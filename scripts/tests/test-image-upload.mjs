import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImageUpload() {
  const imagePath = path.join(__dirname, 'client/public/uploads/berberin-product.png');
  
  if (!fs.existsSync(imagePath)) {
    console.log('Файл изображения не найден');
    return;
  }
  
  const imageBuffer = fs.readFileSync(imagePath);
  
  // Создаем FormData для загрузки
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('image', blob, 'berberin-product.png');
  
  try {
    const response = await fetch('http://localhost:5050/api/upload/image', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Результат загрузки:', result);
    
    if (response.ok) {
      // Проверяем, что изображение доступно через API
      const imageResponse = await fetch(`http://localhost:5050${result.url}`);
      console.log('Проверка загруженного изображения:', imageResponse.status);
    }
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
}

testImageUpload();