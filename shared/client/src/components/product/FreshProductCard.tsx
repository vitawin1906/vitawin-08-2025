
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FreshProductCardProps {
  product: {
    id?: number | string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviews: number;
    badge?: string;
    images: string[];
    category?: string;
    description?: string;
  };
}

const FreshProductCard = ({ product }: FreshProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const discount = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Card className="border-none shadow-lg h-full flex flex-col hover:shadow-xl transition-all duration-300">
      <div className="relative">
        {discount > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-rose-600 text-white">-{discount}%</Badge>
          </div>
        )}
        {product.badge && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-emerald-600 text-white">{product.badge}</Badge>
          </div>
        )}
        <div className="overflow-hidden rounded-lg aspect-square bg-gray-50">
          <img 
            src={product.images?.[0]} 
            alt={product.name} 
            className="w-full h-full object-contain p-4"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
        </div>
        <Button 
          variant="outline"
          size="icon" 
          className="absolute bottom-3 right-3 rounded-full bg-white shadow-sm border-gray-200 hover:bg-gray-100"
          onClick={() => setIsFavorite(!isFavorite)}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </Button>
      </div>
      
      <CardContent className="pt-4 flex flex-col flex-grow">
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
        </div>
        
        {product.category && (
          <Badge variant="secondary" className="mb-2 text-xs w-fit">
            {product.category}
          </Badge>
        )}
        
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}
        
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-semibold text-gray-900">{(product.price / 100).toFixed(0)} ₽</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">{(product.originalPrice / 100).toFixed(0)} ₽</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FreshProductCard;
