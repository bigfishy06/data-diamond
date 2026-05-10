library(dplyr)
library(jsonlite)

# ── Load ───────────────────────────────────────────────────────────────────────
pitches <- read.csv("C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/datadiamond.csv",
                    stringsAsFactors = FALSE,
                    header = FALSE,
                    col.names = c("inning", "outs", "balls", "strikes", "count",
                                  "date", "batter_team", "pitcher_team",
                                  "time_to_plate",
                                  "batter", "pitcher",
                                  "batter_side", "pitcher_side", "pitch_type",
                                  "outcome", "contact_quality", "spray_chart",
                                  "runners", "pitch_x", "pitch_y"))

pitches$pitch_x       <- suppressWarnings(as.numeric(pitches$pitch_x))
pitches$pitch_y       <- suppressWarnings(as.numeric(pitches$pitch_y))
pitches$time_to_plate <- suppressWarnings(as.numeric(pitches$time_to_plate))
pitches <- pitches %>% filter(trimws(batter) != "")

# ── Outcome reference vectors ──────────────────────────────────────────────────
# Pitch-level outcomes (do NOT end a PA)
PITCH_OUTCOMES <- c("Ball", "Called Strike", "Swinging Strike", "Foul", "Pickoff")

# PA-ending outcomes that are NOT at-bats
NON_AB_PA_OUTCOMES <- c(
  "Walk", "Intentional Walk", "Hit By Pitch",
  "Sacrifice Fly", "Sac Fly Double Play",
  "Sacrifice Bunt", "Sac Bunt Double Play",
  "Catcher Interference",
  "Caught Stealing", "Truncated Out",
  "Batter Interference", "Additional Out"
)

# ── Classify outcomes ──────────────────────────────────────────────────────────
pitches <- pitches %>%
  mutate(
    # Hits
    is_single     = outcome == "Single",
    is_double     = outcome == "Double",
    is_triple     = outcome == "Triple",
    is_hr         = outcome == "Home Run",
    is_hit        = is_single | is_double | is_triple | is_hr,
    
    # Walks & HBP
    is_bb         = outcome %in% c("Walk", "Intentional Walk"),
    is_ibb        = outcome == "Intentional Walk",
    is_hbp        = outcome == "Hit By Pitch",
    
    # Strikeouts (standard)
    is_k_looking  = outcome == "Strikeout Looking",
    is_k_swinging = outcome == "Strikeout Swinging",
    is_k          = is_k_looking | is_k_swinging,
    
    # Dropped third strikes (batter reaches — still a K charged to pitcher)
    is_dts_looking  = outcome == "Dropped Third Strike Looking",
    is_dts_swinging = outcome == "Dropped Third Strike Swinging",
    is_dts          = is_dts_looking | is_dts_swinging,
    
    # Outs in play
    is_groundout  = outcome == "Groundout",
    is_dp         = outcome == "Double Play",
    is_tp         = outcome == "Triple Play",
    is_popout     = outcome == "Popout",
    is_flyout     = outcome == "Flyout",
    is_lineout    = outcome == "Lineout",
    
    # Sacrifice
    is_sf         = outcome %in% c("Sacrifice Fly", "Sac Fly Double Play"),
    is_sb         = outcome %in% c("Sacrifice Bunt", "Sac Bunt Double Play"),
    is_sf_dp      = outcome == "Sac Fly Double Play",
    is_sb_dp      = outcome == "Sac Bunt Double Play",
    
    # Interference / special
    is_ci         = outcome == "Catcher Interference",
    is_bi         = outcome == "Batter Interference",
    is_error      = outcome == "Error",
    
    # Baserunning outcomes (charged to runner, not batter PA)
    is_pickoff    = outcome == "Pickoff",
    is_cs         = outcome == "Caught Stealing",
    
    # Truncated / administrative outs
    is_truncated  = outcome == "Truncated Out",
    is_add_out    = outcome == "Additional Out",
    
    # PA and AB flags
    # A PA ends whenever a batter-PA-ending outcome occurs
    is_pa = !(outcome %in% PITCH_OUTCOMES),
    
    # AB excludes: BB, IBB, HBP, SF (incl. DP), SB (incl. DP), CI, and
    #              non-batter outcomes (CS, Pickoff, Truncated, Additional Out, BI)
    is_ab = !(outcome %in% c(PITCH_OUTCOMES, NON_AB_PA_OUTCOMES)),
    
    # RBI opportunities — errors count as AB but not hits; DTS counts as K (AB)
    is_productive_out = outcome %in% c("Groundout", "Flyout", "Lineout",
                                       "Popout", "Double Play", "Triple Play")
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
    .groups        = "drop"
  ) %>%
  mutate(
    AVG  = ifelse(AB > 0, round(H / AB, 3), 0),
    SLG  = ifelse(AB > 0, round((`1B` + 2*`2B` + 3*`3B` + 4*HR) / AB, 3), 0),
    OBP  = ifelse((AB + BB + HBP + SF) > 0,
                  round((H + BB + HBP + CI) / (AB + BB + HBP + SF), 3), 0),
    OPS  = round(OBP + SLG, 3),
    # K% and BB% of PA
    K_pct  = ifelse(PA > 0, round((K + DTS) / PA * 100, 1), 0),
    BB_pct = ifelse(PA > 0, round(BB / PA * 100, 1), 0)
  )

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
    chase_pitches = sum(
      !is.na(pitch_x) & !is.na(pitch_y) &
        (abs(pitch_x) > 1 | pitch_y < 0 | pitch_y > 1) &
        outcome %in% c("Swinging Strike", "Foul"),
      na.rm = TRUE),
    .groups = "drop"
  )

# ── Join & export ──────────────────────────────────────────────────────────────
final <- summary_stats %>%
  left_join(pitch_mix,  by = "batter") %>%
  left_join(zone_stats, by = "batter")

write_json(final,
           "C:/Users/chris/OneDrive/Documents/summary.json",
           auto_unbox = TRUE, pretty = TRUE)

cat("Done! summary.json written with", nrow(final), "players\n")
cat("Columns:", paste(names(final), collapse = ", "), "\n")