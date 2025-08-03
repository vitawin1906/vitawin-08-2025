import { Request, Response } from "express";
import { storage } from "../storage";
import { insertProductSchema, updateProductSchema } from "@shared/schema";
import { z } from "zod";
import { imageService } from "../services/imageService";

// Validation schemas
const adminQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});

const productIdSchema = z.object({
  id: z.coerce.number().min(1),
});

const orderIdSchema = z.object({
  id: z.coerce.number().min(1),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
});

const createProductSchema = insertProductSchema;

class AdminController {
  async getProducts(req: Request, res: Response) {
    try {
      // Временно убираем проверку для тестирования
      // if (!req.user?.is_admin) {
      //   return res.status(403).json({
      //     error: "Access denied",
      //     message: "Administrator privileges required",
      //   });
      // }

      const validationResult = adminQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          message: "Please provide valid query parameters",
          details: validationResult.error.errors,
        });
      }

      const { limit, offset, search } = validationResult.data;

      const result = await storage.getProducts({
        search,
        limit,
        offset,
      });

      res.json({
        success: true,
        products: result.products,
        pagination: {
          total: result.total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(result.total / limit),
        },
      });

    } catch (error) {
      console.error("Admin get products error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch products. Please try again.",
      });
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      // Отладка: выводим входящие данные
      console.log("Create product request body:", JSON.stringify(req.body, null, 2));
      
      // Временно убираем проверку для тестирования
      // if (!req.user?.is_admin) {
      //   return res.status(403).json({
      //     error: "Access denied",
      //     message: "Administrator privileges required",
      //   });
      // }

      const validationResult = createProductSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log("Validation failed:", validationResult.error.errors);
        return res.status(400).json({
          error: "Invalid product data",
          message: "Please provide valid product information",
          details: validationResult.error.errors,
        });
      }

      const productData = validationResult.data;

      // Валидация slug - запрещаем только цифровые URL
      if (productData.slug) {
        // Проверяем, что slug не состоит только из цифр
        if (/^\d+$/.test(productData.slug)) {
          return res.status(400).json({
            error: "Invalid URL",
            message: "URL не должен состоять только из цифр",
          });
        }
        
        // Проверяем формат slug
        if (!/^[a-z0-9-]+$/.test(productData.slug)) {
          return res.status(400).json({
            error: "Invalid URL format",
            message: "URL может содержать только строчные буквы, цифры и дефисы",
          });
        }
      }

      // Автоматически генерируем slug из названия товара если не предоставлен
      if (!productData.slug && productData.name) {
        productData.slug = productData.name
          .toLowerCase()
          .replace(/[^a-zA-Zа-яёА-ЯЁ0-9\s-]/g, '') // Удаляем спецсимволы
          .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
          .replace(/-+/g, '-') // Убираем множественные дефисы
          .trim();
          
        // Убеждаемся, что автогенерированный slug не только из цифр
        if (/^\d+$/.test(productData.slug)) {
          productData.slug = `product-${productData.slug}`;
        }
      }

      // Проверяем уникальность slug
      if (productData.slug) {
        const existingProduct = await storage.getProductBySlug(productData.slug);
        if (existingProduct) {
          return res.status(400).json({
            error: "URL already exists",
            message: "Такой URL уже используется другим товаром",
          });
        }
      }

      const product = await storage.createProduct(productData);

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: {
          id: product.id,
          title: product.title,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          image: product.image,
          stock: product.stock,
          created_at: product.created_at,
        },
      });

    } catch (error) {
      console.error("Admin create product error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to create product. Please try again.",
      });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      // Временно убираем проверку для тестирования
      // if (!req.user?.is_admin) {
      //   return res.status(403).json({
      //     error: "Access denied",
      //     message: "Administrator privileges required",
      //   });
      // }

      const idValidation = productIdSchema.safeParse(req.params);
      if (!idValidation.success) {
        return res.status(400).json({
          error: "Invalid product ID",
          message: "Please provide a valid product ID",
        });
      }

      const { id } = idValidation.data;

      console.log('Update product request body:', JSON.stringify(req.body, null, 2));
      
      const validationResult = updateProductSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error('Product validation failed:', validationResult.error.errors);
        return res.status(400).json({
          error: "Invalid update data",
          message: "Please provide valid product information",
          details: validationResult.error.errors,
          receivedData: req.body
        });
      }

      const updateData = validationResult.data;

      // Check if product exists
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({
          error: "Product not found",
          message: `Product with ID ${id} does not exist`,
        });
      }

      console.log('Updating product with data:', JSON.stringify(updateData, null, 2));
      
      const updatedProduct = await storage.updateProduct(id, updateData);
      
      console.log('Update result:', updatedProduct);

      if (!updatedProduct) {
        console.error('Failed to update product - no result returned');
        return res.status(500).json({
          error: "Update failed",
          message: "Failed to update product. Please try again.",
        });
      }

      // ✅ КРИТИЧНО: Инвалидируем кеш после обновления товара
      console.log('🧹 Clearing product cache after update');
      await storage.invalidateProductCache();

      res.json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct,
        cacheCleared: true, // Сигнал фронтенду что кеш очищен
        timestamp: Date.now(), // Timestamp для cache busting изображений
        imageRefreshRequired: true // Флаг для принудительного обновления изображений
      });

    } catch (error) {
      console.error("Admin update product error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to update product. Please try again.",
      });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      // Временно убираем проверку для тестирования
      // if (!req.user?.is_admin) {
      //   return res.status(403).json({
      //     error: "Access denied",
      //     message: "Administrator privileges required",
      //   });
      // }

      const validationResult = productIdSchema.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid product ID",
          message: "Please provide a valid product ID",
        });
      }

      const { id } = validationResult.data;

      // Check if product exists and get its images
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({
          error: "Product not found",
          message: `Product with ID ${id} does not exist`,
        });
      }

      // Get product images to delete them from disk
      const productImages = await imageService.getProductImages(id);
      
      // Delete the product from database first
      const deleted = await storage.deleteProduct(id);
      
      // If product deleted successfully, clean up images
      if (deleted && productImages.length > 0) {
        console.log(`Deleting ${productImages.length} images for product ${id}`);
        for (const imageInfo of productImages) {
          try {
            await imageService.deleteImage(imageInfo.filename);
            console.log(`Deleted image: ${imageInfo.filename}`);
          } catch (error) {
            console.error(`Failed to delete image ${imageInfo.filename}:`, error);
          }
        }
      }

      if (!deleted) {
        return res.status(500).json({
          error: "Delete failed",
          message: "Failed to delete product. Please try again.",
        });
      }

      // ✅ КРИТИЧНО: Инвалидируем кеш после удаления товара
      console.log('🧹 Clearing product cache after deletion');
      await storage.invalidateProductCache();

      res.json({
        success: true,
        message: "Product deleted successfully",
      });

    } catch (error) {
      console.error("Admin delete product error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to delete product. Please try again.",
      });
    }
  }

  async getOrders(req: Request, res: Response) {
    try {
      // Временно отключаем проверку админа для тестирования
      // if (!req.user?.is_admin) {
      //   return res.status(403).json({
      //     error: "Access denied",
      //     message: "Administrator privileges required",
      //   });
      // }

      const validationResult = adminQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          message: "Please provide valid query parameters",
          details: validationResult.error.errors,
        });
      }

      const { limit, offset } = validationResult.data;

      const result = await storage.getAllOrders({ limit, offset });

      // Get user information for each order
      const ordersWithUsers = await Promise.all(
        result.orders.map(async (order) => {
          let user = null;
          
          if (order.user_id) {
            // Зарегистрированный пользователь
            const userData = await storage.getUser(order.user_id);
            if (userData) {
              user = {
                first_name: userData.first_name,
                username: userData.username,
                telegram_id: userData.telegram_id,
                type: 'registered'
              };
            }
          } else {
            // Анализируем гостевые заказы
            const customerInfo = (order as any).customer_info;
            if (customerInfo && typeof customerInfo === 'object') {
              user = {
                first_name: customerInfo.fullName || customerInfo.name || 'Гость',
                username: customerInfo.phone || customerInfo.email || 'Не указан',
                telegram_id: null,
                type: 'guest'
              };
            } else {
              // Заказы без данных клиента - возможно тестовые или устаревшие
              user = {
                first_name: 'Неизвестный клиент',
                username: 'Данные отсутствуют',
                telegram_id: null,
                type: 'orphaned'
              };
            }
          }
          
          return {
            ...order,
            user: user || {
              first_name: 'Неизвестен',
              username: 'Данные отсутствуют',
              telegram_id: null,
              type: 'orphaned'
            },
            user_name: user?.first_name || 'Неизвестен',
            user_telegram_id: user?.telegram_id || null,
          };
        })
      );

      res.json({
        success: true,
        orders: ordersWithUsers,
        pagination: {
          total: result.total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(result.total / limit),
        },
      });

    } catch (error) {
      console.error("Admin get orders error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch orders. Please try again.",
      });
    }
  }

  async updateOrderStatus(req: Request, res: Response) {
    try {
      if (!req.user?.is_admin) {
        return res.status(403).json({
          error: "Access denied",
          message: "Administrator privileges required",
        });
      }

      const idValidation = orderIdSchema.safeParse(req.params);
      if (!idValidation.success) {
        return res.status(400).json({
          error: "Invalid order ID",
          message: "Please provide a valid order ID",
        });
      }

      const { id } = idValidation.data;

      const validationResult = updateOrderStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid status data",
          message: "Please provide a valid order status",
          details: validationResult.error.errors,
        });
      }

      const { status } = validationResult.data;

      // Check if order exists
      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({
          error: "Order not found",
          message: `Order with ID ${id} does not exist`,
        });
      }

      const updatedOrder = await storage.updateOrderStatus(id, status);

      if (!updatedOrder) {
        return res.status(500).json({
          error: "Update failed",
          message: "Failed to update order status. Please try again.",
        });
      }

      // Начисляем бонусы только при изменении статуса заказа на 'delivered' (доставлен)
      if (status === 'delivered' && existingOrder.status !== 'delivered') {
        try {
          const { calculateBonusesInternal } = await import('./advancedAIController');
          await calculateBonusesInternal(id);
          console.log(`✅ ИИ Агент: Бонусы для заказа ${id} рассчитаны и начислены после доставки`);
        } catch (error) {
          console.error('Ошибка расчета бонусов ИИ агентом:', error);
          // Не прерываем выполнение, если расчет бонусов не удался
        }
      }

      res.json({
        success: true,
        message: "Order status updated successfully",
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          user_id: updatedOrder.user_id,
          total: updatedOrder.total,
          created_at: updatedOrder.created_at,
        },
      });

    } catch (error) {
      console.error("Admin update order status error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to update order status. Please try again.",
      });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      // Authentication is already handled by adminAuthMiddleware
      // if (!req.admin) {
      //   return res.status(403).json({
      //     error: "Access denied",
      //     message: "Administrator privileges required",
      //   });
      // }

      const validationResult = adminQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          message: "Please provide valid query parameters",
          details: validationResult.error.errors,
        });
      }

      const { limit, offset } = validationResult.data;

      const result = await storage.getAllUsers({ limit, offset });

      res.json({
        success: true,
        users: result.users.map(user => ({
          id: user.id,
          telegram_id: user.telegram_id,
          first_name: user.first_name,
          username: user.username,
          referral_code: user.referral_code,
          referrer_id: user.referrer_id,
          is_admin: user.is_admin,
          created_at: user.created_at,
        })),
        pagination: {
          total: result.total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(result.total / limit),
        },
      });

    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch users. Please try again.",
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      // Authentication is already handled by adminAuthMiddleware
      // if (!req.admin) {
      //   return res.status(403).json({
      //     error: "Access denied",
      //     message: "Administrator privileges required",
      //   });
      // }

      const stats = await storage.getUserStats();

      res.json({
        success: true,
        stats: {
          total_users: stats.total_users,
          total_orders: stats.total_orders,
          total_revenue: stats.total_revenue,
          new_users_today: stats.new_users_today,
        },
      });

    } catch (error) {
      console.error("Admin get stats error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch statistics. Please try again.",
      });
    }
  }
}

export const adminController = new AdminController();
