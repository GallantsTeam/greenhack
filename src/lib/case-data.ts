
import type { Prize, CaseItem, BoostOption } from '@/types';

// Prizes: Made chances more distinct and adjusted sell values
// This data will now be fetched from the database via lib/data.ts getCaseById function.
/*
export const unitHackPrizes: Prize[] = [
  { id: 'uh1d', case_id: 'main-case-1', name: 'Unit Hack 1 День', prize_type: 'product_duration', duration_days: 1, imageUrl: 'https://picsum.photos/seed/uh1d/120/120', chance: 0.30, dataAiHint: "software chip", sell_value_gh: 10 },
  { id: 'uh3d', case_id: 'main-case-1', name: 'Unit Hack 3 Дня', prize_type: 'product_duration', duration_days: 3, imageUrl: 'https://picsum.photos/seed/uh3d/120/120', chance: 0.20, dataAiHint: "software package", sell_value_gh: 25 },
  { id: 'uh5d', case_id: 'main-case-1', name: 'Unit Hack 5 Дней', prize_type: 'product_duration', duration_days: 5, imageUrl: 'https://picsum.photos/seed/uh5d/120/120', chance: 0.15, dataAiHint: "software box", sell_value_gh: 45 },
  { id: 'uh7d', case_id: 'main-case-1', name: 'Unit Hack 7 Дней', prize_type: 'product_duration', duration_days: 7, imageUrl: 'https://picsum.photos/seed/uh7d/120/120', chance: 0.10, dataAiHint: "software key", sell_value_gh: 60 },
  { id: 'uh10d', case_id: 'main-case-1', name: 'Unit Hack 10 Дней', prize_type: 'product_duration', duration_days: 10, imageUrl: 'https://picsum.photos/seed/uh10d/120/120', chance: 0.08, dataAiHint: "software icon", sell_value_gh: 80 },
  { id: 'uh14d', case_id: 'main-case-1', name: 'Unit Hack 14 Дней', prize_type: 'product_duration', duration_days: 14, imageUrl: 'https://picsum.photos/seed/uh14d/120/120', chance: 0.07, dataAiHint: "software cd", sell_value_gh: 100 },
  { id: 'uh30d', case_id: 'main-case-1', name: 'Unit Hack 30 Дней', prize_type: 'product_duration', duration_days: 30, imageUrl: 'https://picsum.photos/seed/uh30d/120/120', chance: 0.06, dataAiHint: "software disc", sell_value_gh: 180 },
  { id: 'uh90d', case_id: 'main-case-1', name: 'Unit Hack 90 Дней', prize_type: 'product_duration', duration_days: 90, imageUrl: 'https://picsum.photos/seed/uh90d/120/120', chance: 0.04, dataAiHint: "software archive", sell_value_gh: 500 },
];

export const mainCase: CaseItem = {
  id: 'main-case-1', // This ID should match an ID in the 'cases' table
  name: 'Стандартный Кейс Удачи',
  image_url: 'https://cdn.streamelements.com/uploads/ed049f7b-6dbd-419d-a279-c2e4db0f65f9.png',
  imageUrl: 'https://cdn.streamelements.com/uploads/ed049f7b-6dbd-419d-a279-c2e4db0f65f9.png',
  prizes: unitHackPrizes, // Prizes will be fetched based on case_id
  base_price_gh: 100, 
  description: 'Откройте кейс и получите шанс выиграть ценные внутриигровые предметы!',
  data_ai_hint: 'loot box'
};
*/

// This is now the only active part of this file, for UI boost options.
// Case and prize data should be fetched from the database.
export const defaultBoostOptions: BoostOption[] = [
  { id: 'no-boost', label: 'Стандарт', cost: 0, chanceMultiplier: 1, description: 'Базовый шанс.' },
  { id: 'boost10', label: '+10%', cost: 10, chanceMultiplier: 1.10, description: 'Шанс x1.10' },
  { id: 'boost50', label: '+50%', cost: 100, chanceMultiplier: 1.50, description: 'Шанс x1.50' },
  { id: 'boost70', label: '+70%', cost: 1000, chanceMultiplier: 1.70, description: 'Шанс x1.70' },
];

// Placeholder for the main case ID that the UI will try to load.
// This should ideally be configurable or fetched from a "featured cases" API endpoint.
export const FEATURED_CASE_ID = 'warface-allin'; // Changed to display 'warface-allin' case

