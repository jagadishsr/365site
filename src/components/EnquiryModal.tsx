import { X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { APPROVED_CATEGORIES, HolidayCategory } from '../types/package';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory: HolidayCategory | 'All';
}

export function EnquiryModal({ isOpen, onClose, defaultCategory }: EnquiryModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<HolidayCategory>(
    defaultCategory === 'All' ? 'Honeymoon' : defaultCategory,
  );
  const [destination, setDestination] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (defaultCategory !== 'All') {
      setCategory(defaultCategory);
    }
  }, [defaultCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setConfirmed(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-trip-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E6E3DC] px-6 py-4 bg-[#FAF9F6]">
          <h2 id="plan-trip-title" className="text-lg font-semibold text-[#141413]">
            Plan a Custom Holiday
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trip planner"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#5C5B57] hover:bg-[#EFECE4] hover:text-[#141413]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {confirmed ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0F5E5E]">
                Enquiry Logged
              </p>
              <h3 className="text-xl font-medium font-display text-[#141413]">
                We will prepare tailored {category} options for you.
              </h3>
              <p className="text-sm text-[#3F3E3B]">
                Thank you, {name}. A destination specialist will reply to {email} within one business day.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirmed(false);
                  onClose();
                }}
                className="rounded-md bg-[#0F5E5E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0B4747]"
              >
                Return to Packages
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                >
                  {errorMsg}
                </div>
              )}

              <div>
                <label htmlFor="plan-name" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                  Your Name
                </label>
                <input
                  id="plan-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arjun Menon"
                  className="w-full rounded-md border border-[#D8D4CA] px-3.5 py-2.5 text-sm focus:border-[#0F5E5E] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="plan-email" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                  Email Address
                </label>
                <input
                  id="plan-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjun@example.com"
                  className="w-full rounded-md border border-[#D8D4CA] px-3.5 py-2.5 text-sm focus:border-[#0F5E5E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="plan-cat" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                    Holiday Category
                  </label>
                  <select
                    id="plan-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as HolidayCategory)}
                    className="w-full rounded-md border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-sm focus:border-[#0F5E5E] focus:outline-none"
                  >
                    {APPROVED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="plan-dest" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                    Preferred Destination
                  </label>
                  <input
                    id="plan-dest"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Maldives, Bali, Jordan..."
                    className="w-full rounded-md border border-[#D8D4CA] px-3.5 py-2.5 text-sm focus:border-[#0F5E5E] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-[#0F5E5E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B4747] transition-colors"
              >
                Send Trip Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
