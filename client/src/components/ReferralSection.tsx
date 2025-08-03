import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Gift, Users, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';

export function ReferralSection() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Реферальный код пользователя = его Telegram ID
  const userReferralCode = user?.referralCode || user?.id || '';

  const copyReferralCode = () => {
    navigator.clipboard.writeText(userReferralCode);
    toast({
      title: "Скопировано!",
      description: "Реферальный код скопирован в буфер обмена",
    });
  };

  const shareReferralCode = () => {
    const shareText = `Присоединяйся к VitaWin и получи скидку 10% на первую покупку! Используй мой реферальный код: ${userReferralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'VitaWin - Скидка 10%',
        text: shareText,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.origin}`);
      toast({
        title: "Скопировано!",
        description: "Реферальная ссылка скопирована в буфер обмена",
      });
    }
  };

  const applyReferralCode = async () => {
    if (!referralCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите реферальный код",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    
    try {
      const response = await fetch('/api/referrals/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referral_code: referralCode.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Успешно!",
          description: data.message,
        });
        setReferralCode('');
      } else {
        toast({
          title: "Ошибка",
          description: data.message || "Не удалось применить реферальный код",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при применении кода",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Мой реферальный код */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-600" />
            Мой реферальный код
          </CardTitle>
          <CardDescription>
            Делитесь своим кодом и зарабатывайте на покупках друзей
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <code className="text-lg font-mono text-emerald-800">
                {userReferralCode}
              </code>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyReferralCode}
              className="border-emerald-200 hover:bg-emerald-50"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={shareReferralCode}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Поделиться кодом
          </Button>

          <div className="space-y-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              <Users className="h-3 w-3 mr-1" />
              Вы получаете 20% с покупок
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Gift className="h-3 w-3 mr-1" />
              Друзья получают скидку 10%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Применить реферальный код */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" />
            Применить реферальный код
          </CardTitle>
          <CardDescription>
            {user?.applied_referral_code ? (
              `Вы уже применили код: ${user.applied_referral_code}`
            ) : (
              "Введите код друга и получите скидку 10% на все покупки"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.applied_referral_code ? (
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <Check className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Реферальный код применен
                </p>
                <p className="text-xs text-green-600">
                  Код {user.applied_referral_code} дает вам скидку 10% на все покупки
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="referral-code">Реферальный код (Telegram ID)</Label>
                <Input
                  id="referral-code"
                  placeholder="Введите реферальный код (Telegram ID)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={isApplying}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  Реферальный код можно применить только один раз при первой покупке
                </p>
              </div>
              
              <Button
                onClick={applyReferralCode}
                disabled={isApplying || !referralCode.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isApplying ? "Применяется..." : "Применить код"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}