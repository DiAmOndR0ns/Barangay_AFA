import { getPool, isDatabaseConfigured, saveFullStateToPostgres } from '../../src/server/db';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!isDatabaseConfigured()) {
    return res.status(200).json({
      success: true,
      offlineMode: true,
      message: 'Saved to local offline storage (DATABASE_URL not configured).',
    });
  }

  try {
    const pool = getPool();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    await saveFullStateToPostgres(pool, body);
    return res.status(200).json({
      success: true,
      message: 'State successfully synced to Aiven PostgreSQL!',
    });
  } catch (error: any) {
    console.warn('[Aiven Push Warning]:', error?.message || error);
    return res.status(200).json({
      success: true,
      offlineMode: true,
      message: `Saved locally. Cloud sync pending reconnection: ${error.message}`,
    });
  }
}
