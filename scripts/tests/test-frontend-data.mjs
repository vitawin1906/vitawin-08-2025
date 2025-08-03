// Проверка данных, которые получает фронтенд

async function testFrontendData() {
  try {
    console.log('Проверка данных для фронтенда...\n');

    // Получаем список товаров
    const productsResponse = await fetch('http://localhost:5000/api/products');
    const productsData = await productsResponse.json();
    
    console.log('=== СПИСОК ТОВАРОВ ===');
    console.log('Статус:', productsResponse.status);
    console.log('Количество товаров:', productsData.products?.length || 0);
    
    if (productsData.products && productsData.products.length > 0) {
      console.log('\nДетали товаров:');
      
      productsData.products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name || product.title}`);
        console.log(`   - ID: ${product.id}`);
        console.log(`   - Цена: ${product.price} ₽`);
        console.log(`   - Статус: ${product.status}`);
        console.log(`   - Изображений: ${product.images?.length || 0} шт`);
        
        if (product.images && product.images.length > 0) {
          console.log(`   - Главное изображение: ${product.images[0]}`);
          
          // Проверяем правильность пути изображения
          if (product.images[0].startsWith('/api/uploads/')) {
            console.log('     ✅ Правильный путь к изображению');
          } else {
            console.log('     ❌ Неправильный путь к изображению');
          }
        } else {
          console.log('     ⚠️ Нет изображений');
        }
        
        console.log(`   - Описание: ${product.description?.substring(0, 80)}...`);
      });
    }

    // Проверяем детальную информацию о товаре
    if (productsData.products && productsData.products.length > 0) {
      const productId = productsData.products[0].id;
      
      console.log(`\n=== ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О ТОВАРЕ ID=${productId} ===`);
      
      const detailResponse = await fetch(`http://localhost:5000/api/product/${productId}`);
      const detailData = await detailResponse.json();
      
      console.log('Статус:', detailResponse.status);
      
      if (detailData.product) {
        const product = detailData.product;
        console.log('Название:', product.name || product.title);
        console.log('Цена:', product.price, '₽');
        console.log('Оригинальная цена:', product.original_price || product.originalPrice, '₽');
        console.log('Категория:', product.category);
        console.log('Количество на складе:', product.stock);
        console.log('SKU:', product.sku || 'не указан');
        console.log('Производитель:', product.manufacturer || 'не указан');
        console.log('Изображений:', product.images?.length || 0, 'шт');
        
        if (product.images && product.images.length > 0) {
          console.log('Изображения:');
          product.images.forEach((img, i) => {
            console.log(`  ${i + 1}. ${img}`);
          });
        }
        
        console.log('Преимущества:', product.benefits?.length || 0, 'шт');
        if (product.benefits && product.benefits.length > 0) {
          product.benefits.forEach((benefit, i) => {
            console.log(`  ${i + 1}. ${benefit}`);
          });
        }
        
        console.log('Рейтинг:', product.rating || 0);
        console.log('Количество отзывов:', product.reviews || 0);
        
        // Проверяем похожие товары
        if (detailData.related_products) {
          console.log('\nПохожие товары:', detailData.related_products.length, 'шт');
          detailData.related_products.forEach((relatedProduct, i) => {
            console.log(`  ${i + 1}. ${relatedProduct.name || relatedProduct.title} (ID: ${relatedProduct.id})`);
          });
        }
      }
    }

    console.log('\n=== ПРОВЕРКА ДОСТУПНОСТИ ИЗОБРАЖЕНИЙ ===');
    
    // Проверяем все изображения товаров
    let totalImages = 0;
    let availableImages = 0;
    
    for (const product of productsData.products || []) {
      if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images) {
          totalImages++;
          
          try {
            const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;
            const imageResponse = await fetch(fullImageUrl, { method: 'HEAD' });
            
            if (imageResponse.status === 200) {
              availableImages++;
              console.log(`✅ ${imageUrl} - доступно`);
            } else {
              console.log(`❌ ${imageUrl} - недоступно (${imageResponse.status})`);
            }
          } catch (error) {
            console.log(`❌ ${imageUrl} - ошибка: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`\nИтого изображений: ${totalImages}`);
    console.log(`Доступных: ${availableImages}`);
    console.log(`Недоступных: ${totalImages - availableImages}`);
    
    if (availableImages === totalImages && totalImages > 0) {
      console.log('✅ Все изображения доступны');
    } else if (availableImages > 0) {
      console.log('⚠️ Некоторые изображения недоступны');
    } else {
      console.log('❌ Изображения недоступны');
    }

  } catch (error) {
    console.error('Ошибка при проверке данных фронтенда:', error);
  }
}

testFrontendData();