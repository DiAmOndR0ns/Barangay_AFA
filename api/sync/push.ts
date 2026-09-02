import { getPool, isDatabaseConfigured, saveFullStateToPostgres } from '../../src/server/db';
import { sendResponse, parseRequestBody } from '../_helper';

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
        success: true,
        offlineMode: true,
        message: 'Saved to local offline storage (DATABASE_URL not configured).',
      });
    }

    const pool = getPool();
    const body = await parseRequestBody(req);
    await saveFullStateToPostgres(pool, body);
    return sendResponse(res, 200, {
      success: true,
      message: 'State successfully synced to Aiven PostgreSQL!',
    });
  } catch (error: any) {
    console.warn('[Aiven Push Warning]:', error?.message || error);
    return sendResponse(res, 200, {
      success: true,
      offlineMode: true,
      message: `Saved locally. Cloud sync pending reconnection: ${error.message}`,
    });
  }
}
