import https from 'https';

const REPLIT_DOMAIN = process.env.REPLIT_DOMAINS || '15b86ffd-8123-4786-9a33-4c6dce6c1a67-00-11b7k921y9q0c.picard.replit.dev';
const BOT_TOKEN = '7610585258:AAGTeZHRbpgjFcgXqcpBhE7yh0mKuwj0owA';

const webhookUrl = `https://${REPLIT_DOMAIN}/api/telegram/webhook`;

console.log('Настраиваем webhook для:', webhookUrl);

const postData = JSON.stringify({
  url: webhookUrl,
  allowed_updates: ['message', 'callback_query']
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${BOT_TOKEN}/setWebhook`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Ответ от Telegram:', data);
    const response = JSON.parse(data);
    if (response.ok) {
      console.log('✅ Webhook успешно настроен!');
    } else {
      console.log('❌ Ошибка при настройке webhook:', response.description);
    }
  });
});

req.on('error', (e) => {
  console.error('Ошибка запроса:', e.message);
});

req.write(postData);
req.end();