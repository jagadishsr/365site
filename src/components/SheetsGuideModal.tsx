import { Copy, Download, RefreshCw, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { APPROVED_CATEGORIES, PackagesApiResponse } from '../types/package';

interface SheetsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetMeta: PackagesApiResponse | null;
  customSourceUrl: string;
  onSaveSourceUrl: (url: string) => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

const APPS_SCRIPT_SNIPPET = `function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var records = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[1] && !row[2]) continue;
    var item = {};
    for (var c = 0; c < headers.length; c++) {
      item[String(headers[c]).trim()] = row[c];
    }
    records.push(item);
  }

  return ContentService
    .createTextOutput(JSON.stringify(records))
    .setMimeType(ContentService.MimeType.JSON);
}`;

const REQUIRED_COLUMNS = [
  { col: 'S.No', desc: 'Original numbered record ID (1–32, 32B)' },
  { col: 'Package Name', desc: 'Internal or campaign offer name' },
  { col: 'Package Title', desc: 'Customer-facing package headline' },
  { col: 'Package Description', desc: 'Concise itinerary overview' },
  { col: 'Features', desc: 'Comma-separated inclusions and transfers' },
  { col: 'Stay Period', desc: 'Informational travel window (not auto-expired)' },
  { col: 'Booking Validity', desc: 'Informational booking cutoff condition' },
  { col: 'Persons', desc: 'Base traveler count' },
  { col: 'Rooms', desc: 'Room sharing basis' },
  { col: 'Price (USD)', desc: 'Published foreign tariff (USD / SGD / Euro)' },
  { col: 'Price (INR)', desc: 'Published INR tariff' },
  {
    col: 'Holiday Category',
    desc: 'Exact value from the 7 approved categories',
  },
  { col: 'Destination', desc: 'Country or island destination name' },
  {
    col: 'Display Status',
    desc: 'Active (published everywhere) or Hidden (excluded publicly, retained in sheet)',
  },
];

export function SheetsGuideModal({
  isOpen,
  onClose,
  sheetMeta,
  customSourceUrl,
  onSaveSourceUrl,
  onSyncNow,
  isSyncing,
}: SheetsGuideModalProps) {
  const [urlInput, setUrlInput] = useState(customSourceUrl);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    setUrlInput(customSourceUrl);
  }, [customSourceUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onSaveSourceUrl(urlInput.trim());
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      // Clipboard blocked in non-HTTPS contexts
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheets-guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-[#E6E3DC] px-6 py-4 bg-[#FAF9F6] shrink-0">
          <div>
            <h2 id="sheets-guide-title" className="text-lg font-semibold text-[#141413]">
              Google Sheets Package Management & Documentation
            </h2>
            <p className="text-xs text-[#5C5B57]">
              Read-only integration · No private credentials exposed in browser code
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Google Sheets guide"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#5C5B57] hover:bg-[#EFECE4] hover:text-[#141413]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto text-sm text-[#3F3E3B]">
          {/* Current Sync Summary & Live Endpoint Input */}
          <section className="rounded-lg border border-[#E6E3DC] bg-[#FAF9F6] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-[#141413]">Active Data Source</h3>
                <p className="text-xs text-[#5C5B57] mt-0.5">
                  {sheetMeta
                    ? `${sheetMeta.sourceLabel} · ${sheetMeta.activeCount} Active published (${sheetMeta.hiddenCount} Hidden excluded) · Refreshes every ${sheetMeta.refreshIntervalSeconds}s`
                    : 'Connecting to package sheet...'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/api/packages/template.csv"
                  download="365holidayz-packages-sheet-template.csv"
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs font-medium text-[#141413] hover:bg-[#F3F1EC]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Migrated CSV</span>
                </a>
                <button
                  type="button"
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E5E] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#0B4747] disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-2 pt-2 border-t border-[#E6E3DC]">
              <label htmlFor="sheet-url-input" className="block text-xs font-medium text-[#141413]">
                Published Google Sheets CSV URL or Google Apps Script Endpoint (Optional Override)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="sheet-url-input"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv"
                  className="flex-1 rounded-md border border-[#D8D4CA] bg-white px-3 py-2 text-xs font-mono text-[#141413] focus:border-[#0F5E5E] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-md bg-[#141413] px-4 py-2 text-xs font-medium text-white hover:bg-[#2C2C2A] whitespace-nowrap shrink-0"
                >
                  Apply Endpoint
                </button>
                {customSourceUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput('');
                      onSaveSourceUrl('');
                    }}
                    className="rounded-md border border-[#D8D4CA] bg-white px-3 py-2 text-xs font-medium text-[#5C5B57] hover:text-[#141413] whitespace-nowrap shrink-0"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
              <p className="text-xs text-[#5C5B57]">
                Or configure <code className="font-mono text-[#141413]">GOOGLE_SHEETS_CSV_URL</code> in the server environment. Leave empty to read the migrated sheet dataset directly.
              </p>
            </form>
          </section>

          {/* Client Editing Instructions */}
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-[#141413]">
              01. Client Editing Workflow in Google Sheets
            </h3>
            <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
              <li>
                Download the migrated CSV above and import it into Google Sheets via{' '}
                <span className="font-medium text-[#141413]">File → Import → Upload</span>.
              </li>
              <li>
                To show or hide a package on the website, edit only the{' '}
                <code className="font-mono text-xs bg-[#F3F1EC] px-1.5 py-0.5 rounded">
                  Display Status
                </code>{' '}
                cell between <span className="font-medium text-[#141413]">Active</span> and{' '}
                <span className="font-medium text-[#141413]">Hidden</span>. Never delete archived
                rows—setting a row to <span className="font-medium text-[#141413]">Hidden</span>{' '}
                immediately excludes it from public listings, search results, featured sections, and
                Flash Offers on the next refresh cycle.
              </li>
              <li>
                Use Google Sheets Data Validation on the{' '}
                <code className="font-mono text-xs bg-[#F3F1EC] px-1.5 py-0.5 rounded">
                  Holiday Category
                </code>{' '}
                column restricted strictly to these seven approved categories:{' '}
                <span className="font-medium text-[#141413]">
                  {APPROVED_CATEGORIES.join(' · ')}
                </span>
                .
              </li>
              <li>
                Publish read-only access via{' '}
                <span className="font-medium text-[#141413]">
                  File → Share → Publish to web → Sheet 1 → Comma-separated values (.csv)
                </span>
                , then paste the generated URL above or set{' '}
                <code className="font-mono text-xs bg-[#F3F1EC] px-1.5 py-0.5 rounded">
                  GOOGLE_SHEETS_CSV_URL
                </code>
                .
              </li>
            </ol>
          </section>

          {/* Spreadsheet Column Schema */}
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-[#141413]">
              02. Spreadsheet Column Structure (14 Columns)
            </h3>
            <div className="overflow-x-auto border border-[#E6E3DC] rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] border-b border-[#E6E3DC] text-[#5C5B57]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Column Header</th>
                    <th className="py-2.5 px-4 font-semibold">Purpose & Allowed Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE4]">
                  {REQUIRED_COLUMNS.map((item) => (
                    <tr key={item.col}>
                      <td className="py-2 px-4 font-mono text-[#141413] whitespace-nowrap">
                        {item.col}
                      </td>
                      <td className="py-2 px-4 text-[#3F3E3B]">{item.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Optional Read-Only Google Apps Script */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#141413]">
                03. Optional Read-Only Google Apps Script Endpoint (JSON)
              </h3>
              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#D8D4CA] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F3F1EC]"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedScript ? 'Copied' : 'Copy Code.gs'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-[#141413] p-4 text-xs font-mono text-[#F3F1EC] leading-relaxed">
              {APPS_SCRIPT_SNIPPET}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
