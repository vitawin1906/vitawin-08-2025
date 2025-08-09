import { Request, Response } from "express";
import { storage } from "../storage/storage/storage";
import { insertAboutPageContentSchema } from "@shared/schema";
import { z } from "zod";

class AboutPageController {
  // Получить контент страницы About
  async getAboutPageContent(req: Request, res: Response) {
    try {
      const content = await storage.getAboutPageContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching about page content:", error);
      res.status(500).json({
        error: "Server error",
        message: "Не удалось загрузить контент страницы"
      });
    }
  }

  // Обновить контент страницы About (только для админов)
  async updateAboutPageContent(req: Request, res: Response) {
    try {
      // Валидация данных
      const validationResult = insertAboutPageContentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation error",
          message: "Некорректные данные",
          details: validationResult.error.issues
        });
      }

      const updatedContent = await storage.updateAboutPageContent(validationResult.data);
      
      res.json({
        message: "Контент страницы успешно обновлен",
        content: updatedContent
      });
    } catch (error) {
      console.error("Error updating about page content:", error);
      res.status(500).json({
        error: "Server error",
        message: "Не удалось обновить контент страницы"
      });
    }
  }

  // Загрузить изображение для секции
  async uploadSectionImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded",
          message: "Изображение не было загружено"
        });
      }

      const { section } = req.body;
      
      if (!section || !['hero', 'zerowaste', 'benefits'].includes(section)) {
        return res.status(400).json({
          error: "Invalid section",
          message: "Некорректная секция"
        });
      }

      // Сохраняем файл и получаем URL
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Обновляем соответствующее поле в базе данных
      const fieldName = `${section}_image_url`;
      await storage.updateAboutPageContentField(fieldName, imageUrl);

      res.json({
        message: "Изображение успешно загружено",
        imageUrl,
        section
      });
    } catch (error) {
      console.error("Error uploading section image:", error);
      res.status(500).json({
        error: "Server error",
        message: "Не удалось загрузить изображение"
      });
    }
  }

  // Удалить изображение секции
  async removeSectionImage(req: Request, res: Response) {
    try {
      const { section } = req.params;
      
      if (!section || !['hero', 'zerowaste', 'benefits'].includes(section)) {
        return res.status(400).json({
          error: "Invalid section",
          message: "Некорректная секция"
        });
      }

      const fieldName = `${section}_image_url`;
      await storage.updateAboutPageContentField(fieldName, null);

      res.json({
        message: "Изображение успешно удалено",
        section
      });
    } catch (error) {
      console.error("Error removing section image:", error);
      res.status(500).json({
        error: "Server error",
        message: "Не удалось удалить изображение"
      });
    }
  }
}

export const aboutPageController = new AboutPageController();