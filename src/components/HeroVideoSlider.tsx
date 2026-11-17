import { ChevronLeft, ChevronRight, Pause, Play, ArrowDownRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { HeroSlideItem, HolidayCategory } from '../types/package';

interface HeroVideoSliderProps {
  slides: HeroSlideItem[];
  selectedCategory: HolidayCategory | 'All';
  onSelectSlideCategory: (category: HolidayCategory) => void;
  onExploreCategory: (category: HolidayCategory) => void;
  autoAdvanceMs?: number;
}

export function HeroVideoSlider({
  slides,
  selectedCategory,
  onSelectSlideCategory,
  onExploreCategory,
  autoAdvanceMs = 6000,
}: HeroVideoSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoFailed, setVideoFailed] = useState<Record<string, boolean>>({});
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 640px)');

    const syncPreferences = () => {
      setPrefersReducedMotion(motionQuery.matches);
      setIsMobileViewport(mobileQuery.matches);
    };

    syncPreferences();
    motionQuery.addEventListener('change', syncPreferences);
    mobileQuery.addEventListener('change', syncPreferences);
    return () => {
      motionQuery.removeEventListener('change', syncPreferences);
      mobileQuery.removeEventListener('change', syncPreferences);
    };
  }, []);

  // Sync slider index when user clicks one of the 7 approved categories in the catalog below
  useEffect(() => {
    if (selectedCategory === 'All') return;
    const matchIdx = slides.findIndex((s) => s.category === selectedCategory);
    if (matchIdx !== -1 && matchIdx !== activeIndex) {
      setActiveIndex(matchIdx);
    }
  }, [selectedCategory, slides, activeIndex]);

  // Auto-advance slides cleanly unless paused or reduced motion
  useEffect(() => {
    if (isPaused || prefersReducedMotion || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion, slides.length, autoAdvanceMs]);

  // Ensure only the active video plays while inactive videos pause cleanly
  useEffect(() => {
    slides.forEach((slide, idx) => {
      const el = videoRefs.current[slide.id];
      if (!el) return;
      if (idx === activeIndex && !isPaused && !prefersReducedMotion && !isMobileViewport) {
        el.currentTime = 0;
        const playPromise = el.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            // Browser blocked autoplay; poster fallback remains visible
          });
        }
      } else {
        el.pause();
      }
    });
  }, [activeIndex, isPaused, prefersReducedMotion, isMobileViewport, slides]);

  const activeSlide = slides[activeIndex] ?? slides[0];
  if (!activeSlide) return null;

  const goPrev = () => {
    const nextIdx = (activeIndex - 1 + slides.length) % slides.length;
    setActiveIndex(nextIdx);
  };

  const goNext = () => {
    const nextIdx = (activeIndex + 1) % slides.length;
    setActiveIndex(nextIdx);
  };

  return (
    <section
      aria-label="Featured Holiday Categories"
      className="relative w-full overflow-hidden bg-[#141413] text-white"
    >
      <div className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] w-full flex flex-col justify-between">
        {/* Media Layer: Poster fallback + lazy-loaded compressed muted MP4 videos */}
        <div className="absolute inset-0">
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            const isAdjacent =
              idx === (activeIndex + 1) % slides.length ||
              idx === (activeIndex - 1 + slides.length) % slides.length;
            const shouldRenderVideo =
              !prefersReducedMotion && !isMobileViewport && !videoFailed[slide.id] && (isActive || isAdjacent);

            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* High-resolution poster image acts as immediate paint & mobile/reduced-motion fallback */}
                <img
                  src={isMobileViewport && slide.mobilePosterSrc ? slide.mobilePosterSrc : slide.posterSrc}
                  alt={`${slide.category} holiday destination`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />

                {shouldRenderVideo && (
                  <video
                    ref={(node) => {
                      videoRefs.current[slide.id] = node;
                    }}
                    src={slide.videoSrc}
                    poster={slide.posterSrc}
                    muted
                    playsInline
                    loop
                    preload={isActive ? 'auto' : 'metadata'}
                    onError={() =>
                      setVideoFailed((prev) => ({
                        ...prev,
                        [slide.id]: true,
                      }))
                    }
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
            );
          })}

          {/* Measured WCAG AA contrast scrim */}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
        </div>

        {/* Top subtle slide counter & media controls */}
        <div className="relative z-30 mx-auto w-full max-w-7xl px-6 pt-8 flex items-center justify-between">
          <div className="text-xs tracking-wide text-white/80 font-medium">
            <span>{activeSlide.eyebrow}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              aria-label={isPaused ? 'Resume hero video' : 'Pause hero video'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/25 bg-black/30 text-white hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous holiday category"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/25 bg-black/30 text-white hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next holiday category"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/25 bg-black/30 text-white hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center-bottom dominant focal content */}
        <div className="relative z-30 mx-auto w-full max-w-7xl px-6 pb-8 pt-16">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-white/80 mb-3">
              {activeSlide.category}
            </p>
            <h1
              className="font-display text-white font-medium tracking-tight leading-[1.08] mb-4"
              style={{ fontSize: 'clamp(2.25rem, 4.4vw, 3.85rem)', textWrap: 'balance' }}
            >
              {activeSlide.headline}
            </h1>
            <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-xl mb-7">
              {activeSlide.subheadline}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onExploreCategory(activeSlide.category)}
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#141413] hover:bg-[#F3F1EC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore {activeSlide.category}</span>
                <ArrowDownRight className="h-4 w-4" />
              </button>
              <span className="text-xs text-white/70 tabular-nums">
                {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                {' · '}
                {activeSlide.mediaAttribution}
              </span>
            </div>
          </div>

          {/* Seven Approved Holiday Categories Selector Rail */}
          <div className="mt-8 border-t border-white/20 pt-4">
            <div
              role="tablist"
              aria-label="Holiday categories"
              className="flex items-center gap-2 overflow-x-auto pb-1"
            >
              {slides.map((slide, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      setActiveIndex(idx);
                      onSelectSlideCategory(slide.category);
                    }}
                    className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      isSelected
                        ? 'bg-white text-[#141413]'
                        : 'bg-black/35 text-white/85 hover:bg-black/55 hover:text-white border border-white/15'
                    }`}
                  >
                    {slide.category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
