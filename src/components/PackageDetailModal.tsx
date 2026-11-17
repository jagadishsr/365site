import { Check, Compass, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { getPackageImage } from '../data/heroSlides';
import {
  formatForeignPrice,
  formatInrPrice,
  splitFeaturesList,
} from '../lib/sheets';
import type { HolidayPackage } from '../types/package';

interface PackageDetailModalProps {
  pkg: HolidayPackage | null;
  onClose: () => void;
}

export function PackageDetailModal({ pkg, onClose }: PackageDetailModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [travelMonth, setTravelMonth] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setSubmittedRef(null);
    setErrorMsg('');
    setImgError(false);
  }, [pkg?.sNo]);

  useEffect(() => {
    if (!pkg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pkg, onClose]);

  if (!pkg) return null;

  const featuresList = splitFeaturesList(pkg.features);
  const imageSrc = getPackageImage(pkg);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (phone.trim().length < 7) {
      setErrorMsg('Please enter a valid contact phone number.');
      return;
    }
    setErrorMsg('');
    const refId = `365H-${pkg.sNo}-${String(Date.now()).slice(-4)}`;
    setSubmittedRef(refId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="package-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl rounded-xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E6E3DC] px-6 py-4 bg-[#FAF9F6] shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#5C5B57] min-w-0">
            <span className="font-mono tabular-nums text-[#141413]">
              Package #{pkg.sNo}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#141413] truncate">{pkg.destination}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{pkg.holidayCategory}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close package details"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#5C5B57] hover:bg-[#EFECE4] hover:text-[#141413] focus-visible:outline-2 focus-visible:outline-[#0F5E5E]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* Left Column: Visual + Full Preserved Package Details */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-[#E6E3DC]">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#F3F1EC]">
              {!imgError ? (
                <img
                  src={imageSrc}
                  alt={pkg.packageTitle}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-[#EFECE4] text-[#5C5B57]">
                  <Compass className="h-7 w-7 text-[#0F5E5E]" />
                  <span className="text-sm font-medium">{pkg.destination}</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#0F5E5E] mb-1">
                {pkg.packageName}
              </p>
              <h2
                id="package-detail-title"
                className="font-display text-2xl sm:text-3xl font-medium text-[#141413] leading-tight mb-3"
                style={{ textWrap: 'balance' }}
              >
                {pkg.packageTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#3F3E3B] leading-relaxed">
                {pkg.packageDescription}
              </p>
            </div>

            {/* Informational Travel Validity, Booking Conditions & Occupancy */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-[#E6E3DC] py-4 text-xs">
              <div>
                <div className="text-[#73716C] mb-1">Stay Period</div>
                <div className="font-medium text-[#141413]">{pkg.stayPeriod || 'On Request'}</div>
              </div>
              <div>
                <div className="text-[#73716C] mb-1">Booking Validity</div>
                <div className="font-medium text-[#141413]">
                  {pkg.bookingValidity || 'Standard'}
                </div>
              </div>
              <div>
                <div className="text-[#73716C] mb-1">Persons</div>
                <div className="font-medium text-[#141413] tabular-nums">{pkg.persons}</div>
              </div>
              <div>
                <div className="text-[#73716C] mb-1">Rooms</div>
                <div className="font-medium text-[#141413]">{pkg.rooms}</div>
              </div>
            </div>

            {/* Included Features */}
            <div>
              <h3 className="text-sm font-semibold text-[#141413] mb-3">
                Inclusions & Itinerary Highlights
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#3F3E3B]">
                {featuresList.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#0F5E5E] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Contiguous Pricing & Booking Request Module */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-[#FAF9F6] flex flex-col justify-between">
            <div>
              <div className="pb-5 mb-6 border-b border-[#E6E3DC]">
                <div className="text-xs text-[#5C5B57] mb-1">Published Package Tariff</div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-semibold text-[#141413] tabular-nums">
                    {formatInrPrice(pkg.priceInr)}
                  </span>
                  <span className="text-sm text-[#5C5B57] tabular-nums">
                    ({formatForeignPrice(pkg.priceUsd)})
                  </span>
                </div>
                <p className="text-xs text-[#5C5B57] mt-1">
                  Per person on {pkg.rooms} basis · Subject to booking conditions above
                </p>
              </div>

              {submittedRef ? (
                <div className="rounded-lg border border-[#0F5E5E]/25 bg-white p-6 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#0F5E5E]">
                    Request Confirmed
                  </div>
                  <h4 className="text-lg font-semibold text-[#141413]">
                    Enquiry #{submittedRef} Received
                  </h4>
                  <p className="text-sm text-[#3F3E3B] leading-relaxed">
                    Thank you, {name}. Our holiday desk has logged your interest for{' '}
                    <span className="font-medium text-[#141413]">{pkg.packageTitle}</span> and
                    will reach out to {email} with confirmed flight and room availability.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedRef(null)}
                    className="mt-2 inline-flex px-4 py-2 text-xs font-medium rounded-md border border-[#E6E3DC] text-[#141413] hover:bg-[#F3F1EC]"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <h3 className="text-base font-semibold text-[#141413]">
                    Request Availability & Quote
                  </h3>

                  {errorMsg && (
                    <div
                      role="alert"
                      className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800"
                    >
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label htmlFor="pkg-name" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                      Full Name
                    </label>
                    <input
                      id="pkg-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Priya Nair"
                      className="w-full rounded-md border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F5E5E] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="pkg-email" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                        Email Address
                      </label>
                      <input
                        id="pkg-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-md border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F5E5E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="pkg-phone" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        id="pkg-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98400 00000"
                        className="w-full rounded-md border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F5E5E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pkg-dates" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                      Preferred Travel Dates
                    </label>
                    <input
                      id="pkg-dates"
                      type="text"
                      value={travelMonth}
                      onChange={(e) => setTravelMonth(e.target.value)}
                      placeholder={pkg.stayPeriod || 'e.g. 12–16 Dec 2026'}
                      className="w-full rounded-md border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F5E5E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="pkg-notes" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                      Departure City & Notes
                    </label>
                    <textarea
                      id="pkg-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Departure airport, room preferences, or traveler count..."
                      className="w-full rounded-md border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F5E5E] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-md bg-[#0F5E5E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B4747] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5E5E] transition-colors"
                  >
                    Request Package Confirmation
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
