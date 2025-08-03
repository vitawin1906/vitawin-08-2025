import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from "cors";
import { authController } from "./controllers/authController";
import { productController } from "./controllers/productController";
import { cartController } from "./controllers/cartController";
import { orderController } from "./controllers/orderController";
import { referralController } from "./controllers/referralController";
import { blogController } from "./controllers/blogController";
import { adminController } from "./controllers/adminController";
import { uploadController } from "./controllers/uploadController";
import { imageController } from "./controllers/imageController";
import { aiControllerStub } from "./controllers/aiController";
import { aboutPageController } from "./controllers/aboutPageController";
import { 
  buildReferralNetwork, 
  calculateBonusesAPI, 
  getSystemHealthReport, 
  getErrorLogs 
} from "./controllers/advancedAIController";
import { getMlmLevels, getMlmLevel, getUserMlmStatus, getUserMlmDetails, recalculateUserLevel } from "./controllers/mlmController";
import { mlmNetworkController } from "./controllers/mlmNetworkController";
import { MLMNetworkTreeRealController } from "./controllers/mlmNetworkTreeReal";
import { userBonusPreferencesController } from "./controllers/userBonusPreferencesController";
import { telegramController } from "./controllers/telegramController";
import { supportBotController } from "./controllers/supportBotController";
import { deliveryController } from "./controllers/deliveryController";
import * as settingsController from "./controllers/settingsController";
import { paymentController } from "./controllers/paymentController";
import * as referralSettingsController from "./controllers/referralSettingsController";
import { authMiddleware, adminMiddleware, optionalAuthMiddleware, optionalAdminOrUserAuthMiddleware } from "./middleware/auth";
import { adminAuthMiddleware } from "./middleware/adminAuth";
import { getCaptcha, adminLogin, adminLogout, getAdminProfile, changePassword } from "./controllers/adminAuthController";
import { createRateLimit } from "./middleware/rateLimiter";
import { adminRateLimit, loginRateLimit } from "./middleware/security";
import { enhancedAdminProtection, sqlInjectionProtection, xssProtection } from "./middleware/adminProtection";
import { adminSecurityEnforcement, fileUploadSecurity } from "./middleware/securityEnforcement";
import { robotsMiddleware } from "./middleware/robotsMiddleware";
import { cacheService } from "./services/cacheService";
import { errorMonitoringService } from "./services/errorMonitoringService";
import { addSimpleImageRoute } from "./imageRoute";
import { performanceMonitor } from "./services/performanceMonitor";
import { optimizedReferralService } from "./services/optimizedReferralService";
import { memoryManager } from "./services/memoryManager";
import { storage, db } from "./storage";
import { uploadedImages } from '@shared/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import { imageService } from './services/imageService';

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS configuration
  app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
  }));

  // Add performance monitoring middleware
  app.use(performanceMonitor.createPerformanceMiddleware());
  
  // Add robots middleware for admin pages
  app.use(robotsMiddleware);

  // Serve static assets that are commonly referenced
  app.get('/placeholder.svg', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#f0f0f0"/>
      <text x="150" y="100" text-anchor="middle" fill="#999" font-family="Arial" font-size="14">Placeholder</text>
    </svg>`);
  });

  app.get('/vitawins.png', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
      <rect width="200" height="60" fill="#4f46e5"/>
      <text x="100" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="bold">VitaWin</text>
    </svg>`);
  });

  // Простой роут для прямого доступа к изображениям (без кодирования)
  app.get("/uploads/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      console.log(`[DIRECT IMG] Request for: ${filename}`);
      
      // Простая проверка расширения
      if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)) {
        return res.status(400).json({ error: 'Invalid file type' });
      }
      
      // Прямое чтение файла без декодирования
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      if (require('fs').existsSync(filePath)) {
        const buffer = await require('fs').promises.readFile(filePath);
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const mimeTypes: { [key: string]: string } = {
          'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
          'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
          'bmp': 'image/bmp', 'tiff': 'image/tiff'
        };
        
        res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Length', buffer.length);
        console.log(`[DIRECT IMG] Served: ${filename}, size: ${buffer.length} bytes`);
        return res.send(buffer);
      }
      
      console.log(`[DIRECT IMG] File not found: ${filename}`);
      return res.status(404).json({ error: 'Image not found' });
    } catch (error) {
      console.error(`[DIRECT IMG] Error serving ${req.params.filename}:`, error);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  // Health check endpoint for Docker
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // Увеличил до 10MB для больших изображений
      fieldSize: 10 * 1024 * 1024,
      files: 1
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Upload routes with security enforcement
  app.post("/api/upload/image", (req, res, next) => {
    // Увеличиваем timeout для загрузки файлов
    req.setTimeout(60000); // 60 секунд
    res.setTimeout(60000);
    next();
  }, upload.single('image'), fileUploadSecurity, uploadController.uploadImage);
  app.delete("/api/upload/image", adminAuthMiddleware, uploadController.deleteImage);

  // API endpoint для раздачи изображений из файловой системы (обходит проблему с Vite dev server)
  app.get('/api/uploads/:filename', async (req, res) => {
    try {
      let filename = req.params.filename;
      console.log(`[IMAGE] Raw filename from URL: ${filename}`);
      
      // Декодируем URL-кодированные символы
      try {
        filename = decodeURIComponent(filename);
        console.log(`[IMAGE] Decoded filename: ${filename}`);
      } catch (e) {
        console.log(`[IMAGE] Failed to decode filename: ${filename}`);
      }
      
      // Валидация имени файла
      if (!filename || !/^[a-zA-Z0-9._%-]+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(filename)) {
        console.log(`[IMAGE] Invalid filename format: ${filename}`);
        return res.status(400).json({ error: 'Invalid filename' });
      }
      
      // Используем новый imageService для получения изображения
      console.log(`[IMAGE] Requesting image: ${filename}`);
      let image = await imageService.getImage(filename);
      
      if (!image) {
        console.log(`[IMAGE] Fallback to direct file reading for: ${filename}`);
        // Прямое чтение из файловой системы
        const filePath = path.join(process.cwd(), 'uploads', filename);
        if (require('fs').existsSync(filePath)) {
          const buffer = await require('fs').promises.readFile(filePath);
          const ext = require('path').extname(filename).toLowerCase();
          const mimeTypes = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml'
          };
          const mimeType = mimeTypes[ext] || 'application/octet-stream';
          image = { buffer, mimeType };
          console.log(`[IMAGE] Direct read successful: ${filename}, size: ${buffer.length}`);
        }
      }
      
      if (!image) {
        console.log(`[IMAGE] Image not found: ${filename}`);
        return res.status(404).json({ error: 'Image not found' });
      }
      
      res.setHeader('Content-Type', image.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Кэш на 24 часа
      res.setHeader('Content-Length', image.buffer.length);
      
      // Отправляем изображение
      res.send(image.buffer);
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Image microservice routes - дополнительные маршруты для управления изображениями
  app.get("/api/uploads/file/:filename", imageController.getImage);
  app.get("/api/uploads/:filename", imageController.getImage); // Новый роут для поддержки /api/images/имя_файла.png
  app.delete("/api/uploads/file/:filename", imageController.deleteImage);
  app.get("/api/uploads", imageController.getAllImages);
  app.post("/api/uploads/migrate-images", imageController.migrateImages);
  
  // API endpoint для получения изображений по ID (для блога)
  app.get('/api/uploads/:id', async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      
      if (isNaN(imageId)) {
        return res.status(400).json({ error: 'Invalid image ID' });
      }
      
      // Ищем изображение в базе данных по ID
      const dbImage = await db.select().from(uploadedImages).where(eq(uploadedImages.id, imageId)).limit(1);
      
      if (dbImage.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Используем новый imageService для получения файла
      const image = await imageService.getImage(dbImage[0].filename);
      
      if (!image) {
        return res.status(404).json({ error: 'Image file not found' });
      }
      
      res.setHeader('Content-Type', image.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Кэш на 24 часа
      res.setHeader('Content-Length', image.buffer.length);
      
      // Отправляем изображение
      res.send(image.buffer);
    } catch (error) {
      console.error('Error serving image by ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Product-specific image routes - жесткая связь товар-изображение
  app.get("/api/products/:productId/images", imageController.getProductImages);
  app.get("/api/products/:productId/primary-image", imageController.getPrimaryProductImage);

  // Authentication routes
  app.post("/api/auth/telegram", authController.telegramAuth);
  app.post("/api/auth/telegram-bot-login", authController.telegramBotLogin.bind(authController));
  app.post("/api/auth/telegram-auto", authController.telegramAutoAuth);
  
  // TEST ONLY: Simplified token generation for API testing
  app.post("/api/auth/test-token", async (req, res) => {
    try {
      const { telegram_id } = req.body;
      
      if (!telegram_id) {
        return res.status(400).json({ error: "telegram_id required" });
      }
      
      // Find or create test user
      let user = await storage.getUserByTelegramId(telegram_id);
      
      if (!user) {
        user = await storage.createUser({
          telegram_id: telegram_id,
          first_name: "Test User",
          username: "test_user",
          referral_code: telegram_id.toString(),
          is_admin: false,
          last_login: new Date()
        });
      }
      
      // Generate JWT token without signature validation
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: user.id, telegramId: user.telegram_id },
        process.env.JWT_SECRET || "vitawin_jwt_secret_key_production_2025_secure",
        { expiresIn: '30d' }
      );
      
      res.json({
        success: true,
        token: token,
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          first_name: user.first_name,
          username: user.username,
          referral_code: user.referral_code
        }
      });
      
    } catch (error) {
      console.error('Test token generation error:', error);
      res.status(500).json({ error: "Failed to generate test token" });
    }
  });
  
  // app.get("/api/auth/check-telegram/:token", authController.checkTelegramAuth);
  app.get("/api/user/me", authMiddleware, authController.getCurrentUser);
  app.get("/api/user", authMiddleware, authController.getCurrentUser); // Alias for compatibility
  app.get("/api/auth/telegram-login/:token", authController.telegramAutoLogin);
  
  // Get user by Telegram ID without auth middleware
  app.get("/api/user/telegram/:telegram_id", async (req, res) => {
    try {
      const telegramId = parseInt(req.params.telegram_id);
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        success: true,
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          first_name: user.first_name,
          username: user.username,
          referral_code: user.referral_code,
          balance: user.balance,
          applied_referral_code: user.applied_referral_code,
          is_admin: user.is_admin
        }
      });
    } catch (error) {
      console.error("Get user by Telegram ID error:", error);
      res.status(500).json({ error: "Failed to get user data" });
    }
  });

  // Admin authentication routes with enhanced security
  app.get("/api/admin/captcha", adminRateLimit, getCaptcha);
  app.post("/api/admin/login", loginRateLimit, adminLogin);
  app.post("/api/admin/logout", adminAuthMiddleware, adminLogout);
  app.get("/api/admin/test", adminAuthMiddleware, adminSecurityEnforcement, enhancedAdminProtection, adminRateLimit, (req, res) => res.json({ test: "success" }));
  app.get("/api/admin/profile", adminAuthMiddleware, adminSecurityEnforcement, enhancedAdminProtection, adminRateLimit, getAdminProfile);
  app.post("/api/admin/change-password", adminAuthMiddleware, adminSecurityEnforcement, enhancedAdminProtection, adminRateLimit, xssProtection, changePassword);

  // Product routes with caching and rate limiting
  app.get("/api/products", createRateLimit(200, 60000), async (req, res, next) => {
    try {
      // Проверяем кэш
      const cached = cacheService.getProductList();
      if (cached) {
        return res.json(cached);
      }
      
      // Если нет в кэше, вызываем контроллер
      next();
    } catch (error) {
      errorMonitoringService.logError('error', 'Products cache middleware error', error as Error);
      next();
    }
  }, productController.getProducts);

  // Random products endpoint for homepage
  app.get("/api/products/random", createRateLimit(200, 60000), productController.getRandomProducts);
  
  // 301 редиректы для старых цифровых URL
  app.get("/product/7", (req, res) => {
    res.redirect(301, "/product/ezhovik-grebenchatiy");
  });
  
  app.get("/product/8", (req, res) => {
    res.redirect(301, "/404");
  });
  
  app.get("/product/9", (req, res) => {
    res.redirect(301, "/product/vitamin-d3");
  });
  
  app.get("/product/10", (req, res) => {
    res.redirect(301, "/product/omega-3");
  });
  
  app.get("/product/11", (req, res) => {
    res.redirect(301, "/product/ezhovik-grebenchatiy-extract");
  });
  
  app.get("/product/12", (req, res) => {
    res.redirect(301, "/404");
  });
  
  app.get("/product/13", (req, res) => {
    res.redirect(301, "/product/berberine");
  });

  // Удаляем указанные страницы
  app.get("/product/berberin", (req, res) => {
    res.redirect(301, "/404");
  });
  
  app.get("/product/test", (req, res) => {
    res.redirect(301, "/404");
  });

  // Обработка 404 страницы с правильным статусом
  app.get("/404", (req, res) => {
    res.status(404);
    // Пропускаем обработку к Vite для рендера React компонента
    res.locals.status = 404;
  });

  app.get("/api/product/:id", createRateLimit(300, 60000), async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id);
      const cached = cacheService.getProduct(productId);
      if (cached) {
        return res.json(cached);
      }
      
      next();
    } catch (error) {
      errorMonitoringService.logError('error', 'Product cache middleware error', error as Error);
      next();
    }
  }, productController.getProduct);
  
  app.get("/api/product/slug/:slug", createRateLimit(300, 60000), productController.getProductBySlug);

  // Cart routes (with optional auth)
  app.post("/api/cart", optionalAuthMiddleware, cartController.updateCart);
  app.get("/api/cart", optionalAuthMiddleware, cartController.getCart);
  app.delete("/api/cart/:id", optionalAuthMiddleware, cartController.removeItem);
  app.delete("/api/cart", optionalAuthMiddleware, cartController.clearCart);

  // Checkout and order routes (protected)
  app.post("/api/checkout", authMiddleware, orderController.checkout);
  app.get("/api/orders", authMiddleware, orderController.getUserOrders);
  app.post("/api/orders", authMiddleware, orderController.createOrder);
  app.post("/api/orders/create", authMiddleware, orderController.createOrder);
  
  // Get orders by Telegram ID without auth middleware
  app.get("/api/orders/telegram/:telegram_id", async (req, res) => {
    try {
      const telegramId = parseInt(req.params.telegram_id);
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const orders = await storage.getOrders(user.id);
      
      res.json({
        success: true,
        orders: orders.map((order: any) => ({
          id: order.id,
          items: order.items,
          total: order.total,
          status: order.status,
          created_at: order.created_at,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          delivery_type: order.delivery_type,
          delivery_service: order.delivery_service,
          delivery_address: order.delivery_address,
          delivery_city: order.delivery_city,
          delivery_cost: order.delivery_cost,
          tracking_number: order.tracking_number,
          estimated_delivery: order.estimated_delivery,
          customer_info: order.customer_info,
          discount_amount: order.discount_amount,
          final_total: order.final_total,
          referral_code_used: order.referral_code_used
        }))
      });
    } catch (error) {
      console.error("Get orders by Telegram ID error:", error);
      res.status(500).json({ error: "Failed to get user orders" });
    }
  });
  
  // Guest checkout (без авторизации)
  app.post("/api/orders/guest", orderController.createGuestOrder);

  // Referral routes (protected)
  app.get("/api/referral/stats", authMiddleware, referralController.getStats);
  app.post("/api/referral/apply", authMiddleware, referralController.applyReferralCode);
  app.get("/api/referral/history", authMiddleware, referralController.getReferralHistory);
  app.post("/api/validate-referral-code", authMiddleware, referralController.validateReferralCode);
  
  // MLM routes
  app.get("/api/mlm/levels", getMlmLevels);
  app.get("/api/mlm/level/:level", getMlmLevel);
  app.get("/api/mlm/user/status", authMiddleware, getUserMlmStatus);
  app.get("/api/mlm/user/details", authMiddleware, getUserMlmDetails);
  app.post("/api/mlm/user/:userId/recalculate", adminMiddleware, recalculateUserLevel);

  // MLM Network Statistics routes
  app.get("/api/mlm/network/stats", authMiddleware, mlmNetworkController.getUserNetworkStats.bind(mlmNetworkController));
  app.get("/api/mlm/network/tree", authMiddleware, mlmNetworkController.getUserNetworkTree.bind(mlmNetworkController));
  
  // Admin MLM Network routes
  app.get("/api/admin/mlm/network/users", adminAuthMiddleware, mlmNetworkController.getAllUsersNetworkStats.bind(mlmNetworkController));
  app.get("/api/admin/mlm/network/user/:userId", adminAuthMiddleware, mlmNetworkController.getSpecificUserNetworkStats.bind(mlmNetworkController));
  app.post("/api/admin/mlm/network/recalculate", adminAuthMiddleware, mlmNetworkController.recalculateAllNetworkStats.bind(mlmNetworkController));
  
  // MLM Network Tree visualization - унифицированный контроллер для всех
  const mlmTreeRealController = new MLMNetworkTreeRealController();
  app.get("/api/admin/mlm/network/tree/:userId", adminAuthMiddleware, mlmTreeRealController.getNetworkTree.bind(mlmTreeRealController));
  app.get("/api/mlm/network/my-tree", authMiddleware, mlmTreeRealController.getUserNetworkTree.bind(mlmTreeRealController));
  
  // Оставляем старый эндпоинт для совместимости
  app.get("/api/admin/mlm/network/tree-real/:userId", adminAuthMiddleware, mlmTreeRealController.getNetworkTree.bind(mlmTreeRealController));

  // User Bonus Preferences routes
  app.get("/api/user/bonus-preferences", authMiddleware, userBonusPreferencesController.getUserPreferences.bind(userBonusPreferencesController));
  app.put("/api/user/bonus-preferences", authMiddleware, userBonusPreferencesController.updateUserPreferences.bind(userBonusPreferencesController));
  
  // Admin Bonus Preferences routes
  app.get("/api/admin/bonus-preferences", adminAuthMiddleware, userBonusPreferencesController.getAllUsersPreferences.bind(userBonusPreferencesController));
  app.put("/api/admin/bonus-preferences/:userId/lock", adminAuthMiddleware, userBonusPreferencesController.lockUserPreferences.bind(userBonusPreferencesController));
  
  // Network Volume routes
  app.get("/api/referral/network-volume", authMiddleware, async (req, res) => {
    try {
      const { getNetworkVolume } = await import("./controllers/networkVolumeController.js");
      return getNetworkVolume(req, res);
    } catch (error) {
      console.error('Error loading network volume controller:', error);
      res.status(500).json({ error: 'Ошибка загрузки контроллера' });
    }
  });
  
  // Get referral stats by Telegram ID without auth middleware
  app.get("/api/referral/stats/telegram/:telegram_id", async (req, res) => {
    try {
      const telegramId = parseInt(req.params.telegram_id);
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const stats = await storage.getReferralStats(user.id);
      
      res.json({
        success: true,
        referral_code: stats.referral_code,
        total_referrals: stats.total_referrals,
        total_earnings: stats.total_earnings,
        pending_rewards: stats.pending_rewards,
        recent_referrals: stats.recent_referrals
      });
    } catch (error) {
      console.error("Get referral stats by Telegram ID error:", error);
      res.status(500).json({ error: "Failed to get referral statistics" });
    }
  });
  
  // Get referral history by Telegram ID without auth middleware
  app.get("/api/referral/history/telegram/:telegram_id", async (req, res) => {
    try {
      const telegramId = parseInt(req.params.telegram_id);
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const referrals = await storage.getReferralsByUser(user.id);
      
      const referralHistory = await Promise.all(
        referrals.map(async (referral) => {
          const referredUser = await storage.getUser(referral.user_id);
          const order = referral.order_id ? await storage.getOrder(referral.order_id) : null;

          return {
            id: referral.id,
            referred_user: referredUser ? {
              first_name: referredUser.first_name,
              username: referredUser.username,
            } : null,
            reward_earned: referral.reward_earned,
            order_total: order ? order.total : null,
            created_at: referral.created_at,
          };
        })
      );

      res.json({
        success: true,
        referral_history: referralHistory,
        summary: {
          total_referrals: referrals.length,
          total_rewards: referrals.reduce((sum, r) => sum + parseFloat(r.reward_earned || '0'), 0).toFixed(2),
        },
      });
    } catch (error) {
      console.error("Get referral history by Telegram ID error:", error);
      res.status(500).json({ error: "Failed to get referral history" });
    }
  });

  // Withdrawal requests routes (protected)
  app.post("/api/withdrawal/request", authMiddleware, async (req, res) => {
    try {
      const { amount, full_name, inn, bik, account_number } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Пользователь не авторизован" });
      }

      // Проверяем минимальную сумму вывода
      if (parseFloat(amount) < 3500) {
        return res.status(400).json({ error: "Минимальная сумма для вывода: 3500 рублей" });
      }

      // Получаем баланс пользователя
      const referralStats = await storage.getReferralStats(userId);
      const currentBalance = parseFloat(referralStats.total_earnings || "0");

      if (currentBalance < parseFloat(amount)) {
        return res.status(400).json({ error: "Недостаточно средств на балансе" });
      }

      const withdrawalRequest = await storage.createWithdrawalRequest({
        user_id: userId,
        amount,
        full_name,
        inn,
        bik,
        account_number,
        status: 'pending'
      });

      res.json({ success: true, request: withdrawalRequest });
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ error: "Ошибка при создании заявки на вывод" });
    }
  });

  app.get("/api/withdrawal/requests", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Пользователь не авторизован" });
      }

      const requests = await storage.getWithdrawalRequests(userId);
      res.json({ success: true, requests });
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ error: "Ошибка при получении заявок на вывод" });
    }
  });

  // Blog routes
  app.get("/api/blog", optionalAdminOrUserAuthMiddleware, blogController.getBlogPosts);
  app.get("/api/blog/:id", blogController.getBlogPost);
  app.post("/api/blog", adminAuthMiddleware, blogController.createBlogPost);
  app.put("/api/blog/:id", adminAuthMiddleware, blogController.updateBlogPost);
  app.delete("/api/blog/:id", adminAuthMiddleware, blogController.deleteBlogPost);
  app.post("/api/admin/upload-image", adminAuthMiddleware, upload.single('image'), imageController.uploadImage);

  // About page content management routes
  app.get("/api/about-content", aboutPageController.getAboutPageContent);
  app.put("/api/about-content", adminAuthMiddleware, aboutPageController.updateAboutPageContent);
  app.post("/api/about-content/upload-image", adminAuthMiddleware, upload.single('image'), aboutPageController.uploadSectionImage);
  app.delete("/api/about-content/remove-image/:field", adminAuthMiddleware, aboutPageController.removeSectionImage);

  // Admin routes (protected with email/password auth)
  app.get("/api/admin/products", adminAuthMiddleware, adminSecurityEnforcement, enhancedAdminProtection, adminRateLimit, adminController.getProducts);
  app.post("/api/admin/products", adminAuthMiddleware, adminSecurityEnforcement, enhancedAdminProtection, adminRateLimit, xssProtection, adminController.createProduct);
  app.put("/api/admin/products/:id", adminAuthMiddleware, adminSecurityEnforcement, enhancedAdminProtection, adminRateLimit, xssProtection, adminController.updateProduct);
  app.delete("/api/admin/products/:id", adminAuthMiddleware, adminRateLimit, adminController.deleteProduct);


  // Admin order management
  app.get("/api/admin/orders", adminAuthMiddleware, adminSecurityEnforcement, enhancedAdminProtection, adminRateLimit, adminController.getOrders);
  app.put("/api/admin/orders/:id/status", adminAuthMiddleware, adminSecurityEnforcement, enhancedAdminProtection, adminRateLimit, xssProtection, adminController.updateOrderStatus);


  // Admin user management (protected)
  app.get("/api/admin/users", adminAuthMiddleware, adminController.getUsers);
  app.get("/api/admin/stats", adminAuthMiddleware, adminController.getStats);

  // Admin session monitoring (protected)
  app.get("/api/admin/sessions/active", adminAuthMiddleware, async (req, res) => {
    try {
      const sessions = await storage.getActiveAdminSessions();
      res.json({ success: true, sessions });
    } catch (error) {
      console.error("Error fetching active admin sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Payment processing webhook (for automatic referral bonus processing)
  app.post("/api/orders/:id/payment-confirmed", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // Update payment status to paid
      await storage.updateOrderStatus(orderId, "paid");
      
      // Process referral bonuses for paid orders only
      const { paymentProcessor } = await import('./services/paymentProcessor');
      await paymentProcessor.processPaymentConfirmation(orderId);
      
      res.json({ success: true, message: "Payment confirmed and bonuses processed" });
    } catch (error) {
      console.error('Payment confirmation error:', error);
      res.status(500).json({ error: "Failed to process payment confirmation" });
    }
  });

  // Referral transaction management endpoints
  app.get("/api/admin/referral-transactions", adminAuthMiddleware, async (req, res) => {
    try {
      const { referralTransactionService } = await import('./services/referralTransactionService');
      const stats = await referralTransactionService.getTransactionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transaction stats" });
    }
  });

  app.post("/api/admin/referral-transactions/recover", adminAuthMiddleware, async (req, res) => {
    try {
      const { orderId } = req.body;
      const { referralTransactionService } = await import('./services/referralTransactionService');
      await referralTransactionService.recoverFailedTransactions(orderId);
      res.json({ success: true, message: "Recovery process initiated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to recover transactions" });
    }
  });

  // Referral settings API endpoints
  app.get("/api/referral-settings", referralSettingsController.getReferralSettings);
  app.put("/api/admin/referral-settings", adminAuthMiddleware, referralSettingsController.updateReferralSettings);

  // Company commitments API endpoints
  app.get("/api/company-commitments", async (req, res) => {
    try {
      const commitments = await storage.getCompanyCommitments();
      res.json({ success: true, commitments });
    } catch (error) {
      console.error("Error getting company commitments:", error);
      res.status(500).json({ error: "Ошибка при получении настроек компании" });
    }
  });

  app.put("/api/admin/company-commitments", adminAuthMiddleware, async (req, res) => {
    try {
      const { title, subtitle, description1, description2, promise_title, promise_text, guarantee_button_text } = req.body;

      // Базовая валидация
      if (!title || !subtitle || !description1 || !description2 || !promise_title || !promise_text || !guarantee_button_text) {
        return res.status(400).json({ error: "Все поля обязательны для заполнения" });
      }

      const commitments = await storage.updateCompanyCommitments({
        title,
        subtitle,
        description1,
        description2,
        promise_title,
        promise_text,
        guarantee_button_text
      });

      res.json({ 
        success: true, 
        commitments,
        message: "Настройки компании успешно обновлены"
      });
    } catch (error) {
      console.error("Error updating company commitments:", error);
      res.status(500).json({ error: "Ошибка при обновлении настроек компании" });
    }
  });

  app.get("/api/admin/activity-log", adminAuthMiddleware, async (req, res) => {
    try {
      const { adminId, sessionId, action, limit, offset } = req.query;
      const result = await storage.getAdminActivityLog({
        adminId: adminId ? parseInt(adminId as string) : undefined,
        sessionId: sessionId ? parseInt(sessionId as string) : undefined,
        action: action as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      });
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Error fetching admin activity log:", error);
      res.status(500).json({ error: "Failed to fetch activity log" });
    }
  });

  app.get("/api/admin/realtime-stats", adminAuthMiddleware, async (req, res) => {
    try {
      const stats = await storage.getRealtimeAdminStats();
      res.json({ success: true, stats });
    } catch (error) {
      console.error("Error fetching realtime admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.post("/api/admin/cleanup-sessions", adminAuthMiddleware, async (req, res) => {
    try {
      await storage.cleanupInactiveSessions();
      res.json({ success: true, message: "Inactive sessions cleaned up" });
    } catch (error) {
      console.error("Error cleaning up sessions:", error);
      res.status(500).json({ error: "Failed to cleanup sessions" });
    }
  });

  // Admin user management (protected)
  app.get("/api/admin/users", adminAuthMiddleware, adminController.getUsers);
  app.get("/api/admin/stats", adminAuthMiddleware, adminController.getStats);

  // Payment settings routes (protected)
  app.get("/api/admin/payment-settings", adminAuthMiddleware, paymentController.getPaymentSettings);
  app.post("/api/admin/payment-settings", adminAuthMiddleware, paymentController.createPaymentSettings);
  app.put("/api/admin/payment-settings/:id", adminAuthMiddleware, paymentController.updatePaymentSettings);
  app.delete("/api/admin/payment-settings/:id", adminAuthMiddleware, paymentController.deletePaymentSettings);
  app.post("/api/admin/payment-settings/test-tinkoff", adminAuthMiddleware, paymentController.testTinkoffConnection);

  // Public payment routes
  app.post("/api/payment/create", paymentController.createPayment);
  app.post("/api/payment/tinkoff/notification", paymentController.handleTinkoffNotification);
  app.get("/api/payment/status/:paymentId", paymentController.getPaymentStatus);

  // Settings routes (protected)
  app.get("/api/admin/delivery-settings", adminAuthMiddleware, settingsController.getDeliverySettings);
  app.post("/api/admin/delivery-settings", adminAuthMiddleware, settingsController.saveDeliverySettings);
  app.get("/api/admin/site-settings", adminAuthMiddleware, settingsController.getSiteSettings);
  app.post("/api/admin/site-settings", adminAuthMiddleware, settingsController.saveSiteSettings);
  app.get("/api/admin/all-settings", adminAuthMiddleware, settingsController.getAllSettings);
  
  // Referral settings routes with security
  app.get("/api/admin/referral-settings", adminAuthMiddleware, adminSecurityEnforcement, enhancedAdminProtection, adminRateLimit, async (req, res) => {
    try {
      const settings = await storage.getReferralSettings();
      res.json({ success: true, settings });
    } catch (error) {
      console.error("Error getting referral settings:", error);
      res.status(500).json({ error: "Ошибка при получении настроек реферальной программы" });
    }
  });

  app.post("/api/admin/referral-settings", adminAuthMiddleware, adminSecurityEnforcement, enhancedAdminProtection, adminRateLimit, xssProtection, sqlInjectionProtection, async (req, res) => {
    try {
      const { level1_commission, level2_commission, level3_commission, bonus_coins_percentage } = req.body;

      // Валидация
      if (
        level1_commission < 0 || level1_commission > 100 ||
        level2_commission < 0 || level2_commission > 100 ||
        level3_commission < 0 || level3_commission > 100 ||
        bonus_coins_percentage < 0 || bonus_coins_percentage > 100
      ) {
        return res.status(400).json({ error: "Все значения должны быть от 0 до 100%" });
      }

      if (level1_commission + level2_commission + level3_commission > 50) {
        return res.status(400).json({ error: "Общая сумма комиссий не должна превышать 50%" });
      }

      const settings = await storage.updateReferralSettings({
        level1_commission: level1_commission.toString(),
        level2_commission: level2_commission.toString(), 
        level3_commission: level3_commission.toString(),
        bonus_coins_percentage: bonus_coins_percentage.toString()
      });

      res.json({ 
        success: true, 
        settings,
        message: "Настройки реферальной программы успешно сохранены" 
      });
    } catch (error) {
      console.error("Error updating referral settings:", error);
      res.status(500).json({ error: "Ошибка при сохранении настроек реферальной программы" });
    }
  });
  

  
  // Public route for scripts (for frontend to load custom scripts)
  app.get("/api/site-scripts", settingsController.getPublicScripts);

  // AI routes (protected)
  app.post("/api/ai/enhance-product", authMiddleware, adminMiddleware, aiControllerStub);
  app.post("/api/ai/generate-seo", authMiddleware, adminMiddleware, aiControllerStub);
  app.post("/api/ai/enhance-field", authMiddleware, adminMiddleware, aiControllerStub);
  app.post("/api/ai/create-product", authMiddleware, adminMiddleware, aiControllerStub);
  app.post("/api/ai/generate-full-article", authMiddleware, adminMiddleware, aiControllerStub);

  // AI Agent routes (интеллектуальный мониторинг системы)
  app.get("/api/ai-agent/network", authMiddleware, adminMiddleware, buildReferralNetwork);
  app.post("/api/ai-agent/calculate-bonuses", authMiddleware, adminMiddleware, calculateBonusesAPI);
  app.get("/api/ai-agent/errors", authMiddleware, adminMiddleware, getErrorLogs);
  app.get("/api/ai-agent/health", authMiddleware, adminMiddleware, getSystemHealthReport);
  


  // Delivery routes
  app.get("/api/delivery/options", deliveryController.getDeliveryOptions);
  app.get("/api/delivery/pickup-points", deliveryController.getPickupPoints);
  app.post("/api/delivery/calculate", deliveryController.calculateDelivery);
  app.post("/api/delivery/create-order", deliveryController.createDeliveryOrder);
  app.get("/api/delivery/cities", deliveryController.getCities);

  // Telegram Bot routes
  app.post("/api/telegram/webhook", telegramController.webhook);
  app.post("/api/telegram/set-webhook", telegramController.setWebhook);
  app.delete("/api/telegram/webhook", telegramController.deleteWebhook);
  app.get("/api/telegram/webhook-info", telegramController.getWebhookInfo);
  app.post("/api/telegram/setup-bot", telegramController.setupBot);
  app.get("/api/telegram/start-polling", telegramController.startPolling);
  app.post("/api/telegram/auth", telegramController.telegramAuth);

  // Support Bot routes
  app.post("/api/telegram/support/webhook", supportBotController.webhook);
  app.post("/api/telegram/support/set-webhook", supportBotController.setWebhook);
  app.delete("/api/telegram/support/webhook", supportBotController.deleteWebhook);
  app.get("/api/telegram/support/webhook-info", supportBotController.getWebhookInfo);
  
  // Простой тест webhook
  app.post("/api/telegram/test-webhook", (req, res) => {
    console.log('Test webhook received:', req.body);
    res.status(200).json({ ok: true, message: "Test webhook works" });
  });
  
  // Debug endpoint for Telegram tokens
  app.get("/api/telegram/debug", (req, res) => {
    res.json({
      main_bot: {
        token_exists: !!process.env.TELEGRAM_BOT_TOKEN,
        token_length: process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.length : 0,
        token_starts_with: process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.substring(0, 10) + "..." : "не найден"
      },
      support_bot: {
        token_exists: !!process.env.TELEGRAM_SUPPORT_BOT_TOKEN,
        token_length: process.env.TELEGRAM_SUPPORT_BOT_TOKEN ? process.env.TELEGRAM_SUPPORT_BOT_TOKEN.length : 0,
        token_starts_with: process.env.TELEGRAM_SUPPORT_BOT_TOKEN ? process.env.TELEGRAM_SUPPORT_BOT_TOKEN.substring(0, 10) + "..." : "не найден"
      }
    });
  });

  // Performance monitoring endpoints
  app.get("/api/admin/performance/metrics", adminAuthMiddleware, (req, res) => {
    try {
      const metrics = performanceMonitor.getMetrics(100);
      res.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      errorMonitoringService.logError('error', 'Performance metrics error', error as Error);
      res.status(500).json({ error: 'Failed to get performance metrics' });
    }
  });

  app.get("/api/admin/performance/system-health", adminAuthMiddleware, async (req, res) => {
    try {
      const health = await performanceMonitor.getSystemHealth();
      res.json({
        success: true,
        health,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      errorMonitoringService.logError('error', 'System health error', error as Error);
      res.status(500).json({ error: 'Failed to get system health' });
    }
  });

  app.get("/api/admin/monitoring/cache-stats", adminAuthMiddleware, (req, res) => {
    try {
      const stats = cacheService.getStats();
      res.json({
        success: true,
        cache: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      errorMonitoringService.logError('error', 'Cache stats error', error as Error);
      res.status(500).json({ error: 'Failed to get cache statistics' });
    }
  });

  app.get("/api/admin/monitoring/errors", adminAuthMiddleware, (req, res) => {
    try {
      const { level, limit } = req.query;
      const errors = errorMonitoringService.getErrors(
        limit ? parseInt(limit as string) : 50,
        level as any
      );
      const stats = errorMonitoringService.getErrorStats();
      
      res.json({
        success: true,
        errors,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error monitoring endpoint error:', error);
      res.status(500).json({ error: 'Failed to get error statistics' });
    }
  });

  app.post("/api/admin/monitoring/clear-cache", adminAuthMiddleware, (req, res) => {
    try {
      cacheService.clear();
      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      errorMonitoringService.logError('error', 'Clear cache error', error as Error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // Optimized referral network endpoints
  app.get("/api/admin/referral/network-optimized", adminAuthMiddleware, async (req, res) => {
    try {
      const network = await optimizedReferralService.getReferralNetworkOptimized();
      res.json({
        success: true,
        network,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      errorMonitoringService.logError('error', 'Optimized referral network error', error as Error);
      res.status(500).json({ error: 'Failed to get optimized referral network' });
    }
  });

  app.get("/api/admin/referral/integrity-check", adminAuthMiddleware, async (req, res) => {
    try {
      const result = await optimizedReferralService.validateReferralIntegrityBatch();
      res.json({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      errorMonitoringService.logError('error', 'Referral integrity check error', error as Error);
      res.status(500).json({ error: 'Failed to check referral integrity' });
    }
  });

  // Memory management endpoints
  app.get("/api/admin/memory/stats", adminAuthMiddleware, (req, res) => {
    try {
      const stats = memoryManager.getMemoryStats();
      const recommendations = memoryManager.getOptimizationRecommendations();
      res.json({
        success: true,
        memory: stats,
        recommendations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      errorMonitoringService.logError('error', 'Memory stats error', error as Error);
      res.status(500).json({ error: 'Failed to get memory statistics' });
    }
  });

  app.post("/api/admin/memory/gc", adminAuthMiddleware, (req, res) => {
    try {
      const success = memoryManager.forceGarbageCollection();
      const stats = memoryManager.getMemoryStats();
      res.json({
        success: true,
        garbageCollectionForced: success,
        memoryAfterGC: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      errorMonitoringService.logError('error', 'Force GC error', error as Error);
      res.status(500).json({ error: 'Failed to force garbage collection' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
