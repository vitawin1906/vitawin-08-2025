// controllers/productsController.ts
import { Request, Response } from "express";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductUpdate, addProductImage,
} from "../storage/productsStorage.js";
import { errorMonitoringService } from "../services/errorMonitoringService.js";

// ====== Schemas ======
const getProductsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(), // slug категории
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const productIdSchema = z.object({ id: z.coerce.number().min(1) });

const decimal = z.string().regex(/^\d+(\.\d{1,2})?$/);

const productInsertSchema = z.object({
  title: z.string().min(1),
  h1: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  price: decimal,
  original_price: decimal.optional(),
  custom_pv: decimal.optional(),
  custom_cashback: decimal.optional(),
  pv_auto: decimal.optional(),
  cashback_auto: decimal.optional(),
  slug: z.string().min(1),
  description: z.string().optional(),
  long_description: z.string().optional(),
  in_stock: z.boolean().default(true),
  status: z.string().default("active"),
  is_pv_eligible: z.boolean().default(true),

  // поддержка категорий при создании
  categoryIds: z.array(z.number().int().positive()).optional(),
});

const productUpdateSchema = productInsertSchema.partial();

// ====== Controller ======
export class ProductsController {
  // GET /api/products
  async getProducts(req: Request, res: Response) {
    try {
      const parsed = getProductsSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid params", details: parsed.error });
      }
      const { search, category, limit, offset } = parsed.data;

      // удаляем undefined, чтобы не конфликтовать с exactOptionalPropertyTypes
      const rawParams = { search, category, limit, offset };
      const params = Object.fromEntries(
          Object.entries(rawParams).filter(([, v]) => v !== undefined)
      ) as { search?: string; category?: string; limit?: number; offset?: number };

      const { products, total } = await getProducts(params);

      res.json({
        success: true,
        products,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    } catch (e) {
      errorMonitoringService.logError("error", "Get products error", e as Error);
      res.status(500).json({ error: "Server error" });
    }
  }

  // GET /api/products/:id
  async getProductById(req: Request, res: Response) {
    try {
      const parsed = productIdSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: "Invalid product ID" });

      const product = await getProductById(parsed.data.id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      res.json({ success: true, product });
    } catch (e) {
      errorMonitoringService.logError("error", "Get product by ID error", e as Error);
      res.status(500).json({ error: "Server error" });
    }
  }

  // POST /api/products  (+ файл опционально)
  async createProduct(req: Request, res: Response) {
    try {
      const parsed = productInsertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid product data", details: parsed.error.format() });
      }

      const { categoryIds = [], ...productData } = parsed.data;

      // 1) создаём товар
      const product = await createProduct(productData, [], categoryIds);
      if (!product?.id) {
        return res.status(500).json({ error: "Failed to create product" });
      }

      // 2) если есть файл — добавляем одну главную картинку
      if (req.file) {
        const { path: url, filename: cloudinary_public_id } = req.file as any;
        await addProductImage(product.id, {
          url,
          alt_text: productData.title,
          cloudinary_public_id,
          is_primary: true,
          position: 1, // схема требует 1..4
        });
      }

      res.status(201).json({ success: true, product: await getProductById(product.id) });
    } catch (e) {
      errorMonitoringService.logError("error", "Create product error", e as Error);
      res.status(500).json({ error: "Server error" });
    }
  }

  // PUT /api/products/:id  (+ файл опционально для замены картинки)
  async updateProduct(req: Request, res: Response) {
    try {
      const idParsed = productIdSchema.safeParse(req.params);
      if (!idParsed.success) return res.status(400).json({ error: "Invalid product ID" });

      const dataParsed = productUpdateSchema.safeParse(req.body);
      if (!dataParsed.success) {
        return res.status(400).json({ error: "Invalid update data", details: dataParsed.error.format() });
      }

      const id = idParsed.data.id;
      const { categoryIds, ...data } = dataParsed.data as ProductUpdate & { categoryIds?: number[] };

      // Если пришёл файл — заменяем всю галерею одной главной
      let imagesPayload;
      if (req.file) {
        const { path: url, filename: cloudinary_public_id } = req.file as any;
        imagesPayload = [
          {
            url,
            alt_text: (data as any)?.title ?? undefined,
            cloudinary_public_id,
            is_primary: true,
            position: 1,
          },
        ];
      }

      const updated = await updateProduct(id, data, imagesPayload, categoryIds);
      if (!updated) return res.status(404).json({ error: "Product not found" });

      res.json({ success: true, product: updated });
    } catch (e) {
      errorMonitoringService.logError("error", "Update product error", e as Error);
      res.status(500).json({ error: "Server error" });
    }
  }

  // DELETE /api/products/:id
  async deleteProduct(req: Request, res: Response) {
    try {
      const parsed = productIdSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: "Invalid product ID" });

      const deleted = await deleteProduct(parsed.data.id);
      if (!deleted) return res.status(404).json({ error: "Product not found" });

      res.json({ success: true });
    } catch (e) {
      errorMonitoringService.logError("error", "Delete product error", e as Error);
      res.status(500).json({ error: "Server error" });
    }
  }
}

export const productsController = new ProductsController();
