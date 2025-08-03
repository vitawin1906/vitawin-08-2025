import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Gift, 
  Copy, 
  Share2, 
  UserPlus,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const ReferralProgram = () => {
  const user = useAuthStore(state => state.user);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  
  // Получаем Telegram ID из URL параметров
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tgId = urlParams.get('tg_id');
    const tgFirstName = urlParams.get('first_name');
    const tgUsername = urlParams.get('username');

    if (tgId && tgFirstName) {
      setTelegramUser({
        id: parseInt(tgId),
        first_name: decodeURIComponent(tgFirstName),
        username: tgUsername || null
      });
    }
  }, []);

  const currentTelegramId = telegramUser?.id || 131632979;

  // Загружаем данные пользователя по Telegram ID
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: [`/api/user/telegram/${currentTelegramId}`],
    enabled: !!currentTelegramId,
  });

  // Загружаем историю рефералов напрямую по Telegram ID
  const { data: referralData, isLoading: historyLoading } = useQuery({
    queryKey: [`/api/referral/history/telegram/${currentTelegramId}`],
    enabled: !!currentTelegramId,
  });

  const copyReferralCode = () => {
    const codeToShare = (userData as any)?.user?.referral_code || currentTelegramId.toString();
    if (codeToShare) {
      navigator.clipboard.writeText(codeToShare.toString());
      toast({
        title: "Реферальный код скопирован!",
        description: "Поделитесь этим кодом с друзьями, чтобы получать вознаграждения.",
      });
    }
  };

  const applyReferralCode = async () => {
    if (!referralCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите реферальный код",
        variant: "destructive"
      });
      return;
    }

    setIsApplying(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/referral/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ referralCode: referralCode.trim() })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Успешно!",
          description: data.message
        });
        setReferralCode("");
      } else {
        toast({
          title: "Ошибка",
          description: data.message || "Не удалось применить код",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при применении кода",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  const appliedReferralCode = (userData as any)?.user?.applied_referral_code;
  const userReferralCode = (userData as any)?.user?.referral_code || currentTelegramId.toString();
  const totalReferrals = (referralData as any)?.summary?.total_referrals || 0;
  const totalEarnings = (referralData as any)?.summary?.total_rewards || "0.00";
  const referralHistory = (referralData as any)?.referral_history || [];

  return (
    <div className="space-y-6">
      {/* Your Referral Code */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base md:text-lg flex items-center">
            <Gift className="h-4 w-4 md:h-5 md:w-5 mr-2 text-purple-500" />
            Ваш реферальный код
          </CardTitle>
          <CardDescription className="text-sm">
            Поделитесь этим кодом с друзьями и получайте вознаграждения за их покупки
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Input 
                value={userReferralCode} 
                readOnly 
                className="pr-12 text-sm md:text-base font-mono border-dashed border-purple-300"
              />
              <button 
                onClick={copyReferralCode}
                className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-500 hover:text-purple-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1 text-sm" onClick={copyReferralCode}>
                <Copy className="h-4 w-4 mr-2" />
                Копировать
              </Button>
              <Button variant="outline" className="flex-1 text-sm">
                <Share2 className="h-4 w-4 mr-2" />
                Поделиться
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Referral Stats */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 md:p-3 bg-purple-100 rounded-full mb-3 md:mb-4">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">
                {historyLoading ? "..." : totalReferrals}
              </div>
              <div className="text-xs md:text-sm text-gray-500">Прямые рефералы</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 md:p-3 bg-blue-100 rounded-full mb-3 md:mb-4">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">0</div>
              <div className="text-xs md:text-sm text-gray-500">Рефералы 2-го уровня</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 md:p-3 bg-green-100 rounded-full mb-3 md:mb-4">
                <Gift className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">
                {historyLoading ? "..." : `${totalEarnings} ₽`}
              </div>
              <div className="text-xs md:text-sm text-gray-500">Общий доход</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Applied Referral Code Status */}
      {appliedReferralCode && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg flex items-center text-green-800">
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2 text-green-600" />
              Применен реферальный код
            </CardTitle>
            <CardDescription className="text-sm text-green-700">
              Вы получаете скидку 10% на все покупки
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between p-4 bg-white border border-green-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Код: {appliedReferralCode}
                </p>
                <p className="text-xs text-gray-500">
                  Статус: Активен
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">10%</p>
                <p className="text-xs text-gray-500">скидка</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply Referral Code */}
      {!appliedReferralCode && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg flex items-center">
              <UserPlus className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-500" />
              Применить реферальный код
            </CardTitle>
            <CardDescription className="text-sm">
              Есть реферальный код? Введите его здесь, чтобы получить скидку 10% на все покупки
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input 
                  placeholder="Введите реферальный код (Telegram ID)" 
                  className="text-sm md:text-base"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={isApplying}
                />
              </div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={applyReferralCode}
                disabled={isApplying || !referralCode.trim()}
              >
                {isApplying ? "Применяем..." : "Применить код"}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Реферальный код можно применить только один раз при первой покупке
            </p>
          </CardContent>
        </Card>
      )}

      {/* Referral History */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base md:text-lg">История рефералов</CardTitle>
          <CardDescription className="text-sm">
            Все ваши приглашенные пользователи и полученные вознаграждения
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : referralHistory?.length > 0 ? (
            <div className="space-y-3">
              {referralHistory.map((referral: any) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {referral.referred_user?.first_name || "Пользователь"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(referral.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      +{referral.reward_earned} ₽
                    </div>
                    {referral.order_total && (
                      <div className="text-xs text-gray-500">
                        с заказа {referral.order_total} ₽
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>У вас пока нет рефералов</p>
              <p className="text-sm mt-1">Поделитесь своим кодом с друзьями!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralProgram;