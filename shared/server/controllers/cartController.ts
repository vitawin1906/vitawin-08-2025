import { Request, Response } from "express";
import { storage } from "../storage";
import { cartActionSchema } from "@shared/schema";
import { z } from "zod";

class CartController {
  async getCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        // Возвращаем пустую корзину для неавторизованных пользователей
        return res.json({
          success: true,
          cart: {
            items: [],
            summary: {
              items_count: 0,
              total_quantity: 0,
              subtotal: "0.00",
              tax: "0.00",
              total: "0.00",
            },
          },
        });
      }

      const cartItems = await storage.getCartItems(req.user.id);

      // Calculate totals
      const subtotal = cartItems.reduce((total, item) => {
        return total + (parseFloat(item.product.price) * item.quantity);
      }, 0);

      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;

      res.json({
        success: true,
        cart: {
          items: cartItems.map(item => {
            // Используем ту же логику что и в карточках товаров - приоритет массиву images
            const mainImage = item.product.images && item.product.images.length > 0 
              ? item.product.images[0] 
              : item.product.image;
              
            return {
              id: item.id,
              product: {
                id: item.product.id,
                title: item.product.title,
                price: item.product.price,
                image: mainImage,
                stock: item.product.stock,
              },
              quantity: item.quantity,
              subtotal: (parseFloat(item.product.price) * item.quantity).toFixed(2),
            };
          }),
          summary: {
            items_count: cartItems.length,
            total_quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
          },
        },
      });

    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch cart items. Please try again.",
      });
    }
  }

  async updateCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        // Для неавторизованных пользователей возвращаем успешный ответ (локальная корзина)
        return res.json({
          success: true,
          message: "Item processed in local cart. Please log in to sync with server.",
          cart: {
            items: [],
            summary: {
              items_count: 0,
              total_quantity: 0,
              subtotal: "0.00",
              tax: "0.00",
              total: "0.00",
            },
          },
        });
      }

      // Validate request body
      const validationResult = cartActionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request data",
          message: "Please provide valid cart action data",
          details: validationResult.error.errors,
        });
      }

      const { action, product_id, quantity } = validationResult.data;

      // Check if product exists
      const product = await storage.getProduct(product_id);
      if (!product) {
        return res.status(404).json({
          error: "Product not found",
          message: `Product with ID ${product_id} does not exist`,
        });
      }

      let result;

      switch (action) {
        case "add":
          if (!quantity || quantity < 1) {
            return res.status(400).json({
              error: "Invalid quantity",
              message: "Quantity must be at least 1 when adding items",
            });
          }

          // Check stock availability
          if (product.stock < quantity) {
            return res.status(400).json({
              error: "Insufficient stock",
              message: `Only ${product.stock} items available in stock`,
            });
          }

          result = await storage.addToCart({
            user_id: req.user.id,
            product_id,
            quantity,
          });
          break;

        case "update":
          if (!quantity || quantity < 1) {
            return res.status(400).json({
              error: "Invalid quantity",
              message: "Quantity must be at least 1 when updating items",
            });
          }

          // Check stock availability
          if (product.stock < quantity) {
            return res.status(400).json({
              error: "Insufficient stock",
              message: `Only ${product.stock} items available in stock`,
            });
          }

          result = await storage.updateCartItem(req.user.id, product_id, quantity);
          if (!result) {
            return res.status(404).json({
              error: "Cart item not found",
              message: "The item you're trying to update is not in your cart",
            });
          }
          break;

        case "remove":
          const removed = await storage.removeFromCart(req.user.id, product_id);
          if (!removed) {
            return res.status(404).json({
              error: "Cart item not found",
              message: "The item you're trying to remove is not in your cart",
            });
          }
          result = { success: true, message: "Item removed from cart" };
          break;

        default:
          return res.status(400).json({
            error: "Invalid action",
            message: "Action must be 'add', 'update', or 'remove'",
          });
      }

      // Get updated cart
      const updatedCart = await storage.getCartItems(req.user.id);

      res.json({
        success: true,
        message: `Cart ${action} successful`,
        cart_item: result,
        cart_summary: {
          items_count: updatedCart.length,
          total_quantity: updatedCart.reduce((sum, item) => sum + item.quantity, 0),
        },
      });

    } catch (error) {
      console.error("Update cart error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to update cart. Please try again.",
      });
    }
  }

  async removeItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        // Для неавторизованных пользователей возвращаем успешный ответ (локальная корзина)
        return res.json({
          success: true,
          message: "Item removed from local cart. Please log in to sync with server.",
        });
      }

      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({
          error: "Invalid item ID",
          message: "Please provide a valid item ID",
        });
      }

      await storage.removeCartItem(req.user.id, itemId);

      res.json({
        success: true,
        message: "Item removed from cart successfully",
      });

    } catch (error) {
      console.error("Remove cart item error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to remove item from cart. Please try again.",
      });
    }
  }

  async clearCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        // Для неавторизованных пользователей возвращаем успешный ответ (локальная корзина)
        return res.json({
          success: true,
          message: "Cart cleared from local storage. Please log in to sync with server.",
        });
      }

      await storage.clearCart(req.user.id);

      res.json({
        success: true,
        message: "Cart cleared successfully",
      });

    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to clear cart. Please try again.",
      });
    }
  }
}

export const cartController = new CartController();
