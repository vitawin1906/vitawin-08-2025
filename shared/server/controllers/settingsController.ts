import { Request, Response } from 'express';
import { db } from '../storage';
import { siteSettings } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Получить значение настройки из базы данных
async function getSetting(key: string): Promise<string> {
  try {
    const result = await db.select().from(siteSettings).where(eq(siteSettings.setting_key, key)).limit(1);
    return result[0]?.setting_value || '';
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return '';
  }
}

// Сохранить настройку в базу данных
async function setSetting(key: string, value: string): Promise<void> {
  try {
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.setting_key, key)).limit(1);
    
    if (existing.length > 0) {
      await db.update(siteSettings)
        .set({ setting_value: value, updated_at: new Date() })
        .where(eq(siteSettings.setting_key, key));
    } else {
      await db.insert(siteSettings).values({
        setting_key: key,
        setting_value: value,
        setting_type: 'text'
      });
    }
    console.log(`Setting ${key} updated in database`);
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
}

// Получить несколько настроек для доставки из переменных окружения
function getDeliverySettingsData() {
  return {
    cdek_account: process.env.CDEK_API_ACCOUNT || '',
    cdek_secret: process.env.CDEK_API_SECRET || '',
    russianpost_key: process.env.RUSSIANPOST_API_KEY || '',
    yandex_key: process.env.YANDEX_DELIVERY_API_KEY || ''
  };
}

// Получить настройки доставки
export async function getDeliverySettings(req: Request, res: Response) {
  try {
    const settings = getDeliverySettingsData();
    res.json(settings);
  } catch (error) {
    console.error('Error loading delivery settings:', error);
    res.status(500).json({
      error: 'Ошибка загрузки настроек доставки'
    });
  }
}

// Сохранить настройки доставки
export async function saveDeliverySettings(req: Request, res: Response) {
  try {
    const apiKeys = req.body;
    console.log('Received delivery settings data:', apiKeys);
    
    // Обновляем переменные окружения
    process.env.CDEK_API_ACCOUNT = apiKeys.cdek_account;
    process.env.CDEK_API_SECRET = apiKeys.cdek_secret;
    process.env.RUSSIANPOST_API_KEY = apiKeys.russianpost_key;
    process.env.YANDEX_DELIVERY_API_KEY = apiKeys.yandex_key;

    res.json({
      success: true,
      message: 'Настройки доставки сохранены'
    });
  } catch (error) {
    console.error('Error saving delivery settings:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сохранения настроек доставки'
    });
  }
}

// Получить настройки скриптов
export async function getSiteSettings(req: Request, res: Response) {
  try {
    console.log('Loading site settings...');
    const headScripts = await getSetting('head_scripts');
    const bodyScripts = await getSetting('body_scripts');
    
    console.log('Loaded head_scripts:', headScripts.length, 'characters');
    console.log('Loaded body_scripts:', bodyScripts.length, 'characters');
    
    res.json({
      scripts: {
        head_scripts: headScripts,
        body_scripts: bodyScripts
      }
    });
  } catch (error) {
    console.error('Error loading site settings:', error);
    res.status(500).json({
      error: 'Ошибка загрузки настроек сайта'
    });
  }
}

// Сохранить настройки скриптов
export async function saveSiteSettings(req: Request, res: Response) {
  try {
    console.log('Received site settings data:', req.body);
    const { scripts } = req.body;
    
    if (!scripts) {
      console.log('No scripts data provided in request body');
      return res.status(400).json({
        success: false,
        error: 'Данные скриптов не предоставлены'
      });
    }

    console.log('Scripts data received:', scripts);

    // Сохраняем скрипты в базу данных
    console.log('Saving head_scripts:', scripts.head_scripts?.length || 0, 'characters');
    await setSetting('head_scripts', scripts.head_scripts || '');
    
    console.log('Saving body_scripts:', scripts.body_scripts?.length || 0, 'characters');
    await setSetting('body_scripts', scripts.body_scripts || '');

    console.log('Site settings saved successfully');
    res.json({
      success: true,
      message: 'Настройки скриптов сохранены'
    });
  } catch (error) {
    console.error('Error saving site settings:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сохранения настроек сайта: ' + (error as Error).message
    });
  }
}

// Получить все настройки
export async function getAllSettings(req: Request, res: Response) {
  try {
    const headScripts = await getSetting('head_scripts');
    const bodyScripts = await getSetting('body_scripts');
    
    const settings = {
      site_scripts: {
        head_scripts: headScripts,
        body_scripts: bodyScripts
      },
      delivery_api_keys: getDeliverySettingsData()
    };
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error loading all settings:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки настроек'
    });
  }
}

// Получить настройки скриптов для отображения на сайте
export async function getPublicScripts(req: Request, res: Response) {
  try {
    const headScripts = await getSetting('head_scripts');
    const bodyScripts = await getSetting('body_scripts');
    
    res.json({
      success: true,
      head_scripts: headScripts,
      body_scripts: bodyScripts
    });
  } catch (error) {
    console.error('Error loading public scripts:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки скриптов'
    });
  }
}