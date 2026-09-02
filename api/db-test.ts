import { getPool, isDatabaseConfigured, cleanDatabaseUrl } from '../src/server/db';
import { sendResponse } from './_helper';

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') return res.status(200).end();
      res.statusCode = 200;
      return res.end();
    }

    if (!isDatabaseConfigured()) {
      return sendResponse(res, 200, {
        connected: false,
        status: 'missing_config',
        message: 'DATABASE_URL is not configured on this deployment. Running in local/offline storage mode.',
      });
    }

    const startTime = Date.now();
    const pool = getPool();
    const { hostInfo } = cleanDatabaseUrl(process.env.DATABASE_URL || '');

    const timeResult = await pool.query(
      'SELECT NOW() as current_time, version() as pg_version, current_database() as db_name;'
    );

    const tablesResult = await pool.query(
      "SELECT COUNT(*)::int as table_count FROM information_schema.tables WHERE table_schema = 'public';"
    );

    const latencyMs = Date.now() - startTime;
    const dbInfo = timeResult.rows[0];
    const tableCount = tablesResult.rows[0].table_count;

    return sendResponse(res, 200, {
      connected: true,
      status: 'success',
      message: 'Successfully connected to Aiven PostgreSQL database!',
      details: {
        host: hostInfo,
        databaseName: dbInfo.db_name,
        serverTime: dbInfo.current_time,
        version: dbInfo.pg_version ? dbInfo.pg_version.split(',')[0] : 'PostgreSQL',
        publicTablesCount: tableCount,
        latencyMs,
      },
    });
  } catch (error: any) {
    console.warn('[Aiven DB Test Error]:', error?.message || error);
    return sendResponse(res, 200, {
      connected: false,
      status: 'connection_error',
      message: `Failed to connect to Aiven database: ${error.message || 'Unknown error'}`,
      errorDetails: error.stack || error.toString(),
    });
  }
}
