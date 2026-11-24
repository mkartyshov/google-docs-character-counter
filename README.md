# Google Docs Character Counter for Google Sheets

Automatically retrieve character counts from Google Docs and display them in Google Sheets using Google Apps Script.

## Features

- Supports Google Docs smart chips and regular hyperlinks in Google Sheets.
- Counts characters, including spaces and line breaks.
- Supports Google Docs with multiple tabs, including nested tabs.
- Processes multiple documents in a single run.
- Supports manual execution and scheduled updates.
- Requires no third-party services.

## Installation

1. Open your Google Sheets spreadsheet.
2. Navigate to **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with the code from this repository.
4. Open **Project Settings** and enable **Show "appsscript.json" manifest file in editor**.
5. Replace the contents of `appsscript.json` with the manifest from this repository.
6. Under **Services**, make sure **Google Sheets API** is enabled.
7. Save the project.
8. Select `updateDocChars` and click **Run**.
9. Grant the requested Google permissions.

## Usage

By default, the script uses the active worksheet:

- **Column H (starting at H2):** Google Docs links or smart chips.
- **Column J (starting at J2):** Character counts.

Run `updateDocChars` to refresh the results.

The Google account executing the script must have access to the linked documents.

### Automatic Updates

To refresh the counts automatically:

1. Open **Triggers** in the Apps Script editor.
2. Click **Add Trigger**.
3. Select `updateDocChars`.
4. Choose **Time-driven** as the event source.
5. Select your preferred update interval.

For scheduled execution, configure the script to target a specific worksheet rather than relying on the active sheet.

## Limitations

- Only accessible Google Docs files are supported.
- Character counts are calculated from document body text, including all document tabs.
- Results may differ from Google Docs' built-in word count statistics, particularly for complex formatting and special characters.
- Counts are refreshed when the script runs, not instantly when a document is edited.

## License

Distributed under the MIT License. See `LICENSE` for details.
