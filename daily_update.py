from __future__ import annotations

import csv
import io
import json
import sys
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


DATA_DIR = Path(__file__).resolve().parent / "data"
JSON_PATH = DATA_DIR / "cnn_fear_greed_historic_data.json"
CSV_PATH = DATA_DIR / "cnn_fear_greed_historic_data.csv"
CNN_URL = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
NEW_YORK_TZ = ZoneInfo("America/New_York")


@dataclass(frozen=True)
class FearGreedRow:
    date: str
    value: float


def is_new_york_weekend(now: datetime | None = None) -> bool:
    current = now or datetime.now(NEW_YORK_TZ)
    return current.weekday() >= 5


def fetch_cnn_payload() -> dict:
    request = Request(
        CNN_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "application/json",
        },
    )

    try:
        with urlopen(request, timeout=30) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return json.loads(response.read().decode(charset))
    except HTTPError as error:
        raise RuntimeError(f"CNN API returned {error.code}") from error
    except URLError as error:
        raise RuntimeError(f"CNN API request failed: {error.reason}") from error


def normalize_timestamp(raw_timestamp: int | float) -> datetime:
    timestamp = float(raw_timestamp)
    if timestamp > 1_000_000_000_000:
        timestamp /= 1000
    return datetime.fromtimestamp(timestamp, tz=UTC)


def build_rows(payload: dict) -> list[FearGreedRow]:
    historical_data = payload.get("fear_and_greed_historical", {}).get("data", [])
    if not historical_data:
        raise RuntimeError("CNN API did not return historical data")

    rows_by_date: dict[str, FearGreedRow] = {}

    for item in sorted(historical_data, key=lambda value: value["x"]):
        date = normalize_timestamp(item["x"]).date().isoformat()
        rows_by_date[date] = FearGreedRow(date=date, value=round(float(item["y"]), 1))

    rows = sorted(rows_by_date.values(), key=lambda row: row.date)
    if not rows:
        raise RuntimeError("No normalized historical rows were created")

    return rows


def build_json_content(rows: list[FearGreedRow]) -> str:
    payload = [{"d": row.date, "v": row.value} for row in reversed(rows)]
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def build_csv_content(rows: list[FearGreedRow]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(["Date", "Fear Greed"])
    for row in rows:
        writer.writerow([row.date, f"{row.value:.1f}"])
    return buffer.getvalue()


def read_text_if_exists(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def write_text_if_changed(path: Path, content: str) -> bool:
    previous = read_text_if_exists(path)
    if previous == content:
        return False
    path.write_text(content, encoding="utf-8")
    return True


def update_files(rows: list[FearGreedRow]) -> bool:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    json_changed = write_text_if_changed(JSON_PATH, build_json_content(rows))
    csv_changed = write_text_if_changed(CSV_PATH, build_csv_content(rows))
    return json_changed or csv_changed


def main() -> int:
    if is_new_york_weekend():
        print("Skipping update because it is weekend in New York.")
        return 0

    payload = fetch_cnn_payload()
    rows = build_rows(payload)
    changed = update_files(rows)

    if changed:
        print(f"Updated data files with {len(rows)} rows.")
    else:
        print("No data changes detected.")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Daily update failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
