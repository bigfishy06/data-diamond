# Refresh public ONuBaseball player season statistics for the OUA dashboard.
#
# ONuBaseball is a Shiny application, so its tables are not included in the
# initial HTML. chromote opens a local headless Chrome session, activates the
# Stats output, captures the session-specific DataTables endpoint, and writes
# the published batting and pitching rows for the dashboard.
#
# One-time setup in R:
# install.packages(c("chromote", "jsonlite"))

required_packages <- c("chromote", "jsonlite")
missing_packages <- required_packages[!vapply(required_packages, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing_packages)) {
  stop("Install required packages first: install.packages(c(", paste(sprintf("'%s'", missing_packages), collapse = ", "), "))")
}

library(chromote)
library(jsonlite)

site <- "https://onubaseball.com/"
seasons <- c(
  "2020", "2021", "2021 Postseason", "2022", "2022 Postseason",
  "2023", "2023 Postseason", "2024", "2024 Postseason",
  "2024 National Championship", "2025"
)
stat_types <- c("Batting", "Pitching")
output_path <- file.path(
  "C:/Users/chris/Downloads/Guelph Training Files/data-diamond/oua",
  "brock-dashboard/data/onu-season-stats.json"
)

decode_ws_payload <- function(event) {
  event$response$payloadData %||% ""
}

`%||%` <- function(x, y) if (is.null(x)) y else x

table_details <- function(payloads) {
  for (payload in rev(payloads)) {
    endpoint <- regmatches(payload, regexpr(
      "session/[^\"\\\\]+?/dataobj/stats\\?w=&nonce=[0-9a-f]+", payload, perl = TRUE
    ))
    if (!length(endpoint) || !nzchar(endpoint)) next
    headers <- regmatches(payload, gregexpr("<th>([^<]+)<\\\\/th>", payload, perl = TRUE))[[1]]
    headers <- sub("^<th>|<\\\\/th>$", "", headers)
    if (length(headers)) return(list(endpoint = endpoint, columns = headers))
  }
  NULL
}

datatable_form <- function(column_count) {
  values <- list(
    draw = "1", start = "0", length = "10000", escape = "false",
    "search[value]" = "", "search[regex]" = "false",
    "search[caseInsensitive]" = "true", "search[smart]" = "true"
  )
  for (index in seq_len(column_count) - 1L) {
    prefix <- sprintf("columns[%d]", index)
    values[[sprintf("%s[data]", prefix)]] <- as.character(index)
    values[[sprintf("%s[name]", prefix)]] <- ""
    values[[sprintf("%s[searchable]", prefix)]] <- "true"
    values[[sprintf("%s[orderable]", prefix)]] <- "true"
    values[[sprintf("%s[search][value]", prefix)]] <- ""
    values[[sprintf("%s[search][regex]", prefix)]] <- "false"
    values[[sprintf("%s[search][caseInsensitive]", prefix)]] <- "true"
    values[[sprintf("%s[search][smart]", prefix)]] <- "true"
  }
  paste(
    sprintf("%s=%s", utils::URLencode(names(values), reserved = TRUE),
            utils::URLencode(unlist(values, use.names = FALSE), reserved = TRUE)),
    collapse = "&"
  )
}

# Always create an isolated Chrome process. ChromoteSession$new() normally
# reuses Chromote's default browser; after a failed run that default may point
# to a target that has already been closed.
chrome_paths <- c(
  Sys.getenv("CHROMOTE_CHROME", unset = ""),
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
)
chrome_path <- chrome_paths[file.exists(chrome_paths)][1]
if (is.na(chrome_path) || !nzchar(chrome_path)) {
  stop(
    "Chrome or Edge was not found. Set CHROMOTE_CHROME to the full path of chrome.exe, then run this script again.",
    call. = FALSE
  )
}

options(chromote.timeout = 30, chromote.headless = "new")
browser <- tryCatch(
  Chromote$new(browser = Chrome$new(path = chrome_path)),
  error = function(error) {
    stop(
      "Chromote could not start Chrome. Close any old Chromote Chrome windows, ",
      "restart R, and run this script again. Original error: ", error$message,
      call. = FALSE
    )
  }
)

session <- tryCatch(
  browser$new_session(width = 1440, height = 1000),
  error = function(error) {
    try(browser$close(wait = FALSE), silent = TRUE)
    stop("Chromote could not open a browser tab. Original error: ", error$message, call. = FALSE)
  }
)

if (!session$is_active()) {
  stop(
    "Chromote opened a tab but it immediately closed. Restart R, close any Chrome windows ",
    "started by Chromote, and run the script again.",
    call. = FALSE
  )
}

payloads <- character()
cancel_ws_capture <- session$Network$webSocketFrameReceived(
  callback_ = function(event) {
    payloads <<- c(payloads, decode_ws_payload(event))
  }
)

on.exit({
  if (exists("cancel_ws_capture", inherits = FALSE) && is.function(cancel_ws_capture)) {
    try(cancel_ws_capture(), silent = TRUE)
  }
  if (exists("session", inherits = FALSE) && session$is_active()) {
    try(session$close(wait_ = FALSE), silent = TRUE)
  }
  if (exists("browser", inherits = FALSE) && browser$is_active()) {
    try(browser$close(wait = FALSE), silent = TRUE)
  }
}, add = TRUE)

# go_to() waits for a dependable page load; Page$navigate() plus Sys.sleep()
# can miss the Shiny connection that carries the DataTables endpoint.
session$go_to(site)
Sys.sleep(3)

evaluate <- function(expression, await = FALSE) {
  result <- session$Runtime$evaluate(
    expression = expression,
    awaitPromise = await,
    returnByValue = TRUE
  )
  result$result$value %||% NULL
}

activate_table <- function(season, stat_type) {
  payloads <<- character()
  javascript <- sprintf(
    paste0(
      "Shiny.setInputValue('.clientdata_output_stats_hidden', false, {priority:'event'});",
      "Shiny.setInputValue('.clientdata_output_stats_width', 1200, {priority:'event'});",
      "Shiny.setInputValue('.clientdata_output_stats_height', 700, {priority:'event'});",
      "Shiny.setInputValue('groupType', 'Player', {priority:'event'});",
      "Shiny.setInputValue('teamType', 'Any', {priority:'event'});",
      "Shiny.setInputValue('statType', %s, {priority:'event'});",
      "Shiny.setInputValue('season', %s, {priority:'event'});"
    ),
    toJSON(stat_type, auto_unbox = TRUE), toJSON(season, auto_unbox = TRUE)
  )
  evaluate(javascript)
  for (attempt in seq_len(12)) {
    Sys.sleep(0.5)
    details <- table_details(payloads)
    if (!is.null(details)) return(details)
  }
  NULL
}

fetch_rows <- function(endpoint, columns) {
  request_body <- datatable_form(length(columns))
  javascript <- sprintf(
    paste0(
      "fetch(%s,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},body:%s})",
      ".then(response=>response.text())"
    ),
    toJSON(endpoint, auto_unbox = TRUE), toJSON(request_body, auto_unbox = TRUE)
  )
  response <- evaluate(javascript, await = TRUE)
  parsed <- fromJSON(response, simplifyVector = FALSE)
  if (!is.null(parsed$error)) stop(parsed$error)
  parsed$data %||% list()
}

tables <- list()
unavailable <- character()
for (season in seasons) {
  found <- FALSE
  for (stat_type in stat_types) {
    details <- activate_table(season, stat_type)
    if (is.null(details)) next
    rows <- fetch_rows(details$endpoint, details$columns)
    # The source returns the prior valid table for unavailable selections.
    if (length(rows) && as.character(rows[[1]][[2]]) != season) next
    tables[[length(tables) + 1L]] <- list(
      season = season,
      type = stat_type,
      columns = details$columns,
      rows = rows,
      source = site
    )
    found <- TRUE
  }
  if (!found) unavailable <- c(unavailable, season)
}

dir.create(dirname(output_path), recursive = TRUE, showWarnings = FALSE)
write_json(
  list(source = site, tables = tables, unavailable = unavailable),
  output_path,
  pretty = TRUE,
  auto_unbox = TRUE,
  na = "null"
)

message("Wrote ", length(tables), " ONuBaseball season-stat tables to ", output_path)
if (length(unavailable)) message("Unavailable seasons: ", paste(unavailable, collapse = ", "))
