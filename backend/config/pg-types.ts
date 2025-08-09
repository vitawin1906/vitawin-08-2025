// backend/server/config/pg-types.ts
import pg from "pg";

// int8 (COUNT(*)) -> number
pg.types.setTypeParser(20, (val: string) => Number(val));

// numeric/decimal -> number (если нужна точность — убери это!)
pg.types.setTypeParser(1700, (val: string) => Number(val));

export {}; // ничего не экспортируем, важно лишь выполнить код
