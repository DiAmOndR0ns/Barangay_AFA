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
    
    console.log('[PUSH DEBUG] Starting push...');
    console.log('[PUSH DEBUG] Body keys:', Object.keys(body || {}));
    
    // Test 1: Can we connect?
    try {
      const testConn = await pool.query('SELECT current_user, current_database()');
      console.log('[PUSH DEBUG] Connected as:', testConn.rows[0]);
    } catch (connErr: any) {
      console.error('[PUSH DEBUG] Connection failed:', connErr.message);
      throw connErr;
    }
    
    // Test 2: Can we insert into system_logs?
    try {
      const testInsert = await pool.query(
        `INSERT INTO system_logs (id, timestamp, user_name, role, action, details, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id`,
        ['test-' + Date.now(), new Date().toISOString(), 'Test', 'System', 'Test', 'Push test', 'synced']
      );
      console.log('[PUSH DEBUG] Test insert successful:', testInsert.rows[0]);
      
      // Clean up test
      await pool.query('DELETE FROM system_logs WHERE id = $1', ['test-' + Date.now()]);
    } catch (insertErr: any) {
      console.error('[PUSH DEBUG] Test insert failed:', {
        message: insertErr.message,
        code: insertErr.code,
        detail: insertErr.detail,
        hint: insertErr.hint,
        where: insertErr.where
      });
      
      return sendResponse(res, 200, {
        success: false,
        offlineMode: true,
        message: `Test insert failed: ${insertErr.message}`,
        error: insertErr.message,
        detail: insertErr.detail,
        hint: insertErr.hint
      });
    }
    
    // Now try the actual save
    console.log('[PUSH DEBUG] Calling saveFullStateToPostgres...');
    const savePromise = saveFullStateToPostgres(pool, body);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Cloud DB push timed out after 10 seconds.')), 10000)
    );

    const result = await Promise.race([savePromise, timeoutPromise]);
    console.log('[PUSH DEBUG] Save result:', result);
    
    return sendResponse(res, 200, {
      success: true,
      offlineMode: false,
      message: 'State successfully synced to PostgreSQL Cloud DB!',
    });
  } catch (error: any) {
    console.error('[PUSH DEBUG] Full error:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      where: error?.where,
      stack: error?.stack?.substring(0, 2000)
    });
    
    return sendResponse(res, 200, {
      success: false,
      offlineMode: true,
      message: `Failed to sync: ${error?.message || 'Database unavailable'}`,
      error: error?.message,
      detail: error?.detail,
      hint: error?.hint,
      where: error?.where
    });
  }
}
