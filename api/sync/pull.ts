import { getPool, isDatabaseConfigured, fetchAllDataFromPostgres } from '../../src/server/db';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!isDatabaseConfigured()) {
    return res.status(200).json({
      success: false,
      offlineMode: true,
      message: 'DATABASE_URL is not configured. Running in offline/local storage mode.',
    });
  }

  try {
    const pool = getPool();
    const data = await fetchAllDataFromPostgres(pool);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.warn('[Aiven Pull Warning]:', error?.message || error);
    return res.status(200).json({
      success: false,
      offlineMode: true,
      message: `Offline fallback: ${error.message}`,
    });
  }
}
