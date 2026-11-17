import {
  APPROVED_CATEGORIES,
  type DisplayStatus,
  type HolidayCategory,
  type HolidayPackage,
} from '../types/package.ts';

const CATEGORY_LOOKUP = new Map<string, HolidayCategory>(
  APPROVED_CATEGORIES.map((cat) => [cat.toLowerCase(), cat]),
);

export function normalizeCategory(raw: string): HolidayCategory {
  const cleaned = raw.trim().toLowerCase();
  const direct = CATEGORY_LOOKUP.get(cleaned);
  if (direct) return direct;

  // Safe deterministic mapping only if client mistypes spacing/ampersand in sheet
  if (cleaned.includes('honeymoon')) return 'Honeymoon';
  if (cleaned.includes('family') || cleaned.includes('group') || cleaned.includes('mice')) {
    return 'Family & Group';
  }
  if (cleaned.includes('adventure')) return 'Adventure';
  if (cleaned.includes('luxury')) return 'Luxury Escapes';
  if (cleaned.includes('women') || cleaned.includes('solo')) return 'Women Solo';
  if (cleaned.includes('wellness') || cleaned.includes('retreat') || cleaned.includes('spa')) {
    return 'Wellness & Retreats';
  }
  return 'Culture & Heritage';
}

export function normalizeDisplayStatus(raw: string): DisplayStatus {
  const cleaned = raw.trim().toLowerCase();
  return cleaned === 'active' ? 'Active' : 'Hidden';
}

/**
 * RFC-4180 compliant CSV parser supporting quoted fields, commas inside quotes,
 * escaped double quotes (""), and CRLF/LF line endings.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const normalized = csvText.replace(/^\uFEFF/, ''); // strip UTF-8 BOM if present

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\r' && nextChar === '\n') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      i += 1;
    } else if (char === '\n' || char === '\r') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.trim() !== ''));
}

export function parsePackagesFromCsv(csvText: string): HolidayPackage[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  const headerRow = rows[0].map((h) => h.trim().toLowerCase());

  const colIndex = (candidates: string[]): number => {
    for (const candidate of candidates) {
      const idx = headerRow.indexOf(candidate.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxSNo = colIndex(['s.no', 'sno', 's_no', 'id']);
  const idxName = colIndex(['package name', 'packagename', 'name']);
  const idxTitle = colIndex(['package title', 'packagetitle', 'title']);
  const idxDesc = colIndex(['package description', 'packagedescription', 'description']);
  const idxFeatures = colIndex(['features', 'inclusions']);
  const idxStay = colIndex(['stay period', 'stayperiod']);
  const idxValidity = colIndex(['booking validity', 'bookingvalidity']);
  const idxPersons = colIndex(['persons', 'pax']);
  const idxRooms = colIndex(['rooms', 'room']);
  const idxUsd = colIndex(['price (usd)', 'price usd', 'priceusd', 'usd']);
  const idxInr = colIndex(['price (inr)', 'price inr', 'priceinr', 'inr']);
  const idxCategory = colIndex(['holiday category', 'holidaycategory', 'category']);
  const idxDestination = colIndex(['destination', 'country']);
  const idxStatus = colIndex(['display status', 'displaystatus', 'status']);

  const readCell = (row: string[], idx: number): string =>
    idx >= 0 && idx < row.length ? row[idx].trim() : '';

  const packages: HolidayPackage[] = [];

  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r];
    const packageTitle = readCell(row, idxTitle);
    const packageName = readCell(row, idxName);

    if (!packageTitle && !packageName) continue;

    packages.push({
      sNo: readCell(row, idxSNo) || String(r),
      packageName,
      packageTitle,
      packageDescription: readCell(row, idxDesc),
      features: readCell(row, idxFeatures),
      stayPeriod: readCell(row, idxStay),
      bookingValidity: readCell(row, idxValidity),
      persons: readCell(row, idxPersons) || '1',
      rooms: readCell(row, idxRooms) || '1 dbl sharing',
      priceUsd: readCell(row, idxUsd),
      priceInr: readCell(row, idxInr),
      holidayCategory: normalizeCategory(readCell(row, idxCategory)),
      destination: readCell(row, idxDestination) || 'International',
      displayStatus: normalizeDisplayStatus(readCell(row, idxStatus)),
    });
  }

  return packages;
}

export function parsePackagesFromAppsScriptJson(payload: unknown): HolidayPackage[] {
  const rawList = Array.isArray(payload)
    ? payload
    : typeof payload === 'object' && payload !== null && Array.isArray((payload as { data?: unknown[] }).data)
      ? (payload as { data: unknown[] }).data
      : [];

  return rawList
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item, idx) => {
      const getField = (...keys: string[]): string => {
        for (const k of keys) {
          const matchedKey = Object.keys(item).find((ik) => ik.trim().toLowerCase() === k.toLowerCase());
          if (matchedKey && item[matchedKey] !== undefined && item[matchedKey] !== null) {
            return String(item[matchedKey]).trim();
          }
        }
        return '';
      };

      return {
        sNo: getField('S.No', 'sNo', 'sno') || String(idx + 1),
        packageName: getField('Package Name', 'packageName'),
        packageTitle: getField('Package Title', 'packageTitle'),
        packageDescription: getField('Package Description', 'packageDescription'),
        features: getField('Features', 'features'),
        stayPeriod: getField('Stay Period', 'stayPeriod'),
        bookingValidity: getField('Booking Validity', 'bookingValidity'),
        persons: getField('Persons', 'persons') || '1',
        rooms: getField('Rooms', 'rooms') || '1 dbl sharing',
        priceUsd: getField('Price (USD)', 'priceUsd', 'Price USD'),
        priceInr: getField('Price (INR)', 'priceInr', 'Price INR'),
        holidayCategory: normalizeCategory(getField('Holiday Category', 'holidayCategory', 'Category')),
        destination: getField('Destination', 'destination') || 'International',
        displayStatus: normalizeDisplayStatus(getField('Display Status', 'displayStatus', 'Status')),
      };
    })
    .filter((pkg) => Boolean(pkg.packageTitle || pkg.packageName));
}

export function isFlashOfferPackage(pkg: HolidayPackage): boolean {
  const haystack = `${pkg.packageName} ${pkg.packageTitle}`.toLowerCase();
  return (
    haystack.includes('flash offer') ||
    haystack.includes('festive special') ||
    haystack.includes('big offer') ||
    haystack.includes('year end special')
  );
}

export function formatForeignPrice(rawUsd: string): string {
  const trimmed = rawUsd.trim();
  if (!trimmed) return 'On Request';
  if (/^(sgd|euro|eur|usd|aed)\b/i.test(trimmed)) {
    return trimmed;
  }
  return `USD ${trimmed}`;
}

export function formatInrPrice(rawInr: string): string {
  const trimmed = rawInr.trim();
  if (!trimmed) return 'On Request';
  return `INR ${trimmed}`;
}

export function splitFeaturesList(features: string): string[] {
  return features
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
