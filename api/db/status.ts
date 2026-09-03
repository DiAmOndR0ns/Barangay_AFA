import type { IncomingMessage, ServerResponse } from 'http';
import { isDatabaseConfigured, getPool } from '../_db';
import { sendResponse } from '../_helper';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!isDatabaseConfigured()) {
    return sendResponse(res, 200, {
      connected: false,
      configured: false,
      provider: 'Local Storage',
      message: 'DATABASE_URL is not set or contains placeholder text.',
    });
  }

  const rawUrl = process.env.DATABASE_URL || '';
  const isSupabase = rawUrl.toLowerCase().includes('supabase');
  const provider = isSupabase ? 'Supabase' : 'PostgreSQL';

  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    return sendResponse(res, 200, {
      connected: true,
      configured: true,
      provider,
      database: result.rows[0]?.db_name || 'postgres',
      timestamp: result.rows[0]?.current_time,
      message: `Connected to ${provider} (${result.rows[0]?.db_name || 'postgres'})`,
    });
  } catch (err: any) {
    return sendResponse(res, 200, {
      connected: false,
      configured: true,
      provider,
      error: err?.message || 'Connection failed',
      message: `Failed to connect to ${provider}: ${err?.message || 'Unknown error'}`,
    });
  }
}
