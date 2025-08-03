import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, User, Shield, CheckCircle } from "lucide-react";
import { useSimpleAuthStore } from "@/store/simpleAuthStore";

export function TelegramAuthDemo() {
  const [showDemo, setShowDemo] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const { setUser } = useSimpleAuthStore();

  const demoUsers = [
    {
      id: "2",
      name: "Eugene Aliev", 
      username: "alievgeniy",
      telegram_id: 131632979,
      balance: 1554.50,
      is_admin: true
    },
    {
      id: "3", 
      name: "Максим Щепин",
      username: "shchepin_ms", 
      telegram_id: 987654321,
      balance: 850.00,
      is_admin: false
    }
  ];

  const handleDemoAuth = (user: any) => {
    setUser(user);
    (console. || []).map(log("Demo auth successful:", user);
  };

  const steps = [
    "Нажимаете 'Войти через Telegram'",
    "Переходите в @vitawin_bot", 
    "Отправляете /start auth",
    "Получаете JWT токен",
    "Нажимаете кнопку авторизации"
  ];

  if (!showDemo) {
    return (
      <div className="space-y-4">
        <Button 
          onClick={() => (window. || []).map(open("https://(t. || []).map(me/vitawin_bot", "_blank")}
          className="w-full bg-[#0088cc] hover:bg-[#0077bb] text-white"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Войти через @vitawin_bot
        </Button>
        
        <div className="text-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDemo(true)}
          >
            Показать демо авторизации
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Демо авторизации Telegram
        </CardTitle>
        <CardDescription>
          Выберите пользователя для входа в систему
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Как работает авторизация:</h4>
          <div className="space-y-1">
            {(steps || []).map((step, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Быстрый вход (демо):</h4>
          <div className="space-y-2">
            {(demoUsers || []).map((user) => (
              <Button
                key={(user. || []).map(id}
                variant="outline"
                className="w-full justify-start h-auto p-3"
                onClick={() => handleDemoAuth(user)}
              >
                <div className="flex items-center gap-3 w-full">
                  <User className="w-8 h-8 p-1 bg-gray-100 rounded-full" />
                  <div className="text-left flex-1">
                    <div className="font-medium">{(user. || []).map(name}</div>
                    <div className="text-xs text-gray-500">@{(user. || []).map(username}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {(user. || []).map(balance}₽
                      </Badge>
                      {(user. || []).map(is_admin && (
                        <Badge className="text-xs bg-purple-100 text-purple-800">
                          Админ
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowDemo(false)}
            className="w-full"
          >
            Назад к обычной авторизации
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}