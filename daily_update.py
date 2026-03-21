from __future__ import annotations

import csv
import io
import json
import os
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


@dataclass(frozen=True)
class UpdateResult:
    status: str
    summary: str
    latest_date: str
    latest_value: float
    changed_count: int


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


def load_existing_rows() -> list[FearGreedRow]:
    if not JSON_PATH.exists():
        return []

    raw_rows = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    rows = [FearGreedRow(date=item["d"], value=round(float(item["v"]), 1)) for item in raw_rows]
    return sorted(rows, key=lambda row: row.date)


def build_change_preview(previous_rows: list[FearGreedRow], current_rows: list[FearGreedRow]) -> tuple[int, str]:
    previous_map = {row.date: row.value for row in previous_rows}
    current_map = {row.date: row.value for row in current_rows}

    changed_dates = [
        date
        for date in sorted(set(previous_map) | set(current_map), reverse=True)
        if previous_map.get(date) != current_map.get(date)
    ]

    preview_parts = [
        f"{date}: {previous_map.get(date, '없음')} → {current_map.get(date, '없음')}"
        for date in changed_dates[:5]
    ]
    return len(changed_dates), ", ".join(preview_parts)


def write_github_output(result: UpdateResult) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return

    with Path(output_path).open("a", encoding="utf-8") as file:
        file.write(f"status={result.status}\n")
        file.write(f"latest_date={result.latest_date}\n")
        file.write(f"latest_value={result.latest_value:.1f}\n")
        file.write(f"changed_count={result.changed_count}\n")
        file.write("summary<<EOF\n")
        file.write(result.summary)
        file.write("\nEOF\n")


def main() -> int:
    previous_rows = load_existing_rows()
    previous_latest = previous_rows[-1] if previous_rows else None

    if is_new_york_weekend():
        latest_row = previous_latest or FearGreedRow(date="N/A", value=0.0)
        result = UpdateResult(
            status="weekend_skip",
            summary=f"주말 스킵(뉴욕 기준). 현재 저장된 최신값은 {latest_row.date} {latest_row.value:.1f}입니다.",
            latest_date=latest_row.date,
            latest_value=latest_row.value,
            changed_count=0,
        )
        write_github_output(result)
        print(result.summary)
        return 0

    payload = fetch_cnn_payload()
    rows = build_rows(payload)
    changed = update_files(rows)
    latest_row = rows[-1]

    if changed:
        changed_count, preview = build_change_preview(previous_rows, rows)
        previous_text = (
            f"이전 최신값 {previous_latest.date} {previous_latest.value:.1f}"
            if previous_latest
            else "이전 저장 데이터 없음"
        )
        preview_text = f" 변경 내역: {preview}" if preview else ""
        result = UpdateResult(
            status="updated",
            summary=(
                f"데이터 업데이트 완료. 최신값 {latest_row.date} {latest_row.value:.1f}. "
                f"{previous_text}. 변경 일자 {changed_count}건.{preview_text}"
            ),
            latest_date=latest_row.date,
            latest_value=latest_row.value,
            changed_count=changed_count,
        )
    else:
        result = UpdateResult(
            status="no_change",
            summary=f"변경 없음. 최신값은 {latest_row.date} {latest_row.value:.1f}로 유지됩니다.",
            latest_date=latest_row.date,
            latest_value=latest_row.value,
            changed_count=0,
        )

    write_github_output(result)
    print(result.summary)

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Daily update failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
