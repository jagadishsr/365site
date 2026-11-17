export const APPROVED_CATEGORIES = [
  'Honeymoon',
  'Family & Group',
  'Adventure',
  'Luxury Escapes',
  'Women Solo',
  'Wellness & Retreats',
  'Culture & Heritage',
] as const;

export type HolidayCategory = (typeof APPROVED_CATEGORIES)[number];

export type DisplayStatus = 'Active' | 'Hidden';

export interface HolidayPackage {
  sNo: string;
  packageName: string;
  packageTitle: string;
  packageDescription: string;
  features: string;
  stayPeriod: string;
  bookingValidity: string;
  persons: string;
  rooms: string;
  priceUsd: string;
  priceInr: string;
  holidayCategory: HolidayCategory;
  destination: string;
  displayStatus: DisplayStatus;
}

export interface PackagesApiResponse {
  packages: HolidayPackage[];
  totalRowsInSheet: number;
  activeCount: number;
  hiddenCount: number;
  sourceType: 'google-sheets-csv' | 'apps-script-json' | 'local-sheet-csv';
  sourceLabel: string;
  fetchedAt: string;
  refreshIntervalSeconds: number;
}

export interface HeroSlideItem {
  id: string;
  category: HolidayCategory;
  eyebrow: string;
  headline: string;
  subheadline: string;
  videoSrc: string;
  posterSrc: string;
  mobilePosterSrc?: string;
  durationSeconds: number;
  mediaAttribution: string;
}
