/**
 * Google Docs Character Counter for Google Sheets
 *
 * Reads Google Docs links from a spreadsheet and writes
 * the character count of each document to another column.
 *
 * Supports:
 * - Google Docs smart chips
 * - Regular hyperlinks
 * - Plain Google Docs URLs
 * - Multiple document tabs, including nested tabs
 *
 * Character counts include spaces and line breaks.
 * Results may differ from Google Docs' built-in statistics.
 */

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  // Worksheet name. Leave empty to use the first worksheet.
  SHEET_NAME: "",

  // First row containing document links.
  START_ROW: 2,

  // Column containing Google Docs links (H = 8).
  SOURCE_COLUMN: 8,

  // Column where character counts are written (J = 10).
  OUTPUT_COLUMN: 10
};

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Updates character counts for all linked Google Docs.
 * Can be executed manually or through a time-driven trigger.
 */
function updateDocChars() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error(
      "No active spreadsheet found. " +
      "This script must be bound to a Google Sheets file."
    );
  }

  const sheet = CONFIG.SHEET_NAME
    ? spreadsheet.getSheetByName(CONFIG.SHEET_NAME)
    : spreadsheet.getSheets()[0];

  if (!sheet) {
    throw new Error(
      `Worksheet "${CONFIG.SHEET_NAME}" not found.`
    );
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < CONFIG.START_ROW) {
    console.log("No rows to process.");
    return;
  }

  const rowCount = lastRow - CONFIG.START_ROW + 1;
  const sourceRange = sheet.getRange(
    CONFIG.START_ROW,
    CONFIG.SOURCE_COLUMN,
    rowCount,
    1
  );

  // Read ordinary hyperlinks and displayed cell values.
  const richTexts = sourceRange.getRichTextValues();
  const displayValues = sourceRange.getDisplayValues();

  // Read smart chip metadata using the Advanced Sheets API.
  const chipRows = getSmartChipRows_(
    spreadsheet.getId(),
    sheet.getName(),
    CONFIG.START_ROW,
    lastRow,
    CONFIG.SOURCE_COLUMN
  );

  const results = [];
  const cache = new Map();

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < rowCount; i++) {
    const rowNumber = CONFIG.START_ROW + i;

    const documentId = getDocumentIdFromCell_(
      chipRows[i],
      richTexts[i][0],
      displayValues[i][0]
    );

    if (!documentId) {
      const cellText = displayValues[i][0];

      results.push([
        cellText ? "ERROR: No Google Docs link" : ""
      ]);

      if (cellText) failed++;
      continue;
    }

    try {
      let count;

      // Avoid opening the same document multiple times.
      if (cache.has(documentId)) {
        count = cache.get(documentId);
      } else {
        count = countDocumentChars_(documentId);
        cache.set(documentId, count);
      }

      results.push([count]);
      processed++;

    } catch (error) {
      const message = error.message || String(error);

      results.push([`ERROR: ${message}`]);
      console.error(`Row ${rowNumber}: ${message}`);

      failed++;
    }
  }

  // Write all results in a single operation.
  sheet.getRange(
    CONFIG.START_ROW,
    CONFIG.OUTPUT_COLUMN,
    results.length,
    1
  ).setValues(results);

  console.log(
    `Finished. Processed: ${processed}, Errors: ${failed}.`
  );
}

// ============================================================
// SMART CHIP HANDLING
// ============================================================

/**
 * Retrieves smart chip metadata from the source column.
 *
 * SpreadsheetApp does not expose smart chip URLs directly,
 * so the Advanced Google Sheets API is required.
 */
function getSmartChipRows_(
  spreadsheetId,
  sheetName,
  startRow,
  endRow,
  columnNumber
) {
  const column = columnToLetter_(columnNumber);
  const escapedName = sheetName.replace(/'/g, "''");

  const range =
    `'${escapedName}'!${column}${startRow}:` +
    `${column}${endRow}`;

  const response = Sheets.Spreadsheets.get(spreadsheetId, {
    ranges: [range],
    fields: "sheets(data(rowData(values(chipRuns))))"
  });

  return response.sheets?.[0]?.data?.[0]?.rowData || [];
}

/**
 * Extracts a Google Docs document ID from a cell.
 *
 * Smart chips are checked first, followed by regular
 * hyperlinks and plain URLs.
 */
function getDocumentIdFromCell_(
  chipRow,
  richText,
  displayText
) {
  const urls = [];

  // Smart chip links.
  const chipRuns = chipRow?.values?.[0]?.chipRuns || [];

  for (const run of chipRuns) {
    const url = run.chip?.richLinkProperties?.uri;

    if (url) {
      urls.push(url);
    }
  }

  // Regular cell hyperlink.
  if (richText) {
    const cellUrl = richText.getLinkUrl();

    if (cellUrl) {
      urls.push(cellUrl);
    }

    // Hyperlinks applied to individual text segments.
    for (const run of richText.getRuns()) {
      const url = run.getLinkUrl();

      if (url) {
        urls.push(url);
      }
    }
  }

  // Plain text URL.
  if (displayText) {
    urls.push(displayText.trim());
  }

  for (const url of urls) {
    const documentId = extractDocumentId_(url);

    if (documentId) {
      return documentId;
    }
  }

  return null;
}

/**
 * Extracts the ID from a Google Docs URL.
 */
function extractDocumentId_(url) {
  if (typeof url !== "string") {
    return null;
  }

  const match = url.match(
    /https?:\/\/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([\w-]+)/i
  );

  return match ? match[1] : null;
}

// ============================================================
// DOCUMENT CHARACTER COUNTING
// ============================================================

/**
 * Counts characters across all document tabs.
 *
 * Includes spaces and line breaks in body text.
 * Uses JavaScript string length (UTF-16 code units).
 */
function countDocumentChars_(documentId) {
  const document = DocumentApp.openById(documentId);

  let total = 0;

  for (const tab of document.getTabs()) {
    total += countTabChars_(tab);
  }

  return total;
}

/**
 * Recursively counts characters in a document tab
 * and all its nested child tabs.
 */
function countTabChars_(tab) {
  const body = tab.asDocumentTab().getBody();

  let count = body.getText().length;

  for (const childTab of tab.getChildTabs()) {
    count += countTabChars_(childTab);
  }

  return count;
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Converts a 1-based column number to its A1 letter.
 *
 * Examples: 1 -> A, 8 -> H, 27 -> AA
 */
function columnToLetter_(columnNumber) {
  let result = "";
  let number = columnNumber;

  while (number > 0) {
    const remainder = (number - 1) % 26;

    result =
      String.fromCharCode(65 + remainder) + result;

    number = Math.floor((number - 1) / 26);
  }

  return result;
}
