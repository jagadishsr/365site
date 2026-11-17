import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parsePackagesFromAppsScriptJson,
  parsePackagesFromCsv,
} from './src/lib/sheets.ts';
import type { HolidayPackage, PackagesApiResponse } from './src/types/package.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_REFRESH_SECONDS = Number(process.env.VITE_SHEETS_REFRESH_SECONDS || 30);

function isAllowedGoogleEndpoint(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'docs.google.com' ||
      host === 'script.google.com' ||
      host === 'script.googleusercontent.com'
    );
  } catch {
    return false;
  }
}

async function fetchExternalSheetPackages(sourceUrl: string): Promise<{
  allPackages: HolidayPackage[];
  sourceType: PackagesApiResponse['sourceType'];
}> {
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: 'text/csv, application/json, text/plain',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Google Sheets endpoint returned HTTP ${response.status}`);
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const bodyText = await response.text();

  if (
    contentType.includes('application/json') ||
    bodyText.trim().startsWith('[') ||
    bodyText.trim().startsWith('{')
  ) {
    const jsonData: unknown = JSON.parse(bodyText);
    return {
      allPackages: parsePackagesFromAppsScriptJson(jsonData),
      sourceType: 'apps-script-json',
    };
  }

  return {
    allPackages: parsePackagesFromCsv(bodyText),
    sourceType: 'google-sheets-csv',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/packages/template.csv', (_req, res) => {
    const localCsvPath = path.resolve(__dirname, 'public', 'data', 'packages.csv');
    if (!fs.existsSync(localCsvPath)) {
      res.status(404).json({ error: 'Template CSV not found.' });
      return;
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="365holidayz-packages-sheet-template.csv"');
    res.send(fs.readFileSync(localCsvPath, 'utf-8'));
  });

  app.get('/api/packages', async (req, res) => {
    try {
      const requestedSource =
        typeof req.query.sourceUrl === 'string' ? req.query.sourceUrl.trim() : '';
      const envSource = (process.env.GOOGLE_SHEETS_CSV_URL || '').trim();
      const targetUrl = requestedSource || envSource;

      let allPackages: HolidayPackage[] = [];
      let sourceType: PackagesApiResponse['sourceType'] = 'local-sheet-csv';
      let sourceLabel = 'Migrated Sheet CSV (/data/packages.csv)';

      if (targetUrl) {
        if (!isAllowedGoogleEndpoint(targetUrl)) {
          res.status(400).json({
            error:
              'Invalid source URL. Only HTTPS Google Sheets (docs.google.com) or Google Apps Script (script.google.com) endpoints are supported.',
          });
          return;
        }
        const fetched = await fetchExternalSheetPackages(targetUrl);
        allPackages = fetched.allPackages;
        sourceType = fetched.sourceType;
        sourceLabel =
          sourceType === 'apps-script-json'
            ? 'Live Google Apps Script Endpoint'
            : 'Live Google Sheets Published CSV';
      } else {
        const localCsvPath = path.resolve(__dirname, 'public', 'data', 'packages.csv');
        if (!fs.existsSync(localCsvPath)) {
          res.status(404).json({ error: 'Local packages CSV not found.' });
          return;
        }
        const csvContent = fs.readFileSync(localCsvPath, 'utf-8');
        allPackages = parsePackagesFromCsv(csvContent);
      }

      const activePackages = allPackages.filter((pkg) => pkg.displayStatus === 'Active');
      const hiddenCount = allPackages.length - activePackages.length;

      const payload: PackagesApiResponse = {
        packages: activePackages,
        totalRowsInSheet: allPackages.length,
        activeCount: activePackages.length,
        hiddenCount,
        sourceType,
        sourceLabel,
        fetchedAt: new Date().toISOString(),
        refreshIntervalSeconds:
          Number.isFinite(DEFAULT_REFRESH_SECONDS) && DEFAULT_REFRESH_SECONDS >= 5
            ? DEFAULT_REFRESH_SECONDS
            : 30,
      };

      res.setHeader('Cache-Control', 'no-store');
      res.json(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load published packages.';
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
