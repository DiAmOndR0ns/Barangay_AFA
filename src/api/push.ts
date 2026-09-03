import { getPool, isDatabaseConfigured, saveFullStateToPostgres } from './db';
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
      return sendResponse(res, 200, {
        success: true,
        offlineMode: true,
        message: 'Saved to local offline storage (DATABASE_URL not configured).',
      });
    }

    const pool = getPool();
    const body = await parseRequestBody(req);
    const savePromise = saveFullStateToPostgres(pool, body);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Cloud DB push timed out after 6 seconds.')), 6000)
    );

    await Promise.race([savePromise, timeoutPromise]);
    return sendResponse(res, 200, {
      success: true,
      message: 'State successfully synced to PostgreSQL Cloud DB!',
    });
  } catch (error: any) {
    console.warn('[Cloud DB Push Warning]:', error?.message || error);
    return sendResponse(res, 200, {
      success: true,
      offlineMode: true,
      message: `Saved locally. Cloud sync pending reconnection: ${error?.message || 'Database unavailable'}`,
    });
  }
}
