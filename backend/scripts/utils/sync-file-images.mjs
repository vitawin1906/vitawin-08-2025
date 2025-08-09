#!/usr/bin/env node

import { ImageService } from './server/services/imageService.js';

async function syncImages() {
  try {
    console.log('🔄 Синхронизация изображений с файловой системой...');
    
    const imageService = new ImageService();
    const result = await imageService.syncWithFileSystem();
    
    console.log('✅ Синхронизация завершена:');
    console.log(`📂 Синхронизировано файлов: ${result.synced}`);
    
    if (result.errors.length > 0) {
      console.log('⚠️ Предупреждения и ошибки:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n🎯 Файловая архитектура активна!');
    console.log('   - Изображения хранятся в uploads/images/');
    console.log('   - Метаданные в базе данных');
    console.log('   - API работает с файлами, а не Base64');
    
  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error);
    process.exit(1);
  }
}

syncImages();