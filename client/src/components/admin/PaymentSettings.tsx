import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, TestTube, Plus, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentSettings {
  id: number;
  provider: string;
  terminal_key: string;
  secret_key: string;
  is_test_mode: boolean;
  is_active: boolean;
  created_at: string;
}

interface NewPaymentSettings {
  provider: string;
  terminal_key: string;
  secret_key: string;
  is_test_mode: boolean;
  is_active: boolean;
}

export function PaymentSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<NewPaymentSettings>({
    provider: "tinkoff",
    terminal_key: "",
    secret_key: "",
    is_test_mode: true,
    is_active: false,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/payment-settings"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: NewPaymentSettings) => {
      const response = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка создания настроек");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-settings"] });
      setIsCreating(false);
      resetForm();
      toast({
        title: "Успешно",
        description: "Настройки платежного терминала созданы",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewPaymentSettings> }) => {
      const response = await fetch(`/api/admin/payment-settings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка обновления настроек");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-settings"] });
      setEditingId(null);
      resetForm();
      toast({
        title: "Успешно",
        description: "Настройки платежного терминала обновлены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/payment-settings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка удаления настроек");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-settings"] });
      toast({
        title: "Успешно",
        description: "Настройки платежного терминала удалены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (data: { terminal_key: string; secret_key: string; is_test_mode: boolean }) => {
      const response = await fetch("/api/admin/payment-settings/test-tinkoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка тестирования подключения");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Подключение успешно",
        description: `Тестирование прошло успешно (${data.test_mode ? "тестовый" : "боевой"} режим)`,
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка подключения",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      provider: "tinkoff",
      terminal_key: "",
      secret_key: "",
      is_test_mode: true,
      is_active: false,
    });
  };

  const handleEdit = (setting: PaymentSettings) => {
    setEditingId(setting.id);
    setFormData({
      provider: setting.provider,
      terminal_key: setting.terminal_key,
      secret_key: setting.secret_key,
      is_test_mode: setting.is_test_mode,
      is_active: setting.is_active,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terminal_key || !formData.secret_key) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleTestConnection = () => {
    if (!formData.terminal_key || !formData.secret_key) {
      toast({
        title: "Ошибка",
        description: "Заполните ключ терминала и секретный ключ для тестирования",
        variant: "destructive",
      });
      return;
    }

    testConnectionMutation.mutate({
      terminal_key: formData.terminal_key,
      secret_key: formData.secret_key,
      is_test_mode: formData.is_test_mode,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Настройки платежей</h2>
          <p className="text-muted-foreground">Управление интеграциями с платежными системами</p>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить интеграцию
          </Button>
        )}
      </div>

      {/* Форма создания/редактирования */}
      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Редактирование настроек" : "Новая интеграция"}
            </CardTitle>
            <CardDescription>
              Настройте подключение к платежной системе Тинькофф
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">Провайдер</Label>
                  <Input
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="tinkoff"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="terminal_key">Ключ терминала *</Label>
                  <Input
                    id="terminal_key"
                    value={formData.terminal_key}
                    onChange={(e) => setFormData({ ...formData, terminal_key: e.target.value })}
                    placeholder="Введите ключ терминала"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secret_key">Секретный ключ *</Label>
                <Input
                  id="secret_key"
                  type="password"
                  value={formData.secret_key}
                  onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                  placeholder="Введите секретный ключ"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_test_mode"
                  checked={formData.is_test_mode}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_test_mode: checked })}
                />
                <Label htmlFor="is_test_mode">Тестовый режим</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Активно</Label>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  В тестовом режиме используется песочница Тинькофф. 
                  Отключите тестовый режим только после полной настройки и тестирования.
                </AlertDescription>
              </Alert>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnectionMutation.isPending}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Тестировать подключение
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? "Обновить" : "Создать"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    resetForm();
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Список существующих настроек */}
      <div className="space-y-4">
        {settings?.settings?.map((setting: PaymentSettings) => (
          <Card key={setting.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{setting.provider.toUpperCase()}</h3>
                    <Badge variant={setting.is_active ? "default" : "secondary"}>
                      {setting.is_active ? "Активно" : "Неактивно"}
                    </Badge>
                    <Badge variant={setting.is_test_mode ? "outline" : "destructive"}>
                      {setting.is_test_mode ? "Тест" : "Продакшн"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ключ терминала: {setting.terminal_key}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Создано: {new Date(setting.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(setting)}
                  >
                    Редактировать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(setting.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!settings?.settings || settings.settings.length === 0) && !isCreating && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Настройки платежных систем не найдены</p>
                <Button className="mt-4" onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первую интеграцию
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}