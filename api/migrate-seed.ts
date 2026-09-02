import { getPool, isDatabaseConfigured, migrateSeedData } from '../src/server/db';
import { sendResponse } from './_helper';

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
      return sendResponse(res, 200, {
        success: false,
        offlineMode: true,
        message: 'DATABASE_URL is not configured. Seed data remains in local offline storage.',
      });
    }

    const pool = getPool();
    const summary = await migrateSeedData(pool);
    return sendResponse(res, 200, {
      success: true,
      message: 'All BAFA seed data successfully migrated to Aiven PostgreSQL!',
      summary,
    });
  } catch (error: any) {
    console.error('[Aiven Seed Migration Error]:', error);
    return sendResponse(res, 500, {
      success: false,
      message: `Migration failed: ${error.message || 'Unknown error'}`,
      errorDetails: error.stack || error.toString(),
    });
  }
}
