// schemas/productsSchema.ts
import {
    pgTable, serial, text, decimal, boolean, timestamp, integer, jsonb
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// === Products ===
export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    h1: text("h1"),
    seo_title: text("seo_title"),
    seo_description: text("seo_description"),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    original_price: decimal("original_price", { precision: 12, scale: 2 }),
    custom_pv: decimal("custom_pv", { precision: 12, scale: 2 }),
    custom_cashback: decimal("custom_cashback", { precision: 12, scale: 2 }),
    pv_auto: decimal("pv_auto", { precision: 12, scale: 2 }),
    cashback_auto: decimal("cashback_auto", { precision: 12, scale: 2 }),
    slug: text("slug").unique(),
    description: text("description"),
    long_description: text("long_description"),
    in_stock: boolean("in_stock").default(true),
    status: text("status").default("active"),
    is_pv_eligible: boolean("is_pv_eligible").default(true),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

// === Product Images ===
export const product_images = pgTable("product_images", {
    id: serial("id").primaryKey(),
    product_id: integer("product_id").references(() => products.id),
    url: text("url").notNull(),
    alt_text: text("alt_text"),
    webp_url: text("webp_url"),
    thumbnail_url: text("thumbnail_url")
});

// === Categories ===
export const categories = pgTable("categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    seo_title: text("seo_title"),
    seo_description: text("seo_description")
});

// === Product-Categories Junction (Many-to-Many) ===
export const product_categories = pgTable("product_categories", {
    product_id: integer("product_id").references(() => products.id),
    category_id: integer("category_id").references(() => categories.id),
});

// === Relations (Drizzle-style, для Joins) ===
export const productsRelations = relations(products, ({ many }) => ({
    images: many(product_images),
    productCategories: many(product_categories),
}));

export const productImagesRelations = relations(product_images, ({ one }) => ({
    product: one(products, {
        fields: [product_images.product_id],
        references: [products.id],
    }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
    productCategories: many(product_categories),
}));

export const productCategoriesRelations = relations(product_categories, ({ one }) => ({
    product: one(products, {
        fields: [product_categories.product_id],
        references: [products.id],
    }),
    category: one(categories, {
        fields: [product_categories.category_id],
        references: [categories.id],
    }),
}));

// === Типы для всей работы с products ===
export type Product = typeof products.$inferSelect;
export type ProductInsert = typeof products.$inferInsert;

export type ProductImage = typeof product_images.$inferSelect;
export type ProductImageInsert = typeof product_images.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;

export type ProductCategory = typeof product_categories.$inferSelect;
export type ProductCategoryInsert = typeof product_categories.$inferInsert;
