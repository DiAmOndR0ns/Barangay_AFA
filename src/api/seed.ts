import { getPool, isDatabaseConfigured, ensureDatabaseSchema, migrateSeedData, saveFullStateToPostgres, getTableStats } from './db';
import { sendResponse, parseRequestBody } from './helper';

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') return res.status(200).end();
      res.statusCode = 200;
      return res.end();
    }

    if (!isDatabaseConfigured()) {
      return sendResponse(res, 400, {
        success: false,
        message: 'DATABASE_URL is not configured.',
      });
    }

    const pool = getPool();
    await ensureDatabaseSchema(pool);
    const body = await parseRequestBody(req);

    if (body && Object.keys(body).length > 0) {
      await saveFullStateToPostgres(pool, body);
    } else {
      await migrateSeedData(pool);
    }

    const stats = await getTableStats(pool);
    return sendResponse(res, 200, {
      success: true,
      message: `Successfully populated Supabase tables! (${stats.totalRecords} records across 11 tables)`,
      tableCounts: stats.tableCounts,
      totalRecords: stats.totalRecords,
    });
  } catch (error: any) {
    console.error('[Cloud DB Seed Handler Error]:', error);
    return sendResponse(res, 500, {
      success: false,
      message: `Failed to seed database: ${error?.message || error}`,
    });
  }
}
