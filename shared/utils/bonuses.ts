/**
 * Bonus and cashback calculation utilities
 */

/**
 * Рассчитывает кешбэк (5% от суммы покупки)
 * @param amount - сумма покупки в рублях
 * @param customCashback - ручное значение кешбэка (если задано)
 * @returns сумма кешбэка в рублях (округление вверх)
 */
export function calculateCashback(amount: number, customCashback?: number | null): number {
  if (amount <= 0) return 0;
  if (customCashback !== null && customCashback !== undefined) return customCashback;
  return Math.ceil(amount * 0.05);
}

/**
 * Рассчитывает количество VitaWin Coin за кешбэк
 * @param amount - сумма покупки в рублях
 * @param customCashback - ручное значение кешбэка (если задано)
 * @returns количество монет (равно кешбэку в рублях)
 */
export function calculateVitaWinCoins(amount: number, customCashback?: number | null): number {
  return calculateCashback(amount, customCashback);
}

/**
 * Получает полную информацию о бонусах для суммы
 * @param amount - сумма покупки в рублях
 * @param customCashback - ручное значение кешбэка (если задано)
 * @returns объект с информацией о всех бонусах
 */
export function getBonusInfo(amount: number, customCashback?: number | null) {
  const cashback = calculateCashback(amount, customCashback);
  const coins = calculateVitaWinCoins(amount, customCashback);
  
  return {
    cashback,
    coins,
    cashbackPercent: customCashback ? null : 5,
    isCustom: customCashback !== null && customCashback !== undefined
  };
}