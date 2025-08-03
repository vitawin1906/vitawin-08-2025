
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Trash2, PlusCircle, CheckCircle, Home, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";

// Mock data for saved addresses
const mockAddresses = [
  {
    id: "addr-1",
    name: "Дом",
    address: "ул. Примерная, 123",
    city: "Москва",
    state: "Московская область",
    zip: "101000",
    country: "Россия",
    isDefault: true,
    type: "home",
  },
  {
    id: "addr-2",
    name: "Работа",
    address: "пр. Деловой, 456",
    city: "Москва",
    state: "Московская область",
    zip: "101001",
    country: "Россия",
    isDefault: false,
    type: "work",
  },
];

const DeliveryAddresses = () => {
  const [addresses, setAddresses] = useState(mockAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "Россия",
      type: "home",
    },
  });

  const onSubmit = (values: any) => {
    // In a real app, this would call an API to save the address
    const newAddress = {
      id: `addr-${Date.now()}`,
      ...values,
      isDefault: addresses.length === 0,
    };
    
    setAddresses([...addresses, newAddress]);
    setIsAdding(false);
    form.reset();
    
    toast({
      title: "Адрес добавлен",
      description: "Ваш адрес доставки был успешно сохранен.",
    });
  };

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
    
    toast({
      title: "Адрес удален",
      description: "Ваш адрес доставки был удален.",
    });
  };

  const setAsDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    })));
    
    toast({
      title: "По умолчанию обновлено",
      description: "Ваш адрес доставки по умолчанию был обновлен.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Адреса доставки</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <PlusCircle size={16} />
            Добавить новый адрес
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить новый адрес</CardTitle>
            <CardDescription>Введите детали вашего адреса доставки</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название адреса</FormLabel>
                      <FormControl>
                        <Input placeholder="Дом, Работа и т.д." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес</FormLabel>
                      <FormControl>
                        <Input placeholder="ул. Название, 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Город</FormLabel>
                        <FormControl>
                          <Input placeholder="Город" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Область/Регион</FormLabel>
                        <FormControl>
                          <Input placeholder="Область" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Почтовый индекс</FormLabel>
                        <FormControl>
                          <Input placeholder="Почтовый индекс" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Страна</FormLabel>
                        <FormControl>
                          <Input placeholder="Страна" {...field} />
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
                  <Button type="submit">Сохранить адрес</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {addresses.length === 0 && !isAdding ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <MapPin className="h-12 w-12 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium mb-2">Пока нет адресов</h3>
          <p className="text-gray-500 mb-4">Добавьте адрес доставки для быстрого оформления заказа</p>
          <Button onClick={() => setIsAdding(true)}>Добавить адрес</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((addr) => (
            <Card key={addr.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-gray-100 rounded">
                      {addr.type === 'home' ? (
                        <Home className="h-5 w-5 text-gray-700" />
                      ) : (
                        <Building className="h-5 w-5 text-gray-700" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center">
                        {addr.name}
                        {addr.isDefault && (
                          <span className="ml-2 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full">
                            По умолчанию
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {addr.address}
                      </div>
                      <div className="text-sm text-gray-600">
                        {addr.city}, {addr.state} {addr.zip}
                      </div>
                      <div className="text-sm text-gray-600">
                        {addr.country}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!addr.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setAsDefault(addr.id)}
                      >
                        Сделать основным
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(addr.id)}
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

export default DeliveryAddresses;
