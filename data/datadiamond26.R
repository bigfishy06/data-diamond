library(dplyr)
library(jsonlite)

# ── Load pitch data ────────────────────────────────────────────────────────────
pitches_raw <- read.csv("C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/datadiamond2026.csv",
                         header = TRUE,
                         stringsAsFactors = FALSE)

pitches <- as.data.frame(pitches_raw)
colnames(pitches) <- c("inning", "outs", "balls", "strikes", "count",
                       "date", "batter_team", "pitcher_team",
                       "time_to_plate",
                       "batter", "pitcher",
                       "batter_side", "pitcher_side", "pitch_type",
                       "outcome", "contact_quality", "spray_chart",
                       "runners", "pitch_x", "pitch_y")

# ── Clean ──────────────────────────────────────────────────────────────────────
pitches$pitch_x       <- suppressWarnings(as.numeric(pitches$pitch_x))
pitches$pitch_y       <- suppressWarnings(as.numeric(pitches$pitch_y))
pitches$time_to_plate <- suppressWarnings(as.numeric(pitches$time_to_plate))
pitches <- pitches %>% filter(trimws(batter) != "")

# ── Outcome reference vectors ──────────────────────────────────────────────────
PITCH_LEVEL <- c("Ball", "Called Strike", "Swinging Strike", "Foul", "Pickoff")

NON_AB_PA_OUTCOMES <- c(
  "Walk", "Intentional Walk", "Hit By Pitch",
  "Sacrifice Fly", "Sac Fly Double Play",
  "Sacrifice Bunt", "Sac Bunt Double Play",
  "Catcher Interference", "Caught Stealing",
  "Truncated Out", "Batter Interference", "Additional Out"
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
      pitch_y >= 0    & pitch_y <= 1,

    # ── Per-pitch flags for pitcher aggregation ──────────────────────────────
    is_hit        = outcome %in% c("Single", "Double", "Triple", "Home Run"),
    is_hr         = outcome == "Home Run",
    is_bb         = outcome %in% c("Walk", "Intentional Walk"),
    is_hbp        = outcome == "Hit By Pitch",
    is_k          = outcome %in% c("Strikeout Looking", "Strikeout Swinging",
                                   "Dropped Third Strike Looking", "Dropped Third Strike Swinging"),
    is_sf         = outcome %in% c("Sacrifice Fly", "Sac Fly Double Play"),
    is_pa         = !(outcome %in% PITCH_LEVEL),
    is_ab         = !(outcome %in% c(PITCH_LEVEL, NON_AB_PA_OUTCOMES)),

    # Swing = any pitch batter offered at (contact or miss)
    is_swing      = outcome %in% c(
      "Swinging Strike", "Foul",
      "Strikeout Swinging", "Dropped Third Strike Swinging",
      "Single", "Double", "Triple", "Home Run",
      "Groundout", "Flyout", "Popout", "Lineout",
      "Double Play", "Triple Play", "Error",
      "Sacrifice Fly", "Sac Fly Double Play",
      "Sacrifice Bunt", "Sac Bunt Double Play"
    ),
    # Whiff = swing and miss
    is_whiff      = outcome %in% c("Swinging Strike", "Strikeout Swinging",
                                   "Dropped Third Strike Swinging"),

    # First-pitch (0-0 count)
    is_first_pitch = gsub("^'", "", count) == "0-0",
    is_fp_strike   = is_first_pitch &
                     outcome %in% c("Called Strike", "Swinging Strike", "Foul",
                                    "Strikeout Swinging", "Strikeout Looking",
                                    "Dropped Third Strike Swinging", "Dropped Third Strike Looking"),

    # Two-strike putaway
    is_two_strike_count = grepl("-2$", gsub("^'", "", count)),
    is_putaway          = is_two_strike_count & is_pa & is_k,

    # Batted ball (any ball put in play)
    is_batted     = outcome %in% c(
      "Single", "Double", "Triple", "Home Run",
      "Groundout", "Flyout", "Popout", "Lineout",
      "Double Play", "Triple Play", "Error",
      "Sacrifice Fly", "Sac Fly Double Play",
      "Sacrifice Bunt", "Sac Bunt Double Play"
    ),

    # Contact type: prefer contact_quality field, fall back to outcome shape
    contact_type  = case_when(
      contact_quality == "Ground Ball"                                              ~ "GB",
      contact_quality == "Fly Ball"                                                 ~ "FB",
      contact_quality == "Line Drive"                                               ~ "LD",
      contact_quality == "Pop Up"                                                   ~ "PO",
      outcome %in% c("Groundout", "Double Play", "Triple Play")                    ~ "GB",
      outcome %in% c("Flyout", "Home Run", "Sacrifice Fly", "Sac Fly Double Play") ~ "FB",
      outcome == "Lineout"                                                          ~ "LD",
      outcome == "Popout"                                                           ~ "PO",
      TRUE                                                                          ~ NA_character_
    )
  )

# ── Replace NA strings with empty string ──────────────────────────────────────
pitches <- pitches %>%
  mutate(across(where(is.character), ~ifelse(is.na(.), "", .)))

# ── Build per-batter pitch list (pitches2026.json) ────────────────────────────
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

# ── Innings pitched per pitcher ────────────────────────────────────────────────
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
  mutate(total_outs = outs_recorded + dp_bonus + tp_bonus,
         ip         = total_outs / 3)

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
  summarise(achieved_ahead = any(clean_count %in% c("0-2", "1-2")), .groups = "drop") %>%
  filter(achieved_ahead)

pa_final <- pitches %>% filter(!(outcome %in% c(PITCH_LEVEL, "")))

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
    pa_id          = paste(date, inning, pitcher, batter, sep = "_"),
    is_early       = is_in_play & pitch_number <= 3 & clean_count != "2-0",
    is_ahead_final = pa_id %in% ahead_pas$pa_id & !is_early
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

# ── Per-pitcher aggregated stats (pitchers2026.json) ──────────────────────────
pitcher_stats <- pitches %>%
  group_by(pitcher) %>%
  summarise(
    pitcher_team      = last(pitcher_team),
    total_pitches     = sum(outcome != "" & !is.na(outcome)),
    K                 = sum(is_k),
    BB                = sum(is_bb),
    HBP               = sum(is_hbp),
    H_allowed         = sum(is_hit),
    HR_allowed        = sum(is_hr),
    SF_allowed        = sum(is_sf),
    ab_against        = sum(is_ab),
    strikes           = sum(outcome %in% c(
                          "Called Strike", "Swinging Strike", "Foul",
                          "Strikeout Looking", "Strikeout Swinging",
                          "Dropped Third Strike Looking", "Dropped Third Strike Swinging"
                        )),
    swings            = sum(is_swing),
    whiffs            = sum(is_whiff),
    fp_pitches        = sum(is_first_pitch),
    fp_strikes        = sum(is_fp_strike),
    two_strike_pa     = sum(is_two_strike_count & is_pa),
    putaways          = sum(is_putaway),
    batted_balls      = sum(is_batted),
    gb                = sum(contact_type == "GB", na.rm = TRUE),
    fb                = sum(contact_type == "FB", na.rm = TRUE),
    ld                = sum(contact_type == "LD", na.rm = TRUE),
    po                = sum(contact_type == "PO", na.rm = TRUE),
    avg_time_to_plate = round(mean(time_to_plate, na.rm = TRUE), 2),
    .groups = "drop"
  ) %>%
  left_join(ip_totals,     by = "pitcher") %>%
  left_join(ea_by_pitcher, by = "pitcher") %>%
  mutate(
    IP = ifelse(is.na(IP), 0, IP),

    # ── Existing rate stats ────────────────────────────────────────────────────
    K_pct     = ifelse(total_pitches > 0, round(K       / total_pitches * 100, 1), NA),
    BB_pct    = ifelse(total_pitches > 0, round(BB      / total_pitches * 100, 1), NA),
    K_BB      = ifelse(BB > 0,            round(K / BB,  2),                        NA),
    STR_pct   = ifelse(total_pitches > 0, round(strikes / total_pitches * 100, 1), NA),

    # ── NEW: Swing / Whiff / Putaway ──────────────────────────────────────────
    Swing_pct   = ifelse(total_pitches > 0, round(swings   / total_pitches * 100, 1), NA),
    Whiff_pct   = ifelse(swings > 0,        round(whiffs   / swings        * 100, 1), NA),
    Putaway_pct = ifelse(two_strike_pa > 0, round(putaways / two_strike_pa * 100, 1), NA),

    # ── NEW: First-pitch strike % ──────────────────────────────────────────────
    FPS_pct     = ifelse(fp_pitches > 0,    round(fp_strikes / fp_pitches   * 100, 1), NA),

    # ── NEW: BAA and BABIP against ────────────────────────────────────────────
    BAA         = ifelse(ab_against > 0,    round(H_allowed / ab_against, 3),           NA),
    BABIP_den   = ab_against - K - HR_allowed + SF_allowed,
    BABIP       = ifelse(BABIP_den > 0,
                         round((H_allowed - HR_allowed) / BABIP_den, 3),                NA),

    # ── NEW: Contact type % (of all batted balls) ─────────────────────────────
    GB_pct      = ifelse(batted_balls > 0,  round(gb / batted_balls * 100, 1),          NA),
    FB_pct      = ifelse(batted_balls > 0,  round(fb / batted_balls * 100, 1),          NA),
    LD_pct      = ifelse(batted_balls > 0,  round(ld / batted_balls * 100, 1),          NA),
    PO_pct      = ifelse(batted_balls > 0,  round(po / batted_balls * 100, 1),          NA)
  ) %>%
  select(-BABIP_den, -strikes, -swings, -whiffs, -fp_pitches, -fp_strikes,
         -two_strike_pa, -putaways, -batted_balls, -gb, -fb, -ld, -po,
         -ab_against, -H_allowed, -HR_allowed, -SF_allowed)

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
cat("\nNew pitcher columns: BAA, BABIP, FPS_pct, Swing_pct, Whiff_pct, Putaway_pct, GB_pct, FB_pct, LD_pct, PO_pct\n")
cat("\nOutcome categories:\n")
print(table(pitches$result_category))
cat("\nX range:", range(pitches$pitch_x, na.rm = TRUE), "\n")
cat("Y range:", range(pitches$pitch_y, na.rm = TRUE), "\n")
