import { ArrowRight, RefreshCw, Search, Sheet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EnquiryModal } from './components/EnquiryModal';
import { HeroVideoSlider } from './components/HeroVideoSlider';
import { PackageCard } from './components/PackageCard';
import { PackageDetailModal } from './components/PackageDetailModal';
import { SheetsGuideModal } from './components/SheetsGuideModal';
import { HERO_SLIDES } from './data/heroSlides';
import { formatInrPrice, isFlashOfferPackage } from './lib/sheets';
import {
  APPROVED_CATEGORIES,
  HolidayCategory,
  HolidayPackage,
  PackagesApiResponse,
} from './types/package';

const STORAGE_SOURCE_KEY = '365holidayz_sheets_source_url';
const CONFIGURED_REFRESH_SECONDS = Number(import.meta.env.VITE_SHEETS_REFRESH_SECONDS || 30);

export default function App() {
  const [packages, setPackages] = useState<HolidayPackage[]>([]);
  const [sheetMeta, setSheetMeta] = useState<PackagesApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<HolidayCategory | 'All'>('All');
  const [selectedDestination, setSelectedDestination] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [activePackage, setActivePackage] = useState<HolidayPackage | null>(null);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [isSheetsGuideOpen, setIsSheetsGuideOpen] = useState(false);

  const [customSourceUrl, setCustomSourceUrl] = useState<string>(() => {
    try {
      return window.localStorage.getItem(STORAGE_SOURCE_KEY) || '';
    } catch {
      return '';
    }
  });

  const loadPackages = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      setIsSyncing(true);
      setErrorMessage(null);

      try {
        const endpoint = customSourceUrl
          ? `/api/packages?sourceUrl=${encodeURIComponent(customSourceUrl)}`
          : '/api/packages';

        const response = await fetch(endpoint, { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || `HTTP ${response.status}`);
        }

        const parsed = data as PackagesApiResponse;
        // Defensive guard: strictly publish only Active records
        const onlyActive = (parsed.packages || []).filter(
          (pkg) => pkg.displayStatus === 'Active',
        );

        setPackages(onlyActive);
        setSheetMeta(parsed);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to load holiday packages.';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [customSourceUrl],
  );

  // Initial load + configured refresh interval polling for Google Sheets updates
  useEffect(() => {
    loadPackages(false);

    const seconds =
      Number.isFinite(CONFIGURED_REFRESH_SECONDS) && CONFIGURED_REFRESH_SECONDS >= 5
        ? CONFIGURED_REFRESH_SECONDS
        : 30;

    const timer = window.setInterval(() => {
      loadPackages(true);
    }, seconds * 1000);

    return () => window.clearInterval(timer);
  }, [loadPackages]);

  const handleSaveSourceUrl = (url: string) => {
    setCustomSourceUrl(url);
    try {
      if (url) {
        window.localStorage.setItem(STORAGE_SOURCE_KEY, url);
      } else {
        window.localStorage.removeItem(STORAGE_SOURCE_KEY);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

  // Unique destinations derived strictly from currently Active packages
  const availableDestinations = useMemo(() => {
    const set = new Set<string>();
    packages.forEach((pkg) => {
      if (pkg.destination) set.add(pkg.destination);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [packages]);

  // Flash Offers derived strictly from Active packages
  const flashOfferPackages = useMemo(() => {
    return packages.filter(isFlashOfferPackage).slice(0, 3);
  }, [packages]);

  // Filtered catalog packages (Active only)
  const filteredPackages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return packages.filter((pkg) => {
      if (selectedCategory !== 'All' && pkg.holidayCategory !== selectedCategory) {
        return false;
      }
      if (selectedDestination !== 'All' && pkg.destination !== selectedDestination) {
        return false;
      }
      if (query) {
        const searchable = [
          pkg.packageTitle,
          pkg.packageName,
          pkg.destination,
          pkg.holidayCategory,
          pkg.packageDescription,
          pkg.features,
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
  }, [packages, selectedCategory, selectedDestination, searchQuery]);

  const handleExploreCategory = (category: HolidayCategory) => {
    setSelectedCategory(category);
    setSelectedDestination('All');
    const el = document.getElementById('collections');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedDestination('All');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#141413]">
      {/* Top Bar Contract: 3 zones (Brand wordmark — 4 single-line nav links — 1 primary CTA) */}
      <header className="sticky top-0 z-40 h-16 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E6E3DC]">
        <div className="mx-auto h-full max-w-7xl px-6 flex items-center justify-between gap-8">
          <a
            href="#"
            className="font-display text-xl font-semibold tracking-tight text-[#141413] whitespace-nowrap shrink-0"
          >
            365Holidayz
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5C5B57]"
          >
            <a
              href="#collections"
              className="hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
            >
              Collections
            </a>
            <a
              href="#flash-offers"
              className="hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
            >
              Flash Offers
            </a>
            <a
              href="#collections"
              onClick={() => resetFilters()}
              className="hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
            >
              Destinations
            </a>
            <button
              type="button"
              onClick={() => setIsSheetsGuideOpen(true)}
              className="hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
            >
              Sheet Sync
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsEnquiryOpen(true)}
              className="rounded-md bg-[#0F5E5E] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#0B4747] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5E5E] transition-colors whitespace-nowrap shrink-0"
            >
              Plan a Trip
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Section 1: Seven Holiday-Category-Led Hero Video Slider */}
        <HeroVideoSlider
          slides={HERO_SLIDES}
          selectedCategory={selectedCategory}
          onSelectSlideCategory={(cat) => setSelectedCategory(cat)}
          onExploreCategory={handleExploreCategory}
        />

        {/* Section 2: Flash & Seasonal Offers (only Active flash offers appear) */}
        {flashOfferPackages.length > 0 && (
          <section
            id="flash-offers"
            aria-labelledby="flash-offers-heading"
            className="border-b border-[#E6E3DC] bg-white"
          >
            <div className="mx-auto max-w-7xl px-6 py-14">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#B45309] mb-1.5">
                    Featured & Flash Offers
                  </p>
                  <h2
                    id="flash-offers-heading"
                    className="font-display text-2xl sm:text-3xl font-medium text-[#141413]"
                  >
                    Limited-window international departures
                  </h2>
                </div>
                <p className="text-xs text-[#5C5B57] max-w-sm">
                  Published offers synced directly from the live package sheet. Hidden entries are automatically withheld.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {flashOfferPackages.map((pkg) => (
                  <button
                    key={`flash-${pkg.sNo}`}
                    type="button"
                    onClick={() => setActivePackage(pkg)}
                    className="text-left rounded-lg border border-[#E6E3DC] bg-[#FAF9F6] p-5 hover:border-[#0F5E5E]/50 hover:bg-white transition-colors flex flex-col justify-between gap-4 focus-visible:outline-2 focus-visible:outline-[#0F5E5E]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#5C5B57] mb-2">
                        <span>
                          {pkg.destination} · {pkg.holidayCategory}
                        </span>
                        <span className="font-semibold text-[#B45309] whitespace-nowrap">
                          Flash Offer
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-[#141413] leading-snug mb-1">
                        {pkg.packageTitle}
                      </h3>
                      <p className="text-xs text-[#5C5B57] line-clamp-2">
                        {pkg.packageDescription}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E6E3DC] pt-3">
                      <div>
                        <span className="text-base font-semibold text-[#141413] tabular-nums">
                          {formatInrPrice(pkg.priceInr)}
                        </span>
                        <span className="block text-xs text-[#5C5B57]">
                          Stay: {pkg.stayPeriod}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#0F5E5E]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Curated International Package Catalog */}
        <section id="collections" aria-labelledby="catalog-heading" className="py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
              <div>
                <h2
                  id="catalog-heading"
                  className="font-display text-3xl sm:text-4xl font-medium text-[#141413] tracking-tight mb-2"
                  style={{ textWrap: 'balance' }}
                >
                  Curated Holiday Packages
                </h2>
                <p className="text-sm sm:text-base text-[#5C5B57] max-w-2xl">
                  Browse active packages across all seven holiday categories. Click any package to inspect full flights, hotel inclusions, stay period, and booking conditions.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => loadPackages(true)}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs font-medium text-[#141413] hover:bg-[#F3F1EC] disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Refresh Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSheetsGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs font-medium text-[#141413] hover:bg-[#F3F1EC] whitespace-nowrap shrink-0"
                >
                  <Sheet className="h-3.5 w-3.5 text-[#0F5E5E]" />
                  <span>Sheets Guide</span>
                </button>
              </div>
            </div>

            {/* Search, Destination & Seven-Category Filter Controls */}
            <div className="space-y-4 mb-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8 relative">
                  <Search className="h-4 w-4 text-[#73716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search destinations, hotels, watersports, or inclusions..."
                    aria-label="Search holiday packages"
                    className="w-full rounded-md border border-[#D8D4CA] bg-white pl-10 pr-4 py-2.5 text-sm text-[#141413] placeholder:text-[#73716C] focus:border-[#0F5E5E] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-4">
                  <select
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    aria-label="Filter by destination"
                    className="w-full rounded-md border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F5E5E] focus:outline-none"
                  >
                    <option value="All">All Destinations ({availableDestinations.length})</option>
                    {availableDestinations.map((dest) => (
                      <option key={dest} value={dest}>
                        {dest}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Approved 7 Category Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === 'All'
                      ? 'bg-[#141413] text-white'
                      : 'bg-[#EFECE4] text-[#3F3E3B] hover:bg-[#E4E0D5]'
                  }`}
                >
                  All Categories ({packages.length})
                </button>
                {APPROVED_CATEGORIES.map((category) => {
                  const count = packages.filter((p) => p.holidayCategory === category).length;
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-[#0F5E5E] text-white'
                          : 'bg-[#EFECE4] text-[#3F3E3B] hover:bg-[#E4E0D5]'
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clean Loading / Error / Empty / Catalog States */}
            {isLoading ? (
              <div
                aria-busy="true"
                aria-label="Loading holiday packages"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-[#E6E3DC] bg-white overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-[#EFECE4]" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 w-1/3 bg-[#EFECE4] rounded" />
                      <div className="h-5 w-3/4 bg-[#EFECE4] rounded" />
                      <div className="h-4 w-full bg-[#EFECE4] rounded" />
                      <div className="h-10 w-full bg-[#EFECE4] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : errorMessage ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-white p-8 text-center max-w-xl mx-auto space-y-4"
              >
                <h3 className="text-lg font-semibold text-[#141413]">
                  Could not reach the package spreadsheet
                </h3>
                <p className="text-sm text-[#5C5B57]">{errorMessage}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => loadPackages(false)}
                    className="rounded-md bg-[#0F5E5E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B4747]"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSheetsGuideOpen(true)}
                    className="rounded-md border border-[#D8D4CA] bg-white px-4 py-2 text-xs font-medium text-[#141413] hover:bg-[#F3F1EC]"
                  >
                    Check Sheet URL
                  </button>
                </div>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="rounded-lg border border-[#E6E3DC] bg-white p-10 text-center max-w-xl mx-auto space-y-4">
                <h3 className="text-lg font-semibold text-[#141413]">
                  No active packages match your selection
                </h3>
                <p className="text-sm text-[#5C5B57]">
                  Try clearing your search or switching back to all seven holiday categories. Packages marked Hidden in Google Sheets are excluded from public view.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-md bg-[#141413] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#2C2C2A]"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-[#5C5B57] mb-5">
                  <span className="tabular-nums">
                    Showing {filteredPackages.length} of {packages.length} active packages
                  </span>
                  {sheetMeta && (
                    <span>
                      Source: {sheetMeta.sourceLabel}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPackages.map((pkg) => (
                    <PackageCard
                      key={`${pkg.sNo}-${pkg.packageTitle}`}
                      pkg={pkg}
                      onSelect={(item) => setActivePackage(item)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E6E3DC] bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-12 gap-8 text-sm">
          <div className="md:col-span-5 space-y-2">
            <div className="font-display text-lg font-semibold text-[#141413]">
              365Holidayz
            </div>
            <p className="text-xs text-[#5C5B57] max-w-sm leading-relaxed">
              International holiday packages curated across Maldives, Sri Lanka, Bali, Mauritius, Seychelles, Southeast Asia, the Middle East, and the Caucasus.
            </p>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#141413] mb-3">
              Holiday Categories
            </h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-[#5C5B57]">
              {APPROVED_CATEGORIES.map((category) => (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => handleExploreCategory(category)}
                    className="hover:text-[#141413] text-left"
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2.5 text-xs text-[#5C5B57]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#141413] mb-3">
              Package Operations
            </h3>
            <div>
              <button
                type="button"
                onClick={() => setIsSheetsGuideOpen(true)}
                className="text-[#0F5E5E] font-medium hover:underline text-left"
              >
                Google Sheets Structure & Sync Guide
              </button>
            </div>
            <div>
              <a
                href="/api/packages/template.csv"
                download="365holidayz-packages-sheet-template.csv"
                className="hover:text-[#141413]"
              >
                Download Migrated CSV (32+1 Records)
              </a>
            </div>
            <p className="pt-2 text-[#73716C]">© {new Date().getFullYear()} 365Holidayz</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PackageDetailModal
        pkg={activePackage}
        onClose={() => setActivePackage(null)}
      />
      <EnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        defaultCategory={selectedCategory}
      />
      <SheetsGuideModal
        isOpen={isSheetsGuideOpen}
        onClose={() => setIsSheetsGuideOpen(false)}
        sheetMeta={sheetMeta}
        customSourceUrl={customSourceUrl}
        onSaveSourceUrl={handleSaveSourceUrl}
        onSyncNow={() => loadPackages(true)}
        isSyncing={isSyncing}
      />
    </div>
  );
}
