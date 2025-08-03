
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";

// Mock data for saved payment methods
const mockPaymentMethods = [
  {
    id: "card-1",
    type: "visa",
    lastFour: "4242",
    expiry: "12/25",
    name: "Иван Иванов",
    isDefault: true,
  },
  {
    id: "card-2",
    type: "mastercard",
    lastFour: "5678",
    expiry: "09/24",
    name: "Иван Иванов",
    isDefault: false,
  },
];

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      cardNumber: "",
      cardName: "",
      expiry: "",
      cvv: "",
    },
  });

  const onSubmit = (values: any) => {
    // In a real app, this would call an API to save the card
    const newCard = {
      id: `card-${Date.now()}`,
      type: values.cardNumber.startsWith("4") ? "visa" : "mastercard",
      lastFour: values.cardNumber.slice(-4),
      expiry: values.expiry,
      name: values.cardName,
      isDefault: paymentMethods.length === 0,
    };
    
    setPaymentMethods([...paymentMethods, newCard]);
    setIsAdding(false);
    form.reset();
    
    toast({
      title: "Карта добавлена",
      description: "Ваш способ оплаты был успешно сохранен.",
    });
  };

  const handleDelete = (id: string) => {
    setPaymentMethods(paymentMethods.filter(card => card.id !== id));
    
    toast({
      title: "Карта удалена",
      description: "Ваш способ оплаты был удален.",
    });
  };

  const setAsDefault = (id: string) => {
    setPaymentMethods(paymentMethods.map(card => ({
      ...card,
      isDefault: card.id === id,
    })));
    
    toast({
      title: "По умолчанию обновлено",
      description: "Ваш способ оплаты по умолчанию был обновлен.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Способы оплаты</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <PlusCircle size={16} />
            Добавить новую карту
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить новый способ оплаты</CardTitle>
            <CardDescription>Введите данные вашей карты безопасно</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cardName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя на карте</FormLabel>
                      <FormControl>
                        <Input placeholder="Иван Иванов" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер карты</FormLabel>
                      <FormControl>
                        <Input placeholder="4242 4242 4242 4242" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Срок действия</FormLabel>
                        <FormControl>
                          <Input placeholder="ММ/ГГ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV</FormLabel>
                        <FormControl>
                          <Input placeholder="123" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">Сохранить карту</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {paymentMethods.length === 0 && !isAdding ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <CreditCard className="h-12 w-12 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium mb-2">Пока нет способов оплаты</h3>
          <p className="text-gray-500 mb-4">Добавьте кредитную или дебетовую карту для быстрого оформления заказа</p>
          <Button onClick={() => setIsAdding(true)}>Добавить способ оплаты</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentMethods.map((card) => (
            <Card key={card.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded">
                      <CreditCard className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {card.type === "visa" ? "Visa" : "Mastercard"} •••• {card.lastFour}
                      </div>
                      <div className="text-sm text-gray-500">
                        Истекает {card.expiry}
                      </div>
                    </div>
                    {card.isDefault && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full">
                        По умолчанию
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {!card.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setAsDefault(card.id)}
                      >
                        Сделать основной
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(card.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
