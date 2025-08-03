import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Truck, MapPin } from 'lucide-react';

interface DeliveryOption {
  service: 'cdek' | 'russianpost' | 'yandex';
  name: string;
  cost: number;
  min_days: number;
  max_days: number;
  delivery_type: 'pickup' | 'courier';
  description?: string;
}

interface DeliveryCalculatorProps {
  onDeliverySelect: (delivery: DeliveryOption) => void;
  selectedDelivery?: string;
  cartWeight?: number;
}

export function DeliveryCalculator({ onDeliverySelect, selectedDelivery, cartWeight = 500 }: DeliveryCalculatorProps) {
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [selected, setSelected] = useState(selectedDelivery || '');

  const calculateDelivery = async () => {
    if (!city.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/delivery/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_city: 'Москва',
          to_city: city,
          to_address: address,
          to_postal_code: postalCode,
          weight: cartWeight,
          dimensions: {
            length: 20,
            width: 15,
            height: 10
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.options) {
          setDeliveryOptions(data.options);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryChange = (value: string) => {
    setSelected(value);
    const option = deliveryOptions.find((opt, index) => `${opt.service}_${index}` === value);
    if (option) {
      onDeliverySelect(option);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'cdek':
        return '📦';
      case 'russianpost':
        return '📮';
      case 'yandex':
        return '🚚';
      default:
        return '📦';
    }
  };

  const getDeliveryTypeIcon = (type: string) => {
    return type === 'pickup' ? <Package className="w-4 h-4" /> : <Truck className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Расчет доставки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Форма адреса */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Город доставки *</label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Санкт-Петербург"
              onKeyPress={(e) => e.key === 'Enter' && calculateDelivery()}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Адрес</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Улица, дом"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Индекс</label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="190000"
              />
            </div>
          </div>

          <Button 
            onClick={calculateDelivery} 
            disabled={!city.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Рассчитываем...
              </>
            ) : (
              'Рассчитать доставку'
            )}
          </Button>
        </div>

        {/* Результаты расчета */}
        {deliveryOptions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Выберите способ доставки:</h4>
            <RadioGroup value={selected} onValueChange={handleDeliveryChange} className="space-y-3">
              {deliveryOptions.map((option, index) => {
                const optionId = `${option.service}_${index}`;
                return (
                  <div key={optionId} className="flex items-center space-x-3">
                    <RadioGroupItem value={optionId} id={optionId} className="text-green-600" />
                    <Label htmlFor={optionId} className="flex items-center justify-between w-full cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getServiceIcon(option.service)}</span>
                        {getDeliveryTypeIcon(option.delivery_type)}
                        <div>
                          <div className="font-medium">{option.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.min_days === option.max_days 
                              ? `${option.min_days} ${option.min_days === 1 ? 'день' : 'дня'}`
                              : `${option.min_days}-${option.max_days} дней`
                            } • {option.cost} ₽
                          </div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        )}

        {!loading && deliveryOptions.length === 0 && city && (
          <div className="text-center py-4 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Нажмите "Рассчитать доставку" для получения вариантов</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}