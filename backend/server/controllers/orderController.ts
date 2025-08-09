import { Request, Response } from "express";
import { storage } from "../storage/storage/storage";
import { checkoutSchema, type OrderItem } from "@shared/schema";
import { z } from "zod";
import { calculateBonusesInternal } from "./advancedAIController";
import { referralTransactionService } from "../services/referralTransactionService";
import { REFERRAL_CONSTANTS, calculateReferralDiscount, calculateBonusCoins, calculateReferralReward } from "@shared/referral-constants";
import { calculatePV } from "../../shared/utils/pv";
import { calculateCashback } from "../../shared/utils/bonuses";

// Helper function to award PV and cashback to user
async function awardPVAndCashback(userId: number, pvEarned: number, cashbackEarned: number) {
  const user = await storage.getUser(userId);
  if (!user) return;

  const currentPV = user.total_pv || 0;
  const currentCoins = parseFloat(user.bonus_coins || "0");

  await storage.updateUser(userId, {
    total_pv: currentPV + pvEarned,
    bonus_coins: (currentCoins + cashbackEarned).toFixed(2)
  } as any);
}

// Multi-level referral commission function - ЗАХАРДКОЖЕННЫЕ ПРОЦЕНТЫ
async function createMultiLevelReferrals(userId: number, directReferrerId: number, orderId: number, orderTotal: number) {
  const commissionRates = [
    { level: 1, rate: 0.20 }, // 20% для реферала 1-го уровня - ЗАХАРДКОЖЕНО
    { level: 2, rate: 0.05 }, // 5% для реферала 2-го уровня - ЗАХАРДКОЖЕНО  
    { level: 3, rate: 0.01 }, // 1% для реферала 3-го уровня - ЗАХАРДКОЖЕНО
  ];

  let currentReferrerId = directReferrerId;
  
  for (const { level, rate } of commissionRates) {
    if (!currentReferrerId) break;
    
    const reward = orderTotal * rate;
    
    // Create referral record
    await storage.createReferral({
      user_id: userId,
      referrer_id: currentReferrerId,
      order_id: orderId,
      referral_level: level,
      commission_rate: (rate * 100).toFixed(2), // Store as percentage
      reward_earned: reward.toFixed(2),
    });
    
    // Get the next level referrer
    const referrer = await storage.getUser(currentReferrerId);
    currentReferrerId = referrer?.referrer_id || null;
  }
}

// Additional validation schemas
const orderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
});

class OrderController {
  async checkout(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to place an order",
        });
      }

      // Validate request body
      const validationResult = checkoutSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid checkout data",
          message: "Please provide valid checkout information",
          details: validationResult.error.errors,
        });
      }

      const { items, referral_code, payment_method, delivery_info } = validationResult.data;

      if (!items || items.length === 0) {
        return res.status(400).json({
          error: "Empty cart",
          message: "Cannot checkout with an empty cart",
        });
      }

      // Validate products and check stock
      const orderItems: OrderItem[] = [];
      let total = 0;

      for (const item of items) {
        const product = await storage.getProduct(item.product_id);
        
        if (!product) {
          return res.status(404).json({
            error: "Product not found",
            message: `Product with ID ${item.product_id} does not exist`,
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: "Insufficient stock",
            message: `Not enough stock for ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}`,
          });
        }

        const itemTotal = parseFloat(product.price) * item.quantity;
        total += itemTotal;

        orderItems.push({
          product_id: product.id,
          quantity: item.quantity,
          price: product.price,
          title: product.title,
        });
      }

      // Handle referral code logic
      let referrerId = null;
      let discountAmount = 0;
      let finalTotal = total;
      
      if (referral_code && referral_code.trim() !== '') {
        const referrer = await storage.getUserByReferralCode(referral_code);
        if (!referrer) {
          return res.status(400).json({
            error: "Неверный реферальный код",
            message: "Введенный реферальный код не найден"
          });
        }
        
        // Запрет использования собственного реферального кода
        if (referrer.id === req.user.id) {
          return res.status(400).json({
            error: "Нельзя использовать собственный промокод",
            message: "Вы не можете использовать свой собственный реферальный код"
          });
        }
        
        referrerId = referrer.id;
        
        // Check if user already has an applied referral code
        const currentUser = await storage.getUser(req.user.id);
        if (!currentUser?.applied_referral_code) {
          // First time using referral code - bind it to account and apply FIXED 10% discount
          await storage.updateUser(req.user.id, {
            applied_referral_code: referral_code
          } as any);
          // ЗАХАРДКОЖЕННАЯ СКИДКА 10% - НЕ ИЗМЕНЯТЬ
          discountAmount = Math.round(total * 0.10);
          finalTotal = total - discountAmount;
        } else if (currentUser.applied_referral_code === referral_code) {
          // ЗАХАРДКОЖЕННАЯ СКИДКА 10% - НЕ ИЗМЕНЯТЬ
          discountAmount = Math.round(total * 0.10);
          finalTotal = total - discountAmount;
        } else {
          // User trying to use different referral code than the one bound to account
          return res.status(400).json({
            error: REFERRAL_CONSTANTS.ERROR_MESSAGES.CODE_ALREADY_BOUND,
            message: "К вашему аккаунту уже привязан другой реферальный код"
          });
        }
      }

      // Handle payment method with final total
      let paymentStatus = "pending";
      if (payment_method === "balance") {
        // Check if user has sufficient balance
        const user = await storage.getUser(req.user.id);
        if (!user || parseFloat(user.balance || "0") < finalTotal) {
          return res.status(400).json({
            error: "Insufficient balance",
            message: `Not enough balance. Required: ${finalTotal.toFixed(2)} ₽, Available: ${user?.balance || "0"} ₽`,
          });
        }
        
        // Deduct from balance
        await storage.updateUser(req.user.id, {
          balance: (parseFloat(user.balance || "0") - finalTotal).toFixed(2)
        } as any);
        
        paymentStatus = "paid";
      } else if (payment_method === "cash") {
        paymentStatus = "pending"; // Will be paid to courier on delivery
      }

      // Calculate PV and cashback for the order
      const pvEarned = calculatePV(finalTotal);
      const cashbackEarned = calculateCashback(finalTotal);
      
      // Create order with discount, PV and cashback information
      const order = await storage.createOrder({
        user_id: req.user.id,
        items: orderItems,
        total: total.toFixed(2),
        discount_amount: discountAmount.toFixed(2),
        final_total: finalTotal.toFixed(2),
        pv_earned: pvEarned,
        cashback_earned: cashbackEarned.toFixed(2),
        status: "pending",
        payment_method: payment_method,
        payment_status: paymentStatus,
        referral_code_used: referral_code,
        customer_info: delivery_info ? {
          fullName: delivery_info.recipient_name,
          phone: delivery_info.recipient_phone,
          address: delivery_info.address,
          city: delivery_info.address.split(',')[0] || '',
          postalCode: delivery_info.postal_code,
          deliveryService: delivery_info.service,
          paymentMethod: payment_method
        } : null,
      });

      // Create multi-level referral commissions
      if (referrerId) {
        await createMultiLevelReferrals(req.user.id, referrerId, order.id, total);
      }

      // Award PV and cashback if payment is confirmed
      if (paymentStatus === "paid") {
        await awardPVAndCashback(req.user.id, pvEarned, cashbackEarned);
        console.log(`✅ PV (${pvEarned}) и кешбэк (${cashbackEarned} ₽) начислены пользователю ${req.user.id}`);
      } else {
        console.log(`📝 Заказ ${order.id} создан, ожидает подтверждения оплаты для начисления бонусов`);
      }

      // Update product stock
      for (const item of items) {
        const product = await storage.getProduct(item.product_id);
        if (product) {
          await storage.updateProduct(item.product_id, {
            stock: product.stock - item.quantity,
          });
        }
      }

      res.json({
        success: true,
        message: "Order placed successfully",
        order: {
          id: order.id,
          total: order.total,
          status: order.status,
          items: orderItems,
          created_at: order.created_at,
        },
      });

    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({
        error: "Checkout failed",
        message: "Failed to place order. Please try again.",
      });
    }
  }

  async getUserOrders(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to view your orders",
        });
      }

      const orders = await storage.getOrders(req.user.id);

      res.json({
        success: true,
        orders: orders.map(order => ({
          id: order.id,
          user_id: order.user_id,
          items: order.items,
          total: order.total,
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          referral_code_used: order.referral_code_used,
          created_at: order.created_at,
          discount_amount: order.discount_amount,
          final_total: order.final_total,
          customer_info: order.customer_info,
          delivery_type: order.delivery_type,
          delivery_service: order.delivery_service,
          tracking_number: order.tracking_number,
        })),
      });

    } catch (error) {
      console.error("Get user orders error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch your orders. Please try again.",
      });
    }
  }

  async getOrder(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to view order details",
        });
      }

      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({
          error: "Invalid order ID",
          message: "Please provide a valid order ID",
        });
      }

      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
          message: `Order with ID ${orderId} does not exist`,
        });
      }

      // Check if the order belongs to the user (or if user is admin)
      if (order.user_id !== req.user.id && !req.user.is_admin) {
        return res.status(403).json({
          error: "Access denied",
          message: "You can only view your own orders",
        });
      }

      res.json({
        success: true,
        order: {
          id: order.id,
          user_id: order.user_id,
          items: order.items,
          total: order.total,
          status: order.status,
          referral_code_used: order.referral_code_used,
          created_at: order.created_at,
        },
      });

    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch order details. Please try again.",
      });
    }
  }

  async createOrder(req: Request, res: Response) {
    try {
      console.log('🚀 [SERVER] Получен запрос создания заказа');
      console.log('📦 [SERVER] Данные запроса:', {
        body: req.body,
        headers: req.headers,
        user: req.user?.id || 'не авторизован'
      });

      const { customerInfo, items, total, delivery_cost } = req.body;
      console.log('📋 [SERVER] Парсинг данных заказа:', { customerInfo, items, total, delivery_cost });

      if (!customerInfo || !items || !total) {
        console.error('❌ [SERVER] Недостаточно данных для создания заказа');
        return res.status(400).json({
          error: "Недостаточно данных",
          message: "Не хватает обязательных полей для создания заказа"
        });
      }

      // Calculate PV and cashback for the order
      const finalTotal = parseFloat(total.toString());
      const pvEarned = calculatePV(finalTotal);
      const cashbackEarned = calculateCashback(finalTotal);
      
      // Создаем заказ с реальными данными
      const orderData = {
        user_id: req.user?.id || null,
        items: items,
        total: total.toString(),
        discount_amount: "0",
        final_total: total.toString(),
        pv_earned: pvEarned,
        cashback_earned: cashbackEarned.toFixed(2),
        status: "pending",
        payment_method: "online",
        payment_status: "pending",
        customer_info: customerInfo,
        delivery_cost: delivery_cost || 0,
        referral_code_used: null,
      };
      
      console.log('💾 [SERVER] Подготовленные данные для сохранения:', orderData);

      const order = await storage.createOrder(orderData);
      console.log('✅ [SERVER] Заказ создан в базе данных:', order);

      // Автоматический расчет и начисление бонусов через ИИ агент
      try {
        await calculateBonusesInternal(order.id);
        console.log(`✅ [SERVER] ИИ Агент: Бонусы для заказа ${order.id} рассчитаны и начислены`);
      } catch (error) {
        console.error('⚠️ [SERVER] Ошибка расчета бонусов ИИ агентом:', error);
        // Не прерываем выполнение, если расчет бонусов не удался
      }

      const responseData = {
        success: true,
        message: "Заказ успешно создан",
        order: {
          id: order.id,
          total: order.total,
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          items: items,
          created_at: order.created_at,
        },
      };
      
      console.log('📤 [SERVER] Отправляем ответ клиенту:', responseData);
      res.json(responseData);

    } catch (error) {
      console.error("💥 [SERVER] Критическая ошибка создания заказа:", error);
      console.error('[SERVER] Детали ошибки:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      
      res.status(500).json({
        error: "Order creation failed",
        message: "Failed to create order. Please try again.",
        details: (error as any)?.message
      });
    }
  }

  async createGuestOrder(req: Request, res: Response) {
    try {
      console.log('🚀 [GUEST] Получен запрос создания гостевого заказа');
      console.log('📦 [GUEST] Данные запроса:', {
        body: req.body,
        headers: req.headers
      });

      const { customerInfo, items, total, delivery_cost } = req.body;
      console.log('📋 [GUEST] Парсинг данных заказа:', { customerInfo, items, total, delivery_cost });

      if (!customerInfo || !items || !total) {
        console.error('❌ [GUEST] Недостаточно данных для создания заказа');
        return res.status(400).json({
          error: "Недостаточно данных",
          message: "Не хватает обязательных полей для создания заказа"
        });
      }

      // Создаем гостевой заказ без user_id
      const orderData = {
        user_id: null, // Гостевой заказ
        items: items,
        total: total.toString(),
        discount_amount: "0",
        final_total: total.toString(),
        status: "pending",
        payment_method: "online",
        payment_status: "pending",
        customer_info: customerInfo,
        delivery_cost: delivery_cost || 0,
        referral_code_used: null,
      };
      
      console.log('💾 [GUEST] Подготовленные данные для сохранения:', orderData);

      const order = await storage.createOrder(orderData);
      console.log('✅ [GUEST] Гостевой заказ создан в базе данных:', order);

      const responseData = {
        success: true,
        message: "Гостевой заказ успешно создан",
        order: {
          id: order.id,
          total: order.total,
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          items: items,
          created_at: order.created_at,
        },
      };
      
      console.log('📤 [GUEST] Отправляем ответ клиенту:', responseData);
      res.json(responseData);

    } catch (error) {
      console.error("💥 [GUEST] Критическая ошибка создания гостевого заказа:", error);
      if (error instanceof Error) {
        console.error('[GUEST] Детали ошибки:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      res.status(500).json({
        error: "Guest order creation failed",
        message: "Failed to create guest order. Please try again.",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const orderController = new OrderController();