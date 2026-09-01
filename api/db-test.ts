import { getPool, isDatabaseConfigured } from '../src/server/db';
import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!isDatabaseConfigured()) {
    return res.status(200).json({
      connected: false,
      status: 'missing_config',
      message: 'DATABASE_URL is not configured. Running in offline/local storage mode. To sync with Aiven PostgreSQL, configure DATABASE_URL in environment variables.',
    });
  }

  try {
    const pool = getPool();

    const timeResult = await pool.query(
      'SELECT NOW() as current_time, version() as pg_version, current_database() as db_name;'
    );

    const tablesResult = await pool.query(
      "SELECT COUNT(*)::int as table_count FROM information_schema.tables WHERE table_schema = 'public';"
    );

    const dbInfo = timeResult.rows[0];
    const tableCount = tablesResult.rows[0].table_count;

    return res.status(200).json({
      connected: true,
      status: 'success',
      message: 'Successfully connected to Aiven PostgreSQL database!',
      details: {
        databaseName: dbInfo.db_name,
        serverTime: dbInfo.current_time,
        version: dbInfo.pg_version.split(',')[0],
        publicTablesCount: tableCount,
      },
    });
  } catch (error: any) {
    console.warn('[Aiven DB Test Error]:', error?.message || error);
    return res.status(200).json({
      connected: false,
      status: 'connection_error',
      message: `Failed to connect to Aiven database: ${error.message || 'Unknown error'}`,
      errorDetails: error.toString(),
    });
  }
}
