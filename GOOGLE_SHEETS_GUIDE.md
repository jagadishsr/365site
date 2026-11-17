# 365Holidayz — Google Sheets Package Management Guide

Google Sheets serves as the single source of truth for published holiday packages. No private credentials are exposed in frontend browser code; the backend `/api/packages` endpoint reads only a public read-only Published CSV URL or read-only Google Apps Script Web App URL.

---

## 1. Spreadsheet Structure (14 Columns)

Import `/public/data/packages.csv` into Google Sheets (`File → Import → Upload`). Keep row 1 as the exact column headers below:

| Column | Header | Description & Allowed Values |
| --- | --- | --- |
| A | `S.No` | Original numbered package ID (`1`–`32`, `32B`) |
| B | `Package Name` | Internal / campaign offer name |
| C | `Package Title` | Public-facing package headline |
| D | `Package Description` | Summary of flights, stay, meals, and transfers |
| E | `Features` | Comma-separated inclusions list |
| F | `Stay Period` | Informational travel window (displayed as text, never auto-expired) |
| G | `Booking Validity` | Informational booking cutoff terms |
| H | `Persons` | Base traveler count |
| I | `Rooms` | Room sharing basis |
| J | `Price (USD)` | Foreign currency tariff (USD, SGD, or Euro) |
| K | `Price (INR)` | Indian Rupee tariff |
| L | `Holiday Category` | **Must be one of the 7 approved categories below** |
| M | `Destination` | Country or island destination name |
| N | `Display Status` | **`Active`** or **`Hidden`** |

### Approved `Holiday Category` Values (Exactly 7)
1. `Honeymoon`
2. `Family & Group`
3. `Adventure`
4. `Luxury Escapes`
5. `Women Solo`
6. `Wellness & Retreats`
7. `Culture & Heritage`

### Supported `Display Status` Values
- `Active`: Appears in public listings, search results, category filters, and Flash Offers.
- `Hidden`: Retained in Google Sheets (never deleted) and excluded from all public listings, search results, featured sections, and Flash Offers.

---

## 2. Client Editing Instructions

1. **Hide or Republish a Package**: Change the `Display Status` cell from `Active` to `Hidden` (or vice versa). Never delete archived rows.
2. **Edit Package Pricing or Validity**: Update `Price (INR)`, `Price (USD)`, `Stay Period`, or `Booking Validity` directly in the sheet. Travel validity is shown for information only and is never automatically expired.
3. **Refresh Interval**: The website polls `/api/packages` automatically every `30` seconds (configurable via `VITE_SHEETS_REFRESH_SECONDS`).

---

## 3. Publishing Read-Only Access

### Option A — Published CSV Endpoint (Recommended)
1. In Google Sheets, click **File → Share → Publish to web**.
2. Select **Sheet 1** and **Comma-separated values (.csv)**.
3. Click **Publish** and copy the `https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv` URL.
4. Configure `GOOGLE_SHEETS_CSV_URL` in your environment variables, or paste the URL into **Sheet Sync → Apply Endpoint** in the website footer/navigation.

### Option B — Read-Only Google Apps Script Endpoint
1. In Google Sheets, open **Extensions → Apps Script** and paste the `doGet()` script from the **Sheet Sync** modal.
2. Deploy as a **Web App** (`Execute as: Me`, `Who has access: Anyone`).
3. Use the `https://script.google.com/macros/s/.../exec` URL in `GOOGLE_SHEETS_CSV_URL` or **Sheet Sync**.
