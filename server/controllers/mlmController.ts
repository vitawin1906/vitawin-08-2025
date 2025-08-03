import type { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Получить все MLM уровни
export async function getMlmLevels(req: Request, res: Response) {
  try {
    const levels = await storage.getMlmLevels();
    res.json(levels);
  } catch (error) {
    console.error('Error getting MLM levels:', error);
    res.status(500).json({ 
      error: 'Ошибка получения уровней MLM',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Получить конкретный MLM уровень
export async function getMlmLevel(req: Request, res: Response) {
  try {
    const level = parseInt(req.params.level);
    if (isNaN(level) || level < 1 || level > 16) {
      return res.status(400).json({ error: 'Некорректный номер уровня' });
    }

    const mlmLevel = await storage.getMlmLevel(level);
    if (!mlmLevel) {
      return res.status(404).json({ error: 'Уровень не найден' });
    }

    res.json(mlmLevel);
  } catch (error) {
    console.error('Error getting MLM level:', error);
    res.status(500).json({ 
      error: 'Ошибка получения уровня MLM',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Получить MLM статус пользователя
export async function getUserMlmStatus(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const levelData = await storage.calculateUserLevel(userId);
    const currentLevelInfo = await storage.getMlmLevel(levelData.currentLevel);
    
    res.json({
      ...levelData,
      currentLevelInfo
    });
  } catch (error) {
    console.error('Error getting user MLM status:', error);
    res.status(500).json({ 
      error: 'Ошибка получения MLM статуса пользователя',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Получить детальную MLM статистику пользователя
export async function getUserMlmDetails(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    // Получаем статус пользователя
    const levelData = await storage.calculateUserLevel(userId);
    const currentLevelInfo = await storage.getMlmLevel(levelData.currentLevel);
    const allLevels = await storage.getMlmLevels();
    
    // Получаем статистику рефералов
    const referralStats = await storage.getReferralStats(userId);
    
    // Вычисляем прогресс до следующего уровня
    const progressPercentage = levelData.nextLevel 
      ? Math.round((((levelData.nextLevel.required_referrals || 0) - levelData.requiredReferrals) / (levelData.nextLevel.required_referrals || 1)) * 100)
      : 100;

    res.json({
      currentLevel: levelData.currentLevel,
      currentLevelInfo,
      nextLevel: levelData.nextLevel,
      totalReferrals: referralStats.total_referrals,
      requiredForNext: levelData.requiredReferrals,
      progressPercentage,
      allLevels,
      referralStats
    });
  } catch (error) {
    console.error('Error getting user MLM details:', error);
    res.status(500).json({ 
      error: 'Ошибка получения детальной MLM статистики',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Пересчитать уровень пользователя (админская функция)
export async function recalculateUserLevel(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }

    const levelData = await storage.calculateUserLevel(userIdNum);
    res.json({
      message: 'Уровень пользователя пересчитан',
      ...levelData
    });
  } catch (error) {
    console.error('Error recalculating user level:', error);
    res.status(500).json({ 
      error: 'Ошибка пересчета уровня пользователя',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}