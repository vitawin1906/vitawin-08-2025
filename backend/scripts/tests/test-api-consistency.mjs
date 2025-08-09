// Тест на согласованность данных между API админки и пользовательской частью

async function testAPIConsistency() {
  try {
    console.log('Проверка согласованности API данных...\n');

    // Получаем данные из пользовательского API
    const userResponse = await fetch('http://localhost:5000/api/products');
    const userData = await userResponse.json();
    
    // Получаем данные из административного API
    const adminResponse = await fetch('http://localhost:5000/api/admin/products');
    const adminData = await adminResponse.json();

    console.log('=== ПОЛЬЗОВАТЕЛЬСКИЙ API (/api/products) ===');
    console.log('Статус:', userResponse.status);
    console.log('Количество товаров:', userData.products?.length || 0);
    
    if (userData.products && userData.products.length > 0) {
      const firstProduct = userData.products[0];
      console.log('Структура первого товара:');
      console.log('- ID:', firstProduct.id);
      console.log('- Название:', firstProduct.name || firstProduct.title);
      console.log('- Цена:', firstProduct.price);
      console.log('- Изображения:', firstProduct.images?.length || 0, 'шт');
      console.log('- Первое изображение:', firstProduct.images?.[0]);
      console.log('- Описание:', firstProduct.description?.substring(0, 50) + '...');
    }

    console.log('\n=== АДМИНИСТРАТИВНЫЙ API (/api/admin/products) ===');
    console.log('Статус:', adminResponse.status);
    console.log('Количество товаров:', adminData.products?.length || 0);
    
    if (adminData.products && adminData.products.length > 0) {
      const firstProduct = adminData.products[0];
      console.log('Структура первого товара:');
      console.log('- ID:', firstProduct.id);
      console.log('- Название:', firstProduct.name || firstProduct.title);
      console.log('- Цена:', firstProduct.price);
      console.log('- Изображения:', firstProduct.images?.length || 0, 'шт');
      console.log('- Первое изображение:', firstProduct.images?.[0]);
      console.log('- Описание:', firstProduct.description?.substring(0, 50) + '...');
    }

    // Сравниваем количество товаров
    const userCount = userData.products?.length || 0;
    const adminCount = adminData.products?.length || 0;
    
    console.log('\n=== АНАЛИЗ СОГЛАСОВАННОСТИ ===');
    
    if (userCount === adminCount) {
      console.log('✅ Количество товаров совпадает:', userCount);
    } else {
      console.log('❌ Количество товаров НЕ совпадает:');
      console.log('   - Пользовательский API:', userCount);
      console.log('   - Административный API:', adminCount);
    }

    // Проверяем конкретный товар по ID
    if (userData.products && adminData.products && userData.products.length > 0) {
      const productId = userData.products[0].id;
      
      console.log(`\n=== ПРОВЕРКА ТОВАРА ID=${productId} ===`);
      
      // Проверяем через детальный API пользователя
      const userDetailResponse = await fetch(`http://localhost:5000/api/product/${productId}`);
      const userDetailData = await userDetailResponse.json();
      
      console.log('Детальная информация пользователя:');
      console.log('- Статус:', userDetailResponse.status);
      if (userDetailData.product) {
        console.log('- Название:', userDetailData.product.name || userDetailData.product.title);
        console.log('- Изображения:', userDetailData.product.images?.length || 0, 'шт');
        console.log('- Первое изображение:', userDetailData.product.images?.[0]);
      }

      // Находим тот же товар в административных данных
      const adminProduct = adminData.products.find(p => p.id === productId);
      if (adminProduct) {
        console.log('\nАдминистративные данные того же товара:');
        console.log('- Название:', adminProduct.name || adminProduct.title);
        console.log('- Изображения:', adminProduct.images?.length || 0, 'шт');
        console.log('- Первое изображение:', adminProduct.images?.[0]);
        
        // Сравниваем изображения
        const userImg = userDetailData.product?.images?.[0];
        const adminImg = adminProduct.images?.[0];
        
        if (userImg === adminImg) {
          console.log('✅ Изображения совпадают');
        } else {
          console.log('❌ Изображения НЕ совпадают:');
          console.log('   - Пользователь:', userImg);
          console.log('   - Админ:', adminImg);
        }
      }
    }

    console.log('\n=== ПРОВЕРКА ИЗОБРАЖЕНИЙ ===');
    
    // Проверяем доступность изображений
    if (userData.products && userData.products.length > 0) {
      const productWithImage = userData.products.find(p => p.images && p.images.length > 0);
      if (productWithImage && productWithImage.images[0]) {
        const imageUrl = productWithImage.images[0];
        console.log('Проверяем изображение:', imageUrl);
        
        const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;
        const imageResponse = await fetch(fullImageUrl);
        
        console.log('- Статус изображения:', imageResponse.status);
        console.log('- Content-Type:', imageResponse.headers.get('content-type'));
        console.log('- Размер:', imageResponse.headers.get('content-length'), 'байт');
        
        if (imageResponse.status === 200) {
          console.log('✅ Изображение доступно');
        } else {
          console.log('❌ Изображение недоступно');
        }
      }
    }

  } catch (error) {
    console.error('Ошибка при проверке API:', error);
  }
}

testAPIConsistency();