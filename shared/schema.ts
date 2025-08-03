import { pgTable, text, varchar, serial, integer, boolean, decimal, timestamp, jsonb, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users table for email/password authentication
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(), // Stores plain text passwords (not hashed)
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_login: timestamp("last_login"),
});

// Users table for Telegram authentication
export const users: any = pgTable("users", {
  id: serial("id").primaryKey(),
  telegram_id: bigint("telegram_id", { mode: "number" }).notNull().unique(),
  first_name: text("first_name").notNull(),
  username: text("username"),
  referral_code: text("referral_code").notNull().unique(),
  referrer_id: integer("referrer_id"),
  applied_referral_code: text("applied_referral_code"), // Примененный реферальный код (навсегда)
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  bonus_coins: decimal("bonus_coins", { precision: 10, scale: 2 }).default("0.00"), // Бонусные монеты за покупки (VitaWin Coins)
  referral_rewards: decimal("referral_rewards", { precision: 10, scale: 2 }).default("0.00"), // Реферальные награды
  total_pv: integer("total_pv").default(0), // Общее количество накопленных PV
  is_admin: boolean("is_admin").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_login: timestamp("last_login"), // Время последнего входа
});

// Добавляем foreign key отдельно чтобы избежать циклической зависимости
export const usersRelations: any = () => ({
  referrer: users.referrer_id?.references(() => users.id)
});

// User Bonus Preferences - настройки распределения бонусов "Свобода выбора"
export const userBonusPreferences = pgTable("user_bonus_preferences", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  health_id_percentage: integer("health_id_percentage").default(0), // Процент для Health ID (0-100)
  travel_percentage: integer("travel_percentage").default(0), // Процент для "Мои путешествия" (0-100)
  home_percentage: integer("home_percentage").default(0), // Процент для "Мой дом" (0-100)
  auto_percentage: integer("auto_percentage").default(0), // Процент для "Авто" (0-100)
  is_locked: boolean("is_locked").default(false), // Заблокированы ли настройки от изменения
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// MLM Levels table - 16-уровневая матрица
export const mlmLevels = pgTable("mlm_levels", {
  id: serial("id").primaryKey(),
  level: integer("level").notNull().unique(), // 1-16
  name: text("name").notNull(),
  description: text("description"),
  percentage: decimal("percentage", { precision: 5, scale: 3 }).notNull(), // Процент бонуса
  required_referrals: integer("required_referrals").default(0), // Требуемое количество рефералов
  required_personal_volume: integer("required_personal_volume").default(0), // Требуемый личный объём (LO) в PV
  required_group_volume: integer("required_group_volume").default(0), // Требуемый групповой объём (GO) в PV
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// User MLM Status - текущий уровень пользователя
export const userMlmStatus = pgTable("user_mlm_status", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  current_level: integer("current_level").default(1).notNull(),
  total_referrals: integer("total_referrals").default(0),
  total_earnings: decimal("total_earnings", { precision: 12, scale: 2 }).default("0.00"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  long_description: text("long_description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  original_price: decimal("original_price", { precision: 10, scale: 2 }),
  category: text("category"),
  badge: text("badge"),
  image: text("image"),
  images: text("images").array(), // Массив изображений для товара
  stock: integer("stock").notNull().default(0),
  status: text("status").notNull().default("active"), // active, inactive
  sku: text("sku"),
  slug: text("slug").unique(), // Уникальный URL слаг для товара
  benefits: text("benefits").array(), // Массив преимуществ
  key_benefits: text("key_benefits"), // Ключевые преимущества (каждое с новой строки)
  quality_guarantee: text("quality_guarantee"), // Гарантия качества
  composition: text("composition"), // Состав товара
  composition_table: jsonb("composition_table"), // Состав в виде таблицы [{component: "Витамин D3", amount: "5000 МЕ"}]
  nutrition_facts: text("nutrition_facts"), // Дополнительная информация о составе
  capsule_count: integer("capsule_count"),
  capsule_volume: text("capsule_volume"),
  servings_per_container: integer("servings_per_container"),
  manufacturer: text("manufacturer"),
  country_of_origin: text("country_of_origin"),
  expiration_date: text("expiration_date"),
  storage_conditions: text("storage_conditions"),
  how_to_take: text("how_to_take").default("morning"),
  usage: text("usage"),
  benefits_text: text("benefits_text"), // Поле "Польза" для характеристик
  additional_info: text("additional_info"),
  // Manual PV and cashback settings
  custom_pv: integer("custom_pv"), // Ручное значение PV (если null - автоматический расчет)
  custom_cashback: decimal("custom_cashback", { precision: 10, scale: 2 }), // Ручное значение кешбэка (если null - автоматический расчет)
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id), // Nullable для гостевых заказов
  items: jsonb("items").notNull(), // Array of {product_id, quantity, price}
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  discount_amount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"), // Сумма скидки
  final_total: decimal("final_total", { precision: 10, scale: 2 }).notNull(), // Итоговая сумма после скидки
  pv_earned: integer("pv_earned").default(0), // Начисленные PV за заказ
  cashback_earned: decimal("cashback_earned", { precision: 10, scale: 2 }).default("0.00"), // Начисленный кешбэк
  status: text("status").notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  payment_method: text("payment_method").notNull().default("cash"), // cash, balance, card
  payment_status: text("payment_status").notNull().default("pending"), // pending, paid, failed
  referral_code_used: text("referral_code_used"), // Использованный реферальный код
  // Delivery information
  delivery_type: text("delivery_type"), // pickup, courier
  delivery_service: text("delivery_service"), // cdek, russianpost, yandex
  delivery_address: text("delivery_address"), // Full delivery address
  delivery_city: text("delivery_city"), // City name
  delivery_point_id: text("delivery_point_id"), // Pickup point ID for pickup delivery
  delivery_point_name: text("delivery_point_name"), // Pickup point name
  delivery_cost: decimal("delivery_cost", { precision: 10, scale: 2 }).default("0"), // Delivery cost
  tracking_number: text("tracking_number"), // Tracking number from delivery service
  estimated_delivery: timestamp("estimated_delivery"), // Estimated delivery date
  customer_info: jsonb("customer_info"), // Guest customer information {name, phone, email}
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  related_products: jsonb("related_products"), // Array of product IDs
  author_id: integer("author_id").notNull().references(() => users.id),
  published: boolean("published").default(false),
  slug: text("slug").unique(), // Custom URL slug for SEO-friendly URLs
  image_id: integer("image_id").references(() => uploadedImages.id), // Featured image for the blog post
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Referrals table for multi-level tracking
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id), // The person who was referred
  referrer_id: integer("referrer_id").notNull().references(() => users.id), // The person who made the referral
  order_id: integer("order_id").references(() => orders.id), // Order that triggered the referral reward
  referral_level: integer("referral_level").notNull().default(1), // 1, 2, or 3 for multi-level tracking
  commission_rate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // 20%, 5%, or 1%
  reward_earned: decimal("reward_earned", { precision: 10, scale: 2 }).default("0.00"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Promo codes table
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discount_percentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull().default("10.00"),
  is_active: boolean("is_active").default(true),
  usage_count: integer("usage_count").default(0),
  max_usage: integer("max_usage"), // null = unlimited
  created_at: timestamp("created_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at"),
});

// Telegram auth sessions
export const telegramAuthSessions = pgTable("telegram_auth_sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  session_token: text("session_token").notNull().unique(),
  telegram_data: jsonb("telegram_data").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Uploaded images table - метаданные изображений (файлы хранятся в файловой системе)
export const uploadedImages = pgTable("uploaded_images", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull().unique(),
  original_filename: varchar("original_filename", { length: 255 }).notNull(),
  mime_type: varchar("mime_type", { length: 100 }).notNull(),
  file_size: integer("file_size").notNull(),
  product_id: integer("product_id").references(() => products.id, { onDelete: 'cascade' }), // Жесткая связь с товаром
  is_primary: boolean("is_primary").default(false), // Является ли основным изображением товара
  display_order: integer("display_order").default(0), // Порядок отображения изображений
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Shopping cart table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  product_id: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Payment settings table for Tinkoff and other payment systems
export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // 'tinkoff', 'sberbank', etc.
  terminal_key: text("terminal_key").notNull(),
  secret_key: text("secret_key").notNull(),
  is_test_mode: boolean("is_test_mode").default(true),
  is_active: boolean("is_active").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Payment transactions table
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  order_id: text("order_id").notNull(), // Can be string for external order IDs
  payment_id: text("payment_id").notNull().unique(), // ID from payment provider
  provider: text("provider").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("RUB"),
  status: text("status").notNull().default("pending"), // pending, confirmed, rejected, cancelled
  payment_url: text("payment_url"),
  metadata: jsonb("metadata"), // Additional payment data
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Site settings table for storing custom scripts and meta tags
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  setting_key: text("setting_key").notNull().unique(),
  setting_value: text("setting_value"),
  setting_type: text("setting_type").notNull().default("text"),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

// Referral settings table for managing referral program configuration
export const referralSettings = pgTable("referral_settings", {
  id: serial("id").primaryKey(),
  level1_commission: decimal("level1_commission", { precision: 5, scale: 2 }).notNull().default("20.00"),
  level2_commission: decimal("level2_commission", { precision: 5, scale: 2 }).notNull().default("5.00"),
  level3_commission: decimal("level3_commission", { precision: 5, scale: 2 }).notNull().default("1.00"),
  bonus_coins_percentage: decimal("bonus_coins_percentage", { precision: 5, scale: 2 }).notNull().default("5.00"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

// About page content management
export const aboutPageContent = pgTable("about_page_content", {
  id: serial("id").primaryKey(),
  // SEO fields
  page_title: text("page_title").notNull().default("О компании VitaWin"),
  meta_description: text("meta_description").notNull().default("VitaWin - MLM компания нового поколения, объединяющая знания на стыке природы, современных технологий и науки"),
  meta_keywords: text("meta_keywords").default("VitaWin, MLM, биодобавки, здоровье, природа, наука"),
  
  // Hero section
  hero_title: text("hero_title").notNull().default("VitaWin - MLM компания нового поколения, объединяющая знания на стыке природы, современных технологий и науки"),
  hero_description: text("hero_description").notNull().default("Мы объединили древние знания о целебных свойствах грибов с современными научными технологиями и AI-инструментами чтобы создавать премиальные натуральные добавки для вашего здоровья и долголетия."),
  hero_video_url: text("hero_video_url"), // URL видео
  hero_image_url: text("hero_image_url"), // Fallback изображение если нет видео
  
  // ZeroWaste section
  zerowaste_title: text("zerowaste_title").notNull().default("ZeroWaste производство"),
  zerowaste_description: text("zerowaste_description").notNull().default("Мы приверженцы экологически ответственного производства и минимизации воздействия на окружающую среду. Наша цель — создавать продукты для здоровья, не нанося вреда планете."),
  zerowaste_image_url: text("zerowaste_image_url"),
  zerowaste_initiatives: jsonb("zerowaste_initiatives").default([
    "100% переработанная упаковка",
    "Безотходное производство", 
    "Возобновляемые источники энергии",
    "Органические методы выращивания",
    "Минимизация углеродного следа",
    "Локальные поставщики сырья"
  ]),
  
  // Benefits section
  benefits_title: text("benefits_title").notNull().default("Что вы получаете, выбирая нас"),
  benefits_description: text("benefits_description").notNull().default("Мы предлагаем не просто продукты, а комплексный подход к вашему здоровью"),
  benefits_image_url: text("benefits_image_url"),
  benefits_list: jsonb("benefits_list").default([
    "Натуральные ингредиенты высшего качества",
    "Научно обоснованные формулы",
    "Сертифицированное производство",
    "Экологически чистое сырье",
    "Персональный подход к здоровью",
    "Постоянная поддержка специалистов"
  ]),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

// Company commitments table for managing company commitments section
export const companyCommitments = pgTable("company_commitments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("Наши обязательства по качеству"),
  subtitle: text("subtitle").notNull().default("Высочайшие стандарты"),
  description1: text("description1").notNull().default("В VitaWin мы стремимся предоставлять витамины и минералы, БАДы и пищевые добавки высочайшего качества. Наша продукция производится на собственном предприятии в Санкт-Петербурге, зарегистрировано в ЕАС, которые следуют строгим рекомендациям надлежащей производственной практики (GMP)."),
  description2: text("description2").notNull().default("Каждая партия наших добавок проходит строгое тестирование на чистоту, эффективность и качество. Мы сами выращиваем и закупаем ингредиенты у проверенных поставщиков, которые разделяют наши обязательства по качеству и устойчивости."),
  promise_title: text("promise_title").notNull().default("Наше обещание"),
  promise_text: text("promise_text").notNull().default("Мы поддерживаем нашу продукцию 100% гарантией удовлетворения. Если вы не полностью удовлетворены покупкой, мы вернем деньги или заменим товар."),
  guarantee_button_text: text("guarantee_button_text").notNull().default("Получить гарантию качества"),
  guarantee_button_url: text("guarantee_button_url").default("#"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

// ИИ агент: Таблица для отслеживания задач
export const aiTasks = pgTable("ai_tasks", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'error_fix', 'bonus_calculation', 'network_analysis'
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'critical'
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'failed'
  error_data: jsonb("error_data"), // Данные об ошибке
  context: jsonb("context"), // Контекст задачи
  ai_analysis: jsonb("ai_analysis"), // Анализ ИИ
  solution_steps: jsonb("solution_steps"), // Шаги решения
  assigned_to: text("assigned_to"), // Кому назначена задача
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  completed_at: timestamp("completed_at"),
});

// ИИ агент: Таблица для кэшбеков и бонусов
export const userCashbacks = pgTable("user_cashbacks", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'referral_bonus', 'purchase_cashback', 'level_bonus'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  source_order_id: integer("source_order_id").references(() => orders.id),
  source_user_id: integer("source_user_id").references(() => users.id), // Кто принес бонус
  referral_level: integer("referral_level"), // Уровень реферала (1, 2, 3)
  status: text("status").notNull().default("pending"), // 'pending', 'processed', 'paid'
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  processed_at: timestamp("processed_at"),
});

// ИИ агент: Таблица для отслеживания связей в реферальной сети
export const networkConnections = pgTable("network_connections", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  referrer_id: integer("referrer_id").references(() => users.id),
  level: integer("level").notNull(), // Уровень в сети (1, 2, 3)
  path: text("path").notNull(), // Путь в сети "1->2->3"
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  verified_at: timestamp("verified_at"),
});

// ИИ агент: Таблица для логов
export const aiLogs = pgTable("ai_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // 'info', 'warning', 'error', 'critical'
  message: text("message").notNull(),
  context: jsonb("context"),
  user_id: integer("user_id").references(() => users.id),
  order_id: integer("order_id").references(() => orders.id),
  task_id: integer("task_id").references(() => aiTasks.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Withdrawal requests table
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  full_name: text("full_name").notNull(),
  inn: text("inn"),
  bik: text("bik"),
  account_number: text("account_number").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, rejected
  admin_notes: text("admin_notes"),
  processed_at: timestamp("processed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Admin login schema
export const adminLoginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
  captcha: z.string().optional(), // Временно опциональный
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  created_at: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  created_at: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  original_price: z.union([z.string(), z.number()]).optional().transform((val) => val ? val.toString() : undefined),
  custom_pv: z.union([z.string(), z.number()]).optional().transform((val) => val ? val.toString() : undefined),
  custom_cashback: z.union([z.string(), z.number()]).optional().transform((val) => val ? val.toString() : undefined),
  slug: z.string().optional().refine((val) => {
    if (!val) return true;
    // Разрешаем буквы, цифры, дефисы
    return /^[a-zA-Z0-9а-яёА-ЯЁ\-]+$/.test(val);
  }, {
    message: "URL может содержать только буквы, цифры и дефисы"
  })
});

export const updateProductSchema = insertProductSchema.partial().extend({
  price: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => (val === null || val === undefined) ? null : val.toString()),
  original_price: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => (val === null || val === undefined) ? null : val.toString()),
  custom_pv: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => (val === null || val === undefined) ? null : val.toString()),
  custom_cashback: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => (val === null || val === undefined) ? null : val.toString()),
  images: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  composition_table: z.array(z.any()).optional()
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  created_at: true,
  author_id: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  created_at: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  created_at: true,
});

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAboutPageContentSchema = createInsertSchema(aboutPageContent).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertUserBonusPreferencesSchema = createInsertSchema(userBonusPreferences).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  // Валидация: все проценты должны в сумме давать 100%
  health_id_percentage: z.number().min(0).max(100),
  travel_percentage: z.number().min(0).max(100),
  home_percentage: z.number().min(0).max(100),
  education_percentage: z.number().min(0).max(100),
}).refine((data) => {
  const total = data.health_id_percentage + data.travel_percentage + data.home_percentage + data.education_percentage;
  return total === 100;
}, {
  message: "Сумма всех процентов должна равняться 100%"
});

export const insertReferralSettingsSchema = createInsertSchema(referralSettings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAiTaskSchema = createInsertSchema(aiTasks).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertUserCashbackSchema = createInsertSchema(userCashbacks).omit({
  id: true,
  created_at: true,
});

export const insertNetworkConnectionSchema = createInsertSchema(networkConnections).omit({
  id: true,
  created_at: true,
});

export const insertAiLogSchema = createInsertSchema(aiLogs).omit({
  id: true,
  created_at: true,
});

export const insertUploadedImageSchema = createInsertSchema(uploadedImages).omit({
  id: true,
  created_at: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  created_at: true,
  processed_at: true,
});

export const insertMlmLevelSchema = createInsertSchema(mlmLevels).omit({
  id: true,
  created_at: true,
});

export const insertUserMlmStatusSchema = createInsertSchema(userMlmStatus).omit({
  id: true,
  updated_at: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserBonusPreferences = typeof userBonusPreferences.$inferSelect;
export type InsertUserBonusPreferences = z.infer<typeof insertUserBonusPreferencesSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingsSchema>;

export type ReferralSetting = typeof referralSettings.$inferSelect;
export type InsertReferralSetting = typeof referralSettings.$inferInsert;

export const insertReferralSettingSchema = createInsertSchema(referralSettings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type AiTask = typeof aiTasks.$inferSelect;
export type InsertAiTask = z.infer<typeof insertAiTaskSchema>;

export type UserCashback = typeof userCashbacks.$inferSelect;
export type InsertUserCashback = z.infer<typeof insertUserCashbackSchema>;

export type NetworkConnection = typeof networkConnections.$inferSelect;
export type InsertNetworkConnection = z.infer<typeof insertNetworkConnectionSchema>;

export type AiLog = typeof aiLogs.$inferSelect;
export type InsertAiLog = z.infer<typeof insertAiLogSchema>;

export type UploadedImage = typeof uploadedImages.$inferSelect;
export type InsertUploadedImage = z.infer<typeof insertUploadedImageSchema>;

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;

export type MlmLevel = typeof mlmLevels.$inferSelect;
export type InsertMlmLevel = z.infer<typeof insertMlmLevelSchema>;

export type UserMlmStatus = typeof userMlmStatus.$inferSelect;
export type InsertUserMlmStatus = z.infer<typeof insertUserMlmStatusSchema>;

export type TelegramAuthSession = typeof telegramAuthSessions.$inferSelect;

// Telegram auth data interface
export interface TelegramAuthData {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Cart action types
export const cartActionSchema = z.object({
  action: z.enum(["add", "update", "remove"]),
  product_id: z.number(),
  quantity: z.number().min(1).optional(),
});

export type CartAction = z.infer<typeof cartActionSchema>;

// Order item interface
export interface OrderItem {
  product_id: number;
  quantity: number;
  price: string;
  title: string;
}

// Checkout request schema с поддержкой реферального кода
export const checkoutSchema = z.object({
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().min(1),
  })),
  referral_code: z.string().optional(),
  payment_method: z.enum(["cash", "balance", "card"]).default("cash"),
  delivery_info: z.object({
    service: z.string(),
    address: z.string(),
    postal_code: z.string(),
    recipient_name: z.string(),
    recipient_phone: z.string(),
  }).optional(),
});

export type CheckoutRequest = z.infer<typeof checkoutSchema>;

// Admin user types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  password_hash: true,
});

// Admin session tracking for real-time monitoring
export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  admin_id: integer("admin_id").references(() => adminUsers.id).notNull(),
  session_token: text("session_token").notNull().unique(),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  login_time: timestamp("login_time").defaultNow().notNull(),
  last_activity: timestamp("last_activity").defaultNow().notNull(),
  logout_time: timestamp("logout_time"),
  is_active: boolean("is_active").default(true).notNull(),
  location: text("location"), // Geographic location
  device_info: jsonb("device_info"), // Browser, OS info
});

// Admin activity log for audit trail
export const adminActivityLog = pgTable("admin_activity_log", {
  id: serial("id").primaryKey(),
  admin_id: integer("admin_id").references(() => adminUsers.id).notNull(),
  session_id: integer("session_id").references(() => adminSessions.id),
  action: text("action").notNull(), // login, logout, view_page, edit_product, etc.
  resource: text("resource"), // product, order, user, etc.
  resource_id: text("resource_id"), // ID of the affected resource
  details: jsonb("details"), // Additional action details
  ip_address: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;
export type AdminActivityLog = typeof adminActivityLog.$inferSelect;
export type InsertAdminActivityLog = typeof adminActivityLog.$inferInsert;

export const insertAdminSessionSchema = createInsertSchema(adminSessions);
export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLog);

// Referral transaction log for detailed tracking and recovery
export const referralTransactionLog = pgTable("referral_transaction_log", {
  id: serial("id").primaryKey(),
  transaction_id: varchar("transaction_id", { length: 50 }).notNull().unique(),
  order_id: integer("order_id").references(() => orders.id),
  buyer_id: integer("buyer_id").references(() => users.id),
  referrer_id: integer("referrer_id").references(() => users.id),
  referral_level: integer("referral_level").notNull(),
  commission_rate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  order_amount: decimal("order_amount", { precision: 10, scale: 2 }).notNull(),
  bonus_amount: decimal("bonus_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  telegram_notification_sent: boolean("telegram_notification_sent").default(false),
  telegram_notification_error: text("telegram_notification_error"),
  processed_at: timestamp("processed_at"),
  created_at: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata").default('{}'),
});

// Order processing log for tracking each stage
export const orderProcessingLog = pgTable("order_processing_log", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").references(() => orders.id),
  processing_stage: varchar("processing_stage", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  details: jsonb("details").default('{}'),
  error_message: text("error_message"),
  created_at: timestamp("created_at").defaultNow(),
});

export type ReferralTransactionLog = typeof referralTransactionLog.$inferSelect;
export type InsertReferralTransactionLog = typeof referralTransactionLog.$inferInsert;
export type OrderProcessingLog = typeof orderProcessingLog.$inferSelect;
export type InsertOrderProcessingLog = typeof orderProcessingLog.$inferInsert;

export const insertReferralTransactionLogSchema = createInsertSchema(referralTransactionLog);
export const insertOrderProcessingLogSchema = createInsertSchema(orderProcessingLog);

export const insertCompanyCommitmentsSchema = createInsertSchema(companyCommitments).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CompanyCommitments = typeof companyCommitments.$inferSelect;
export type InsertCompanyCommitments = z.infer<typeof insertCompanyCommitmentsSchema>;

export type AboutPageContent = typeof aboutPageContent.$inferSelect;
export type InsertAboutPageContent = z.infer<typeof insertAboutPageContentSchema>;
