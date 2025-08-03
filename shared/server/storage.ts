import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and, sql, like, or } from "drizzle-orm";
import { queryCache } from "./queryCache";
import { redisCache } from "./services/redisCache";
import {
  users,
  products,
  orders,
  blogPosts,
  referrals,
  telegramAuthSessions,
  cartItems,
  paymentSettings,
  paymentTransactions,
  referralSettings,
  companyCommitments,
  aboutPageContent,
  adminUsers,
  adminSessions,
  adminActivityLog,
  withdrawalRequests,
  uploadedImages,
  mlmLevels,
  userMlmStatus,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type BlogPost,
  type AdminUser,
  type InsertAdminUser,
  type AdminSession,
  type InsertAdminSession,
  type AdminActivityLog,
  type InsertAdminActivityLog,
  type InsertBlogPost,
  type Referral,
  type InsertReferral,
  type CartItem,
  type InsertCartItem,
  type PaymentSettings,
  type InsertPaymentSettings,
  type PaymentTransaction,
  type InsertPaymentTransaction,
  type ReferralSetting,
  type InsertReferralSetting,
  type CompanyCommitments,
  type InsertCompanyCommitments,
  AboutPageContent,
  InsertAboutPageContent,
  type TelegramAuthSession,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type OrderItem,
  type MlmLevel,
  type InsertMlmLevel,
  type UserMlmStatus,
  type InsertUserMlmStatus,
} from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

console.log("PostgreSQL connection initialized");
console.log("Environment:", process.env.NODE_ENV || 'development');
console.log("Database type: Neon (remote)");



const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: number): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  // Product management
  getProducts(params: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Cart management
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(userId: number, productId: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(userId: number, productId: number): Promise<boolean>;
  clearCart(userId: number): Promise<void>;

  // Order management
  getOrders(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getAllOrders(params: { limit?: number; offset?: number }): Promise<{ orders: Order[]; total: number }>;

  // Blog management
  getBlogPosts(params: {
    published?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ posts: BlogPost[]; total: number }>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;

  // Referral management
  getReferralStats(userId: number): Promise<{
    referral_code: string;
    total_referrals: number;
    total_earnings: string;
    pending_rewards: string;
    recent_referrals: Referral[];
  }>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByUser(userId: number): Promise<Referral[]>;

  // Session management
  createSession(session: {
    user_id: number;
    session_token: string;
    telegram_data: any;
    expires_at: Date;
  }): Promise<TelegramAuthSession>;
  getSession(token: string): Promise<TelegramAuthSession | undefined>;
  deleteSession(token: string): Promise<boolean>;

  // Payment settings management
  getPaymentSettings(): Promise<PaymentSettings[]>;
  getPaymentSettingsByProvider(provider: string): Promise<PaymentSettings | undefined>;
  createPaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings>;
  updatePaymentSettings(id: number, data: Partial<InsertPaymentSettings>): Promise<PaymentSettings | undefined>;
  deletePaymentSettings(id: number): Promise<boolean>;

  // Payment transactions management
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransaction(paymentId: string): Promise<PaymentTransaction | undefined>;
  updatePaymentTransactionStatus(paymentId: string, status: string): Promise<PaymentTransaction | undefined>;

  // Referral settings management
  getReferralSettings(): Promise<ReferralSetting | undefined>;
  updateReferralSettings(settings: InsertReferralSetting): Promise<ReferralSetting>;

  // About page content management
  getAboutPageContent(): Promise<AboutPageContent | undefined>;
  updateAboutPageContent(data: Partial<InsertAboutPageContent>): Promise<AboutPageContent>;
  updateAboutPageContentField(field: string, value: string | null): Promise<void>;

  // Admin methods
  getAllUsers(params: { limit?: number; offset?: number }): Promise<{ users: User[]; total: number }>;
  getUserStats(): Promise<{
    total_users: number;
    total_orders: number;
    total_revenue: string;
    new_users_today: number;
  }>;

  // Admin user management
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
  updateAdminLastLogin(id: number): Promise<void>;
  updateAdminPassword(id: number, passwordHash: string): Promise<void>;

  // Admin session management
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(sessionToken: string): Promise<AdminSession | undefined>;
  updateAdminSessionActivity(sessionToken: string): Promise<void>;
  endAdminSession(sessionToken: string): Promise<void>;
  getActiveAdminSessions(): Promise<(AdminSession & { admin: AdminUser })[]>;
  cleanupInactiveSessions(): Promise<void>;

  // Admin activity logging
  logAdminActivity(activity: InsertAdminActivityLog): Promise<AdminActivityLog>;
  getAdminActivityLog(params: {
    adminId?: number;
    sessionId?: number;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ activities: AdminActivityLog[]; total: number }>;
  getRealtimeAdminStats(): Promise<{
    activeSessions: number;
    totalLogins: number;
    recentActivities: AdminActivityLog[];
    sessionsByLocation: { location: string; count: number }[];
  }>;

  // Withdrawal requests management
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getWithdrawalRequests(userId: number): Promise<WithdrawalRequest[]>;
  getAllWithdrawalRequests(params: { limit?: number; offset?: number }): Promise<{ requests: WithdrawalRequest[]; total: number }>;
  updateWithdrawalRequestStatus(id: number, status: string, adminNotes?: string): Promise<WithdrawalRequest | undefined>;

  // MLM Levels management
  getMlmLevels(): Promise<MlmLevel[]>;
  getMlmLevel(level: number): Promise<MlmLevel | undefined>;
  getUserMlmStatus(userId: number): Promise<UserMlmStatus | undefined>;
  createUserMlmStatus(status: InsertUserMlmStatus): Promise<UserMlmStatus>;
  updateUserMlmStatus(userId: number, data: Partial<InsertUserMlmStatus>): Promise<UserMlmStatus | undefined>;
  calculateUserLevel(userId: number): Promise<{ currentLevel: number; nextLevel: MlmLevel | null; requiredReferrals: number }>;
  
  // User and Order data access
  getUsers(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getAllOrders(): Promise<Order[]>;
}

export class PostgresStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByTelegramId(telegramId: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.telegram_id, telegramId)).limit(1);
    return result[0];
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.referral_code, code)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    
    // Инвалидируем кэш статистики пользователей
    await redisCache.invalidateUserStats();
    
    return result[0] as User;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getProducts(params: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const { search, limit = 20, offset = 0 } = params;
    
    // Проверяем Redis кэш сначала
    const redisCacheKey = `products:${search || 'all'}:${limit}:${offset}`;
    const cachedFromRedis = await redisCache.getCachedProducts();
    if (cachedFromRedis) {
      return cachedFromRedis;
    }

    // Затем проверяем локальный кэш
    const localCacheKey = `products:${search || 'all'}:${limit}:${offset}`;
    const cachedLocal = queryCache.get(localCacheKey);
    if (cachedLocal) {
      // Сохраняем в Redis для следующих запросов
      await redisCache.cacheProducts(cachedLocal, 300); // 5 минут
      return cachedLocal;
    }

    let query = db.select().from(products);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(products);

    // Базовое условие - показываем только активные товары
    let baseCondition = eq(products.status, 'active');

    if (search) {
      const searchCondition = or(
        like(products.title, `%${search}%`),
        like(products.description, `%${search}%`)
      );
      baseCondition = and(baseCondition, searchCondition);
    }

    query = query.where(baseCondition);
    countQuery = countQuery.where(baseCondition);

    const [productsResult, countResult] = await Promise.all([
      query.orderBy(desc(products.created_at)).limit(limit).offset(offset),
      countQuery,
    ]);

    const result = {
      products: productsResult,
      total: (countResult[0] as any).count,
    };

    // Кэшируем в оба места
    queryCache.set(localCacheKey, result, 2 * 60 * 1000); // 2 минуты локально
    await redisCache.cacheProducts(result, 300); // 5 минут в Redis
    
    return result;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    // Проверяем Redis кэш
    const cachedFromRedis = await redisCache.getCachedProduct(id);
    if (cachedFromRedis) {
      return cachedFromRedis;
    }

    // Проверяем локальный кэш
    const cacheKey = `product:${id}`;
    const cached = queryCache.get(cacheKey);
    if (cached) {
      // Сохраняем в Redis
      await redisCache.cacheProduct(id, cached, 1800); // 30 минут
      return cached;
    }

    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    const product = result[0];
    
    if (product) {
      // Кэшируем в оба места
      queryCache.set(cacheKey, product, 5 * 60 * 1000); // 5 минут локально
      await redisCache.cacheProduct(id, product, 1800); // 30 минут в Redis
    }
    
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    
    // Инвалидируем кэш продуктов в обоих местах
    queryCache.invalidatePattern('products:');
    await redisCache.invalidateProducts();
    
    return result[0];
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    // Обновляем только самые базовые поля без массивов
    const basicData: any = {};
    
    // Только основные текстовые и числовые поля
    if (data.name) basicData.name = data.name;
    if (data.title) basicData.title = data.title;
    if (data.description) basicData.description = data.description;
    if (data.long_description) basicData.long_description = data.long_description;
    if (data.price) basicData.price = data.price;
    if (data.original_price) basicData.original_price = data.original_price;
    if (data.category) basicData.category = data.category;
    if (data.badge) basicData.badge = data.badge;
    if (data.stock !== undefined) basicData.stock = data.stock;
    if (data.status) basicData.status = data.status;
    if (data.sku) basicData.sku = data.sku;
    if (data.slug) basicData.slug = data.slug;
    
    // Дополнительные поля товара
    if (data.capsule_count) basicData.capsule_count = data.capsule_count;
    if (data.capsule_volume) basicData.capsule_volume = data.capsule_volume;
    if (data.servings_per_container) basicData.servings_per_container = data.servings_per_container;
    if (data.manufacturer) basicData.manufacturer = data.manufacturer;
    if (data.country_of_origin) basicData.country_of_origin = data.country_of_origin;
    if (data.expiration_date) basicData.expiration_date = data.expiration_date;
    if (data.storage_conditions) basicData.storage_conditions = data.storage_conditions;
    if (data.how_to_take) basicData.how_to_take = data.how_to_take;
    if (data.usage) basicData.usage = data.usage;
    if (data.benefits_text) basicData.benefits_text = data.benefits_text;
    if (data.additional_info) basicData.additional_info = data.additional_info;
    if (data.composition) basicData.composition = data.composition;
    
    // Новые поля для улучшенной информации о товаре
    if (data.key_benefits !== undefined) basicData.key_benefits = data.key_benefits;
    if (data.quality_guarantee !== undefined) basicData.quality_guarantee = data.quality_guarantee;
    if (data.nutrition_facts !== undefined) basicData.nutrition_facts = data.nutrition_facts;
    
    // Обрабатываем массивы отдельно
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      const cleanImages = data.images.filter(img => img && img.trim() !== '');
      if (cleanImages.length > 0) {
        basicData.images = cleanImages;
      }
    }
    
    if (data.benefits && Array.isArray(data.benefits) && data.benefits.length > 0) {
      const cleanBenefits = data.benefits.filter(benefit => benefit && benefit.trim() !== '');
      if (cleanBenefits.length > 0) {
        basicData.benefits = cleanBenefits;
      }
    }
    
    // Обрабатываем composition_table
    if (data.composition_table !== undefined) {
      if (Array.isArray(data.composition_table) && data.composition_table.length > 0) {
        const cleanComposition = data.composition_table.filter(item => 
          item && item.component && item.component.trim() !== ''
        );
        basicData.composition_table = cleanComposition.length > 0 ? cleanComposition : null;
      } else {
        basicData.composition_table = null;
      }
    }
    
    console.log('Basic data for update:', JSON.stringify(basicData, null, 2));
    
    const result = await db.update(products).set(basicData).where(eq(products.id, id)).returning();
    
    // Инвалидируем кэш продуктов
    queryCache.invalidatePattern('products:');
    queryCache.delete(`product:${id}`);
    
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    
    // Инвалидируем кэш продуктов
    queryCache.invalidatePattern('products:');
    queryCache.delete(`product:${id}`);
    
    return result.rowCount > 0;
  }

  // ✅ Метод для полной инвалидации кеша продуктов
  async invalidateProductCache(): Promise<void> {
    console.log("🧹 Invalidating all product cache...");
    
    // Очищаем локальный кеш
    queryCache.invalidatePattern("products:");
    queryCache.invalidatePattern("product:");
    
    // Очищаем Redis кеш
    await redisCache.invalidateProducts();
    
    console.log("✅ Product cache cleared successfully");
  }

  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    const cacheKey = `cart:${userId}`;
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await db
      .select({
        id: cartItems.id,
        user_id: cartItems.user_id,
        product_id: cartItems.product_id,
        quantity: cartItems.quantity,
        created_at: cartItems.created_at,
        product: products,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.product_id, products.id))
      .where(eq(cartItems.user_id, userId));

    const cartData = result.filter(item => item.product) as (CartItem & { product: Product })[];
    
    // Кэшируем корзину на 1 минуту
    queryCache.set(cacheKey, cartData, 60 * 1000);
    
    return cartData;
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.user_id, item.user_id), eq(cartItems.product_id, item.product_id)))
      .limit(1);

    let result;
    if (existing[0]) {
      // Update quantity
      result = await db
        .update(cartItems)
        .set({ quantity: (existing[0].quantity || 0) + (item.quantity || 1) })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
    } else {
      // Insert new item
      result = await db.insert(cartItems).values(item).returning();
    }

    // Инвалидируем кэш корзины
    queryCache.delete(`cart:${item.user_id}`);
    
    return result[0];
  }

  async updateCartItem(userId: number, productId: number, quantity: number): Promise<CartItem | undefined> {
    const result = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.user_id, userId), eq(cartItems.product_id, productId)))
      .returning();
    
    // Инвалидируем кэш корзины
    queryCache.delete(`cart:${userId}`);
    
    return result[0];
  }

  async removeFromCart(userId: number, productId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(and(eq(cartItems.user_id, userId), eq(cartItems.product_id, productId)));
    
    // Инвалидируем кэш корзины
    queryCache.delete(`cart:${userId}`);
    
    return result.rowCount > 0;
  }

  async clearCart(userId: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.user_id, userId));
    
    // Инвалидируем кэш корзины
    queryCache.delete(`cart:${userId}`);
  }

  async getOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.user_id, userId)).orderBy(desc(orders.created_at));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    
    // Инвалидируем кэш статистики пользователей при создании заказа
    await redisCache.invalidateUserStats();
    
    return result[0];
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const result = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return result[0];
  }

  async getAllOrders(params: { limit?: number; offset?: number }): Promise<{ orders: Order[]; total: number }> {
    const { limit = 50, offset = 0 } = params;

    const [ordersResult, countResult] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(orders),
    ]);

    return {
      orders: ordersResult,
      total: countResult[0].count,
    };
  }

  async getBlogPosts(params: {
    published?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ posts: BlogPost[]; total: number }> {
    const { published, limit = 20, offset = 0 } = params;

    // Проверяем Redis кэш
    const cacheKey = `blog:posts:${published}:${limit}:${offset}`;
    const cachedFromRedis = await redisCache.getCachedBlogPosts();
    if (cachedFromRedis) {
      return cachedFromRedis;
    }

    let query = db.select().from(blogPosts);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(blogPosts);

    if (published !== undefined) {
      query = query.where(eq(blogPosts.published, published));
      countQuery = countQuery.where(eq(blogPosts.published, published));
    }

    const [postsResult, countResult] = await Promise.all([
      query.orderBy(desc(blogPosts.created_at)).limit(limit).offset(offset),
      countQuery,
    ]);

    const result = {
      posts: postsResult,
      total: countResult[0].count,
    };

    // Кэшируем блог-посты в Redis на 10 минут
    await redisCache.cacheBlogPosts(result.posts, 600);

    return result;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const result = await db.select({
      id: blogPosts.id,
      title: blogPosts.title,
      content: blogPosts.content,
      related_products: blogPosts.related_products,
      author_id: blogPosts.author_id,
      published: blogPosts.published,
      slug: blogPosts.slug,
      image_id: blogPosts.image_id,
      created_at: blogPosts.created_at,
    }).from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    return result[0];
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const result = await db.select({
      id: blogPosts.id,
      title: blogPosts.title,
      content: blogPosts.content,
      related_products: blogPosts.related_products,
      author_id: blogPosts.author_id,
      published: blogPosts.published,
      slug: blogPosts.slug,
      image_id: blogPosts.image_id,
      created_at: blogPosts.created_at,
    }).from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    return result[0];
  }

  async createBlogPost(post: any): Promise<BlogPost> {
    const result = await db.insert(blogPosts).values(post).returning();
    
    // Инвалидируем кэш блог-постов
    await redisCache.invalidateBlogPosts();
    
    return result[0];
  }

  async updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const result = await db.update(blogPosts).set(data).where(eq(blogPosts.id, id)).returning();
    
    // Инвалидируем кэш блог-постов
    await redisCache.invalidateBlogPosts();
    
    return result[0];
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return result.rowCount > 0;
  }

  async getReferralStats(userId: number): Promise<{
    referral_code: string;
    total_referrals: number;
    total_earnings: string;
    pending_rewards: string;
    recent_referrals: Referral[];
  }> {
    const cacheKey = `referral_stats:${userId}`;
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const [totalReferrals, totalEarnings, recentReferrals] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(referrals).where(eq(referrals.referrer_id, userId)),
      db
        .select({ total: sql<string>`COALESCE(SUM(reward_earned), 0)` })
        .from(referrals)
        .where(eq(referrals.referrer_id, userId)),
      db
        .select()
        .from(referrals)
        .where(eq(referrals.referrer_id, userId))
        .orderBy(desc(referrals.created_at))
        .limit(10),
    ]);

    const stats = {
      referral_code: user.referral_code,
      total_referrals: totalReferrals[0].count,
      total_earnings: totalEarnings[0].total,
      pending_rewards: "0.00", // Could be calculated based on pending orders
      recent_referrals: recentReferrals,
    };

    // Кэшируем статистику рефералов на 2 минуты
    queryCache.set(cacheKey, stats, 2 * 60 * 1000);

    return stats;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const result = await db.insert(referrals).values(referral).returning();
    
    // Инвалидируем кэш статистики рефералов
    queryCache.delete(`referral_stats:${referral.referrer_id}`);
    
    return result[0];
  }

  async getReferralsByUser(userId: number): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrer_id, userId));
  }

  async createSession(session: {
    user_id: number;
    session_token: string;
    telegram_data: any;
    expires_at: Date;
  }): Promise<TelegramAuthSession> {
    const result = await db.insert(telegramAuthSessions).values(session).returning();
    return result[0];
  }

  async getSession(token: string): Promise<TelegramAuthSession | undefined> {
    const result = await db
      .select()
      .from(telegramAuthSessions)
      .where(eq(telegramAuthSessions.session_token, token))
      .limit(1);
    return result[0];
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = await db.delete(telegramAuthSessions).where(eq(telegramAuthSessions.session_token, token));
    return result.rowCount > 0;
  }

  async getAllUsers(params: { limit?: number; offset?: number }): Promise<{ users: User[]; total: number }> {
    const { limit = 50, offset = 0 } = params;

    const [usersResult, countResult] = await Promise.all([
      db.select().from(users).orderBy(desc(users.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(users),
    ]);

    return {
      users: usersResult,
      total: countResult[0].count,
    };
  }

  async getPaymentSettings(): Promise<PaymentSettings[]> {
    return await db.select().from(paymentSettings).orderBy(paymentSettings.created_at);
  }

  async getPaymentSettingsByProvider(provider: string): Promise<PaymentSettings | undefined> {
    const result = await db.select()
      .from(paymentSettings)
      .where(eq(paymentSettings.provider, provider))
      .limit(1);
    return result[0];
  }

  async createPaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings> {
    const result = await db.insert(paymentSettings)
      .values(settings)
      .returning();
    return result[0];
  }

  async updatePaymentSettings(id: number, data: Partial<InsertPaymentSettings>): Promise<PaymentSettings | undefined> {
    const result = await db.update(paymentSettings)
      .set({ ...data, updated_at: new Date() })
      .where(eq(paymentSettings.id, id))
      .returning();
    return result[0];
  }

  async deletePaymentSettings(id: number): Promise<boolean> {
    const result = await db.delete(paymentSettings)
      .where(eq(paymentSettings.id, id));
    return result.rowCount > 0;
  }

  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const result = await db.insert(paymentTransactions)
      .values(transaction)
      .returning();
    return result[0];
  }

  async getPaymentTransaction(paymentId: string): Promise<PaymentTransaction | undefined> {
    const result = await db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.payment_id, paymentId))
      .limit(1);
    return result[0];
  }

  async updatePaymentTransactionStatus(paymentId: string, status: string): Promise<PaymentTransaction | undefined> {
    const result = await db.update(paymentTransactions)
      .set({ status, updated_at: new Date() })
      .where(eq(paymentTransactions.payment_id, paymentId))
      .returning();
    return result[0];
  }

  async getUserStats(): Promise<{
    total_users: number;
    total_orders: number;
    total_revenue: string;
    new_users_today: number;
  }> {
    // Проверяем Redis кэш статистики
    const cachedStats = await redisCache.getCachedUserStats();
    if (cachedStats) {
      return cachedStats;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [userCount, orderCount, revenue, newUsersToday] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db.select({ total: sql<string>`COALESCE(SUM(total), 0)` }).from(orders),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.created_at} >= ${today}`),
    ]);

    const stats = {
      total_users: userCount[0].count,
      total_orders: orderCount[0].count,
      total_revenue: revenue[0].total,
      new_users_today: newUsersToday[0].count,
    };

    // Кэшируем статистику в Redis на 2 минуты
    await redisCache.cacheUserStats(stats, 120);

    return stats;
  }

  // Admin user management methods
  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const result = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return result[0];
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const result = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return result[0];
  }

  async createAdminUser(admin: InsertAdminUser): Promise<AdminUser> {
    const result = await db.insert(adminUsers).values(admin).returning();
    return result[0];
  }

  async updateAdminLastLogin(id: number): Promise<void> {
    await db.update(adminUsers)
      .set({ last_login: new Date() })
      .where(eq(adminUsers.id, id));
  }

  async updateAdminPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(adminUsers)
      .set({ password_hash: passwordHash })
      .where(eq(adminUsers.id, id));
  }



  // Admin session management methods
  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const result = await db.insert(adminSessions).values(session).returning();
    return result[0];
  }

  async getAdminSession(sessionToken: string): Promise<AdminSession | undefined> {
    const result = await db.select().from(adminSessions)
      .where(eq(adminSessions.session_token, sessionToken))
      .limit(1);
    return result[0];
  }

  async updateAdminSessionActivity(sessionToken: string): Promise<void> {
    await db.update(adminSessions)
      .set({ last_activity: new Date() })
      .where(eq(adminSessions.session_token, sessionToken));
  }

  async endAdminSession(sessionToken: string): Promise<void> {
    await db.update(adminSessions)
      .set({ 
        logout_time: new Date(),
        is_active: false 
      })
      .where(eq(adminSessions.session_token, sessionToken));
  }

  async getActiveAdminSessions(): Promise<(AdminSession & { admin: AdminUser })[]> {
    const result = await db.select({
      id: adminSessions.id,
      admin_id: adminSessions.admin_id,
      session_token: adminSessions.session_token,
      ip_address: adminSessions.ip_address,
      user_agent: adminSessions.user_agent,
      login_time: adminSessions.login_time,
      last_activity: adminSessions.last_activity,
      logout_time: adminSessions.logout_time,
      is_active: adminSessions.is_active,
      location: adminSessions.location,
      device_info: adminSessions.device_info,
      admin: {
        id: adminUsers.id,
        email: adminUsers.email,
        password_hash: adminUsers.password_hash,
        created_at: adminUsers.created_at,
        last_login: adminUsers.last_login
      }
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.admin_id, adminUsers.id))
    .where(eq(adminSessions.is_active, true))
    .orderBy(desc(adminSessions.last_activity));

    return result.map(row => ({
      ...row,
      admin: row.admin
    }));
  }

  async cleanupInactiveSessions(): Promise<void> {
    // Mark sessions inactive if no activity for 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.update(adminSessions)
      .set({ is_active: false })
      .where(and(
        eq(adminSessions.is_active, true),
        sql`${adminSessions.last_activity} < ${twentyFourHoursAgo}`
      ));
  }

  // Admin activity logging methods
  async logAdminActivity(activity: InsertAdminActivityLog): Promise<AdminActivityLog> {
    const result = await db.insert(adminActivityLog).values(activity).returning();
    return result[0];
  }

  async getAdminActivityLog(params: {
    adminId?: number;
    sessionId?: number;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ activities: AdminActivityLog[]; total: number }> {
    let query = db.select().from(adminActivityLog);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(adminActivityLog);

    const conditions = [];
    if (params.adminId) {
      conditions.push(eq(adminActivityLog.admin_id, params.adminId));
    }
    if (params.sessionId) {
      conditions.push(eq(adminActivityLog.session_id, params.sessionId));
    }
    if (params.action) {
      conditions.push(eq(adminActivityLog.action, params.action));
    }

    if (conditions.length > 0) {
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    const [activities, countResult] = await Promise.all([
      query
        .orderBy(desc(adminActivityLog.timestamp))
        .limit(params.limit || 50)
        .offset(params.offset || 0),
      countQuery
    ]);

    return {
      activities,
      total: countResult[0].count
    };
  }

  async getRealtimeAdminStats(): Promise<{
    activeSessions: number;
    totalLogins: number;
    recentActivities: AdminActivityLog[];
    sessionsByLocation: { location: string; count: number }[];
  }> {
    const [
      activeSessionsResult,
      totalLoginsResult,
      recentActivities,
      sessionsByLocationResult
    ] = await Promise.all([
      // Count active sessions
      db.select({ count: sql<number>`count(*)` })
        .from(adminSessions)
        .where(eq(adminSessions.is_active, true)),
      
      // Total logins today
      db.select({ count: sql<number>`count(*)` })
        .from(adminActivityLog)
        .where(and(
          eq(adminActivityLog.action, 'login'),
          sql`DATE(${adminActivityLog.timestamp}) = CURRENT_DATE`
        )),
      
      // Recent activities (last 20)
      db.select().from(adminActivityLog)
        .orderBy(desc(adminActivityLog.timestamp))
        .limit(20),
      
      // Sessions by location
      db.select({
        location: adminSessions.location,
        count: sql<number>`count(*)`
      })
        .from(adminSessions)
        .where(eq(adminSessions.is_active, true))
        .groupBy(adminSessions.location)
    ]);

    return {
      activeSessions: activeSessionsResult[0].count,
      totalLogins: totalLoginsResult[0].count,
      recentActivities,
      sessionsByLocation: sessionsByLocationResult.map(row => ({
        location: row.location || 'Unknown',
        count: row.count
      }))
    };
  }

  // Referral settings management methods for PostgresStorage
  async getReferralSettings(): Promise<ReferralSetting | undefined> {
    try {
      const result = await db.select().from(referralSettings).limit(1);
      if (result.length > 0) {
        return result[0];
      }
      
      // Если настроек нет в БД, возвращаем значения по умолчанию
      return {
        id: 1,
        level1_commission: "20.00",
        level2_commission: "5.00", 
        level3_commission: "1.00",
        bonus_coins_percentage: "5.00",
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      console.error('Error getting referral settings:', error);
      // В случае ошибки возвращаем значения по умолчанию
      return {
        id: 1,
        level1_commission: "20.00",
        level2_commission: "5.00", 
        level3_commission: "1.00",
        bonus_coins_percentage: "5.00",
        created_at: new Date(),
        updated_at: new Date()
      };
    }
  }

  async updateReferralSettings(settings: InsertReferralSetting): Promise<ReferralSetting> {
    try {
      // Проверяем, есть ли уже настройки в БД
      const existing = await db.select().from(referralSettings).limit(1);
      
      if (existing.length > 0) {
        // Обновляем существующие настройки
        const [updated] = await db
          .update(referralSettings)
          .set({
            level1_commission: settings.level1_commission || "20.00",
            level2_commission: settings.level2_commission || "5.00",
            level3_commission: settings.level3_commission || "1.00",
            bonus_coins_percentage: settings.bonus_coins_percentage || "5.00",
            updated_at: new Date()
          })
          .where(eq(referralSettings.id, existing[0].id))
          .returning();
        
        return updated;
      } else {
        // Создаем новые настройки
        const [created] = await db
          .insert(referralSettings)
          .values({
            level1_commission: settings.level1_commission || "20.00",
            level2_commission: settings.level2_commission || "5.00",
            level3_commission: settings.level3_commission || "1.00",
            bonus_coins_percentage: settings.bonus_coins_percentage || "5.00"
          })
          .returning();
        
        return created;
      }
    } catch (error) {
      console.error('Error updating referral settings:', error);
      throw error;
    }
  }

  async getCompanyCommitments() {
    try {
      const commitments = await db.select().from(companyCommitments).limit(1);
      return commitments[0] || null;
    } catch (error) {
      console.error('Error getting company commitments:', error);
      throw error;
    }
  }

  async updateCompanyCommitments(data: InsertCompanyCommitments) {
    try {
      const existing = await this.getCompanyCommitments();
      
      if (existing) {
        const [updated] = await db
          .update(companyCommitments)
          .set({
            ...data,
            updated_at: new Date()
          })
          .where(eq(companyCommitments.id, existing.id))
          .returning();
        
        return updated;
      } else {
        const [created] = await db
          .insert(companyCommitments)
          .values(data)
          .returning();
        
        return created;
      }
    } catch (error) {
      console.error('Error updating company commitments:', error);
      throw error;
    }
  }

  // About page content methods
  async getAboutPageContent(): Promise<AboutPageContent | undefined> {
    try {
      const content = await db.select().from(aboutPageContent).limit(1);
      return content[0] || undefined;
    } catch (error) {
      console.error('Error getting about page content:', error);
      throw error;
    }
  }

  async updateAboutPageContent(data: Partial<InsertAboutPageContent>): Promise<AboutPageContent> {
    try {
      const existing = await this.getAboutPageContent();
      
      if (existing) {
        const [updated] = await db
          .update(aboutPageContent)
          .set({
            ...data,
            updated_at: new Date()
          })
          .where(eq(aboutPageContent.id, existing.id))
          .returning();
        
        return updated;
      } else {
        const [created] = await db
          .insert(aboutPageContent)
          .values({
            ...data
          } as InsertAboutPageContent)
          .returning();
        
        return created;
      }
    } catch (error) {
      console.error('Error updating about page content:', error);
      throw error;
    }
  }

  async updateAboutPageContentField(field: string, value: string | null): Promise<void> {
    try {
      const existing = await this.getAboutPageContent();
      
      if (existing) {
        await db
          .update(aboutPageContent)
          .set({
            [field]: value,
            updated_at: new Date()
          })
          .where(eq(aboutPageContent.id, existing.id));
      } else {
        // Создаем запись с дефолтными значениями и устанавливаем нужное поле
        await db
          .insert(aboutPageContent)
          .values({
            [field]: value
          } as any);
      }
    } catch (error) {
      console.error('Error updating about page content field:', error);
      throw error;
    }
  }

  // Withdrawal requests management
  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const result = await db.insert(withdrawalRequests).values(request).returning();
    return result[0];
  }

  async getWithdrawalRequests(userId: number): Promise<WithdrawalRequest[]> {
    return await db.select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.user_id, userId))
      .orderBy(desc(withdrawalRequests.created_at));
  }

  async getAllWithdrawalRequests(params: { limit?: number; offset?: number }): Promise<{ requests: WithdrawalRequest[]; total: number }> {
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const [requests, totalResult] = await Promise.all([
      db.select().from(withdrawalRequests)
        .orderBy(desc(withdrawalRequests.created_at))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(withdrawalRequests)
    ]);

    return {
      requests,
      total: totalResult[0].count
    };
  }

  async updateWithdrawalRequestStatus(id: number, status: string, adminNotes?: string): Promise<WithdrawalRequest | undefined> {
    const updateData: any = {
      status,
      processed_at: status !== 'pending' ? new Date() : null
    };
    
    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    const result = await db.update(withdrawalRequests)
      .set(updateData)
      .where(eq(withdrawalRequests.id, id))
      .returning();
    
    return result[0];
  }

  // MLM Levels management
  async getMlmLevels(): Promise<MlmLevel[]> {
    return await db.select()
      .from(mlmLevels)
      .orderBy(mlmLevels.level);
  }

  async getMlmLevel(level: number): Promise<MlmLevel | undefined> {
    const result = await db.select()
      .from(mlmLevels)
      .where(eq(mlmLevels.level, level))
      .limit(1);
    return result[0];
  }

  async getUserMlmStatus(userId: number): Promise<UserMlmStatus | undefined> {
    const result = await db.select()
      .from(userMlmStatus)
      .where(eq(userMlmStatus.user_id, userId))
      .limit(1);
    return result[0];
  }

  async createUserMlmStatus(status: InsertUserMlmStatus): Promise<UserMlmStatus> {
    const result = await db.insert(userMlmStatus).values(status).returning();
    return result[0];
  }

  async updateUserMlmStatus(userId: number, data: Partial<InsertUserMlmStatus>): Promise<UserMlmStatus | undefined> {
    const result = await db.update(userMlmStatus)
      .set({ ...data, updated_at: new Date() })
      .where(eq(userMlmStatus.user_id, userId))
      .returning();
    return result[0];
  }

  async calculateUserLevel(userId: number): Promise<{ currentLevel: number; nextLevel: MlmLevel | null; requiredReferrals: number }> {
    // Получаем количество рефералов пользователя
    const referralCount = await db.select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(eq(referrals.referrer_id, userId));

    const totalReferrals = referralCount[0]?.count || 0;

    // Получаем все уровни
    const levels = await this.getMlmLevels();
    
    // Определяем текущий уровень пользователя
    let currentLevel = 1;
    let nextLevel: MlmLevel | null = null;

    for (const level of levels) {
      if (totalReferrals >= (level.required_referrals || 0)) {
        currentLevel = level.level;
      } else {
        nextLevel = level;
        break;
      }
    }

    // Обновляем статус пользователя
    const existingStatus = await this.getUserMlmStatus(userId);
    if (existingStatus) {
      await this.updateUserMlmStatus(userId, {
        current_level: currentLevel,
        total_referrals: totalReferrals
      });
    } else {
      await this.createUserMlmStatus({
        user_id: userId,
        current_level: currentLevel,
        total_referrals: totalReferrals,
        total_earnings: "0.00"
      });
    }

    const requiredForNext = nextLevel ? (nextLevel.required_referrals || 0) - totalReferrals : 0;

    return {
      currentLevel,
      nextLevel,
      requiredReferrals: requiredForNext
    };
  }
}

export const storage = new PostgresStorage();
