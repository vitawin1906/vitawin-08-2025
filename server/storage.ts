import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import {
  users, ranks, orders, network_connections, user_mlm_status, user_bonus_preferences,
  wallets, bonuses, wallet_transactions, notifications, categories, products,
  product_images, cart_items, product_categories, blog_posts, uploaded_images,
  achievements, airdrops, config, matrix_distribution, site_settings
} from "@shared/schema";
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Rank = typeof ranks.$inferSelect;
export type InsertRank = typeof ranks.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type NetworkConnection = typeof network_connections.$inferSelect;
export type InsertNetworkConnection = typeof network_connections.$inferInsert;
export type UserMlmStatus = typeof user_mlm_status.$inferSelect;
export type InsertUserMlmStatus = typeof user_mlm_status.$inferInsert;
export type UserBonusPreferences = typeof user_bonus_preferences.$inferSelect;
export type InsertUserBonusPreferences = typeof user_bonus_preferences.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;
export type Bonus = typeof bonuses.$inferSelect;
export type InsertBonus = typeof bonuses.$inferInsert;
export type WalletTransaction = typeof wallet_transactions.$inferSelect;
export type InsertWalletTransaction = typeof wallet_transactions.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type ProductImage = typeof product_images.$inferSelect;
export type InsertProductImage = typeof product_images.$inferInsert;
export type CartItem = typeof cart_items.$inferSelect;
export type InsertCartItem = typeof cart_items.$inferInsert;
export type ProductCategory = typeof product_categories.$inferSelect;
export type InsertProductCategory = typeof product_categories.$inferInsert;
export type BlogPost = typeof blog_posts.$inferSelect;
export type InsertBlogPost = typeof blog_posts.$inferInsert;
export type UploadedImage = typeof uploaded_images.$inferSelect;
export type InsertUploadedImage = typeof uploaded_images.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type Airdrop = typeof airdrops.$inferSelect;
export type InsertAirdrop = typeof airdrops.$inferInsert;
export type Config = typeof config.$inferSelect;
export type InsertConfig = typeof config.$inferInsert;
export type MatrixDistribution = typeof matrix_distribution.$inferSelect;
export type InsertMatrixDistribution = typeof matrix_distribution.$inferInsert;
export type SiteSetting = typeof site_settings.$inferSelect;
export type InsertSiteSetting = typeof site_settings.$inferInsert;


const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
export const db = drizzle(pool);

function first<T>(arr: T[]): T | null {
  return arr && arr.length > 0 ? arr[0] : null;
}

export class PostgresStorage {
  async createUser(data: InsertUser): Promise<User | null> {
    return first(await db.insert(users).values(data).returning());
  }
  async getUser(id: number): Promise<User | null> {
    return first(await db.select().from(users).where(eq(users.id, id)));
  }
  async getUserByTelegramId(telegram_id: number): Promise<User | null> {
    return first(await db.select().from(users).where(eq(users.telegram_id, telegram_id)));
  }
  async getUserByEmail(email: string): Promise<User | null> {
    return first(await db.select().from(users).where(eq(users.email, email)));
  }
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | null> {
    return first(await db.update(users).set(data).where(eq(users.id, id)).returning());
  }
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createRank(data: InsertRank): Promise<Rank | null> {
    return first(await db.insert(ranks).values(data).returning());
  }
  async getRank(id: number): Promise<Rank | null> {
    return first(await db.select().from(ranks).where(eq(ranks.id, id)));
  }
  async getRanks(): Promise<Rank[]> {
    return await db.select().from(ranks);
  }
  async updateRank(id: number, data: Partial<InsertRank>): Promise<Rank | null> {
    return first(await db.update(ranks).set(data).where(eq(ranks.id, id)).returning());
  }
  async deleteRank(id: number): Promise<boolean> {
    const result = await db.delete(ranks).where(eq(ranks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createOrder(data: InsertOrder): Promise<Order | null> {
    return first(await db.insert(orders).values(data).returning());
  }
  async getOrder(id: number): Promise<Order | null> {
    return first(await db.select().from(orders).where(eq(orders.id, id)));
  }
  async getOrdersByUserId(user_id: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.user_id, user_id));
  }
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }
  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | null> {
    return first(await db.update(orders).set(data).where(eq(orders.id, id)).returning());
  }
  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createNetworkConnection(data: InsertNetworkConnection): Promise<NetworkConnection | null> {
    return first(await db.insert(network_connections).values(data).returning());
  }
  async getNetworkConnection(id: number): Promise<NetworkConnection | null> {
    return first(await db.select().from(network_connections).where(eq(network_connections.id, id)));
  }
  async getNetworkConnectionsByParent(parent_id: number): Promise<NetworkConnection[]> {
    return await db.select().from(network_connections).where(eq(network_connections.parent_id, parent_id));
  }
  async getNetworkConnectionsByChild(child_id: number): Promise<NetworkConnection[]> {
    return await db.select().from(network_connections).where(eq(network_connections.child_id, child_id));
  }
  async getNetworkConnections(): Promise<NetworkConnection[]> {
    return await db.select().from(network_connections);
  }
  async updateNetworkConnection(id: number, data: Partial<InsertNetworkConnection>): Promise<NetworkConnection | null> {
    return first(await db.update(network_connections).set(data).where(eq(network_connections.id, id)).returning());
  }
  async deleteNetworkConnection(id: number): Promise<boolean> {
    const result = await db.delete(network_connections).where(eq(network_connections.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createUserMlmStatus(data: InsertUserMlmStatus): Promise<UserMlmStatus | null> {
    return first(await db.insert(user_mlm_status).values(data).returning());
  }
  async getUserMlmStatus(user_id: number): Promise<UserMlmStatus | null> {
    return first(await db.select().from(user_mlm_status).where(eq(user_mlm_status.user_id, user_id)));
  }
  async getAllUserMlmStatus(): Promise<UserMlmStatus[]> {
    return await db.select().from(user_mlm_status);
  }
  async updateUserMlmStatus(user_id: number, data: Partial<InsertUserMlmStatus>): Promise<UserMlmStatus | null> {
    return first(await db.update(user_mlm_status).set(data).where(eq(user_mlm_status.user_id, user_id)).returning());
  }
  async deleteUserMlmStatus(user_id: number): Promise<boolean> {
    const result = await db.delete(user_mlm_status).where(eq(user_mlm_status.user_id, user_id));
    return (result.rowCount ?? 0) > 0;
  }

  async createUserBonusPreferences(data: InsertUserBonusPreferences): Promise<UserBonusPreferences | null> {
    return first(await db.insert(user_bonus_preferences).values(data).returning());
  }
  async getUserBonusPreferences(user_id: number): Promise<UserBonusPreferences | null> {
    return first(await db.select().from(user_bonus_preferences).where(eq(user_bonus_preferences.user_id, user_id)));
  }
  async getAllUserBonusPreferences(): Promise<UserBonusPreferences[]> {
    return await db.select().from(user_bonus_preferences);
  }
  async updateUserBonusPreferences(user_id: number, data: Partial<InsertUserBonusPreferences>): Promise<UserBonusPreferences | null> {
    return first(await db.update(user_bonus_preferences).set(data).where(eq(user_bonus_preferences.user_id, user_id)).returning());
  }
  async deleteUserBonusPreferences(user_id: number): Promise<boolean> {
    const result = await db.delete(user_bonus_preferences).where(eq(user_bonus_preferences.user_id, user_id));
    return (result.rowCount ?? 0) > 0;
  }

  async createWallet(data: InsertWallet): Promise<Wallet | null> {
    return first(await db.insert(wallets).values(data).returning());
  }
  async getWallet(id: number): Promise<Wallet | null> {
    return first(await db.select().from(wallets).where(eq(wallets.id, id)));
  }
  async getWalletByUserId(user_id: number): Promise<Wallet | null> {
    return first(await db.select().from(wallets).where(eq(wallets.user_id, user_id)));
  }
  async getWallets(): Promise<Wallet[]> {
    return await db.select().from(wallets);
  }
  async updateWallet(id: number, data: Partial<InsertWallet>): Promise<Wallet | null> {
    return first(await db.update(wallets).set(data).where(eq(wallets.id, id)).returning());
  }
  async deleteWallet(id: number): Promise<boolean> {
    const result = await db.delete(wallets).where(eq(wallets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createBonus(data: InsertBonus): Promise<Bonus | null> {
    return first(await db.insert(bonuses).values(data).returning());
  }
  async getBonus(id: number): Promise<Bonus | null> {
    return first(await db.select().from(bonuses).where(eq(bonuses.id, id)));
  }
  async getBonusesByUserId(user_id: number): Promise<Bonus[]> {
    return await db.select().from(bonuses).where(eq(bonuses.user_id, user_id));
  }
  async getBonuses(): Promise<Bonus[]> {
    return await db.select().from(bonuses);
  }
  async updateBonus(id: number, data: Partial<InsertBonus>): Promise<Bonus | null> {
    return first(await db.update(bonuses).set(data).where(eq(bonuses.id, id)).returning());
  }
  async deleteBonus(id: number): Promise<boolean> {
    const result = await db.delete(bonuses).where(eq(bonuses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createWalletTransaction(data: InsertWalletTransaction): Promise<WalletTransaction | null> {
    return first(await db.insert(wallet_transactions).values(data).returning());
  }
  async getWalletTransaction(id: number): Promise<WalletTransaction | null> {
    return first(await db.select().from(wallet_transactions).where(eq(wallet_transactions.id, id)));
  }
  async getWalletTransactionsByWalletId(wallet_id: number): Promise<WalletTransaction[]> {
    return await db.select().from(wallet_transactions).where(eq(wallet_transactions.wallet_id, wallet_id));
  }
  async getWalletTransactions(): Promise<WalletTransaction[]> {
    return await db.select().from(wallet_transactions);
  }
  async updateWalletTransaction(id: number, data: Partial<InsertWalletTransaction>): Promise<WalletTransaction | null> {
    return first(await db.update(wallet_transactions).set(data).where(eq(wallet_transactions.id, id)).returning());
  }
  async deleteWalletTransaction(id: number): Promise<boolean> {
    const result = await db.delete(wallet_transactions).where(eq(wallet_transactions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createNotification(data: InsertNotification): Promise<Notification | null> {
    return first(await db.insert(notifications).values(data).returning());
  }
  async getNotification(id: number): Promise<Notification | null> {
    return first(await db.select().from(notifications).where(eq(notifications.id, id)));
  }
  async getNotificationsByUserId(user_id: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.user_id, user_id));
  }
  async getNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications);
  }
  async updateNotification(id: number, data: Partial<InsertNotification>): Promise<Notification | null> {
    return first(await db.update(notifications).set(data).where(eq(notifications.id, id)).returning());
  }
  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createCategory(data: InsertCategory): Promise<Category | null> {
    return first(await db.insert(categories).values(data).returning());
  }
  async getCategory(id: number): Promise<Category | null> {
    return first(await db.select().from(categories).where(eq(categories.id, id)));
  }
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return first(await db.select().from(categories).where(eq(categories.slug, slug)));
  }
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | null> {
    return first(await db.update(categories).set(data).where(eq(categories.id, id)).returning());
  }
  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createProduct(data: InsertProduct): Promise<Product | null> {
    return first(await db.insert(products).values(data).returning());
  }
  async getProduct(id: number): Promise<Product | null> {
    return first(await db.select().from(products).where(eq(products.id, id)));
  }
  async getProductBySlug(slug: string): Promise<Product | null> {
    return first(await db.select().from(products).where(eq(products.slug, slug)));
  }
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }
  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | null> {
    return first(await db.update(products).set(data).where(eq(products.id, id)).returning());
  }
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createProductImage(data: InsertProductImage): Promise<ProductImage | null> {
    return first(await db.insert(product_images).values(data).returning());
  }
  async getProductImage(id: number): Promise<ProductImage | null> {
    return first(await db.select().from(product_images).where(eq(product_images.id, id)));
  }
  async getProductImagesByProductId(product_id: number): Promise<ProductImage[]> {
    return await db.select().from(product_images).where(eq(product_images.product_id, product_id));
  }
  async getProductImages(): Promise<ProductImage[]> {
    return await db.select().from(product_images);
  }
  async updateProductImage(id: number, data: Partial<InsertProductImage>): Promise<ProductImage | null> {
    return first(await db.update(product_images).set(data).where(eq(product_images.id, id)).returning());
  }
  async deleteProductImage(id: number): Promise<boolean> {
    const result = await db.delete(product_images).where(eq(product_images.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createCartItem(data: InsertCartItem): Promise<CartItem | null> {
    return first(await db.insert(cart_items).values(data).returning());
  }
  async getCartItem(id: number): Promise<CartItem | null> {
    return first(await db.select().from(cart_items).where(eq(cart_items.id, id)));
  }
  async getCartItemsByOrderId(order_id: number): Promise<CartItem[]> {
    return await db.select().from(cart_items).where(eq(cart_items.order_id, order_id));
  }
  async getCartItems(): Promise<CartItem[]> {
    return await db.select().from(cart_items);
  }
  async updateCartItem(id: number, data: Partial<InsertCartItem>): Promise<CartItem | null> {
    return first(await db.update(cart_items).set(data).where(eq(cart_items.id, id)).returning());
  }
  async deleteCartItem(id: number): Promise<boolean> {
    const result = await db.delete(cart_items).where(eq(cart_items.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createProductCategory(data: InsertProductCategory): Promise<ProductCategory | null> {
    return first(await db.insert(product_categories).values(data).returning());
  }
  async getProductCategoriesByProductId(product_id: number): Promise<ProductCategory[]> {
    return await db.select().from(product_categories).where(eq(product_categories.product_id, product_id));
  }
  async getProductCategoriesByCategoryId(category_id: number): Promise<ProductCategory[]> {
    return await db.select().from(product_categories).where(eq(product_categories.category_id, category_id));
  }
  async getProductCategories(): Promise<ProductCategory[]> {
    return await db.select().from(product_categories);
  }
  async deleteProductCategory(product_id: number, category_id: number): Promise<boolean> {
    const result = await db.delete(product_categories)
        .where(and(
            eq(product_categories.product_id, product_id),
            eq(product_categories.category_id, category_id)
        ));
    return (result.rowCount ?? 0) > 0;
  }

  async createBlogPost(data: InsertBlogPost): Promise<BlogPost | null> {
    return first(await db.insert(blog_posts).values(data).returning());
  }
  async getBlogPost(id: number): Promise<BlogPost | null> {
    return first(await db.select().from(blog_posts).where(eq(blog_posts.id, id)));
  }
  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    return first(await db.select().from(blog_posts).where(eq(blog_posts.slug, slug)));
  }
  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blog_posts);
  }
  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blog_posts).where(eq(blog_posts.published, true));
  }
  async updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | null> {
    return first(await db.update(blog_posts).set(data).where(eq(blog_posts.id, id)).returning());
  }
  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blog_posts).where(eq(blog_posts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createUploadedImage(data: InsertUploadedImage): Promise<UploadedImage | null> {
    return first(await db.insert(uploaded_images).values(data).returning());
  }
  async getUploadedImage(id: number): Promise<UploadedImage | null> {
    return first(await db.select().from(uploaded_images).where(eq(uploaded_images.id, id)));
  }
  async getUploadedImages(): Promise<UploadedImage[]> {
    return await db.select().from(uploaded_images);
  }
  async updateUploadedImage(id: number, data: Partial<InsertUploadedImage>): Promise<UploadedImage | null> {
    return first(await db.update(uploaded_images).set(data).where(eq(uploaded_images.id, id)).returning());
  }
  async deleteUploadedImage(id: number): Promise<boolean> {
    const result = await db.delete(uploaded_images).where(eq(uploaded_images.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createAchievement(data: InsertAchievement): Promise<Achievement | null> {
    return first(await db.insert(achievements).values(data).returning());
  }
  async getAchievement(id: number): Promise<Achievement | null> {
    return first(await db.select().from(achievements).where(eq(achievements.id, id)));
  }
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }
  async updateAchievement(id: number, data: Partial<InsertAchievement>): Promise<Achievement | null> {
    return first(await db.update(achievements).set(data).where(eq(achievements.id, id)).returning());
  }
  async deleteAchievement(id: number): Promise<boolean> {
    const result = await db.delete(achievements).where(eq(achievements.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createAirdrop(data: InsertAirdrop): Promise<Airdrop | null> {
    return first(await db.insert(airdrops).values(data).returning());
  }
  async getAirdrop(id: number): Promise<Airdrop | null> {
    return first(await db.select().from(airdrops).where(eq(airdrops.id, id)));
  }
  async getAirdrops(): Promise<Airdrop[]> {
    return await db.select().from(airdrops);
  }
  async updateAirdrop(id: number, data: Partial<InsertAirdrop>): Promise<Airdrop | null> {
    return first(await db.update(airdrops).set(data).where(eq(airdrops.id, id)).returning());
  }
  async deleteAirdrop(id: number): Promise<boolean> {
    const result = await db.delete(airdrops).where(eq(airdrops.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createConfig(data: InsertConfig): Promise<Config | null> {
    return first(await db.insert(config).values(data).returning());
  }
  async getConfig(id: number): Promise<Config | null> {
    return first(await db.select().from(config).where(eq(config.id, id)));
  }
  async getConfigs(): Promise<Config[]> {
    return await db.select().from(config);
  }
  async updateConfig(id: number, data: Partial<InsertConfig>): Promise<Config | null> {
    return first(await db.update(config).set(data).where(eq(config.id, id)).returning());
  }
  async deleteConfig(id: number): Promise<boolean> {
    const result = await db.delete(config).where(eq(config.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createMatrixDistribution(data: InsertMatrixDistribution): Promise<MatrixDistribution | null> {
    return first(await db.insert(matrix_distribution).values(data).returning());
  }
  async getMatrixDistribution(id: number): Promise<MatrixDistribution | null> {
    return first(await db.select().from(matrix_distribution).where(eq(matrix_distribution.id, id)));
  }
  async getMatrixDistributionByUserId(user_id: number): Promise<MatrixDistribution[]> {
    return await db.select().from(matrix_distribution).where(eq(matrix_distribution.user_id, user_id));
  }
  async getMatrixDistributions(): Promise<MatrixDistribution[]> {
    return await db.select().from(matrix_distribution);
  }
  async updateMatrixDistribution(id: number, data: Partial<InsertMatrixDistribution>): Promise<MatrixDistribution | null> {
    return first(await db.update(matrix_distribution).set(data).where(eq(matrix_distribution.id, id)).returning());
  }
  async deleteMatrixDistribution(id: number): Promise<boolean> {
    const result = await db.delete(matrix_distribution).where(eq(matrix_distribution.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createSiteSetting(data: InsertSiteSetting): Promise<SiteSetting | null> {
    return first(await db.insert(site_settings).values(data).returning());
  }
  async getSiteSetting(id: number): Promise<SiteSetting | null> {
    return first(await db.select().from(site_settings).where(eq(site_settings.id, id)));
  }
  async getSiteSettingByKey(setting_key: string): Promise<SiteSetting | null> {
    return first(await db.select().from(site_settings).where(eq(site_settings.setting_key, setting_key)));
  }
  async getAllSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(site_settings);
  }
  async updateSiteSetting(id: number, data: Partial<InsertSiteSetting>): Promise<SiteSetting | null> {
    return first(await db.update(site_settings).set(data).where(eq(site_settings.id, id)).returning());
  }
  async updateSiteSettingByKey(setting_key: string, data: Partial<InsertSiteSetting>): Promise<SiteSetting | null> {
    return first(await db.update(site_settings).set(data).where(eq(site_settings.setting_key, setting_key)).returning());
  }
  async deleteSiteSetting(id: number): Promise<boolean> {
    const result = await db.delete(site_settings).where(eq(site_settings.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}
export const storage = new PostgresStorage();

