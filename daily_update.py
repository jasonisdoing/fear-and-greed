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
ENV_PATH = Path(__file__).resolve().parent / ".env"
JSON_PATH = DATA_DIR / "cnn_fear_greed_historic_data.json"
CSV_PATH = DATA_DIR / "cnn_fear_greed_historic_data.csv"
CNN_URL = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
SLACK_CHANNEL_ID = "C0AK2481V33"
SLACK_API_URL = "https://slack.com/api/chat.postMessage"
NEW_YORK_TZ = ZoneInfo("America/New_York")
RECENT_UPDATE_WINDOW_DAYS = 2


@dataclass(frozen=True)
class FearGreedRow:
    date: str
    value: float


@dataclass(frozen=True)
class UpdateResult:
    fetch_status: str
    update_status: str
    summary: str
    latest_date: str
    latest_value: float
    changed_count: int


def is_new_york_weekend(now: datetime | None = None) -> bool:
    current = now or datetime.now(NEW_YORK_TZ)
    return current.weekday() >= 5


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = value


def is_github_actions() -> bool:
    return os.environ.get("GITHUB_ACTIONS") == "true"


def fetch_cnn_payload() -> dict:
    request = Request(
        CNN_URL,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/134.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Origin": "https://www.cnn.com",
            "Referer": "https://www.cnn.com/markets/fear-and-greed",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
        },
    )

    try:
        with urlopen(request, timeout=30) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return json.loads(response.read().decode(charset))
    except HTTPError as error:
        error_body = error.read(200).decode("utf-8", errors="replace").strip()
        detail = f": {error_body}" if error_body else ""
        raise RuntimeError(f"CNN API returned {error.code}{detail}") from error
    except URLError as error:
        raise RuntimeError(f"CNN API request failed: {error.reason}") from error


def build_slack_message(
    *,
    fetch_status: str,
    update_status: str | None,
    summary: str,
    commit_text: str,
    run_text: str,
) -> str:
    status_emoji = {
        "updated": "🟢",
        "no_change": "🟡",
        "weekend_no_write": "🔵",
    }.get(update_status, "🔴" if fetch_status == "failed" else "⚪")

    lines = [
        f"{status_emoji} fear-and-greed 일일 갱신",
        f"fetch_status: {fetch_status}",
    ]

    if update_status:
        lines.append(f"update_status: {update_status}")

    lines.extend([summary, commit_text, run_text])
    return "\n".join(lines)


def send_slack_message(text: str) -> None:
    token = os.environ.get("SLACK_BOT_TOKEN")
    if not token:
        raise RuntimeError("SLACK_BOT_TOKEN is required for local Slack notification")

    request = Request(
        SLACK_API_URL,
        data=json.dumps(
            {
                "channel": SLACK_CHANNEL_ID,
                "text": text,
            }
        ).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        },
    )

    with urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if not payload.get("ok"):
        raise RuntimeError(f"Slack API error: {payload}")


def notify_local_slack_success(result: UpdateResult) -> None:
    if is_github_actions():
        return

    text = build_slack_message(
        fetch_status=result.fetch_status,
        update_status=result.update_status,
        summary=result.summary,
        commit_text="커밋 없음",
        run_text="Run: local python daily_update.py",
    )
    send_slack_message(text)


def notify_local_slack_failure(error_message: str) -> None:
    if is_github_actions():
        return

    text = build_slack_message(
        fetch_status="failed",
        update_status=None,
        summary=error_message,
        commit_text="커밋 없음",
        run_text="Run: local python daily_update.py",
    )
    send_slack_message(text)


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


def merge_rows(previous_rows: list[FearGreedRow], fetched_rows: list[FearGreedRow]) -> list[FearGreedRow]:
    if not previous_rows:
        return fetched_rows

    merged_by_date = {row.date: row for row in previous_rows}
    recent_dates = {row.date for row in fetched_rows[-RECENT_UPDATE_WINDOW_DAYS:]}

    # 새 날짜와 최근 2일만 CNN 원천 값으로 갱신하고, 그보다 오래된 날짜는 기존 값을 보전한다.
    for row in fetched_rows:
        if row.date not in merged_by_date or row.date in recent_dates:
            merged_by_date[row.date] = row

    return sorted(merged_by_date.values(), key=lambda row: row.date)


def build_change_preview(previous_rows: list[FearGreedRow], current_rows: list[FearGreedRow]) -> tuple[int, str]:
    previous_map = {row.date: row.value for row in previous_rows}
    current_map = {row.date: row.value for row in current_rows}

    changed_dates = [
        date
        for date in sorted(set(previous_map) | set(current_map), reverse=True)
        if previous_map.get(date) != current_map.get(date)
    ]

    preview_parts = [
        f"- {date}: {previous_map.get(date, '없음')} → {current_map.get(date, '없음')}"
        for date in changed_dates[:5]
    ]
    return len(changed_dates), "\n".join(preview_parts)


def write_github_output(result: UpdateResult) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return

    with Path(output_path).open("a", encoding="utf-8") as file:
        file.write(f"fetch_status={result.fetch_status}\n")
        file.write(f"update_status={result.update_status}\n")
        file.write(f"latest_date={result.latest_date}\n")
        file.write(f"latest_value={result.latest_value:.1f}\n")
        file.write(f"changed_count={result.changed_count}\n")
        file.write("summary<<EOF\n")
        file.write(result.summary)
        file.write("\nEOF\n")


def main() -> int:
    load_env_file(ENV_PATH)
    previous_rows = load_existing_rows()
    previous_latest = previous_rows[-1] if previous_rows else None
    payload = fetch_cnn_payload()
    fetched_rows = build_rows(payload)
    fetched_latest_row = fetched_rows[-1]
    rows = merge_rows(previous_rows, fetched_rows)
    latest_row = rows[-1]

    if is_new_york_weekend():
        result = UpdateResult(
            fetch_status="success",
            update_status="weekend_no_write",
            summary=(
                f"조회 성공. 주말이므로 데이터 파일은 갱신하지 않았습니다. "
                f"저장 최신값은 {latest_row.date} {latest_row.value:.1f}입니다. "
                f"CNN 원천 최신값은 {fetched_latest_row.date} {fetched_latest_row.value:.1f}입니다."
            ),
            latest_date=latest_row.date,
            latest_value=latest_row.value,
            changed_count=0,
        )
        write_github_output(result)
        notify_local_slack_success(result)
        print(result.summary)
        return 0

    changed = update_files(rows)

    if changed:
        changed_count, preview = build_change_preview(previous_rows, rows)
        previous_text = (
            f"이전 최신값 {previous_latest.date} {previous_latest.value:.1f}"
            if previous_latest
            else "이전 저장 데이터 없음"
        )
        preview_text = f"\n변경한 일자:\n{preview}" if preview else "\n변경한 일자:\n- 없음"
        result = UpdateResult(
            fetch_status="success",
            update_status="updated",
            summary=(
                f"조회 성공. 데이터 업데이트 완료. 저장 최신값 {latest_row.date} {latest_row.value:.1f}. "
                f"CNN 원천 최신값 {fetched_latest_row.date} {fetched_latest_row.value:.1f}. "
                f"{previous_text}. 변경 일자 {changed_count}건.{preview_text}"
            ),
            latest_date=latest_row.date,
            latest_value=latest_row.value,
            changed_count=changed_count,
        )
    else:
        result = UpdateResult(
            fetch_status="success",
            update_status="no_change",
            summary=(
                f"조회 성공. 변경 없음. 저장 최신값은 {latest_row.date} {latest_row.value:.1f}로 유지됩니다. "
                f"CNN 원천 최신값은 {fetched_latest_row.date} {fetched_latest_row.value:.1f}입니다."
            ),
            latest_date=latest_row.date,
            latest_value=latest_row.value,
            changed_count=0,
        )

    write_github_output(result)
    notify_local_slack_success(result)
    print(result.summary)

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        load_env_file(ENV_PATH)
        if not is_github_actions():
            try:
                notify_local_slack_failure(f"Daily update failed: {error}")
            except Exception as slack_error:
                print(f"Local Slack notification failed: {slack_error}", file=sys.stderr)
        print(f"Daily update failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
