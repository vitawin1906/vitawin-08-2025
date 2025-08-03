// Миграция путей изображений для согласованности

async function migrateImagePaths() {
  try {
    console.log('Начинаем миграцию путей изображений...\n');

    // Получаем все товары
    const response = await fetch('http://localhost:5050/api/products');
    const data = await response.json();

    if (!data.products) {
      console.log('Товары не найдены');
      return;
    }

    let updatedCount = 0;
    let totalProducts = data.products.length;

    console.log(`Найдено ${totalProducts} товаров для проверки\n`);

    for (const product of data.products) {
      let needsUpdate = false;
      let updatedImages = [];

      if (product.images && product.images.length > 0) {
        updatedImages = product.images.map(imagePath => {
          if (imagePath.startsWith('/uploads/')) {
            console.log(`Обновляем путь: ${imagePath} -> /api${imagePath}`);
            needsUpdate = true;
            return `/api${imagePath}`;
          }
          return imagePath;
        });
      }

      if (needsUpdate) {
        console.log(`Обновляем товар "${product.name}" (ID: ${product.id})`);
        
        // Обновляем товар через API (потребуется авторизация админа)
        const updateData = {
          ...product,
          images: updatedImages
        };

        try {
          const updateResponse = await fetch(`http://localhost:5050/api/admin/products/${product.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
          });

          if (updateResponse.ok) {
            console.log(`✅ Товар ${product.id} обновлен успешно`);
            updatedCount++;
          } else {
            console.log(`❌ Ошибка обновления товара ${product.id}: ${updateResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Ошибка при обновлении товара ${product.id}:`, error.message);
        }
        
        console.log(''); // Пустая строка для разделения
      } else {
        console.log(`Товар "${product.name}" (ID: ${product.id}) - пути корректны`);
      }
    }

    console.log(`\n=== РЕЗУЛЬТАТЫ МИГРАЦИИ ===`);
    console.log(`Всего товаров: ${totalProducts}`);
    console.log(`Обновлено: ${updatedCount}`);
    console.log(`Без изменений: ${totalProducts - updatedCount}`);

    if (updatedCount > 0) {
      console.log('\n✅ Миграция завершена успешно');
      
      // Проверяем результат
      console.log('\nПроверяем результат...');
      const checkResponse = await fetch('http://localhost:5050/api/products');
      const checkData = await checkResponse.json();
      
      let correctPaths = 0;
      let totalImages = 0;
      
      checkData.products.forEach(product => {
        if (product.images) {
          product.images.forEach(imagePath => {
            totalImages++;
            if (imagePath.startsWith('/api/uploads/')) {
              correctPaths++;
            }
          });
        }
      });
      
      console.log(`Изображений с правильным путем: ${correctPaths}/${totalImages}`);
      
      if (correctPaths === totalImages) {
        console.log('✅ Все пути изображений теперь корректны');
      } else {
        console.log('⚠️ Некоторые пути все еще требуют исправления');
      }
    } else {
      console.log('\n✅ Все пути уже корректны, миграция не требуется');
    }

  } catch (error) {
    console.error('Ошибка при миграции:', error);
  }
}

migrateImagePaths();