# Derive season-specific wOBA weights from validated DataDiamond base/out
# transitions. Official CBL final scores are used as the validation gate.
derive_cbl_woba_weights <- function(pitches, official_games) {
  terminal_outcomes <- c(
    "Single", "Double", "Triple", "Home Run",
    "Groundout", "Ground Out", "Flyout", "Fly Out", "Popout", "Pop Out",
    "Lineout", "Line Out", "Double Play", "Triple Play", "Error", "Field Error",
    "Fielders Choice", "Fielder's Choice", "Strikeout Looking", "Strikeout Swinging",
    "Dropped Third Strike Looking", "Dropped Third Strike Swinging",
    "Walk", "Intentional Walk", "Hit By Pitch", "Sacrifice Fly",
    "Sac Fly Double Play", "Sacrifice Bunt", "Sac Bunt Double Play",
    "Catcher Interference", "Batter Interference"
  )
  safe_outcomes <- c(
    "Single", "Double", "Triple", "Home Run", "Walk", "Intentional Walk",
    "Hit By Pitch", "Error", "Field Error", "Fielders Choice", "Fielder's Choice",
    "Catcher Interference", "Batter Interference"
  )
  ordinary_outcomes <- c(
    "Groundout", "Ground Out", "Flyout", "Fly Out", "Popout", "Pop Out",
    "Lineout", "Line Out", "Strikeout Looking", "Strikeout Swinging"
  )

  runner_count <- function(values) {
    values <- trimws(as.character(values))
    values[is.na(values) | values == ""] <- "0"
    vapply(values, function(value) {
      chars <- strsplit(value, "")[[1]]
      if (length(chars) >= 3) sum(chars[seq_len(3)] == "1") else sum(chars == "1")
    }, integer(1))
  }
  normalize_base <- function(values) {
    values <- trimws(as.character(values))
    values[is.na(values) | values == ""] <- "0"
    vapply(values, function(value) {
      chars <- strsplit(value, "")[[1]]
      if (length(chars) >= 3) paste(chars[seq_len(3)], collapse = "")
      else sprintf("%03d", suppressWarnings(as.integer(value)))
    }, character(1))
  }

  transitions <- pitches %>%
    mutate(
      .source_row = row_number(),
      .inning = suppressWarnings(as.integer(inning)),
      .outs = suppressWarnings(as.integer(outs)),
      .stint_team = if ("batter_team_stint" %in% names(pitches)) batter_team_stint else batter_team,
      .matchup = paste(date, pmin(.stint_team, pitcher_team), pmax(.stint_team, pitcher_team), sep = "|"),
      .new_game = row_number() == 1L |
        .matchup != lag(.matchup, default = first(.matchup)) |
        .inning < lag(.inning, default = first(.inning)),
      .game_block = cumsum(.new_game)
    ) %>%
    filter(outcome %in% terminal_outcomes) %>%
    mutate(
      .start_runners = runner_count(runners),
      .start_base = normalize_base(runners)
    )

  same_half <- with(
    transitions,
    .game_block == lead(.game_block) & .inning == lead(.inning) &
      .stint_team == lead(.stint_team)
  )
  transitions <- transitions %>%
    mutate(
      .same_half = coalesce(same_half, FALSE),
      .end_runners = ifelse(.same_half, lead(.start_runners), 0L),
      .end_base = ifelse(.same_half, lead(.start_base), "000"),
      .end_outs = ifelse(.same_half, lead(.outs), 3L),
      .batter_safe = outcome %in% safe_outcomes,
      .outs_added = pmax(0L, .end_outs - .outs),
      .batter_out = ifelse(!.batter_safe, pmin(1L, .outs_added), 0L),
      .runner_outs = pmax(0L, .outs_added - .batter_out),
      # On an inning-ending out, remaining runners are stranded rather than
      # scored; for all other transitions participant conservation identifies runs.
      .runs = ifelse(
        .same_half,
        pmax(0L, .start_runners + as.integer(.batter_safe) - .end_runners - .runner_outs),
        0L
      ),
      .state = paste(.outs, .start_base, sep = "|")
    )

  blocks <- transitions %>%
    group_by(.game_block, date) %>%
    summarise(team1 = first(.stint_team), team2 = first(pitcher_team), .groups = "drop")
  block_scores <- transitions %>%
    group_by(.game_block, date, .stint_team) %>%
    summarise(runs = sum(.runs, na.rm = TRUE), .groups = "drop")

  candidate_matches <- list()
  for (block_id in blocks$.game_block) {
    meta <- blocks[blocks$.game_block == block_id, ]
    candidates <- official_games %>%
      filter(
        as.character(game_date) == as.character(meta$date),
        (home_team == meta$team1 & away_team == meta$team2) |
          (home_team == meta$team2 & away_team == meta$team1)
      )
    if (!nrow(candidates)) next
    scores <- block_scores %>% filter(.game_block == block_id)
    for (candidate_index in seq_len(nrow(candidates))) {
      game <- candidates[candidate_index, ]
      inferred_home <- sum(scores$runs[scores$.stint_team == game$home_team], na.rm = TRUE)
      inferred_away <- sum(scores$runs[scores$.stint_team == game$away_team], na.rm = TRUE)
      candidate_matches[[length(candidate_matches) + 1L]] <- data.frame(
        game_block = block_id,
        game_id = game$game_id,
        score_ok = inferred_home == game$home_runs && inferred_away == game$away_runs,
        stringsAsFactors = FALSE
      )
    }
  }
  if (!length(candidate_matches)) stop("No DataDiamond games matched the official CBL feed")

  validated_games <- bind_rows(candidate_matches) %>%
    filter(score_ok) %>%
    group_by(game_block) %>%
    filter(n() == 1L) %>%
    ungroup() %>%
    group_by(game_id) %>%
    filter(n() == 1L) %>%
    ungroup()

  validated <- transitions %>%
    filter(.game_block %in% validated_games$game_block) %>%
    group_by(.game_block, .stint_team, .inning) %>%
    mutate(.runs_remaining = rev(cumsum(rev(.runs)))) %>%
    ungroup()

  expectancy <- validated %>%
    group_by(.state) %>%
    summarise(run_expectancy = mean(.runs_remaining), state_pa = n(), .groups = "drop")
  expectation_by_state <- setNames(expectancy$run_expectancy, expectancy$.state)
  validated <- validated %>%
    mutate(
      .end_state = ifelse(.end_outs >= 3L, NA_character_, paste(.end_outs, .end_base, sep = "|")),
      .end_expectancy = ifelse(is.na(.end_state), 0, expectation_by_state[.end_state]),
      .run_value = .runs + .end_expectancy - expectation_by_state[.state],
      .event = case_when(
        outcome == "Single" ~ "1B", outcome == "Double" ~ "2B",
        outcome == "Triple" ~ "3B", outcome == "Home Run" ~ "HR",
        outcome == "Walk" ~ "BB", outcome == "Hit By Pitch" ~ "HBP",
        outcome %in% ordinary_outcomes ~ "OUT", TRUE ~ "OTHER"
      )
    )

  raw_weights <- validated %>%
    filter(.event %in% c("BB", "HBP", "1B", "2B", "3B", "HR", "OUT"), is.finite(.run_value)) %>%
    group_by(.event) %>%
    summarise(raw_run_value = mean(.run_value), event_count = n(), .groups = "drop")
  out_value <- raw_weights$raw_run_value[raw_weights$.event == "OUT"]
  if (length(out_value) != 1L) stop("Could not derive the CBL out value")
  raw_weights <- raw_weights %>% mutate(above_out = raw_run_value - out_value)
  relative_weights <- setNames(raw_weights$above_out, raw_weights$.event)

  hit_outcomes <- c("Single", "Double", "Triple", "Home Run")
  bb <- sum(validated$outcome %in% c("Walk", "Intentional Walk"))
  ibb <- sum(validated$outcome == "Intentional Walk")
  hbp <- sum(validated$outcome == "Hit By Pitch")
  sf <- sum(validated$outcome %in% c("Sacrifice Fly", "Sac Fly Double Play"))
  ab <- sum(!(validated$outcome %in% c(
    "Walk", "Intentional Walk", "Hit By Pitch", "Sacrifice Fly", "Sac Fly Double Play",
    "Sacrifice Bunt", "Sac Bunt Double Play", "Catcher Interference"
  )))
  hits <- sum(validated$outcome %in% hit_outcomes)
  woba_denominator <- ab + bb - ibb + sf + hbp
  league_obp <- (hits + bb + hbp) / (ab + bb + hbp + sf)
  event_counts <- c(
    BB = sum(validated$outcome == "Walk"), HBP = hbp,
    `1B` = sum(validated$outcome == "Single"), `2B` = sum(validated$outcome == "Double"),
    `3B` = sum(validated$outcome == "Triple"), HR = sum(validated$outcome == "Home Run")
  )
  unscaled_woba <- sum(relative_weights[names(event_counts)] * event_counts) / woba_denominator
  woba_scale <- league_obp / unscaled_woba
  weights <- relative_weights[names(event_counts)] * woba_scale

  if (
    nrow(validated_games) < 40L || nrow(validated) < 3500L ||
      any(!is.finite(weights)) || !is.finite(woba_scale) ||
      event_counts[["HR"]] < 50L || event_counts[["3B"]] < 5L
  ) stop("Not enough score-validated CBL data to publish custom wOBA weights")

  list(
    weights = weights,
    scale = woba_scale,
    validated_games = nrow(validated_games),
    validated_pa = nrow(validated),
    state_table = expectancy,
    event_table = raw_weights,
    event_counts = event_counts
  )
}
