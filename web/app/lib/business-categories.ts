export const BUSINESS_CATEGORIES = [
  'Alimentos y bebidas',
  'Belleza y bienestar',
  'Salud',
  'Fitness',
  'Retail',
  'Mascotas',
  'Automotriz',
  'Hogar y servicios',
  'Educación',
  'Entretenimiento',
  'Servicios profesionales',
  'Otros',
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export const DEFAULT_BUSINESS_CATEGORY: BusinessCategory = 'Otros';

export function isBusinessCategory(value: unknown): value is BusinessCategory {
  return typeof value === 'string' && BUSINESS_CATEGORIES.includes(value as BusinessCategory);
}
