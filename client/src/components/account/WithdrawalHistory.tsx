import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface WithdrawalRequest {
  id: number;
  amount: string;
  full_name: string;
  inn?: string;
  bik?: string;
  account_number: string;
  status: string;
  admin_notes?: string;
  processed_at?: string;
  created_at: string;
}

export function WithdrawalHistory() {
  const { data, isLoading, error } = useQuery<{
    success: boolean;
    requests: WithdrawalRequest[];
  }>({
    queryKey: ["/api/withdrawal/requests"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">На рассмотрении</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-500">Одобрено</Badge>;
      case "rejected":
        return <Badge variant="destructive">Отклонено</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-blue-500">Выполнено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Загрузка заявок...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Ошибка при загрузке заявок на вывод</p>
        </CardContent>
      </Card>
    );
  }

  const requests = data?.requests || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>История заявок на вывод</CardTitle>
        <CardDescription>
          Все ваши заявки на вывод средств
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            У вас пока нет заявок на вывод средств
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {parseFloat(request.amount).toLocaleString()} ₽
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Счет: {request.account_number}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    {getStatusBadge(request.status)}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(request.created_at), "dd.MM.yyyy HH:mm", {
                        locale: ru,
                      })}
                    </p>
                  </div>
                </div>

                {request.admin_notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm">
                      <span className="font-medium">Комментарий администратора:</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.admin_notes}
                    </p>
                  </div>
                )}

                {request.processed_at && (
                  <div className="text-xs text-muted-foreground">
                    Обработано:{" "}
                    {format(new Date(request.processed_at), "dd.MM.yyyy HH:mm", {
                      locale: ru,
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}