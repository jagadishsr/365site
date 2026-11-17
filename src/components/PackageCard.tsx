import { Compass } from 'lucide-react';
import { useState } from 'react';
import { getPackageImage } from '../data/heroSlides';
import { formatForeignPrice, formatInrPrice, isFlashOfferPackage } from '../lib/sheets';
import type { HolidayPackage } from '../types/package';

interface PackageCardProps {
  pkg: HolidayPackage;
  onSelect: (pkg: HolidayPackage) => void;
}

export function PackageCard({ pkg, onSelect }: PackageCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageSrc = getPackageImage(pkg);
  const isFlash = isFlashOfferPackage(pkg);

  return (
    <article
      onClick={() => onSelect(pkg)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(pkg);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View package details for ${pkg.packageTitle}`}
      className="group flex flex-col justify-between bg-white border border-[#E6E3DC] rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5E5E]"
    >
      <div>
        {/* 4:3 Editorial Photograph */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3F1EC]">
          {!imgError ? (
            <img
              src={imageSrc}
              alt={`${pkg.destination} — ${pkg.packageTitle}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#EFECE4] to-[#E3DFD3] text-[#5C5B57] p-6 text-center">
              <Compass className="h-6 w-6 text-[#0F5E5E]" />
              <span className="text-sm font-medium text-[#141413]">{pkg.destination}</span>
            </div>
          )}
        </div>

        {/* Clean Unboxed Card Body */}
        <div className="p-5">
          {/* Unboxed metadata with typographic separator */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#5C5B57] mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-medium text-[#141413] truncate">{pkg.destination}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{pkg.holidayCategory}</span>
            </div>
            {isFlash && (
              <span className="text-xs font-semibold text-[#B45309] whitespace-nowrap shrink-0">
                Featured Offer
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-[#141413] leading-snug line-clamp-2 mb-1">
            {pkg.packageTitle}
          </h3>
          <p className="text-xs text-[#5C5B57] mb-3 truncate">{pkg.packageName}</p>

          <p className="text-sm text-[#3F3E3B] leading-relaxed line-clamp-2 mb-4">
            {pkg.packageDescription}
          </p>

          {/* Travel validity & booking conditions shown cleanly as information */}
          <div className="space-y-1 border-t border-[#EFECE4] pt-3 text-xs text-[#5C5B57]">
            <div className="flex items-baseline justify-between gap-2">
              <span className="shrink-0 text-[#73716C]">Stay Period</span>
              <span className="text-right text-[#141413] truncate">{pkg.stayPeriod || 'On Request'}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="shrink-0 text-[#73716C]">Book By</span>
              <span className="text-right text-[#141413] truncate">
                {pkg.bookingValidity || 'Standard terms'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aligned Tabular Price Footer */}
      <div className="px-5 py-4 bg-[#FAF9F6] border-t border-[#EFECE4] flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-[#141413] tabular-nums">
            {formatInrPrice(pkg.priceInr)}
          </div>
          <div className="text-xs text-[#5C5B57] tabular-nums">
            {formatForeignPrice(pkg.priceUsd)} · {pkg.rooms}
          </div>
        </div>

        <span className="px-3.5 py-2 rounded-md text-xs font-medium text-[#0F5E5E] border border-[#0F5E5E]/25 bg-white group-hover:bg-[#0F5E5E] group-hover:text-white transition-colors whitespace-nowrap shrink-0">
          View Details
        </span>
      </div>
    </article>
  );
}
