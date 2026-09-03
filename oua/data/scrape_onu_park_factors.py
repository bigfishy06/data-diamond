"""Build 2025 OUA park factors from the public ONuBaseball score schedule.

The schedule is a Shiny DataTable, so a normal HTTP request only returns its
page shell.  This uses the same public browser-session approach as
scrape_onu_season_stats.py and writes both the completed games and the factors
used by the Brock dashboard.
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
SEASON = "2025"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
DRIVER = Path(r"C:\Users\chris\Documents\Codex\tools\chromedriver\chromedriver-win64\chromedriver.exe")
OUTPUT = Path(__file__).resolve().parents[1] / "brock-dashboard" / "data" / "oua-2025-park-factors.json"


def browser() -> webdriver.Chrome:
    options = Options()
    options.binary_location = str(CHROME)
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1600,1200")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.set_capability("goog:loggingPrefs", {"performance": "ALL"})
    return webdriver.Chrome(service=Service(str(DRIVER)), options=options)


def payloads(driver: webdriver.Chrome) -> list[str]:
    found: list[str] = []
    for entry in driver.get_log("performance"):
        message = json.loads(entry["message"])["message"]
        if message["method"] == "Network.webSocketFrameReceived":
            found.append(message["params"]["response"]["payloadData"])
    return found


def schedule_endpoint(frames: list[str]) -> tuple[str, list[str]] | None:
    for frame in reversed(frames):
        match = re.search(r"session/[^\"\\]+?/dataobj/schedule\?w=&nonce=[0-9a-f]+", frame)
        if not match:
            continue
        headers = re.findall(r"<th>([^<]+)<\\\\/th>", frame)
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


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", "", html.unescape(str(value)))).strip()


def main() -> None:
    driver = browser()
    try:
        driver.set_page_load_timeout(30)
        try:
            driver.get(SITE)
        except Exception:
            pass
        time.sleep(8)
        payloads(driver)
        driver.execute_script(
            """document.querySelector('a[href="#tab-6797-2"]')?.click();
            Shiny.setInputValue('.clientdata_output_schedule_hidden', false, {priority:'event'});
            Shiny.setInputValue('.clientdata_output_schedule_width', 1200, {priority:'event'});
            Shiny.setInputValue('.clientdata_output_schedule_height', 700, {priority:'event'});
            Shiny.setInputValue('scoresSeason', arguments[0], {priority:'event'});""",
            SEASON,
        )
        endpoint = None
        for _ in range(24):
            time.sleep(.5)
            endpoint = schedule_endpoint(payloads(driver))
            if endpoint:
                break
        if not endpoint:
            raise RuntimeError("Could not find the ONuBaseball schedule table endpoint.")
        path, columns = endpoint
        rendered = driver.execute_script(
            """const table=document.querySelector('#schedule table') || document.querySelector('table[id^="schedule"]');
            if (!table || !window.jQuery || !jQuery.fn.DataTable.isDataTable(table)) return null;
            const api=jQuery(table).DataTable();
            return {rows: api.rows({search:'applied'}).data().toArray(), ajax: api.settings()[0].oAjaxData || null};"""
        )
        response = driver.execute_async_script(
            """const done = arguments[arguments.length - 1];
            fetch(arguments[0], {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}, body:arguments[1]})
              .then(r => r.text()).then(done).catch(e => done(JSON.stringify({error:String(e)})));""",
            path, datatables_form(len(columns)),
        )
        source = json.loads(response)
        if source.get("error"):
            raise RuntimeError(source["error"])
        # The server-side endpoint sometimes responds with an empty filtered
        # page even though the browser's DataTable has all loaded rows. Its
        # data array preserves the complete, correctly ordered schedule.
        table_rows = rendered.get("rows", []) if rendered else source.get("data", [])
        games = []
        for row in table_rows:
            if len(row) >= 10:
                away, home, result = clean(row[4]), clean(row[7]), clean(row[9])
                date = clean(row[1])
            else:
                values = {column: clean(value) for column, value in zip(columns, row)}
                away, home, result, date = values.get("Away", ""), values.get("Home", ""), values.get("Result", ""), values.get("Date", "")
            score = re.search(r"(\d+)\s*-\s*(\d+)", result)
            if away and home and score:
                winner = clean(result.split(",", 1)[0])
                first, second = int(score.group(1)), int(score.group(2))
                home_runs, away_runs = (first, second) if winner == home else (second, first)
                games.append({"date": date, "away": away, "home": home,
                              "away_runs": away_runs, "home_runs": home_runs})
        if not games:
            raise RuntimeError(f"No completed games could be parsed. Columns: {columns}; response: {source}; rendered: {rendered}")
        totals: dict[str, dict[str, float]] = {}
        for game in games:
            for team in (game["home"], game["away"]):
                totals.setdefault(team, {"home_games": 0, "home_runs": 0, "road_games": 0, "road_runs": 0})
            totals[game["home"]]["home_games"] += 1
            totals[game["home"]]["home_runs"] += game["home_runs"] + game["away_runs"]
            totals[game["away"]]["road_games"] += 1
            totals[game["away"]]["road_runs"] += game["home_runs"] + game["away_runs"]
        factors = {}
        for team, total in totals.items():
            home_rpg = total["home_runs"] / total["home_games"] if total["home_games"] else None
            road_rpg = total["road_runs"] / total["road_games"] if total["road_games"] else None
            raw = home_rpg / road_rpg if home_rpg and road_rpg else 1
            # One OUA schedule is a small sample. Regress halfway toward neutral.
            factors[team] = {
                **{key: int(value) for key, value in total.items()},
                "home_rpg": round(home_rpg, 3) if home_rpg else None,
                "road_rpg": round(road_rpg, 3) if road_rpg else None,
                "raw_factor": round(raw, 4),
                "factor": round(1 + (raw - 1) * .5, 4),
            }
        OUTPUT.write_text(json.dumps({
            "source": SITE,
            "season": SEASON,
            "method": "Team home runs per game (runs scored plus allowed) divided by that team's road runs per game; regressed 50% toward 1.000 because this is one season.",
            "games": games,
            "factors": factors,
        }, indent=2), encoding="utf-8")
        print(f"Wrote {len(games)} completed games and {len(factors)} park factors to {OUTPUT}")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
