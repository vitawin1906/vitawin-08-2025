/**
 * Утилиты для форматирования цен
 */

/**
 * Форматирует цену в формате "1000 ₽" (целые числа)
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${Math.round(numPrice)} ₽`;
}

/**
 * Форматирует цену без символа валюты в формате "1000" (целые числа)
 */
export function formatPriceNumber(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return Math.round(numPrice).toString();
}

/**
 * Преобразует строку цены в число с округлением
 */
export function normalizePrice(price: string | number): number {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return Math.round(numPrice);
}