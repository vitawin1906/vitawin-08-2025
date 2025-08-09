// backend/server/utils/pagination.ts
import { sql } from "drizzle-orm";

export type WhereBuilder = { whereSql: string; params: any[] };

/** простая экранизация значений для инлайна в raw SQL */
function escapeValue(v: any): string {
    if (v === null || v === undefined) return "NULL";
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    if (v instanceof Date) return `'${v.toISOString().replace(/'/g, "''")}'`;
    // строка по умолчанию
    return `'${String(v).replace(/'/g, "''")}'`;
}

/** подставляет $1, $2 ... значениями (экранированными) */
function bindParams(text: string, params: any[]): string {
    return text.replace(/\$(\d+)/g, (_, n) => {
        const idx = Number(n) - 1;
        return escapeValue(params[idx]);
    });
}

// конструктор WHERE без undefined
export function buildWhere(filters: Array<{ sql: string; value?: any }>): WhereBuilder {
    const parts: string[] = [];
    const params: any[] = [];
    for (const f of filters) {
        if (f.value !== undefined && f.value !== null) {
            // заменяем служебный маркер $?
            const paramIndex = params.length + 1;
            parts.push(f.sql.replace("$?", `$${paramIndex}`));
            params.push(f.value);
        }
    }
    const whereSql = parts.length ? `WHERE ${parts.join(" AND ")}` : "";
    return { whereSql, params };
}

// COUNT(*) — чистый raw, но параметры уже “связаны”
export async function getTotalRaw(db: any, baseFromSql: string, where: WhereBuilder): Promise<number> {
    const text = `SELECT COUNT(*) AS total ${baseFromSql.replace("{{WHERE}}", where.whereSql)}`;
    const finalSql = bindParams(text, where.params);
    const res = await db.execute(sql.raw(finalSql));
    // благодаря pg-types (20, 1700) total уже number; но на всякий случай Number()
    return Number((res as any).rows?.[0]?.total ?? 0);
}

// получить IDs для текущей страницы
export async function getIdsRaw(
    db: any,
    baseIdsSql: string,
    where: WhereBuilder,
    limit: number,
    offset: number
): Promise<number[]> {
    const params = [...where.params, limit, offset];
    // проставим маркеры для LIMIT/OFFSET заранее
    const text = baseIdsSql
        .replace("{{WHERE}}", where.whereSql)
        .replace("{{LIMIT}}", `$${params.length - 1}`)
        .replace("{{OFFSET}}", `$${params.length}`);

    const finalSql = bindParams(text, params);
    const res = await db.execute(sql.raw(finalSql));
    return (res as any).rows.map((r: any) => Number(r.id));
}
