import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { mlmLevels } from './shared/schema.js';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// 16-уровневая MLM структура на основе матрицы
const mlmLevelsData = [
  {
    level: 1,
    name: "Актив",
    description: "Стартовый уровень для активных участников",
    percentage: "25.000",
    required_referrals: 0
  },
  {
    level: 2,
    name: "Актив +",
    description: "Повышенный уровень активности",
    percentage: "5.000",
    required_referrals: 1
  },
  {
    level: 3,
    name: "Актив pro",
    description: "Профессиональный уровень активности",
    percentage: "9.000",
    required_referrals: 2
  },
  {
    level: 4,
    name: "Партнер",
    description: "Партнерский уровень",
    percentage: "8.000",
    required_referrals: 3
  },
  {
    level: 5,
    name: "Партнер +",
    description: "Продвинутый партнер",
    percentage: "7.000",
    required_referrals: 5
  },
  {
    level: 6,
    name: "Партнер pro",
    description: "Профессиональный партнер",
    percentage: "7.000",
    required_referrals: 8
  },
  {
    level: 7,
    name: "Лидер",
    description: "Лидерский уровень",
    percentage: "7.000",
    required_referrals: 12
  },
  {
    level: 8,
    name: "Лидер +",
    description: "Продвинутый лидер",
    percentage: "7.000",
    required_referrals: 18
  },
  {
    level: 9,
    name: "Лидер pro",
    description: "Профессиональный лидер",
    percentage: "5.000",
    required_referrals: 25
  },
  {
    level: 10,
    name: "Звезда",
    description: "Звездный уровень",
    percentage: "2.000",
    required_referrals: 35
  },
  {
    level: 11,
    name: "Звезда +",
    description: "Продвинутая звезда",
    percentage: "2.000",
    required_referrals: 50
  },
  {
    level: 12,
    name: "Звезда pro",
    description: "Профессиональная звезда",
    percentage: "2.000",
    required_referrals: 70
  },
  {
    level: 13,
    name: "Топ",
    description: "Топ-уровень",
    percentage: "2.000",
    required_referrals: 100
  },
  {
    level: 14,
    name: "Топ +",
    description: "Продвинутый топ",
    percentage: "2.000",
    required_referrals: 150
  },
  {
    level: 15,
    name: "Топ pro",
    description: "Профессиональный топ",
    percentage: "2.000",
    required_referrals: 220
  },
  {
    level: 16,
    name: "Создатель",
    description: "Высший уровень - создатель сети",
    percentage: "0.250",
    required_referrals: 300
  }
];

async function initializeMlmLevels() {
  try {
    console.log('Инициализация 16-уровневой MLM структуры...');
    
    // Очистим существующие уровни
    await db.delete(mlmLevels);
    
    // Добавим новые уровни
    for (const levelData of mlmLevelsData) {
      await db.insert(mlmLevels).values(levelData);
      console.log(`✓ Добавлен уровень ${levelData.level}: ${levelData.name} (${levelData.percentage}%)`);
    }
    
    console.log('✓ MLM структура успешно инициализирована!');
    console.log(`Создано ${mlmLevelsData.length} уровней с матричными процентами`);
    
  } catch (error) {
    console.error('Ошибка при инициализации MLM структуры:', error);
  }
}

initializeMlmLevels();