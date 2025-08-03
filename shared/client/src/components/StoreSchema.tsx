import { useEffect } from 'react';

interface StoreSchemaProps {
  products?: Array<{
    id: number;
    name: string;
    price: string;
    category: string;
    images: string[];
    slug?: string;
  }>;
}

const StoreSchema = ({ products = [] }: StoreSchemaProps) => {
  useEffect(() => {
    // Удаляем существующую разметку магазина
    const existingScript = document.querySelector('script[type="application/ld+json"][data-schema="store"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Создаем Schema.org разметку для интернет-магазина
    const storeSchema: any = {
      "@context": "https://schema.org",
      "@type": "Store",
      "name": "VitaWin - Магазин витаминов и добавок",
      "description": "Интернет-магазин качественных пищевых добавок и витаминов с доставкой по России",
      "url": "https://vitawins.ru/store",
      "image": "https://vitawins.ru/logo.png",
      "telephone": "+7-800-555-0199",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "RU",
        "addressLocality": "Россия"
      },
      "openingHours": "Mo-Su 00:00-23:59",
      "currenciesAccepted": "RUB",
      "paymentAccepted": "Cash, Credit Card, Bank Transfer",
      "priceRange": "₽₽"
    };

    // Добавляем товары если есть
    if (products && products.length > 0) {
      storeSchema.hasOfferCatalog = {
        "@type": "OfferCatalog",
        "name": "Каталог товаров VitaWin",
        "itemListElement": products.slice(0, 10).map((product, index) => ({
          "@type": "Offer",
          "position": index + 1,
          "itemOffered": {
            "@type": "Product",
            "name": product.name,
            "category": product.category,
            "image": product.images[0]?.startsWith('http') 
              ? product.images[0] 
              : `https://vitawins.ru${product.images[0]}`,
            "url": `https://vitawins.ru/product/${product.slug || product.id}`
          },
          "price": (parseFloat(product.price) / 100).toFixed(2),
          "priceCurrency": "RUB",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": "VitaWin"
          }
        }))
      };
    }

    // Создаем и добавляем script элемент
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'store');
    script.textContent = JSON.stringify(storeSchema, null, 2);
    document.head.appendChild(script);

    // Очистка при размонтировании
    return () => {
      const schemaScript = document.querySelector('script[type="application/ld+json"][data-schema="store"]');
      if (schemaScript) {
        schemaScript.remove();
      }
    };
  }, [products]);

  return null;
};

export default StoreSchema;