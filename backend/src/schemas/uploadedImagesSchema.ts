import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const uploaded_images = pgTable("uploaded_images", {
    id: serial("id").primaryKey(),
    url: text("url"),
    alt_text: text("alt_text"),
    webp_url: text("webp_url"),
    thumbnail_url: text("thumbnail_url"),
    cloudinary_public_id: text("cloudinary_public_id"),
});

export type UploadedImage = typeof uploaded_images.$inferSelect;
export type UploadedImageInsert = typeof uploaded_images.$inferInsert;
