import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { cacheService } from "../services/cacheService";
import { errorMonitoringService } from "../services/errorMonitoringService";

// Validation schemas
const getProductsSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
});

const productIdSchema = z.object({
  id: z.coerce.number().min(1),
});

class ProductController {
  async getProducts(req: Request, res: Response) {
    try {
      // Validate query parameters
      const validationResult = getProductsSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          message: "Please provide valid search parameters",
          details: validationResult.error.errors,
        });
      }

      const { search, limit, offset } = validationResult.data;

      // Get products from storage
      const result = await storage.getProducts({
        search,
        limit,
        offset,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(result.total / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      // Фильтруем чувствительные данные из продуктов
      const sanitizedProducts = result.products.map(product => ({
        id: product.id,
        name: product.name,
        title: product.title,
        description: product.description,
        price: product.price,
        original_price: product.original_price,
        category: product.category,
        badge: product.badge,
        image: product.image,
        images: product.images,
        stock: product.stock,
        status: product.status,
        slug: product.slug,
        benefits: product.benefits,
        key_benefits: product.key_benefits,
        quality_guarantee: product.quality_guarantee,
        composition: product.composition,
        usage_instructions: product.usage_instructions,
        contraindications: product.contraindications,
        pv_value: product.pv_value,
        // Исключаем потенциально чувствительные поля
        // created_at, updated_at, internal_notes и др.
      }));

      const response = {
        success: true,
        products: sanitizedProducts,
        pagination: {
          total: result.total,
          page: currentPage,
          totalPages,
          limit,
          offset,
        },
      };

      // Кэшируем результат только если это простой запрос без фильтров
      if (!search && offset === 0 && limit === 20) {
        cacheService.cacheProductList(response, 15); // 15 минут
      }

      res.json(response);

    } catch (error) {
      errorMonitoringService.logError("error", "Get products error", error as Error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch products. Please try again.",
      });
    }
  }

  async getProduct(req: Request, res: Response) {
    try {
      // Validate product ID
      const validationResult = productIdSchema.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid product ID",
          message: "Please provide a valid product ID",
          details: validationResult.error.errors,
        });
      }

      const { id } = validationResult.data;

      // Get product from storage
      const product = await storage.getProduct(id);

      if (!product) {
        return res.status(404).json({
          error: "Product not found",
          message: `Product with ID ${id} does not exist`,
        });
      }

      // Get related products (simple implementation - could be enhanced)
      const relatedProducts = await storage.getProducts({
        limit: 4,
        offset: 0,
      });

      const response = {
        success: true,
        product,
        related_products: relatedProducts.products.filter(p => p.id !== id).slice(0, 3),
      };

      // Кэшируем данные продукта
      cacheService.cacheProduct(id, response, 30); // 30 минут

      res.json(response);

    } catch (error) {
      errorMonitoringService.logError("error", "Get product error", error as Error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch product details. Please try again.",
      });
    }
  }

  async getRandomProducts(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      
      // Get all active products and randomize on server side
      const result = await storage.getProducts({
        limit: 50, // Get more products for better randomization
        offset: 0,
      });

      // Shuffle the products array and take the requested amount
      const shuffledProducts = result.products.sort(() => Math.random() - 0.5);
      const randomProducts = shuffledProducts.slice(0, limit);

      res.json({
        success: true,
        products: randomProducts,
        total: randomProducts.length,
      });

    } catch (error) {
      errorMonitoringService.logError("error", "Get random products error", error as Error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch random products. Please try again.",
      });
    }
  }

  async getProductBySlug(req: Request, res: Response) {
    try {
      const slug = req.params.slug;
      
      if (!slug) {
        return res.status(400).json({
          error: "Invalid slug",
          message: "Please provide a valid product slug",
        });
      }

      // Get product from storage by slug
      const product = await storage.getProductBySlug(slug);

      if (!product) {
        return res.status(404).json({
          error: "Product not found",
          message: `Product with slug "${slug}" does not exist`,
        });
      }

      res.json({
        success: true,
        product,
      });
    } catch (error) {
      console.error("Get product by slug error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch product. Please try again.",
      });
    }
  }

  async searchProducts(req: Request, res: Response) {
    try {
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          error: "Search query required",
          message: "Please provide a search query",
        });
      }

      if (query.length < 2) {
        return res.status(400).json({
          error: "Search query too short",
          message: "Search query must be at least 2 characters long",
        });
      }

      const result = await storage.getProducts({
        search: query,
        limit: 20,
        offset: 0,
      });

      res.json({
        success: true,
        query,
        products: result.products,
        total: result.total,
      });

    } catch (error) {
      console.error("Search products error:", error);
      res.status(500).json({
        error: "Search error",
        message: "Failed to search products. Please try again.",
      });
    }
  }

  async getProductsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const { limit = "20", offset = "0" } = req.query;

      if (!category) {
        return res.status(400).json({
          error: "Category required",
          message: "Please provide a valid category",
        });
      }

      // Note: This would need category support in the database schema
      // For now, we'll return all products as categories aren't implemented
      const result = await storage.getProducts({
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({
        success: true,
        category,
        products: result.products,
        total: result.total,
      });

    } catch (error) {
      console.error("Get products by category error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch products by category. Please try again.",
      });
    }
  }
}

export const productController = new ProductController();
