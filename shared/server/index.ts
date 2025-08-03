import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import { securityHeaders, sanitizeInput } from "./middleware/security";
import { databaseQueryProtection } from "./middleware/securityEnforcement";

// Токен Telegram бота загружается из переменных окружения

const app = express();

// Security hardening - comprehensive protection
// app.use(productionSecurityEnforcement);
// app.use(securityHeaders);
app.use(sanitizeInput);
app.use(databaseQueryProtection);

// Включаем gzip сжатие для улучшения производительности
app.use(compression({
  threshold: 1024, // Сжимать файлы больше 1KB
  level: 6, // Средний уровень сжатия для баланса скорости и размера
  filter: (req, res) => {
    // Не сжимаем изображения и видео
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Оптимизация заголовков для кэширования
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    // API ответы кэшируются на короткое время
    res.setHeader('Cache-Control', 'public, max-age=60');
  } else if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    // Статические ресурсы кэшируются надолго
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});

// КРИТИЧЕСКИ ВАЖНО: middleware для статических файлов должен быть ПЕРВЫМ
// до всех других middleware, включая express.json() и Vite
// В production раздаем собранные Vite файлы напрямую через Express
if (process.env.NODE_ENV === 'production') {
  // Раздаем все статические файлы из dist/public
  app.use(express.static('dist/public', {
    maxAge: '1y',
    etag: true,
    lastModified: true
  }));
}

app.use('/uploads', express.static('uploads', {
  maxAge: '1y', // Кэш изображений на год
  etag: true,
  lastModified: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Оптимизированное логирование только для ошибок и медленных запросов
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Логируем только ошибки и медленные запросы (>1000ms)
      if (res.statusCode >= 400 || duration > 1000) {
        log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
      }
    }
  });

  next();
});

(async () => {
  // Файлы подтверждения для поисковых систем (должны быть выше Vite)
  app.get("/googlef83aa8e382644bb1.html", (req, res) => {
    res.type('text/plain');
    res.send('google-site-verification: googlef83aa8e382644bb1.html');
  });

  app.get("/yandex_86c923468bce03a6.html", (req, res) => {
    res.type('text/html');
    res.send(`<html>
      <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      </head>
      <body>Verification: 86c923468bce03a6</body>
  </html>`);
  });



  // Register API routes first, before Vite middleware
  const server = await registerRoutes(app);

  // Setup Vite in development - this includes catch-all middleware
  // that must come AFTER all API routes are registered
  if (app.get("env") === "development") {
    const { setupVite } = await import("./viteDev");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on port 5050
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5050;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
