// controllers/productsController.ts
import { Request, Response } from "express";
import * as productsStorage from "./../storage/storage/storage/productsStorage.js";
import { z } from "zod";
import { errorMonitoringService } from "../services/errorMonitoringService.js";
import { cleanObject } from "../utils/cleanObject.js"; // Создай этот хелпер, смотри ниже
import dotenv from "dotenv";

dotenv.config();

// Валидация query для поиска/фильтрации продуктов
const getProductsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const productIdSchema = z.object({ id: z.coerce.number().min(1) });
const slugSchema = z.object({ slug: z.string().min(1) });

// Для создания/обновления — делай отдельные zod-схемы на базе schema
const productInsertSchema = z.object({
  title: z.string().min(1),
  h1: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/), // decimal — строкой!
  original_price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  custom_pv: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  custom_cashback: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  pv_auto: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  cashback_auto: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  slug: z.string().min(1),
  description: z.string().optional(),
  long_description: z.string().optional(),
  in_stock: z.boolean().default(true),
  status: z.string().default("active"),
  is_pv_eligible: z.boolean().default(true),
});
const productUpdateSchema = productInsertSchema.partial();

export class ProductsController {
  async getProducts(req: Request, res: Response) {
    try {
      const parsed = getProductsSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid params", details: parsed.error });
      }
      const { search, category, limit, offset } = parsed.data;
      const params: { search?: string; category?: string; limit?: number; offset?: number } = {};
      if (search !== undefined) params.search = search;
      if (category !== undefined) params.category = category;
      if (limit !== undefined) params.limit = limit;
      if (offset !== undefined) params.offset = offset;

      const { products, total } = await productsStorage.getProducts(params);      res.json({
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

  async getProductById(req: Request, res: Response) {
    try {
      const parsed = productIdSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const product = await productsStorage.getProductById(parsed.data.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json({ success: true, product });
    } catch (e) {
      errorMonitoringService.logError("error", "Get product by id error", e as Error);
      res.status(500).json({ error: "Server error" });
    }
  }

  async getProductBySlug(req: Request, res: Response) {
    try {
      const parsed = slugSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid slug" });
      }
      const product = await productsStorage.getProductBySlug(parsed.data.slug);
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json({ success: true, product });
    } catch (e) {
      errorMonitoringService.logError("error", "Get product by slug error", e as Error);
      res.status(500).json({ error: "Server error" });
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      const parsed = productInsertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid product data", details: parsed.error });
      }
      // 1. Создаём продукт
      const product = await productsStorage.createProduct(parsed.data);

      // 2. Если есть файл — создаём картинку
      if (req.file && product?.id) {
        const { path: url, filename: cloudinary_public_id } = req.file as any;
        await productsStorage.addProductImage(product.id, {
          url,
          is_primary: true,
          alt_text: parsed.data.title,
          cloudinary_public_id,
        });
      }

      res.status(201).json({ success: true, product });
    } catch (e) {
      errorMonitoringService.logError("error", "Create product error", e as Error);
      res.status(500).json({ error: "Server error" });
    }
  }


  async updateProduct(req: Request, res: Response) {
  try {
    const idParsed = productIdSchema.safeParse(req.params);
    if (!idParsed.success) return res.status(400).json({ error: "Invalid product ID" });

    const dataParsed = productUpdateSchema.safeParse(req.body);
    if (!dataParsed.success) {
      return res.status(400).json({ error: "Invalid update data", details: dataParsed.error });
    }
    // Удаляем все undefined из данных перед передачей в storage
    const cleanedData = cleanObject(dataParsed.data);

    const updated = await productsStorage.updateProduct(idParsed.data.id, cleanedData);
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, product: updated });
  } catch (e) {
    errorMonitoringService.logError("error", "Update product error", e as Error);
    res.status(500).json({ error: "Server error" });
  }
}


async deleteProduct(req: Request, res: Response) {
    try {
      const parsed = productIdSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: "Invalid product ID" });
      const deleted = await productsStorage.deleteProduct(parsed.data.id);
      if (!deleted) return res.status(404).json({ error: "Product not found" });
      res.json({ success: true });
    } catch (e) {
      errorMonitoringService.logError("error", "Delete product error", e as Error);
      res.status(500).json({ error: "Server error" });
    }
  }
}

export const productsController = new ProductsController();
