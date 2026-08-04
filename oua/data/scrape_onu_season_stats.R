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

# Browser setup has been verified with the installed Chrome. Do not subscribe
# to Network/WebSocket DevTools events here: that callback is what detaches
# the session on this Windows setup. The table is read directly from the page.
options(chromote.timeout = 60, chromote.headless = "new")
session <- ChromoteSession$new(width = 1440, height = 1000)
# ONuBaseball is a persistent Shiny app. Its DevTools Page.navigate command
# can time out even though the page is reachable, so navigate through the
# already-active JavaScript runtime instead.
session$Runtime$evaluate(
  expression = sprintf(
    "setTimeout(() => window.location.assign(%s), 0); 'navigation scheduled'",
    toJSON(site, auto_unbox = TRUE)
  ),
  returnByValue = TRUE
)
Sys.sleep(8)

evaluate <- function(expression, await = FALSE) {
  result <- session$Runtime$evaluate(
    expression = expression,
    awaitPromise = await,
    returnByValue = TRUE
  )
  result$result$value %||% NULL
}

activate_table <- function(season, stat_type) {
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
  for (attempt in seq_len(20)) {
    Sys.sleep(0.75)
    rendered <- evaluate(
      paste0(
        "(() => {",
        "const table = document.querySelector('#stats table') || document.querySelector('table[id^=\\\"stats\\\"]');",
        "if (!table || !window.jQuery || !jQuery.fn.DataTable.isDataTable(table)) return null;",
        "const api = jQuery(table).DataTable();",
        "if (api.page.len() !== 10000) { api.page.len(10000).draw(false); return null; }",
        "const columns = api.columns().header().toArray().map(x => x.textContent.trim());",
        "const rows = api.rows({search:'applied'}).data().toArray().map(row => Array.from(row, cell => String(cell).replace(/<[^>]*>/g, '').trim()));",
        "return JSON.stringify({columns: columns, rows: rows});",
        "})()"
      )
    )
    if (is.null(rendered) || !nzchar(rendered)) next
    parsed <- fromJSON(rendered, simplifyVector = FALSE)
    if (length(parsed$columns) && length(parsed$rows)) {
      return(list(columns = parsed$columns, rows = parsed$rows))
    }
  }
  NULL
}

tables <- list()
unavailable <- character()
for (season in seasons) {
  found <- FALSE
  for (stat_type in stat_types) {
    details <- activate_table(season, stat_type)
    if (is.null(details)) next
    rows <- details$rows
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
