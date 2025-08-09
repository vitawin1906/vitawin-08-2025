// storage/productsStorage.ts
import {
    products,
    product_images,
    categories,
    product_categories,
    type Product,
    type ProductInsert,
    type ProductImage,
    type ProductImageInsert,
    type Category,
} from "./../schemas/productsSchema.js";
import { db } from "../../config/db.js";

// Список: товар с картинками и категориями (для фронта удобнее сразу всё)
export type ProductListItem = Product & {
    images: ProductImage[];
    categories: Category[];
};

// Деталка: товар + все картинки
export type ProductWithDetails = Product & {
    images: ProductImage[];
};

// Обновление товара
export type ProductUpdate = Partial<Omit<ProductInsert, "id">>;

// =================== PRODUCTS ===================

import { eq, ilike, and, inArray } from "drizzle-orm";
// sql и count можно убрать из импорта

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
}): Promise<{ products: (Product & { images: ProductImage[]; categories: Category[] })[]; total: number }> {
    // 1) where
    const whereParts = [];
    if (search) whereParts.push(ilike(products.title, `%${search}%`));

    if (category) {
        const prodIdsRows = await db
            .select({ product_id: product_categories.product_id })
            .from(product_categories)
            .leftJoin(categories, eq(product_categories.category_id, categories.id))
            .where(eq(categories.slug, category));
        const productIds = prodIdsRows.map(r => r.product_id);
        if (productIds.length === 0) return { products: [], total: 0 };
        whereParts.push(inArray(products.id, productIds));
    }
    const whereFinal = whereParts.length ? and(...whereParts) : undefined;

    // 2) ВСЕ id под фильтром (без limit/offset) — отсюда total
    const allIdsRows = await db
        .select({ id: products.id })
        .from(products)
        .where(whereFinal ?? undefined);

    const allIds = allIdsRows.map(r => r.id);
    const total = allIds.length;
    if (total === 0) return { products: [], total: 0 };

    // 3) id текущей страницы (JS-слайсом)
    const pageIds = allIds.slice(offset, offset + limit);
    if (pageIds.length === 0) return { products: [], total };

    // 4) тянем продукты
    const pageProducts = await db
        .select({
            id: products.id,
            title: products.title,
            h1: products.h1,
            seo_title: products.seo_title,
            seo_description: products.seo_description,
            price: products.price,
            original_price: products.original_price,
            custom_pv: products.custom_pv,
            custom_cashback: products.custom_cashback,
            pv_auto: products.pv_auto,
            cashback_auto: products.cashback_auto,
            slug: products.slug,
            description: products.description,
            long_description: products.long_description,
            in_stock: products.in_stock,
            status: products.status,
            is_pv_eligible: products.is_pv_eligible,
            created_at: products.created_at,
            updated_at: products.updated_at,
        })
        .from(products)
        .where(inArray(products.id, pageIds));

    // 5) изображения батчем
    const imgs = await db
        .select()
        .from(product_images)
        .where(inArray(product_images.product_id, pageIds));
    const imagesByProduct = imgs.reduce<Record<number, ProductImage[]>>((acc, img) => {
        (acc[img.product_id] ??= []).push(img);
        return acc;
    }, {});

    // 6) категории батчем
    const cats = await db
        .select({
            product_id: product_categories.product_id,
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            seo_title: categories.seo_title,
            seo_description: categories.seo_description,
        })
        .from(product_categories)
        .leftJoin(categories, eq(product_categories.category_id, categories.id))
        .where(inArray(product_categories.product_id, pageIds));

    const categoriesByProduct = cats.reduce<Record<number, Category[]>>((acc, c) => {
        (acc[c.product_id] ??= []).push({
            id: c.id!,
            name: c.name!,
            slug: c.slug!,
            seo_title: c.seo_title ?? null,
            seo_description: c.seo_description ?? null,
        });
        return acc;
    }, {});

    // 7) склейка
    const productsJoined = pageProducts.map(p => ({
        ...p,
        images: imagesByProduct[p.id] ?? [],
        categories: categoriesByProduct[p.id] ?? [],
    }));

    return { products: productsJoined, total };
}


/**
 * Деталка товара: полный товар + все картинки
 */
export async function getProductById(id: number): Promise<ProductWithDetails | null> {
    const res = await db.select().from(products).where(eq(products.id, id));
    const product = res[0];
    if (!product) return null;

    const imgs = await db.select().from(product_images).where(eq(product_images.product_id, id));
    return { ...product, images: imgs };
}

/**
 * Создать товар. Можно передать картинки и категории.
 * Если среди картинок нет is_primary=true — первая станет главной (position=1).
 */
export async function createProduct(
    product: ProductInsert,
    images: Omit<ProductImageInsert, "product_id">[] = [],
    categoryIds: number[] = []
): Promise<ProductWithDetails | null> {
    return db.transaction(async (tx) => {
        const [created] = await tx
            .insert(products)
            .values(product)
            .returning({
                id: products.id,
                title: products.title,
                h1: products.h1,
                seo_title: products.seo_title,
                seo_description: products.seo_description,
                price: products.price,
                original_price: products.original_price,
                custom_pv: products.custom_pv,
                custom_cashback: products.custom_cashback,
                pv_auto: products.pv_auto,
                cashback_auto: products.cashback_auto,
                slug: products.slug,
                description: products.description,
                long_description: products.long_description,
                in_stock: products.in_stock,
                status: products.status,
                is_pv_eligible: products.is_pv_eligible,
                created_at: products.created_at,
                updated_at: products.updated_at,
            });
        if (!created) return null;

        const productId = created.id;

        if (images.length) {
            const hasPrimary = images.some((i) => i.is_primary === true);
            const prepared = images.map((img, idx) => ({
                ...img,
                is_primary: hasPrimary ? !!img.is_primary : idx === 0,
                position: img.position ?? idx + 1, // CHECK(1..4)
                product_id: productId,
            }));
            await tx.insert(product_images).values(prepared);
        }

        if (categoryIds.length) {
            await tx.insert(product_categories).values(
                categoryIds.map((categoryId) => ({ product_id: productId, category_id: categoryId }))
            );
        }

        const imgs = await tx.select().from(product_images).where(eq(product_images.product_id, productId));
        return { ...created, images: imgs };
    });
}

/**
 * Обновить товар. Можно полностью заменить картинки/категории.
 */
export async function updateProduct(
    id: number,
    data: ProductUpdate,
    images?: Omit<ProductImageInsert, "product_id">[],
    categoryIds?: number[]
): Promise<ProductWithDetails | null> {
    return db.transaction(async (tx) => {
        const [updated] = await tx
            .update(products)
            .set(data)
            .where(eq(products.id, id))
            .returning({
                id: products.id,
                title: products.title,
                h1: products.h1,
                seo_title: products.seo_title,
                seo_description: products.seo_description,
                price: products.price,
                original_price: products.original_price,
                custom_pv: products.custom_pv,
                custom_cashback: products.custom_cashback,
                pv_auto: products.pv_auto,
                cashback_auto: products.cashback_auto,
                slug: products.slug,
                description: products.description,
                long_description: products.long_description,
                in_stock: products.in_stock,
                status: products.status,
                is_pv_eligible: products.is_pv_eligible,
                created_at: products.created_at,
                updated_at: products.updated_at,
            });

        if (!updated) return null;

        if (images) {
            await tx.delete(product_images).where(eq(product_images.product_id, id));
            if (images.length) {
                const hasPrimary = images.some((i) => i.is_primary === true);
                const prepared = images.map((img, idx) => ({
                    ...img,
                    is_primary: hasPrimary ? !!img.is_primary : idx === 0,
                    position: img.position ?? idx + 1,
                    product_id: id,
                }));
                await tx.insert(product_images).values(prepared);
            }
        }

        if (categoryIds) {
            await tx.delete(product_categories).where(eq(product_categories.product_id, id));
            if (categoryIds.length) {
                await tx.insert(product_categories).values(
                    categoryIds.map((categoryId) => ({ product_id: id, category_id: categoryId }))
                );
            }
        }

        const imgs = await tx.select().from(product_images).where(eq(product_images.product_id, id));
        return { ...updated, images: imgs };
    });
}

// =================== IMAGES HELPERS ===================

export async function addProductImage(
    productId: number,
    image: Omit<ProductImageInsert, "product_id">
): Promise<ProductImage | undefined> {
    if (image.position == null) {
        throw new Error("product_images.position is required (1..4)");
    }
    const [inserted] = await db
        .insert(product_images)
        .values({ ...image, product_id: productId })
        .returning();
    return inserted;
}

export async function deleteProductImage(imageId: number): Promise<boolean> {
    const [deleted] = await db.delete(product_images).where(eq(product_images.id, imageId)).returning();
    return !!deleted;
}

// =================== DELETE PRODUCT ===================

export async function deleteProduct(id: number): Promise<boolean> {
    await db.delete(product_images).where(eq(product_images.product_id, id));
    await db.delete(product_categories).where(eq(product_categories.product_id, id));
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    return !!deleted;
}

// =================== OPTIONAL (для imageController) ===================

export async function getProductImageById(imageId: number): Promise<ProductImage | null> {
    const res = await db.select().from(product_images).where(eq(product_images.id, imageId));
    return res[0] ?? null;
}

export async function getProductImages(productId: number): Promise<ProductImage[]> {
    return db.select().from(product_images).where(eq(product_images.product_id, productId));
}
