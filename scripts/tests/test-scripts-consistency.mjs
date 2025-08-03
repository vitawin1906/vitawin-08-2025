// Тест передачи скриптов из админки на фронтенд

async function testScriptsConsistency() {
  try {
    console.log('Проверка передачи скриптов из админки на фронтенд...\n');

    // Проверяем текущие скрипты через публичный API
    console.log('=== ПУБЛИЧНЫЙ API СКРИПТОВ (/api/site-scripts) ===');
    const publicResponse = await fetch('http://localhost:5050/api/site-scripts');
    const publicData = await publicResponse.json();
    
    console.log('Статус:', publicResponse.status);
    if (publicData.success) {
      console.log('Head скрипты длина:', publicData.head_scripts?.length || 0, 'символов');
      console.log('Body скрипты длина:', publicData.body_scripts?.length || 0, 'символов');
      
      if (publicData.head_scripts) {
        console.log('Head скрипты (первые 200 символов):');
        console.log(publicData.head_scripts.substring(0, 200) + '...');
      }
      
      if (publicData.body_scripts) {
        console.log('Body скрипты (первые 200 символов):');
        console.log(publicData.body_scripts.substring(0, 200) + '...');
      }
    } else {
      console.log('Ошибка:', publicData.error);
    }

    // Проверяем административный API (требует авторизации)
    console.log('\n=== АДМИНИСТРАТИВНЫЙ API СКРИПТОВ (/api/admin/site-settings) ===');
    
    try {
      const adminResponse = await fetch('http://localhost:5050/api/admin/site-settings');
      console.log('Статус административного API:', adminResponse.status);
      
      if (adminResponse.status === 401) {
        console.log('❌ Требуется авторизация для доступа к админ API');
      } else if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('✅ Административные настройки получены');
        console.log('Head скрипты длина:', adminData.scripts?.head_scripts?.length || 0, 'символов');
        console.log('Body скрипты длина:', adminData.scripts?.body_scripts?.length || 0, 'символов');
      }
    } catch (error) {
      console.log('Ошибка при обращении к админ API:', error.message);
    }

    // Проверяем данные в базе
    console.log('\n=== ДАННЫЕ В БАЗЕ ===');
    console.log('Проверяем настройки в базе данных...');

    // Симулируем проверку настроек через прямое подключение к БД
    const testHeadScript = `
<!-- Test Head Script -->
<meta name="test-tag" content="head-scripts-working">
<script>
  console.log('Head script loaded from admin');
</script>
    `.trim();

    const testBodyScript = `
<!-- Test Body Script -->
<script>
  console.log('Body script loaded from admin');
  window.adminScriptsLoaded = true;
</script>
    `.trim();

    console.log('Для полного теста можно добавить тестовые скрипты:');
    console.log('Head скрипт:', testHeadScript.substring(0, 100) + '...');
    console.log('Body скрипт:', testBodyScript.substring(0, 100) + '...');

    // Проверяем интеграцию с фронтендом
    console.log('\n=== ИНТЕГРАЦИЯ С ФРОНТЕНДОМ ===');
    
    console.log('Компонент CustomScripts должен загружать скрипты через /api/site-scripts');
    console.log('Проверяем, что скрипты правильно внедряются в HTML...');

    // Проверяем основную страницу
    try {
      const frontendResponse = await fetch('http://localhost:5050/');
      const htmlContent = await frontendResponse.text();
      
      console.log('Статус главной страницы:', frontendResponse.status);
      
      // Ищем скрипты в HTML
      const hasMetaTags = htmlContent.includes('<meta name=');
      const hasCustomScripts = htmlContent.includes('CustomScripts');
      const hasHeadScripts = htmlContent.includes('head_scripts');
      
      console.log('HTML содержит meta теги:', hasMetaTags ? '✅' : '❌');
      console.log('HTML содержит CustomScripts компонент:', hasCustomScripts ? '✅' : '❌');
      console.log('HTML упоминает head_scripts:', hasHeadScripts ? '✅' : '❌');
      
      // Проверяем размер HTML
      console.log('Размер HTML страницы:', htmlContent.length, 'символов');
      
    } catch (error) {
      console.log('Ошибка при получении HTML:', error.message);
    }

    console.log('\n=== РЕКОМЕНДАЦИИ ===');
    console.log('1. Скрипты должны сохраняться через /api/admin/site-settings');
    console.log('2. Публичный доступ к скриптам через /api/site-scripts');
    console.log('3. CustomScripts компонент должен загружать и внедрять скрипты');
    console.log('4. Скрипты должны появляться в HTML головы и тела страницы');

  } catch (error) {
    console.error('Ошибка при проверке скриптов:', error);
  }
}

testScriptsConsistency();