# Google Docs Character Counter for Google Sheets

Automatically retrieve character counts from Google Docs and display them in Google Sheets using Google Apps Script.

## Features

- Supports Google Docs smart chips, regular hyperlinks, and plain URLs.
- Counts characters, including spaces and line breaks.
- Supports documents with multiple tabs, including nested tabs.
- Processes multiple documents in a single run.
- Avoids processing duplicate document links multiple times per run.
- Supports manual execution and automatic updates when opening the spreadsheet or on a schedule.
- Requires no third-party libraries or services.

## Installation

### 1. Set up Google Apps Script

1. Open your Google Sheets spreadsheet.
2. Navigate to **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with the code from this repository.
4. Open **Project Settings** (gear icon).
5. Enable **Show "appsscript.json" manifest file in editor**.
6. Return to the editor and open `appsscript.json`.
7. Replace its contents with the manifest from this repository.
8. Under **Services**, verify that **Google Sheets API** is enabled. If it is missing, click **+**, select **Google Sheets API**, and add it.
9. Save the project.

### 2. Configure the script

Open `Code.gs` and locate the configuration section:

```javascript
const CONFIG = {
  SHEET_NAME: "",
  START_ROW: 2,
  SOURCE_COLUMN: 8,
  OUTPUT_COLUMN: 10
};
```

| Parameter | Default | Description |
|---|---|---|
| `SHEET_NAME` | `""` | Name of the worksheet to process. Leave empty to use the first worksheet. |
| `START_ROW` | `2` | First row containing document links. |
| `SOURCE_COLUMN` | `8` | Column containing Google Docs links. Columns are numbered starting from 1 (H = 8). |
| `OUTPUT_COLUMN` | `10` | Column where character counts will be written (J = 10). |

**Example**

To process a worksheet named `Articles`, read links from column B starting at row 3, and write character counts to column F:

```javascript
const CONFIG = {
  SHEET_NAME: "Articles",
  START_ROW: 3,
  SOURCE_COLUMN: 2,
  OUTPUT_COLUMN: 6
};
```

Only these settings need to be changed. No modifications to the main script logic are required.

**Important:** The script overwrites existing values in the output column, starting from `START_ROW`. Make sure the selected column does not contain data you want to keep.

### 3. Authorize and run

1. In the Apps Script editor, select `updateDocChars` from the function dropdown.
2. Click **Run**.
3. Grant the requested Google Sheets and Google Docs permissions.
4. Return to your spreadsheet to view the results.

The Google account running the script must have access to the linked Google Docs documents.

## Usage

With the default configuration:

- **Column H (starting at H2):** Google Docs links or smart chips.
- **Column J (starting at J2):** Character counts.

Run `updateDocChars` whenever you want to refresh the results.

Empty source cells produce empty results. Invalid links or inaccessible documents produce error messages in the output column.

## Automatic Updates

The script supports two automatic update methods. Both use installable Google Apps Script triggers and require initial authorization.

### Option 1: Update When Opening the Spreadsheet

This option automatically refreshes character counts whenever the spreadsheet is opened by a user with editing access.

1. Open **Extensions → Apps Script**.
2. Select **Triggers** (clock icon) in the left sidebar.
3. Click **Add Trigger**.
4. Configure the trigger:
   - **Choose which function to run:** `updateDocChars`
   - **Choose which deployment should run:** `Head`
   - **Select event source:** `From spreadsheet`
   - **Select event type:** `On open`
5. Click **Save**.

The script will now run automatically whenever an editor opens the spreadsheet.

**Important:** Use an installable *On open* trigger, not a simple `onOpen()` function. Simple triggers cannot access Google Docs through services requiring authorization.

Installable triggers always run under the Google account that created them, even when another editor opens the spreadsheet. That account must have access to the linked documents.

### Option 2: Scheduled Updates

This option refreshes character counts periodically, even when nobody opens the spreadsheet.

1. Open **Extensions → Apps Script**.
2. Select **Triggers**.
3. Click **Add Trigger**.
4. Configure the trigger:
   - **Choose which function to run:** `updateDocChars`
   - **Choose which deployment should run:** `Head`
   - **Select event source:** `Time-driven`
   - **Select type of time based trigger:** e.g., `Hour timer`
   - **Select interval:** e.g., `Every hour`
5. Click **Save**.

The script will automatically refresh character counts at the selected interval.

You can use either update method or configure both. If both are enabled, each trigger will execute the same function independently.

## Permissions

The script requires two Google OAuth scopes:

| Permission | Purpose |
|---|---|
| `https://www.googleapis.com/auth/spreadsheets` | Read Google Sheets data and smart chip metadata, and write character counts. |
| `https://www.googleapis.com/auth/documents` | Open linked Google Docs and read their text. |

These permissions are declared in `appsscript.json`.

The script does not modify the linked Google Docs documents. It only reads their contents and updates the configured output column in Google Sheets.

## Limitations

- Only accessible Google Docs documents are supported.
- Character counts are calculated from document body text across all document tabs, including nested tabs.
- Spaces and line breaks are included.
- The script uses JavaScript's `String.length`, which counts UTF-16 code units. Some Unicode characters, including certain emoji, may count as more than one unit.
- Results may differ from the built-in Google Docs character count, particularly for complex formatting, special characters, and document elements outside the body text.
- Character counts update only when the script runs, not immediately after editing a linked document.
- Very large spreadsheets or large numbers of linked documents may exceed Google Apps Script execution time or service quotas.
- On-open triggers run when a user opens the spreadsheet with editing access; opening in view-only mode does not activate them.

## Troubleshooting

**Permission error when opening a document**

Make sure `appsscript.json` contains the required OAuth scopes and that the script has been authorized. Run `updateDocChars` manually to complete authorization if necessary.

**Google Sheets API is not available**

Open the Apps Script editor, go to **Services**, click **+**, and add **Google Sheets API**.

**ERROR: No Google Docs link**

Check that the source cell contains a valid Google Docs smart chip, hyperlink, or URL.

**Document access error**

Make sure the account executing the script has permission to access the linked document.

**Automatic updates are not working**

Check that the trigger is installed, the function is set to `updateDocChars`, and the required permissions have been granted. Check **Executions** in Apps Script for error details.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
