import { Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const referralSettingsUpdateSchema = z.object({
  level1_commission: z.number().min(0).max(100),
  level2_commission: z.number().min(0).max(100),
  level3_commission: z.number().min(0).max(100),
  bonus_coins_percentage: z.number().min(0).max(100),
});

export const getReferralSettings = async (req: Request, res: Response) => {
  try {
    const settings = await storage.getReferralSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error getting referral settings:', error);
    res.status(500).json({ success: false, error: 'Failed to get referral settings' });
  }
};

export const updateReferralSettings = async (req: Request, res: Response) => {
  try {
    const validatedData = referralSettingsUpdateSchema.parse(req.body);
    
    // Конвертируем числа в строки для базы данных
    const settingsForDb = {
      level1_commission: validatedData.level1_commission.toString(),
      level2_commission: validatedData.level2_commission.toString(),
      level3_commission: validatedData.level3_commission.toString(),
      bonus_coins_percentage: validatedData.bonus_coins_percentage.toString(),
    };
    
    const settings = await storage.updateReferralSettings(settingsForDb);
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating referral settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update referral settings' });
  }
};