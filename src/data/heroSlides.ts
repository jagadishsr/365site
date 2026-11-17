import { HeroSlideItem, HolidayCategory, HolidayPackage } from '../types/package';

export const HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'honeymoon',
    category: 'Honeymoon',
    eyebrow: 'Maldives · Bali · Mauritius · Seychelles',
    headline: 'Quiet lagoons made for two.',
    subheadline:
      'Overwater villas, candlelit coastal dining, and seaplane transfers curated for unhurried beginnings.',
    videoSrc: '/assets/hero/honeymoon.mp4',
    posterSrc: '/assets/hero/honeymoon-poster.jpg',
    mobilePosterSrc: '/assets/hero/honeymoon-poster.jpg',
    durationSeconds: 5,
    mediaAttribution: 'Custom AI Cinema · Maldives Lagoon',
  },
  {
    id: 'family-group',
    category: 'Family & Group',
    eyebrow: 'Singapore · Malaysia · Dubai · Sri Lanka',
    headline: 'Shared horizons across generations.',
    subheadline:
      'Seamless airport transfers, theme-park passes, and multi-generational beach stays built for effortless togetherness.',
    videoSrc: '/assets/hero/family-group.mp4',
    posterSrc: '/assets/hero/family-group-poster.jpg',
    mobilePosterSrc: '/assets/hero/family-group-poster.jpg',
    durationSeconds: 5,
    mediaAttribution: 'Custom AI Cinema · Mauritius Coastline',
  },
  {
    id: 'adventure',
    category: 'Adventure',
    eyebrow: 'Maafushi · Sri Lanka · Khao Sok · Jordan',
    headline: 'Wild ridges, reefs, and open trails.',
    subheadline:
      'Speedboat island hops, limestone cave kayaks, national park safaris, and canyon expeditions.',
    videoSrc: '/assets/hero/adventure.mp4',
    posterSrc: '/assets/hero/adventure-poster.jpg',
    mobilePosterSrc: '/assets/hero/adventure-poster.jpg',
    durationSeconds: 5,
    mediaAttribution: 'Custom AI Cinema · Wadi Rum Sandstone Trail',
  },
  {
    id: 'luxury-escapes',
    category: 'Luxury Escapes',
    eyebrow: 'Maldives · Bahrain · Azerbaijan',
    headline: 'Private decks over emerald waters.',
    subheadline:
      'All-inclusive beach villas, chauffeur-driven transfers, and quiet twilight hospitality at signature resorts.',
    videoSrc: '/assets/hero/luxury-escapes.mp4',
    posterSrc: '/assets/hero/luxury-escapes-poster.jpg',
    mobilePosterSrc: '/assets/hero/luxury-escapes-poster.jpg',
    durationSeconds: 5,
    mediaAttribution: 'Custom AI Cinema · Seychelles Granite Coast',
  },
  {
    id: 'women-solo',
    category: 'Women Solo',
    eyebrow: 'Istanbul · Vietnam · Phuket & Krabi · Bali',
    headline: 'Confident routes, thoughtfully escorted.',
    subheadline:
      'Vetted 4-star stays, English-speaking local drivers, and fixed departures designed for independent women travelers.',
    videoSrc: '/assets/hero/women-solo.mp4',
    posterSrc: '/assets/hero/women-solo-poster.jpg',
    mobilePosterSrc: '/assets/hero/women-solo-poster.jpg',
    durationSeconds: 5,
    mediaAttribution: 'Custom AI Cinema · Istanbul Bosphorus Terrace',
  },
  {
    id: 'wellness-retreats',
    category: 'Wellness & Retreats',
    eyebrow: 'Oman Mountains · Makunudu · Mauritius Spa',
    headline: 'Restorative calm at dawn.',
    subheadline:
      'Aavun spa massages, highland mountain escapes, and slow island mornings away from crowded circuits.',
    videoSrc: '/assets/hero/wellness-retreats.mp4',
    posterSrc: '/assets/hero/wellness-retreats-poster.jpg',
    mobilePosterSrc: '/assets/hero/wellness-retreats-poster.jpg',
    durationSeconds: 5,
    mediaAttribution: 'Custom AI Cinema · Balinese Rainforest Pavilion',
  },
  {
    id: 'culture-heritage',
    category: 'Culture & Heritage',
    eyebrow: 'Petra · Georgia · Baku · Malacca',
    headline: 'Living stone, Silk Road, and sea forts.',
    subheadline:
      'Rose-red canyons in Petra, Tbilisi cableways, Old Baku citadels, and centuries-old spice routes.',
    videoSrc: '/assets/hero/culture-heritage.mp4',
    posterSrc: '/assets/hero/culture-heritage-poster.jpg',
    mobilePosterSrc: '/assets/hero/culture-heritage-poster.jpg',
    durationSeconds: 5,
    mediaAttribution: 'Custom AI Cinema · Petra Rose Treasury',
  },
];

const CATEGORY_IMAGE_MAP: Record<HolidayCategory, string> = {
  Honeymoon: '/src/assets/images/hero_honeymoon_1794846289592.jpg',
  'Family & Group': '/src/assets/images/hero_family_group_1794846293079.jpg',
  Adventure: '/src/assets/images/hero_adventure_1794846293742.jpg',
  'Luxury Escapes': '/src/assets/images/hero_luxury_escapes_1794846291471.jpg',
  'Women Solo': '/src/assets/images/hero_women_solo_1794846293480.jpg',
  'Wellness & Retreats': '/src/assets/images/hero_wellness_retreats_1794846293587.jpg',
  'Culture & Heritage': '/src/assets/images/hero_culture_heritage_1794846293999.jpg',
};

export function getPackageImage(pkg: HolidayPackage): string {
  const dest = pkg.destination.toLowerCase();

  if (dest.includes('dubai') || dest.includes('bahrain') || dest.includes('oman')) {
    if (pkg.holidayCategory === 'Wellness & Retreats') {
      return '/src/assets/images/hero_wellness_retreats_1794846293587.jpg';
    }
    return '/src/assets/images/dest_dubai_skyline_1794846294782.jpg';
  }
  if (dest.includes('azerbaijan') || dest.includes('georgia')) {
    return '/src/assets/images/dest_caucasus_baku_1794846296046.jpg';
  }
  if (dest.includes('vietnam') || dest.includes('singapore') || dest.includes('malaysia') || dest.includes('thailand')) {
    if (pkg.holidayCategory === 'Adventure') {
      return '/src/assets/images/dest_fareast_asia_1794846293438.jpg';
    }
    if (dest.includes('thailand') || dest.includes('vietnam')) {
      return '/src/assets/images/dest_fareast_asia_1794846293438.jpg';
    }
    return CATEGORY_IMAGE_MAP[pkg.holidayCategory];
  }
  if (dest.includes('bali') || dest.includes('sri lanka')) {
    if (pkg.holidayCategory === 'Honeymoon') {
      return CATEGORY_IMAGE_MAP.Honeymoon;
    }
    return '/src/assets/images/dest_tropical_islands_1794846295801.jpg';
  }
  if (dest.includes('jordan')) {
    return pkg.holidayCategory === 'Adventure'
      ? '/src/assets/images/hero_adventure_1794846293742.jpg'
      : '/src/assets/images/hero_culture_heritage_1794846293999.jpg';
  }
  if (dest.includes('turkey')) {
    return '/src/assets/images/hero_women_solo_1794846293480.jpg';
  }
  if (dest.includes('seychelles')) {
    return '/src/assets/images/hero_luxury_escapes_1794846291471.jpg';
  }

  return CATEGORY_IMAGE_MAP[pkg.holidayCategory];
}
