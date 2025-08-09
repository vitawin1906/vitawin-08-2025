// storage/productsStorage.ts
import {
    products, product_images, categories, product_categories,
    Product, ProductInsert, ProductImage, ProductImageInsert, Category
} from "./../schemas/productsSchema.js";
import { eq, ilike, and, sql } from "drizzle-orm";
import {db} from "../config/db.js";


// =================== PRODUCTS ===================

export async function getProducts({
                                      search,
                                      category,
                                      limit = 20,
                                      offset = 0,
                                  }: {
    search?: string;
    category?: string;
    limit?: number;
    offset?: number;
}): Promise<{ products: Product[]; total: number }> {

    // Если фильтруем по категории — делаем join и отдельный query
    if (category) {
        const data = await db
            .select({ product: products }) // явно объявляем, что берем products из join-результата
            .from(products)
            .leftJoin(product_categories, eq(products.id, product_categories.product_id))
            .leftJoin(categories, eq(product_categories.category_id, categories.id))
            .where(
                and(
                    ...(search ? [ilike(products.title, `%${search}%`)] : []),
                    eq(categories.slug, category)
                )
            )
            .offset(offset)
            .limit(limit);

        // Тотал по категориям — отдельный count запрос!
        const totalRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .leftJoin(product_categories, eq(products.id, product_categories.product_id))
            .leftJoin(categories, eq(product_categories.category_id, categories.id))
            .where(
                and(
                    ...(search ? [ilike(products.title, `%${search}%`)] : []),
                    eq(categories.slug, category)
                )
            );
        const total = totalRes[0]?.count ?? 0;

        return {
            products: data.map((row) => row.product),
            total,
        };
    } else {
        // Без категории — простой select
        const where = search ? [ilike(products.title, `%${search}%`)] : [];
        const [totalRes, productsRes] = await Promise.all([
            db
                .select({ count: sql<number>`count(*)` })
                .from(products)
                .where(and(...where)),
            db
                .select()
                .from(products)
                .where(and(...where))
                .offset(offset)
                .limit(limit),
        ]);
        return {
            products: productsRes,
            total: totalRes[0]?.count ?? 0,
        };
    }
}


// Получить продукт по ID
export async function getProductById(id: number): Promise<Product | null> {
    const res = await db.select().from(products).where(eq(products.id, id));
    return res[0] ?? null;
}

// Получить продукт по slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
    const res = await db.select().from(products).where(eq(products.slug, slug));
    return res[0] ?? null;
}

// Создать продукт
export async function createProduct(data: ProductInsert): Promise<Product | undefined> {
    const [created] = await db.insert(products).values(data).returning();
    return created;
}

// Обновить продукт
export async function updateProduct(id: number, data: Partial<ProductInsert>): Promise<Product | null> {
    const [updated] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return updated ?? null;
}

// Удалить продукт (и каскадно — опционально)
export async function deleteProduct(id: number): Promise<boolean> {
    // Можно добавить удаление связанных картинок и категорий, если нужно
    await db.delete(product_images).where(eq(product_images.product_id, id));
    await db.delete(product_categories).where(eq(product_categories.product_id, id));
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    return !!deleted;
}

// =================== PRODUCT IMAGES (GALLERY) ===================

/// Получить галерею для товара
export async function getProductImages(productId: number): Promise<ProductImage[]> {
    return db.select().from(product_images).where(eq(product_images.product_id, productId));
}

// Добавить картинку к товару (если is_primary = true — сбрасываем primary у других!)
export async function addProductImage(
    productId: number,
    image: Omit<ProductImageInsert, "product_id">
): Promise<ProductImage | undefined> {
    if (image.is_primary) {
        await db.update(product_images)
            .set({ is_primary: false })
            .where(eq(product_images.product_id, productId));
    }
    const [created] = await db.insert(product_images).values({ ...image, product_id: productId }).returning();
    return created;
}


// Удалить картинку по id
export async function deleteProductImage(imageId: number): Promise<boolean> {
    const [deleted] = await db.delete(product_images).where(eq(product_images.id, imageId)).returning();
    return !!deleted;
}

export async function getPrimaryProductImage(productId: number): Promise<ProductImage | null | undefined> {
    let res = await db
        .select()
        .from(product_images)
        .where(and(
            eq(product_images.product_id, productId),
            eq(product_images.is_primary, true)
        ))
        .limit(1);

    if (res.length > 0) return res[0];

    // Fallback: вернуть первую картинку по display_order
    res = await db
        .select()
        .from(product_images)
        .where(eq(product_images.product_id, productId))
        .limit(1);
    return res[0] ?? null;
}
export async function getProductImageById(imageId: number): Promise<ProductImage | null> {
    const res = await db.select().from(product_images).where(eq(product_images.id, imageId));
    return res[0] ?? null;
}
// =================== PRODUCT CATEGORIES (MANY-TO-MANY) ===================

// Получить все категории для товара
export async function getProductCategories(productId: number): Promise<Category[]> {
    return db
        .select({ id: categories.id, name: categories.name, slug: categories.slug, seo_title: categories.seo_title, seo_description: categories.seo_description })
        .from(categories)
        .leftJoin(product_categories, eq(categories.id, product_categories.category_id))
        .where(eq(product_categories.product_id, productId));
}

// Добавить категорию к товару
export async function addProductCategory(productId: number, categoryId: number): Promise<void> {
    await db.insert(product_categories).values({ product_id: productId, category_id: categoryId });
}

// Удалить категорию у товара
export async function removeProductCategory(productId: number, categoryId: number): Promise<void> {
    await db.delete(product_categories)
        .where(and(eq(product_categories.product_id, productId), eq(product_categories.category_id, categoryId)));
}
