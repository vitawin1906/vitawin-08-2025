import { calculatePV, getPVInfo } from "../../../shared/utils/pv";
import { calculateCashback, getBonusInfo } from "../../../shared/utils/bonuses";
import { Coins, Gift } from "lucide-react";

interface ProductBonusesProps {
  price: number;
  customPV?: number | null;
  customCashback?: number | null;
  className?: string;
}

export function ProductBonuses({ price, customPV, customCashback, className = "" }: ProductBonusesProps) {
  const pvInfo = getPVInfo(price, customPV);
  const bonusInfo = getBonusInfo(price, customCashback);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* PV Badge - розовый */}
      <div className="inline-flex items-center gap-1 px-2 py-1 text-white rounded-full text-xs font-medium shadow-sm bg-[#4070ff]" style={{ backgroundColor: '#FF4081' }}>
        <Coins className="w-3 h-3" />
        <span>+{bonusInfo.coins} монет</span>
      </div>
      {/* PV Badge - розовый */}
      <div className="inline-flex items-center gap-1 px-2 py-1 text-white rounded-full text-xs font-medium shadow-sm" style={{ backgroundColor: '#FF4081' }}>
        <Gift className="w-3 h-3" />
        <span>{pvInfo.pv} PV кэшбек</span>
      </div>
    </div>
  );
}

interface ProductBonusesDetailedProps {
  price: number;
  customPV?: number | null;
  customCashback?: number | null;
  showDetails?: boolean;
  className?: string;
}

export function ProductBonusesDetailed({ 
  price, 
  customPV,
  customCashback,
  showDetails = false, 
  className = "" 
}: ProductBonusesDetailedProps) {
  const pvInfo = getPVInfo(price, customPV);
  const bonusInfo = getBonusInfo(price, customCashback);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {/* PV Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white rounded-full text-sm font-medium" style={{ backgroundColor: '#FF4081' }}>
          <Coins className="w-4 h-4" />
          <span>+{pvInfo.pv} PV</span>
        </div>

        
      </div>

      {showDetails && (
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>PV (Personal Volume):</span>
            <span className="font-medium">{pvInfo.pv} PV</span>
          </div>
          <div className="flex justify-between">
            <span>Кешбэк VitaWin Coin ({bonusInfo.cashbackPercent}%):</span>
            <span className="font-medium">{bonusInfo.cashback} ₽</span>
          </div>
          
          {pvInfo.remainingForNextPV > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-500 pt-1 border-t">
              До следующего PV: {pvInfo.remainingForNextPV} ₽
            </div>
          )}
        </div>
      )}
    </div>
  );
}