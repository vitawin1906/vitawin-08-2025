"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploaded_images = exports.matrix_distribution = exports.config = exports.airdrops = exports.achievements = exports.blog_posts = exports.site_settings = exports.product_categories = exports.cart_items = exports.product_images = exports.categories = exports.notifications = exports.wallet_transactions = exports.bonuses = exports.wallets = exports.user_bonus_preferences = exports.user_mlm_status = exports.network_connections = exports.orders = exports.products = exports.ranks = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// Users
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    telegram_id: (0, pg_core_1.bigint)("telegram_id", { mode: "number" }).unique(),
    name: (0, pg_core_1.text)("name"),
    email: (0, pg_core_1.text)("email").unique(),
    password_hash: (0, pg_core_1.text)("password_hash"),
    phone: (0, pg_core_1.text)("phone"),
    partner_status: (0, pg_core_1.text)("partner_status"),
    first_purchase_amount: (0, pg_core_1.decimal)("first_purchase_amount", { precision: 12, scale: 2 }),
    first_purchase_date: (0, pg_core_1.date)("first_purchase_date"),
    partner_upgrade_start_date: (0, pg_core_1.date)("partner_upgrade_start_date"),
    partner_upgrade_deadline: (0, pg_core_1.date)("partner_upgrade_deadline"),
    total_orders_amount: (0, pg_core_1.decimal)("total_orders_amount", { precision: 12, scale: 2 }).default("0"),
    lo: (0, pg_core_1.decimal)("lo", { precision: 12, scale: 2 }).default("0"),
    go: (0, pg_core_1.decimal)("go", { precision: 12, scale: 2 }).default("0"),
    is_active: (0, pg_core_1.boolean)("is_active").default(true),
    last_active_date: (0, pg_core_1.date)("last_active_date"),
    pro_badge: (0, pg_core_1.boolean)("pro_badge").default(false),
    is_admin: (0, pg_core_1.boolean)("is_admin").default(false),
    assigned_branch_number: (0, pg_core_1.integer)("assigned_branch_number"),
    personal_bonus: (0, pg_core_1.decimal)("personal_bonus", { precision: 12, scale: 2 }).default("0"),
    referral_discount_used: (0, pg_core_1.boolean)("referral_discount_used").default(false),
    referral_code: (0, pg_core_1.text)("referral_code"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Ranks
exports.ranks = (0, pg_core_1.pgTable)("ranks", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name"),
    required_pv: (0, pg_core_1.decimal)("required_pv", { precision: 12, scale: 2 }),
    required_turnover: (0, pg_core_1.decimal)("required_turnover", { precision: 12, scale: 2 }),
    bonus_percent: (0, pg_core_1.decimal)("bonus_percent", { precision: 5, scale: 2 })
});
// Products
exports.products = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    h1: (0, pg_core_1.text)("h1"),
    seo_title: (0, pg_core_1.text)("seo_title"),
    seo_description: (0, pg_core_1.text)("seo_description"),
    price: (0, pg_core_1.decimal)("price", { precision: 12, scale: 2 }).notNull(),
    original_price: (0, pg_core_1.decimal)("original_price", { precision: 12, scale: 2 }),
    custom_pv: (0, pg_core_1.decimal)("custom_pv", { precision: 12, scale: 2 }),
    custom_cashback: (0, pg_core_1.decimal)("custom_cashback", { precision: 12, scale: 2 }),
    pv_auto: (0, pg_core_1.decimal)("pv_auto", { precision: 12, scale: 2 }),
    cashback_auto: (0, pg_core_1.decimal)("cashback_auto", { precision: 12, scale: 2 }),
    slug: (0, pg_core_1.text)("slug").unique(),
    description: (0, pg_core_1.text)("description"),
    long_description: (0, pg_core_1.text)("long_description"),
    in_stock: (0, pg_core_1.boolean)("in_stock").default(true),
    status: (0, pg_core_1.text)("status").default("active"),
    is_pv_eligible: (0, pg_core_1.boolean)("is_pv_eligible").default(true),
    // legacy-compat fields
    name: (0, pg_core_1.text)("name"),
    badge: (0, pg_core_1.text)("badge"),
    image: (0, pg_core_1.text)("image"),
    images: (0, pg_core_1.jsonb)("images").default("[]"),
    category: (0, pg_core_1.text)("category"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Orders
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id").references(() => exports.users.id),
    total_price: (0, pg_core_1.decimal)("total_price", { precision: 12, scale: 2 }),
    pv_amount: (0, pg_core_1.decimal)("pv_amount", { precision: 12, scale: 2 }),
    cashback_amount: (0, pg_core_1.decimal)("cashback_amount", { precision: 12, scale: 2 }),
    status: (0, pg_core_1.text)("status"),
    delivery_service_id: (0, pg_core_1.text)("delivery_service_id"),
    delivery_address: (0, pg_core_1.text)("delivery_address"),
    is_forwarded_to_partner: (0, pg_core_1.boolean)("is_forwarded_to_partner").default(false),
    assigned_partner_id: (0, pg_core_1.integer)("assigned_partner_id").references(() => exports.users.id),
    telegram_notified: (0, pg_core_1.boolean)("telegram_notified").default(false),
    email_notified: (0, pg_core_1.boolean)("email_notified").default(false),
    checkout_return_status: (0, pg_core_1.text)("checkout_return_status"),
    source: (0, pg_core_1.text)("source"),
    is_personal_purchase: (0, pg_core_1.boolean)("is_personal_purchase").default(false),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Network connections
exports.network_connections = (0, pg_core_1.pgTable)("network_connections", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    parent_id: (0, pg_core_1.integer)("parent_id").references(() => exports.users.id),
    child_id: (0, pg_core_1.integer)("child_id").references(() => exports.users.id),
    root_id: (0, pg_core_1.integer)("root_id").references(() => exports.users.id),
    level: (0, pg_core_1.integer)("level"),
    branch_number: (0, pg_core_1.integer)("branch_number"),
    group_turnover: (0, pg_core_1.decimal)("group_turnover", { precision: 12, scale: 2 }).default("0"),
    branch_pv: (0, pg_core_1.decimal)("branch_pv", { precision: 12, scale: 2 }).default("0"),
    first_line_purchases: (0, pg_core_1.integer)("first_line_purchases").default(0),
    is_first_line: (0, pg_core_1.boolean)("is_first_line").default(false)
});
// User MLM Status
exports.user_mlm_status = (0, pg_core_1.pgTable)("user_mlm_status", {
    user_id: (0, pg_core_1.integer)("user_id").primaryKey().references(() => exports.users.id),
    current_pv: (0, pg_core_1.decimal)("current_pv", { precision: 12, scale: 2 }).default("0"),
    total_pv: (0, pg_core_1.decimal)("total_pv", { precision: 12, scale: 2 }).default("0"),
    rank_id: (0, pg_core_1.integer)("rank_id").references(() => exports.ranks.id),
    partners_count: (0, pg_core_1.integer)("partners_count").default(0),
    hold_until: (0, pg_core_1.date)("hold_until")
});
// User Bonus Preferences
exports.user_bonus_preferences = (0, pg_core_1.pgTable)("user_bonus_preferences", {
    user_id: (0, pg_core_1.integer)("user_id").primaryKey().references(() => exports.users.id),
    health_percent: (0, pg_core_1.integer)("health_percent").default(25),
    travel_percent: (0, pg_core_1.integer)("travel_percent").default(25),
    auto_percent: (0, pg_core_1.integer)("auto_percent").default(25),
    home_percent: (0, pg_core_1.integer)("home_percent").default(25)
});
// Wallets
exports.wallets = (0, pg_core_1.pgTable)("wallets", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id").unique().references(() => exports.users.id),
    balance: (0, pg_core_1.decimal)("balance", { precision: 12, scale: 2 }).default("0")
});
// Bonuses
exports.bonuses = (0, pg_core_1.pgTable)("bonuses", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id").references(() => exports.users.id),
    type: (0, pg_core_1.text)("type"),
    amount: (0, pg_core_1.decimal)("amount", { precision: 12, scale: 2 }),
    source_user_id: (0, pg_core_1.integer)("source_user_id").references(() => exports.users.id),
    order_id: (0, pg_core_1.integer)("order_id").references(() => exports.orders.id),
    date: (0, pg_core_1.timestamp)("date").defaultNow()
});
// Wallet transactions
exports.wallet_transactions = (0, pg_core_1.pgTable)("wallet_transactions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    wallet_id: (0, pg_core_1.integer)("wallet_id").references(() => exports.wallets.id),
    amount: (0, pg_core_1.decimal)("amount", { precision: 12, scale: 2 }),
    type: (0, pg_core_1.text)("type"),
    bonus_type: (0, pg_core_1.text)("bonus_type"),
    related_bonus_id: (0, pg_core_1.integer)("related_bonus_id").references(() => exports.bonuses.id),
    date: (0, pg_core_1.timestamp)("date").defaultNow()
});
// Notifications
exports.notifications = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id").references(() => exports.users.id),
    order_id: (0, pg_core_1.integer)("order_id").references(() => exports.orders.id),
    event_type: (0, pg_core_1.text)("event_type"),
    channel: (0, pg_core_1.text)("channel"),
    message: (0, pg_core_1.text)("message"),
    status: (0, pg_core_1.text)("status").default("pending"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    sent_at: (0, pg_core_1.timestamp)("sent_at")
});
// Categories
exports.categories = (0, pg_core_1.pgTable)("categories", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    slug: (0, pg_core_1.text)("slug").unique(),
    seo_title: (0, pg_core_1.text)("seo_title"),
    seo_description: (0, pg_core_1.text)("seo_description")
});
// Product Images
exports.product_images = (0, pg_core_1.pgTable)("product_images", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    product_id: (0, pg_core_1.integer)("product_id").references(() => exports.products.id),
    url: (0, pg_core_1.text)("url").notNull(),
    alt_text: (0, pg_core_1.text)("alt_text"),
    webp_url: (0, pg_core_1.text)("webp_url"),
    thumbnail_url: (0, pg_core_1.text)("thumbnail_url")
});
// Cart Items
exports.cart_items = (0, pg_core_1.pgTable)("cart_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    order_id: (0, pg_core_1.integer)("order_id").references(() => exports.orders.id),
    product_id: (0, pg_core_1.integer)("product_id").references(() => exports.products.id),
    quantity: (0, pg_core_1.integer)("quantity").default(1)
});
// Product Categories junction
exports.product_categories = (0, pg_core_1.pgTable)("product_categories", {
    product_id: (0, pg_core_1.integer)("product_id").references(() => exports.products.id),
    category_id: (0, pg_core_1.integer)("category_id").references(() => exports.categories.id)
});
// Site settings
exports.site_settings = (0, pg_core_1.pgTable)("site_settings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    setting_key: (0, pg_core_1.text)("setting_key").unique().notNull(),
    setting_value: (0, pg_core_1.text)("setting_value"),
    setting_type: (0, pg_core_1.text)("setting_type").default("text"),
    description: (0, pg_core_1.text)("description"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Blog Posts
exports.blog_posts = (0, pg_core_1.pgTable)("blog_posts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title"),
    h1: (0, pg_core_1.text)("h1"),
    seo_title: (0, pg_core_1.text)("seo_title"),
    seo_description: (0, pg_core_1.text)("seo_description"),
    slug: (0, pg_core_1.text)("slug").unique(),
    content: (0, pg_core_1.text)("content"),
    related_products: (0, pg_core_1.jsonb)("related_products").default("[]"),
    author_id: (0, pg_core_1.integer)("author_id"),
    published: (0, pg_core_1.boolean)("published").default(false),
    image_id: (0, pg_core_1.integer)("image_id"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
// Achievements
exports.achievements = (0, pg_core_1.pgTable)("achievements", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name"),
    description: (0, pg_core_1.text)("description"),
    reward_amount: (0, pg_core_1.decimal)("reward_amount", { precision: 12, scale: 2 }),
    reward_currency: (0, pg_core_1.text)("reward_currency")
});
// Airdrops
exports.airdrops = (0, pg_core_1.pgTable)("airdrops", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name"),
    description: (0, pg_core_1.text)("description"),
    reward_amount: (0, pg_core_1.decimal)("reward_amount", { precision: 12, scale: 2 }),
    reward_currency: (0, pg_core_1.text)("reward_currency"),
    trigger_type: (0, pg_core_1.text)("trigger_type"),
    start_date: (0, pg_core_1.date)("start_date"),
    end_date: (0, pg_core_1.date)("end_date")
});
// Config
exports.config = (0, pg_core_1.pgTable)("config", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    default_pv_rate: (0, pg_core_1.decimal)("default_pv_rate", { precision: 12, scale: 2 }),
    default_cashback_rate: (0, pg_core_1.decimal)("default_cashback_rate", { precision: 12, scale: 2 }),
    mlm_levels_count: (0, pg_core_1.integer)("mlm_levels_count"),
    fast_start_duration_months: (0, pg_core_1.integer)("fast_start_duration_months"),
    fast_start_first_line_percent: (0, pg_core_1.decimal)("fast_start_first_line_percent", { precision: 5, scale: 2 }),
    fast_start_after_percent: (0, pg_core_1.decimal)("fast_start_after_percent", { precision: 5, scale: 2 }),
    leader_bonus_percent: (0, pg_core_1.decimal)("leader_bonus_percent", { precision: 5, scale: 2 }),
    invite_partner_bonus_amount: (0, pg_core_1.decimal)("invite_partner_bonus_amount", { precision: 12, scale: 2 }),
    invite_pro_bonus_amount: (0, pg_core_1.decimal)("invite_pro_bonus_amount", { precision: 12, scale: 2 }),
    pro_upgrade_days: (0, pg_core_1.integer)("pro_upgrade_days"),
    referral_discount: (0, pg_core_1.decimal)("referral_discount", { precision: 5, scale: 2 }),
    group_turnover_bonus_percent: (0, pg_core_1.decimal)("group_turnover_bonus_percent", { precision: 5, scale: 2 }),
    delivery_service_api_key: (0, pg_core_1.text)("delivery_service_api_key"),
    telegram_bot_token: (0, pg_core_1.text)("telegram_bot_token"),
    double_auth_enabled: (0, pg_core_1.boolean)("double_auth_enabled").default(false),
    captcha_enabled: (0, pg_core_1.boolean)("captcha_enabled").default(true),
    default_partner_pro_id: (0, pg_core_1.integer)("default_partner_pro_id").references(() => exports.users.id)
});
// Matrix Distribution
exports.matrix_distribution = (0, pg_core_1.pgTable)("matrix_distribution", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id").references(() => exports.users.id),
    matrix_level: (0, pg_core_1.integer)("matrix_level"),
    matrix_position: (0, pg_core_1.integer)("matrix_position"),
    parent_position: (0, pg_core_1.integer)("parent_position"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
// В schema.ts добавьте эти поля к uploaded_images:
exports.uploaded_images = (0, pg_core_1.pgTable)("uploaded_images", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    filename: (0, pg_core_1.text)("filename").notNull(),
    original_filename: (0, pg_core_1.text)("original_filename"),
    url: (0, pg_core_1.text)("url"),
    alt_text: (0, pg_core_1.text)("alt_text"),
    webp_url: (0, pg_core_1.text)("webp_url"),
    thumbnail_url: (0, pg_core_1.text)("thumbnail_url"),
    mime_type: (0, pg_core_1.text)("mime_type"),
    file_size: (0, pg_core_1.integer)("file_size"),
    product_id: (0, pg_core_1.integer)("product_id").references(() => exports.products.id),
    is_primary: (0, pg_core_1.boolean)("is_primary").default(false),
    display_order: (0, pg_core_1.integer)("display_order").default(0),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
