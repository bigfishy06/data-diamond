# ONuBaseball wRC+ research prototype (offline; not used by the website)
#
# Before running:
# 1. In ONuBaseball > Stats > Batting > Change Included Stats, include:
#    1B, 2B, 3B, HR, BB, HBP, and SF.
# 2. Export/save that table as `onu-batting-expanded.csv` in this folder.
# 3. Export/save ONuBaseball > Scores & Schedule as `onu-schedule.csv` here.
#
# This is a research calculation, not an official published wRC+. ONu does not
# currently expose intentional walks or play-by-play run expectancy. We use
# standard linear weights and a 1.15 wOBA scale provisionally; the schedule is
# used only for a home-park run-environment adjustment.

required <- c("readr", "dplyr", "stringr", "tidyr")
missing <- required[!vapply(required, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing)) stop("Install required packages: ", paste(missing, collapse = ", "))

library(readr)
library(dplyr)
library(stringr)
library(tidyr)

`%||%` <- function(x, y) if (is.null(x)) y else x
script_dir <- dirname(normalizePath(sys.frame(1)$ofile %||% "calculate_onu_wrc_plus.R", mustWork = FALSE))
if (!dir.exists(script_dir)) script_dir <- getwd()

batting_path  <- file.path(script_dir, "onu-batting-expanded.csv")
schedule_path <- file.path(script_dir, "onu-schedule.csv")
output_path   <- file.path(script_dir, "onu-wrc-plus-research.csv")
# Run one ONu regular season at a time. Match this to the schedule selected on
# the site when the CSV is exported.
target_season <- "2025"

if (!file.exists(batting_path) || !file.exists(schedule_path)) {
  stop(
    "Missing input export(s). Save ONu expanded batting as ", batting_path,
    " and scores/schedule as ", schedule_path
  )
}

clean_names <- function(x) {
  x <- str_trim(x)
  x <- str_replace_all(x, "[^A-Za-z0-9]+", "_")
  x <- str_replace_all(x, "^_|_$", "")
  tolower(x)
}

number <- function(x) parse_number(as.character(x), na = c("", "NA", "-"))

batting <- read_csv(batting_path, show_col_types = FALSE, name_repair = "minimal")
names(batting) <- clean_names(names(batting))

required_batting <- c("season", "name", "team", "pa", "ab", "1b", "2b", "3b", "hr", "bb", "hbp", "sf")
missing_batting <- setdiff(required_batting, names(batting))
if (length(missing_batting)) {
  stop("Batting export is missing: ", paste(missing_batting, collapse = ", "),
       ". Ensure the required ONu included stats are checked before export.")
}

batting <- batting %>%
  mutate(
    across(all_of(c("pa", "ab", "1b", "2b", "3b", "hr", "bb", "hbp", "sf")), number),
    season = as.character(season),
    team = str_squish(as.character(team)),
    name = str_squish(as.character(name))
  ) %>%
  filter(!is.na(pa), pa > 0, season == target_season)

# Standard linear weights. These are deliberately declared here so they can be
# replaced with OUA run-expectancy-derived weights if pitch-by-pitch data is
# obtained later.
woba_weights <- c(bb = 0.690, hbp = 0.720, `1b` = 0.880, `2b` = 1.247, `3b` = 1.578, hr = 2.031)
woba_scale <- 1.15

batting <- batting %>%
  mutate(
    woba_den = ab + bb + hbp + sf,
    woba_num = woba_weights[["bb"]] * bb + woba_weights[["hbp"]] * hbp +
      woba_weights[["1b"]] * `1b` + woba_weights[["2b"]] * `2b` +
      woba_weights[["3b"]] * `3b` + woba_weights[["hr"]] * hr,
    woba = if_else(woba_den > 0, woba_num / woba_den, NA_real_)
  )

schedule <- read_csv(schedule_path, show_col_types = FALSE, name_repair = "minimal")
names(schedule) <- clean_names(names(schedule))
required_schedule <- c("away", "home", "result")
missing_schedule <- setdiff(required_schedule, names(schedule))
if (length(missing_schedule)) {
  stop("Schedule export is missing: ", paste(missing_schedule, collapse = ", "),
       ". It must contain Away, Home, and Result columns.")
}
if (!"season" %in% names(schedule)) schedule$season <- target_season

# ONu results are formatted like "Brock, 7-2", where the first score belongs
# to the named winner (not necessarily the home club). Scores are retained
# regardless of winner because park factor uses total runs at that venue.
games <- schedule %>%
  transmute(
    season = as.character(season),
    home = str_squish(as.character(home)),
    away = str_squish(as.character(away)),
    result = as.character(result)
  )
score_matches <- str_match(games$result, "([0-9]+)\\s*-\\s*([0-9]+)")
games <- games %>%
  mutate(
    winner = str_squish(str_remove(result, ",.*$")),
    winning_runs = number(score_matches[, 2]),
    losing_runs = number(score_matches[, 3]),
    home_runs = case_when(winner == home ~ winning_runs, winner == away ~ losing_runs, TRUE ~ NA_real_),
    away_runs = case_when(winner == away ~ winning_runs, winner == home ~ losing_runs, TRUE ~ NA_real_)
  ) %>%
  filter(!is.na(home_runs), !is.na(away_runs), home != "", away != "")

# Home park factor uses run environment at each listed home club's venue versus
# that season's league run environment. It is a first-pass factor; multiple
# seasons and opponent-quality adjustment will improve its stability.
league_games <- games %>%
  group_by(season) %>%
  summarise(
    league_runs = sum(home_runs + away_runs),
    league_runs_per_team_game = sum(home_runs + away_runs) / (2 * n()),
    .groups = "drop"
  )

park_factors <- games %>%
  group_by(season, team = home) %>%
  summarise(home_runs_per_team_game = sum(home_runs + away_runs) / (2 * n()), home_games = n(), .groups = "drop") %>%
  left_join(league_games, by = "season") %>%
  mutate(park_factor = home_runs_per_team_game / league_runs_per_team_game)

# A player wRC+ is calculated versus the relevant league table. Because the
# schedule gives league runs but not team plate appearances by venue, R/PA is
# league-wide; PF shifts the league run environment for the player's home park.
league_offense <- batting %>%
  group_by(season) %>%
  summarise(
    lg_woba = sum(woba_num, na.rm = TRUE) / sum(woba_den, na.rm = TRUE),
    lg_pa = sum(pa, na.rm = TRUE),
    .groups = "drop"
  ) %>%
  left_join(league_games %>% select(season, league_runs), by = "season") %>%
  mutate(lg_r_per_pa = league_runs / lg_pa)

results <- batting %>%
  left_join(league_offense, by = "season") %>%
  left_join(park_factors %>% select(season, team, park_factor, home_games), by = c("season", "team")) %>%
  mutate(
    park_factor = coalesce(park_factor, 1),
    # FanGraphs-style structure: wRAA/PA plus run environment, park adjusted.
    wrc_plus_research = round(100 * (
      ((woba - lg_woba) / woba_scale + lg_r_per_pa - ((park_factor - 1) * lg_r_per_pa)) /
        lg_r_per_pa
    )),
    wrc_plus_research = if_else(is.finite(wrc_plus_research), wrc_plus_research, NA_real_)
  ) %>%
  transmute(
    season, player = name, team, pa, ab, `1B` = `1b`, `2B` = `2b`, `3B` = `3b`, hr, bb, hbp, sf,
    woba = round(woba, 3), park_factor = round(park_factor, 3), home_games,
    wRC_plus_research = wrc_plus_research
  ) %>%
  arrange(desc(season), desc(wRC_plus_research), desc(pa))

write_csv(results, output_path, na = "")
message("Wrote ", nrow(results), " player-season rows to ", output_path)
message("Research only: do not publish as official wRC+ until weights, IBB, and park factors are validated.")
