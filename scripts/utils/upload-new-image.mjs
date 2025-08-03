import fs from 'fs';

async function uploadNewImage() {
  const imageBuffer = fs.readFileSync('./test-berberine.png');
  
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('image', blob, 'berberine-vitawin.png');
  
  try {
    const response = await fetch('http://localhost:5050/api/upload/image', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Результат загрузки:', result);
    
    if (response.ok) {
      console.log('Изображение успешно загружено:', result.url);
      return result.url;
    }
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
}

uploadNewImage();