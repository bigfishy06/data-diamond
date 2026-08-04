"""Export public ONuBaseball player season statistics for the OUA dashboard.

ONuBaseball is a Shiny application. Its tables are delivered through a
session-scoped DataTables endpoint, so a regular HTTP request only receives
the empty page shell. This script opens one public browser session, activates
the Stats output, and writes the published batting and pitching rows to JSON.
"""

from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service


SITE = "https://onubaseball.com/"
SEASONS = ["2020", "2021", "2021 Postseason", "2022", "2022 Postseason",
           "2023", "2023 Postseason", "2024", "2024 Postseason",
           "2024 National Championship", "2025"]
STAT_TYPES = ("Batting", "Pitching")
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
DRIVER = Path(r"C:\Users\chris\Documents\Codex\tools\chromedriver\chromedriver-win64\chromedriver.exe")
OUTPUT = Path(__file__).resolve().parents[1] / "brock-dashboard" / "data" / "onu-season-stats.json"


def browser() -> webdriver.Chrome:
    options = Options()
    options.binary_location = str(CHROME)
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1600,1200")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.set_capability("goog:loggingPrefs", {"performance": "ALL"})
    return webdriver.Chrome(service=Service(str(DRIVER)), options=options)


def received_payloads(driver: webdriver.Chrome) -> list[str]:
    payloads = []
    for entry in driver.get_log("performance"):
        message = json.loads(entry["message"])["message"]
        if message["method"] == "Network.webSocketFrameReceived":
            payloads.append(message["params"]["response"]["payloadData"])
    return payloads


def table_endpoint(payloads: list[str]) -> tuple[str, list[str]] | None:
    for payload in reversed(payloads):
        match = re.search(r"session/[^\"\\]+?/dataobj/stats\?w=&nonce=[0-9a-f]+", payload)
        if not match:
            continue
        headers = re.findall(r"<th>([^<]+)<\\\\/th>", payload)
        if headers:
            return match.group(0).replace("\\/", "/"), [html.unescape(value) for value in headers]
    return None


def datatables_form(column_count: int) -> str:
    form: dict[str, str] = {
        "draw": "1", "start": "0", "length": "10000", "escape": "false",
        "search[value]": "", "search[regex]": "false",
        "search[caseInsensitive]": "true", "search[smart]": "true",
    }
    for index in range(column_count):
        prefix = f"columns[{index}]"
        form.update({
            f"{prefix}[data]": str(index), f"{prefix}[name]": "",
            f"{prefix}[searchable]": "true", f"{prefix}[orderable]": "true",
            f"{prefix}[search][value]": "", f"{prefix}[search][regex]": "false",
            f"{prefix}[search][caseInsensitive]": "true", f"{prefix}[search][smart]": "true",
        })
    return urllib.parse.urlencode(form)


def fetch_rows(driver: webdriver.Chrome, endpoint: str, columns: list[str]) -> list[list[object]]:
    response = driver.execute_async_script(
        """const done = arguments[arguments.length - 1];
        fetch(arguments[0], {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          body: arguments[1]
        }).then(response => response.text()).then(done).catch(error => done(JSON.stringify({error: String(error)})));""",
        endpoint,
        datatables_form(len(columns)),
    )
    payload = json.loads(response)
    if "error" in payload:
        raise RuntimeError(payload["error"])
    return payload.get("data", [])


def request_table(driver: webdriver.Chrome, season: str, stat_type: str) -> dict[str, object] | None:
    # Discard prior messages so the endpoint belongs to this requested split.
    received_payloads(driver)
    driver.execute_script(
        """Shiny.setInputValue('.clientdata_output_stats_hidden', false, {priority: 'event'});
        Shiny.setInputValue('.clientdata_output_stats_width', 1200, {priority: 'event'});
        Shiny.setInputValue('.clientdata_output_stats_height', 700, {priority: 'event'});
        Shiny.setInputValue('groupType', 'Player', {priority: 'event'});
        Shiny.setInputValue('teamType', 'Any', {priority: 'event'});
        Shiny.setInputValue('statType', arguments[0], {priority: 'event'});
        Shiny.setInputValue('season', arguments[1], {priority: 'event'});""",
        stat_type, season,
    )
    for _ in range(12):
        time.sleep(0.5)
        table = table_endpoint(received_payloads(driver))
        if table:
            endpoint, columns = table
            rows = fetch_rows(driver, endpoint, columns)
            # An unavailable selection can fall back to the previous season.
            if rows and str(rows[0][1]) != season:
                return None
            return {"season": season, "type": stat_type, "columns": columns, "rows": rows}
    return None


def main() -> None:
    driver = browser()
    try:
        driver.set_page_load_timeout(25)
        try:
            driver.get(SITE)
        except Exception:
            pass
        time.sleep(8)
        received_payloads(driver)
        tables = []
        unavailable = []
        for season in SEASONS:
            found = False
            for stat_type in STAT_TYPES:
                table = request_table(driver, season, stat_type)
                if table is not None:
                    table["source"] = SITE
                    tables.append(table)
                    found = True
            if not found:
                unavailable.append(season)
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps({"source": SITE, "tables": tables, "unavailable": unavailable}, indent=2), encoding="utf-8")
        print(f"Wrote {len(tables)} tables to {OUTPUT}")
        print("Unavailable:", ", ".join(unavailable) if unavailable else "none")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
