# Refresh the live 2026 ONuBaseball batting and pitching tables used for
# dashboard OPS+ and FIP. This reads the rendered DataTables pages directly,
# which is more reliable than attempting to capture Shiny's websocket frames.

required <- c("chromote", "jsonlite")
missing <- required[!vapply(required, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing)) stop("Install required packages: ", paste(missing, collapse = ", "))

library(chromote)
library(jsonlite)

options(chromote.headless = "new", chromote.timeout = 90)

site <- "https://onubaseball.com/"
season <- "2026"
output_path <- "C:/Users/chris/Downloads/Guelph Training Files/data-diamond/oua/brock-dashboard/data/onu-season-stats.json"

browser <- Chromote$new()
session <- browser$new_session()
on.exit({ try(session$close(), silent = TRUE); try(browser$close(), silent = TRUE) }, add = TRUE)

evaluate <- function(expression) {
  result <- session$Runtime$evaluate(expression = expression, returnByValue = TRUE)
  result$result$value %||% NULL
}
`%||%` <- function(x, y) if (is.null(x)) y else x

session$Page$navigate(site)
Sys.sleep(8)

load_table <- function(stat_type) {
  setup <- sprintf(
    paste0(
      "document.querySelector('a[href=\\\"#tab-2530-3\\\"]').click();",
      "Shiny.setInputValue('.clientdata_output_stats_hidden',false,{priority:'event'});",
      "Shiny.setInputValue('.clientdata_output_stats_width',1200,{priority:'event'});",
      "Shiny.setInputValue('.clientdata_output_stats_height',700,{priority:'event'});",
      "Shiny.setInputValue('groupType','Player',{priority:'event'});",
      "Shiny.setInputValue('teamType','Any',{priority:'event'});",
      "Shiny.setInputValue('statType',%s,{priority:'event'});",
      "Shiny.setInputValue('season','2026',{priority:'event'});"
    ),
    toJSON(stat_type, auto_unbox = TRUE)
  )
  evaluate(setup)

  ready <- FALSE
  for (attempt in seq_len(30)) {
    Sys.sleep(1)
    info <- evaluate("(function(){var t=$('#stats table');if(!t.length||!$.fn.dataTable.isDataTable(t[0]))return null;return JSON.stringify(t.DataTable().page.info())})()")
    if (!is.null(info)) {
      page_info <- fromJSON(info)
      if (identical(as.integer(page_info$recordsTotal), 0L) || page_info$recordsTotal > 0) {
        ready <- TRUE
        break
      }
    }
  }
  if (!ready) stop("ONuBaseball did not return the ", stat_type, " table.")

  headers_json <- evaluate("JSON.stringify(Array.from(document.querySelectorAll('#stats table thead th')).map(function(x){return x.textContent.trim()}))")
  headers <- fromJSON(headers_json)
  # DataTables keeps a hidden sizing clone of the header in the DOM. Keep the
  # visible header once rather than writing each column twice.
  if (length(headers) %% 2 == 0L && identical(headers[seq_len(length(headers) / 2L)], headers[(length(headers) / 2L + 1L):length(headers)])) {
    headers <- headers[seq_len(length(headers) / 2L)]
  }
  evaluate("$('#stats table').DataTable().page.len(100).draw()")
  Sys.sleep(2)

  rows <- list()
  repeat {
    payload <- evaluate("JSON.stringify($('#stats table').DataTable().rows().data().toArray())")
    page_rows <- fromJSON(payload, simplifyVector = FALSE)
    rows <- c(rows, page_rows)
    info <- fromJSON(evaluate("JSON.stringify($('#stats table').DataTable().page.info())"))
    if ((info$start + info$length) >= info$recordsDisplay) break
    evaluate("$('#stats table').DataTable().page('next').draw('page')")
    Sys.sleep(2)
  }

  list(season = season, type = stat_type, columns = headers, rows = rows, source = site)
}

fresh <- lapply(c("Batting", "Pitching"), load_table)
source <- fromJSON(output_path, simplifyVector = FALSE)
source$tables <- c(
  Filter(function(table) !(identical(as.character(table$season), season) && table$type %in% c("Batting", "Pitching")), source$tables),
  fresh
)
source$source <- site
write_json(source, output_path, pretty = TRUE, auto_unbox = TRUE, na = "null")
message("Updated 2026 ONuBaseball tables: ", paste(vapply(fresh, function(table) paste0(table$type, " ", length(table$rows)), character(1)), collapse = "; "))
