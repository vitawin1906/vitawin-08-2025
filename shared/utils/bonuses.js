"use strict";
/**
 * Bonus and cashback calculation utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCashback = calculateCashback;
exports.calculateVitaWinCoins = calculateVitaWinCoins;
exports.getBonusInfo = getBonusInfo;
/**
 * Рассчитывает кешбэк (5% от суммы покупки)
 * @param amount - сумма покупки в рублях
 * @param customCashback - ручное значение кешбэка (если задано)
 * @returns сумма кешбэка в рублях (округление вверх)
 */
function calculateCashback(amount, customCashback) {
    if (amount <= 0)
        return 0;
    if (customCashback !== null && customCashback !== undefined)
        return customCashback;
    return Math.ceil(amount * 0.05);
}
/**
 * Рассчитывает количество VitaWin Coin за кешбэк
 * @param amount - сумма покупки в рублях
 * @param customCashback - ручное значение кешбэка (если задано)
 * @returns количество монет (равно кешбэку в рублях)
 */
function calculateVitaWinCoins(amount, customCashback) {
    return calculateCashback(amount, customCashback);
}
/**
 * Получает полную информацию о бонусах для суммы
 * @param amount - сумма покупки в рублях
 * @param customCashback - ручное значение кешбэка (если задано)
 * @returns объект с информацией о всех бонусах
 */
function getBonusInfo(amount, customCashback) {
    const cashback = calculateCashback(amount, customCashback);
    const coins = calculateVitaWinCoins(amount, customCashback);
    return {
        cashback,
        coins,
        cashbackPercent: customCashback ? null : 5,
        isCustom: customCashback !== null && customCashback !== undefined
    };
}
