import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, MessageCircle } from "lucide-react";
import { useSimpleAuthStore } from "@/store/simpleAuthStore";

export function TelegramAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useSimpleAuthStore();

  const handleTelegramAuth = () => {
    // Открываем основной бота с параметром auth
    window.open("https://t.me/vitawin_bot?start=auth", "_blank");
  };

  const handleQuickDemo = (userData: any) => {
    setIsLoading(true);
    setTimeout(() => {
      setUser(userData);
      setIsLoading(false);
    }, 500);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          Вход через Telegram
        </CardTitle>
        <CardDescription>
          Авторизуйтесь через Telegram бот для доступа к системе
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button 
          onClick={handleTelegramAuth}
          className="w-full bg-[#0088cc] hover:bg-[#0077bb] text-white"
          disabled={isLoading}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Войти через @vitawin_bot
        </Button>
        
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <strong>Инструкция:</strong>
          <br />1. Нажмите кнопку выше
          <br />2. В боте отправьте /start auth  
          <br />3. Получите токен и кнопку авторизации
          <br />4. Нажмите кнопку для входа
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Быстрый вход для тестирования:</p>
          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-left justify-start"
              onClick={() => handleQuickDemo({
                id: "2",
                name: "Eugene Aliev", 
                username: "alievgeniy",
                balance: 1554.50,
                is_admin: true
              })}
              disabled={isLoading}
            >
              Eugene Aliev (Админ)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-left justify-start"
              onClick={() => handleQuickDemo({
                id: "3", 
                name: "Максим Щепин",
                username: "shchepin_ms", 
                balance: 850.00,
                is_admin: false
              })}
              disabled={isLoading}
            >
              Максим Щепин (Пользователь)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}