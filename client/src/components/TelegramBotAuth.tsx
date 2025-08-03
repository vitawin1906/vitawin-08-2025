import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TelegramBotAuthProps {
  isOpen: boolean;
  onClose: () => void;
}

const TelegramBotAuth = ({ isOpen, onClose }: TelegramBotAuthProps) => {
  const handleTelegramAuth = () => {
    // Перенаправление в Telegram бота для авторизации
    const botUrl = 'https://t.me/Vitawin_bot?start=auth';
    window.open(botUrl, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.65.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
            Авторизация через Telegram
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            Для входа в систему необходимо авторизоваться через Telegram бота
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Как это работает:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Нажмите кнопку "Перейти в бота"</li>
              <li>2. В Telegram боте отправьте команду /start</li>
              <li>3. Нажмите кнопку "Авторизоваться на сайте"</li>
              <li>4. Вы автоматически войдете в личный кабинет</li>
            </ol>
          </div>

          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleTelegramAuth}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.65.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              Перейти в бота @Vitawin_bot
            </Button>

            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Отмена
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Безопасная авторизация через официального бота VitaWin
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramBotAuth;