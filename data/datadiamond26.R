library(dplyr)
library(jsonlite)
library(readxl)

# ── Load pitch data ────────────────────────────────────────────────────────────
pitches_raw <- read_excel("C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/datadiamond2026.xlsx",
                          col_names = c("inning", "outs", "balls", "strikes", "count",
                                        "date", "batter_team", "pitcher_team",
                                        "time_to_plate",
                                        "batter", "pitcher",
                                        "batter_side", "pitcher_side", "pitch_type",
                                        "outcome", "contact_quality", "spray_chart",
                                        "runners", "pitch_x", "pitch_y"))

pitches <- as.data.frame(pitches_raw)

# ── Clean ──────────────────────────────────────────────────────────────────────
pitches$pitch_x       <- suppressWarnings(as.numeric(pitches$pitch_x))
pitches$pitch_y       <- suppressWarnings(as.numeric(pitches$pitch_y))
pitches$time_to_plate <- suppressWarnings(as.numeric(pitches$time_to_plate))
pitches <- pitches %>% filter(trimws(batter) != "")

# ── Outcome reference vectors ──────────────────────────────────────────────────
PITCH_LEVEL <- c("Ball", "Called Strike", "Swinging Strike", "Foul", "Pickoff")

PA_ENDING_OUTS <- c(
  "Strikeout Looking", "Strikeout Swinging",
  "Dropped Third Strike Looking", "Dropped Third Strike Swinging",
  "Groundout", "Flyout", "Popout", "Lineout",
  "Double Play", "Triple Play",
  "Sacrifice Fly", "Sac Fly Double Play",
  "Sacrifice Bunt", "Sac Bunt Double Play",
  "Truncated Out", "Caught Stealing",
  "Batter Interference", "Additional Out"
)

# ── Classify outcomes ──────────────────────────────────────────────────────────
pitches <- pitches %>%
  mutate(
    result_category = case_when(
      outcome %in% c("Single", "Double", "Triple", "Home Run")               ~ "hit",
      outcome %in% c("Walk", "Intentional Walk")                             ~ "walk",
      outcome == "Hit By Pitch"                                               ~ "hbp",
      outcome %in% c("Strikeout Looking", "Strikeout Swinging")              ~ "strikeout",
      outcome %in% c("Dropped Third Strike Looking",
                     "Dropped Third Strike Swinging")                        ~ "dropped_third_strike",
      outcome == "Ball"                                                       ~ "ball",
      outcome %in% c("Called Strike", "Swinging Strike", "Foul")             ~ "strike",
      outcome == "Pickoff"                                                    ~ "pickoff",
      outcome %in% c("Groundout", "Double Play", "Triple Play")              ~ "groundout",
      outcome %in% c("Flyout", "Sacrifice Fly", "Sac Fly Double Play")       ~ "flyout",
      outcome %in% c("Popout")                                                ~ "popout",
      outcome %in% c("Lineout")                                               ~ "lineout",
      outcome %in% c("Sacrifice Bunt", "Sac Bunt Double Play")               ~ "sac_bunt",
      outcome == "Error"                                                      ~ "error",
      outcome == "Caught Stealing"                                            ~ "caught_stealing",
      outcome == "Truncated Out"                                              ~ "truncated_out",
      outcome == "Batter Interference"                                        ~ "batter_interference",
      outcome == "Catcher Interference"                                       ~ "catcher_interference",
      outcome == "Additional Out"                                             ~ "additional_out",
      TRUE                                                                    ~ "other"
    ),
    in_zone = !is.na(pitch_x) & !is.na(pitch_y) &
      pitch_x >= -1   & pitch_x <= 1 &
      pitch_y >= 0    & pitch_y <= 1
  )

# ── Replace NA strings with empty string ──────────────────────────────────────
pitches <- pitches %>%
  mutate(across(where(is.character), ~ifelse(is.na(.), "", .)))

# ── Build per-batter pitch list ────────────────────────────────────────────────
pitches_json <- pitches %>%
  filter(!is.na(pitch_x), !is.na(pitch_y)) %>%
  group_by(batter) %>%
  summarise(
    team         = last(batter_team),
    pitches_seen = n(),
    scatter      = list(data.frame(
      x             = pitch_x,
      y             = pitch_y,
      pitch_type    = pitch_type,
      outcome       = outcome,
      result        = result_category,
      count         = count,
      contact       = contact_quality,
      spray         = spray_chart,
      inning        = inning,
      outs          = outs,
      runners       = runners,
      time_to_plate = time_to_plate,
      pitcher       = pitcher,
      pitcher_team  = pitcher_team,
      batter_side   = batter_side,
      pitcher_side  = pitcher_side,
      date          = as.character(date),
      in_zone       = in_zone
    )),
    .groups = "drop"
  )

# ── Innings pitched per pitcher per game ───────────────────────────────────────
ip_per_game <- pitches %>%
  group_by(pitcher, date) %>%
  summarise(
    outs_recorded = sum(outcome %in% c(
      "Strikeout Looking", "Strikeout Swinging",
      "Dropped Third Strike Looking", "Dropped Third Strike Swinging",
      "Groundout", "Flyout", "Popout", "Lineout",
      "Sacrifice Fly", "Sacrifice Bunt",
      "Error", "Truncated Out", "Caught Stealing", "Pickoff",
      "Batter Interference", "Additional Out"
    )),
    dp_bonus = sum(outcome %in% c("Double Play", "Sac Bunt Double Play",
                                  "Sac Fly Double Play")),
    tp_bonus = sum(outcome == "Triple Play") * 2,
    .groups = "drop"
  ) %>%
  mutate(
    total_outs = outs_recorded + dp_bonus + tp_bonus,
    ip         = total_outs / 3
  )

ip_totals <- ip_per_game %>%
  group_by(pitcher) %>%
  summarise(IP = round(sum(ip), 1), .groups = "drop")

# ── Early and Ahead counts ─────────────────────────────────────────────────────
pitches <- pitches %>%
  mutate(clean_count = gsub("^'", "", count)) %>%
  arrange(date, inning, outs, pitcher, batter) %>%
  mutate(pa_id = paste(date, inning, pitcher, batter, sep = "_"))

ahead_pas <- pitches %>%
  group_by(pa_id, pitcher) %>%
  summarise(
    achieved_ahead = any(clean_count %in% c("0-2", "1-2")),
    .groups = "drop"
  ) %>%
  filter(achieved_ahead)

pa_final <- pitches %>%
  filter(!(outcome %in% c(PITCH_LEVEL, "")))

pa_summary <- pa_final %>%
  mutate(
    clean_count   = gsub("^'", "", count),
    count_balls   = as.integer(substr(clean_count, 1, 1)),
    count_strikes = as.integer(substr(clean_count, 3, 3)),
    pitch_number  = count_balls + count_strikes + 1,
    is_in_play    = outcome %in% c(
      "Single", "Double", "Triple", "Home Run",
      "Groundout", "Flyout", "Popout", "Lineout",
      "Double Play", "Triple Play",
      "Sacrifice Fly", "Sac Fly Double Play",
      "Sacrifice Bunt", "Sac Bunt Double Play",
      "Error", "Truncated Out",
      "Dropped Third Strike Looking", "Dropped Third Strike Swinging",
      "Batter Interference", "Additional Out"
    ),
    pa_id           = paste(date, inning, pitcher, batter, sep = "_"),
    is_early        = is_in_play & pitch_number <= 3 & clean_count != "2-0",
    is_ahead_final  = pa_id %in% ahead_pas$pa_id & !is_early
  )

ea_by_pitcher <- pa_summary %>%
  group_by(pitcher) %>%
  summarise(
    BF        = n(),
    Early     = sum(is_early),
    Ahead     = sum(is_ahead_final),
    EA        = sum(is_early | is_ahead_final),
    EA_pct    = round(EA    / BF * 100, 1),
    Early_pct = round(Early / BF * 100, 1),
    Ahead_pct = round(Ahead / BF * 100, 1),
    .groups = "drop"
  )

# ── Per-pitcher aggregated stats ───────────────────────────────────────────────
pitcher_stats <- pitches %>%
  group_by(pitcher) %>%
  summarise(
    pitcher_team      = last(pitcher_team),
    total_pitches     = sum(outcome != "" & !is.na(outcome)),
    K  = sum(outcome %in% c(
      "Strikeout Looking", "Strikeout Swinging",
      "Dropped Third Strike Looking", "Dropped Third Strike Swinging"
    )),
    BB  = sum(outcome %in% c("Walk", "Intentional Walk")),
    HBP = sum(outcome == "Hit By Pitch"),
    strikes = sum(outcome %in% c(
      "Called Strike", "Swinging Strike", "Foul",
      "Strikeout Looking", "Strikeout Swinging",
      "Dropped Third Strike Looking", "Dropped Third Strike Swinging"
    )),
    avg_time_to_plate = round(mean(time_to_plate, na.rm = TRUE), 2),
    .groups = "drop"
  ) %>%
  left_join(ip_totals,     by = "pitcher") %>%
  left_join(ea_by_pitcher, by = "pitcher") %>%
  mutate(
    IP      = ifelse(is.na(IP), 0, IP),
    K_pct   = ifelse(total_pitches > 0, round(K       / total_pitches * 100, 1), NA),
    BB_pct  = ifelse(total_pitches > 0, round(BB      / total_pitches * 100, 1), NA),
    K_BB    = ifelse(BB > 0,            round(K / BB,  2),                        NA),
    STR_pct = ifelse(total_pitches > 0, round(strikes / total_pitches * 100, 1), NA)
  )

# ── Per-pitcher scatter ────────────────────────────────────────────────────────
pitcher_scatter <- pitches %>%
  filter(!is.na(pitch_x), !is.na(pitch_y)) %>%
  group_by(pitcher) %>%
  summarise(
    scatter = list(data.frame(
      x             = pitch_x,
      y             = pitch_y,
      pitch_type    = pitch_type,
      outcome       = outcome,
      result        = result_category,
      count         = count,
      contact       = contact_quality,
      spray         = spray_chart,
      inning        = inning,
      outs          = outs,
      runners       = runners,
      time_to_plate = time_to_plate,
      batter        = batter,
      batter_team   = batter_team,
      batter_side   = batter_side,
      pitcher_side  = pitcher_side,
      date          = as.character(date),
      in_zone       = in_zone
    )),
    .groups = "drop"
  )

pitcher_json <- pitcher_stats %>%
  left_join(pitcher_scatter, by = "pitcher")

# ── Write JSON ─────────────────────────────────────────────────────────────────
write_json(pitches_json,
           "C:/Users/chris/OneDrive/Documents/pitches2026.json",
           auto_unbox = TRUE, pretty = TRUE)

write_json(pitcher_json,
           "C:/Users/chris/OneDrive/Documents/pitchers2026.json",
           auto_unbox = TRUE, pretty = TRUE, na = "null")

cat("Done!\n")
cat("pitches2026.json:", nrow(pitches_json), "batters\n")
cat("pitchers2026.json:", nrow(pitcher_json), "pitchers\n")

cat("\nPitch counts per batter:\n")
pitches %>%
  filter(!is.na(pitch_x)) %>%
  count(batter, name = "pitches") %>%
  arrange(desc(pitches)) %>%
  as.data.frame() %>%
  print()

cat("\nOutcome categories:\n")
print(table(pitches$result_category))

cat("\nX range:", range(pitches$pitch_x, na.rm = TRUE), "\n")
cat("Y range:", range(pitches$pitch_y, na.rm = TRUE), "\n")
cat("Time to plate range:", range(pitches$time_to_plate, na.rm = TRUE), "\n")
