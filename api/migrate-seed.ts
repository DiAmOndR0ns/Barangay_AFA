import { getPool, isDatabaseConfigured, migrateSeedData } from '../src/server/db';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!isDatabaseConfigured()) {
    return res.status(200).json({
      success: false,
      offlineMode: true,
      message: 'DATABASE_URL is not configured. Seed data remains in local offline storage.',
    });
  }

  try {
    const pool = getPool();
    const summary = await migrateSeedData(pool);
    return res.status(200).json({
      success: true,
      message: 'All BAFA seed data successfully migrated to Aiven PostgreSQL!',
      summary,
    });
  } catch (error: any) {
    console.error('[Aiven Seed Migration Error]:', error);
    return res.status(500).json({
      success: false,
      message: `Migration failed: ${error.message || 'Unknown error'}`,
      errorDetails: error.toString(),
    });
  }
}
