library(dplyr)
library(jsonlite)

write_xlsx_workbook <- function(sheets, path) {
  if (requireNamespace("openxlsx", quietly = TRUE)) {
    wb <- openxlsx::createWorkbook()
    header_style <- openxlsx::createStyle(textDecoration = "bold")

    for (sheet_name in names(sheets)) {
      openxlsx::addWorksheet(wb, sheet_name)
      openxlsx::writeDataTable(wb, sheet_name, sheets[[sheet_name]])
      openxlsx::addStyle(
        wb, sheet_name, header_style,
        rows = 1, cols = seq_along(sheets[[sheet_name]]),
        gridExpand = TRUE
      )
      openxlsx::freezePane(wb, sheet_name, firstRow = TRUE)
      openxlsx::setColWidths(wb, sheet_name, cols = seq_along(sheets[[sheet_name]]), widths = "auto")
    }

    openxlsx::saveWorkbook(wb, path, overwrite = TRUE)
  } else if (requireNamespace("writexl", quietly = TRUE)) {
    writexl::write_xlsx(sheets, path)
  } else {
    stop("Install either the openxlsx or writexl R package to export summary2026.xlsx.")
  }
}

add_league_average_row <- function(df) {
  avg_row <- df[0, , drop = FALSE]
  avg_row[1, ] <- NA
  avg_row[1, 2] <- "League Average:"

  stat_cols <- names(df)[vapply(df, is.numeric, logical(1))]
  avg_row[1, stat_cols] <- lapply(df[stat_cols], function(x) round(mean(x, na.rm = TRUE), 1))

  bind_rows(df, avg_row)
}

# ── Load ───────────────────────────────────────────────────────────────────────
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

pitches$pitch_x       <- suppressWarnings(as.numeric(pitches$pitch_x))
pitches$pitch_y       <- suppressWarnings(as.numeric(pitches$pitch_y))
pitches$time_to_plate <- suppressWarnings(as.numeric(pitches$time_to_plate))
pitches <- pitches %>% filter(trimws(batter) != "")
pitches <- pitches %>%
  mutate(
    batter = trimws(gsub("\\s+", " ", batter)),
    pitcher = trimws(gsub("\\s+", " ", pitcher)),
    batter_team = ifelse(grepl("^Chatham-Kent", trimws(batter_team)),
                         "Chatham-Kent Barnstormers", trimws(batter_team)),
    pitcher_team = ifelse(grepl("^Chatham-Kent", trimws(pitcher_team)),
                          "Chatham-Kent Barnstormers", trimws(pitcher_team))
  )

# ── Outcome reference vectors ──────────────────────────────────────────────────
PITCH_OUTCOMES <- c("", "Ball", "Called Strike", "Swinging Strike", "Foul", "Pickoff")

NON_AB_PA_OUTCOMES <- c(
  "Walk", "Intentional Walk", "Hit By Pitch",
  "Sacrifice Fly", "Sac Fly Double Play",
  "Sacrifice Bunt", "Sac Bunt Double Play",
  "Catcher Interference",
  "Caught Stealing", "Truncated Out",
  "Batter Interference", "Additional Out"
)

# ── wOBA weights (standard linear weights) ────────────────────────────────────
wOBA_BB  <- 0.690
wOBA_HBP <- 0.720
wOBA_1B  <- 0.880
wOBA_2B  <- 1.247
wOBA_3B  <- 1.578
wOBA_HR  <- 2.031

# ── Classify outcomes ──────────────────────────────────────────────────────────
pitches <- pitches %>%
  mutate(
    is_single     = outcome == "Single",
    is_double     = outcome == "Double",
    is_triple     = outcome == "Triple",
    is_hr         = outcome == "Home Run",
    is_hit        = is_single | is_double | is_triple | is_hr,
    is_bb         = outcome %in% c("Walk", "Intentional Walk"),
    is_ibb        = outcome == "Intentional Walk",
    is_hbp        = outcome == "Hit By Pitch",
    is_k_looking  = outcome == "Strikeout Looking",
    is_k_swinging = outcome == "Strikeout Swinging",
    is_k          = is_k_looking | is_k_swinging,
    is_dts_looking  = outcome == "Dropped Third Strike Looking",
    is_dts_swinging = outcome == "Dropped Third Strike Swinging",
    is_dts          = is_dts_looking | is_dts_swinging,
    is_groundout  = outcome == "Groundout",
    is_dp         = outcome == "Double Play",
    is_tp         = outcome == "Triple Play",
    is_popout     = outcome == "Popout",
    is_flyout     = outcome == "Flyout",
    is_lineout    = outcome == "Lineout",
    is_sf         = outcome %in% c("Sacrifice Fly", "Sac Fly Double Play"),
    is_sb         = outcome %in% c("Sacrifice Bunt", "Sac Bunt Double Play"),
    is_sf_dp      = outcome == "Sac Fly Double Play",
    is_sb_dp      = outcome == "Sac Bunt Double Play",
    is_ci         = outcome == "Catcher Interference",
    is_bi         = outcome == "Batter Interference",
    is_error      = outcome == "Error",
    is_pickoff    = outcome == "Pickoff",
    is_cs         = outcome == "Caught Stealing",
    is_truncated  = outcome == "Truncated Out",
    is_add_out    = outcome == "Additional Out",
    is_pa         = !(outcome %in% PITCH_OUTCOMES),
    is_ab         = !(outcome %in% c(PITCH_OUTCOMES, NON_AB_PA_OUTCOMES)),
    is_productive_out = outcome %in% c("Groundout", "Flyout", "Lineout",
                                       "Popout", "Double Play", "Triple Play"),

    # ── Swing / Whiff / First-pitch flags ────────────────────────────────────
    is_swing = outcome %in% c(
      "Swinging Strike", "Foul",
      "Strikeout Swinging", "Dropped Third Strike Swinging",
      "Single", "Double", "Triple", "Home Run",
      "Groundout", "Flyout", "Popout", "Lineout",
      "Double Play", "Triple Play", "Error",
      "Sacrifice Fly", "Sac Fly Double Play",
      "Sacrifice Bunt", "Sac Bunt Double Play"
    ),
    is_whiff       = outcome %in% c("Swinging Strike", "Strikeout Swinging",
                                    "Dropped Third Strike Swinging"),
    is_first_pitch = gsub("^'", "", count) == "0-0",
    is_fp_swing    = is_first_pitch & is_swing,
    is_fp_strike   = is_first_pitch & outcome %in% c(
      "Called Strike", "Swinging Strike", "Foul",
      "Strikeout Swinging", "Strikeout Looking",
      "Dropped Third Strike Swinging", "Dropped Third Strike Looking",
      "Single", "Double", "Triple", "Home Run",
      "Groundout", "Flyout", "Popout", "Lineout",
      "Double Play", "Triple Play", "Error", "Truncated Out",
      "Sacrifice Fly", "Sac Fly Double Play",
      "Sacrifice Bunt", "Sac Bunt Double Play"
    ),
    is_two_strike_count = grepl("-2$", gsub("^'", "", count)),
    is_putaway          = is_two_strike_count & is_pa & is_k,
    in_zone             = !is.na(pitch_x) & !is.na(pitch_y) &
      pitch_x >= -1 & pitch_x <= 1 &
      pitch_y >= 0  & pitch_y <= 1,

    # ── Spray direction ───────────────────────────────────────────────────────
    is_batted  = outcome %in% c(
      "Single", "Double", "Triple", "Home Run",
      "Groundout", "Flyout", "Popout", "Lineout",
      "Double Play", "Triple Play", "Error",
      "Sacrifice Fly", "Sac Fly Double Play",
      "Sacrifice Bunt", "Sac Bunt Double Play"
    ),
    contact_type = case_when(
      contact_quality == "Ground Ball"                                             ~ "GB",
      contact_quality == "Fly Ball"                                                ~ "FB",
      contact_quality == "Line Drive"                                              ~ "LD",
      contact_quality == "Pop Up"                                                  ~ "PO",
      outcome %in% c("Groundout", "Double Play", "Triple Play")                    ~ "GB",
      outcome %in% c("Flyout", "Home Run", "Sacrifice Fly", "Sac Fly Double Play") ~ "FB",
      outcome == "Lineout"                                                         ~ "LD",
      outcome == "Popout"                                                          ~ "PO",
      TRUE                                                                         ~ NA_character_
    ),
    spray_pull = is_batted & trimws(spray_chart) == "Pull",
    spray_str  = is_batted & trimws(spray_chart) == "Straightaway",
    spray_oppo = is_batted & trimws(spray_chart) == "Opposite Field"
  )

# ── Aggregate per batter ───────────────────────────────────────────────────────
summary_stats <- pitches %>%
  group_by(batter, batter_team) %>%
  summarise(
    PA             = sum(is_pa),
    AB             = sum(is_ab),
    H              = sum(is_hit),
    `1B`           = sum(is_single),
    `2B`           = sum(is_double),
    `3B`           = sum(is_triple),
    HR             = sum(is_hr),
    BB             = sum(is_bb),
    IBB            = sum(is_ibb),
    HBP            = sum(is_hbp),
    K              = sum(is_k),
    K_L            = sum(is_k_looking),
    K_S            = sum(is_k_swinging),
    DTS            = sum(is_dts),
    DTS_L          = sum(is_dts_looking),
    DTS_S          = sum(is_dts_swinging),
    Groundout      = sum(is_groundout),
    DP             = sum(is_dp),
    TP             = sum(is_tp),
    Popout         = sum(is_popout),
    Flyout         = sum(is_flyout),
    Lineout        = sum(is_lineout),
    SF             = sum(is_sf),
    SF_DP          = sum(is_sf_dp),
    SacB           = sum(is_sb),
    SacB_DP        = sum(is_sb_dp),
    CI             = sum(is_ci),
    BI             = sum(is_bi),
    Error          = sum(is_error),
    Pickoff        = sum(is_pickoff),
    CS             = sum(is_cs),
    Truncated      = sum(is_truncated),
    Additional_Out = sum(is_add_out),
    pitches_seen   = n(),
    swings         = sum(is_swing),
    whiffs         = sum(is_whiff),
    fp_pitches     = sum(is_first_pitch),
    fp_swings      = sum(is_fp_swing),
    batted_balls   = sum(is_batted),
    pull_balls     = sum(spray_pull),
    str_balls      = sum(spray_str),
    oppo_balls     = sum(spray_oppo),
    .groups        = "drop"
  ) %>%
  mutate(
    # ── Existing stats ─────────────────────────────────────────────────────────
    AVG    = ifelse(AB > 0, round(H / AB, 3), 0),
    SLG    = ifelse(AB > 0, round((`1B` + 2*`2B` + 3*`3B` + 4*HR) / AB, 3), 0),
    OBP    = ifelse((AB + BB + HBP + SF) > 0,
                    round((H + BB + HBP) / (AB + BB + HBP + SF), 3), 0),
    OPS    = round(OBP + SLG, 3),
    K_pct  = ifelse(PA > 0, round((K + DTS) / PA * 100, 1), 0),
    BB_pct = ifelse(PA > 0, round(BB / PA * 100, 1), 0),

    # ── NEW: ISO = SLG - AVG ───────────────────────────────────────────────────
    ISO    = ifelse(AB > 0, round(SLG - AVG, 3), NA),

    # ── NEW: BABIP = (H - HR) / (AB - K - HR + SF) ───────────────────────────
    BABIP  = ifelse((AB - K - HR + SF) > 0,
                    round((H - HR) / (AB - K - HR + SF), 3),
                    NA),

    # ── NEW: wOBA ─────────────────────────────────────────────────────────────
    wOBA_num = (wOBA_BB  * (BB - IBB)) +
               (wOBA_HBP * HBP)        +
               (wOBA_1B  * `1B`)       +
               (wOBA_2B  * `2B`)       +
               (wOBA_3B  * `3B`)       +
               (wOBA_HR  * HR),
    wOBA_den = AB + BB - IBB + SF + HBP,
    wOBA     = ifelse(wOBA_den > 0, round(wOBA_num / wOBA_den, 3), NA),

    # ── NEW: Swing%, Whiff%, FP Swing% ────────────────────────────────────────
    Swing_pct    = ifelse(pitches_seen > 0, round(swings    / pitches_seen * 100, 1), NA),
    Whiff_pct    = ifelse(swings > 0,       round(whiffs    / swings       * 100, 1), NA),
    FP_Swing_pct = ifelse(fp_pitches > 0,   round(fp_swings / fp_pitches   * 100, 1), NA),

    # ── NEW: Spray direction % (of batted balls with spray data) ─────────────
    spray_total  = pull_balls + str_balls + oppo_balls,
    Pull_pct     = ifelse(spray_total > 0, round(pull_balls / spray_total * 100, 1), NA),
    Str_pct      = ifelse(spray_total > 0, round(str_balls  / spray_total * 100, 1), NA),
    Oppo_pct     = ifelse(spray_total > 0, round(oppo_balls / spray_total * 100, 1), NA)
  ) %>%
  select(-wOBA_num, -wOBA_den, -swings, -whiffs, -fp_pitches, -fp_swings,
         -batted_balls, -pull_balls, -str_balls, -oppo_balls, -spray_total)

# ── Pitch mix ──────────────────────────────────────────────────────────────────
pitch_mix <- pitches %>%
  filter(!is.na(pitch_type), trimws(pitch_type) != "") %>%
  group_by(batter, pitch_type) %>%
  summarise(n = n(), .groups = "drop") %>%
  group_by(batter) %>%
  mutate(pct = round(n / sum(n) * 100, 1)) %>%
  summarise(
    pitch_mix = list(setNames(as.list(pct), pitch_type)),
    .groups   = "drop"
  )

# ── Zone stats ─────────────────────────────────────────────────────────────────
zone_stats <- pitches %>%
  group_by(batter) %>%
  summarise(
    zone_pct = round(
      sum(!is.na(pitch_x) & !is.na(pitch_y) &
            abs(pitch_x) <= 1 & pitch_y >= 0 & pitch_y <= 1, na.rm = TRUE) /
        max(sum(!is.na(pitch_x) & !is.na(pitch_y)), 1) * 100, 1),
    swinging_k    = sum(is_k_swinging),
    called_k      = sum(is_k_looking),
    ooz_pitches   = sum(
      !is.na(pitch_x) & !is.na(pitch_y) &
        (abs(pitch_x) > 1 | pitch_y < 0 | pitch_y > 1),
      na.rm = TRUE),
    chase_pitches = sum(
      !is.na(pitch_x) & !is.na(pitch_y) &
        (abs(pitch_x) > 1 | pitch_y < 0 | pitch_y > 1) &
        outcome %in% c(
        "Swinging Strike", "Foul",
        "Strikeout Swinging", "Dropped Third Strike Swinging",
        "Single", "Double", "Triple", "Home Run",
        "Groundout", "Flyout", "Popout", "Lineout",
        "Double Play", "Triple Play", "Error",
        "Sacrifice Fly", "Sac Fly Double Play",
        "Sacrifice Bunt", "Sac Bunt Double Play"
      ),
      na.rm = TRUE),
    .groups = "drop"
  ) %>%
  mutate(
    Chase_pct = ifelse(ooz_pitches > 0, round(chase_pitches / ooz_pitches * 100, 1), NA)
  )

# ── Join & export ──────────────────────────────────────────────────────────────
strike_outcomes <- c(
  "Called Strike", "Swinging Strike", "Foul",
  "Strikeout Looking", "Strikeout Swinging",
  "Dropped Third Strike Looking", "Dropped Third Strike Swinging",
  "Single", "Double", "Triple", "Home Run",
  "Groundout", "Flyout", "Popout", "Lineout",
  "Double Play", "Triple Play", "Error", "Truncated Out",
  "Sacrifice Fly", "Sac Fly Double Play",
  "Sacrifice Bunt", "Sac Bunt Double Play"
)

batter_xlsx <- pitches %>%
  mutate(has_location = !is.na(pitch_x) & !is.na(pitch_y)) %>%
  group_by(batter, batter_team) %>%
  summarise(
    PA               = sum(is_pa),
    BB               = sum(is_bb),
    swings           = sum(is_swing),
    whiffs           = sum(is_whiff),
    in_zone_pitches  = sum(has_location & in_zone),
    in_zone_swings   = sum(has_location & in_zone & is_swing),
    out_zone_pitches = sum(has_location & !in_zone),
    out_zone_swings  = sum(has_location & !in_zone & is_swing),
    batted_balls     = sum(is_batted & contact_type %in% c("GB", "FB", "LD", "PO"), na.rm = TRUE),
    gb               = sum(is_batted & contact_type == "GB", na.rm = TRUE),
    fb               = sum(is_batted & contact_type == "FB", na.rm = TRUE),
    pull_balls       = sum(spray_pull),
    str_balls        = sum(spray_str),
    oppo_balls       = sum(spray_oppo),
    .groups          = "drop"
  ) %>%
  mutate(
    `In-Zone Swing %`  = ifelse(in_zone_pitches > 0, round(in_zone_swings / in_zone_pitches * 100, 1), NA),
    `Out-Zone Swing %` = ifelse(out_zone_pitches > 0, round(out_zone_swings / out_zone_pitches * 100, 1), NA),
    `In-Out Swing %`   = round(`In-Zone Swing %` - `Out-Zone Swing %`, 1),
    `Chase %`          = `Out-Zone Swing %`,
    `Whiff %`          = ifelse(swings > 0, round(whiffs / swings * 100, 1), NA),
    `BB %`             = ifelse(PA > 0, round(BB / PA * 100, 1), NA),
    `GB %`             = ifelse(batted_balls > 0, round(gb / batted_balls * 100, 1), NA),
    `FB %`             = ifelse(batted_balls > 0, round(fb / batted_balls * 100, 1), NA),
    spray_total        = pull_balls + str_balls + oppo_balls,
    `Pull %`           = ifelse(spray_total > 0, round(pull_balls / spray_total * 100, 1), NA)
  ) %>%
  transmute(
    Batter = batter,
    Team = batter_team,
    `In-Zone Swing %`,
    `Out-Zone Swing %`,
    `In-Out Swing %`,
    `Chase %`,
    `Whiff %`,
    `BB %`,
    `GB %`,
    `FB %`,
    `Pull %`
  ) %>%
  arrange(Team, Batter)

pitcher_xlsx <- pitches %>%
  mutate(has_location = !is.na(pitch_x) & !is.na(pitch_y)) %>%
  group_by(pitcher, pitcher_team) %>%
  summarise(
    BF               = sum(is_pa),
    total_pitches    = sum(outcome != "" & !is.na(outcome)),
    K                = sum(is_k),
    BB               = sum(is_bb),
    HR               = sum(is_hr),
    strikes          = sum(outcome %in% strike_outcomes),
    swings           = sum(is_swing),
    whiffs           = sum(is_whiff),
    fp_pitches       = sum(is_first_pitch),
    fp_strikes       = sum(is_fp_strike),
    two_strike_pa    = sum(is_two_strike_count & is_pa),
    putaways         = sum(is_putaway),
    out_zone_pitches = sum(has_location & !in_zone),
    chase_pitches    = sum(has_location & !in_zone & is_swing),
    batted_balls     = sum(is_batted & contact_type %in% c("GB", "FB", "LD", "PO"), na.rm = TRUE),
    gb               = sum(is_batted & contact_type == "GB", na.rm = TRUE),
    .groups          = "drop"
  ) %>%
  mutate(
    K_pct       = ifelse(BF > 0, round(K / BF * 100, 1), NA),
    `FPS %`     = ifelse(fp_pitches > 0, round(fp_strikes / fp_pitches * 100, 1), NA),
    `Strike %`  = ifelse(total_pitches > 0, round(strikes / total_pitches * 100, 1), NA),
    `Chase %`   = ifelse(out_zone_pitches > 0, round(chase_pitches / out_zone_pitches * 100, 1), NA),
    `Putaway %` = ifelse(two_strike_pa > 0, round(putaways / two_strike_pa * 100, 1), NA),
    `BB %`      = ifelse(BF > 0, round(BB / BF * 100, 1), NA),
    `GB %`      = ifelse(batted_balls > 0, round(gb / batted_balls * 100, 1), NA),
    `HR %`      = ifelse(BF > 0, round(HR / BF * 100, 1), NA),
    `Whiff %`   = ifelse(swings > 0, round(whiffs / swings * 100, 1), NA),
    `K-BB`      = round(K_pct - `BB %`, 1)
  ) %>%
  transmute(
    Pitcher = pitcher,
    Team = pitcher_team,
    `FPS %`,
    `Strike %`,
    `Chase %`,
    `Putaway %`,
    `BB %`,
    `GB %`,
    `HR %`,
    `Whiff %`,
    `K-BB`
  ) %>%
  arrange(Team, Pitcher)

final <- summary_stats %>%
  left_join(pitch_mix,  by = "batter") %>%
  left_join(zone_stats, by = "batter")

write_json(final,
           "C:/Users/chris/OneDrive/Documents/summary2026.json",
           auto_unbox = TRUE, pretty = TRUE, na = "null")

write_xlsx_workbook(
  list(
    Batters = add_league_average_row(batter_xlsx),
    Pitchers = add_league_average_row(pitcher_xlsx)
  ),
  "C:/Users/chris/OneDrive/Documents/summary2026.xlsx"
)

cat("Done! summary2026.json written with", nrow(final), "players\n")
cat("Done! summary2026.xlsx written with", nrow(batter_xlsx), "batters and", nrow(pitcher_xlsx), "pitchers\n")
cat("New batter columns: ISO, BABIP, wOBA, Swing_pct, Whiff_pct, FP_Swing_pct, Pull_pct, Str_pct, Oppo_pct, Chase_pct\n")
cat("Columns:", paste(names(final), collapse = ", "), "\n")
