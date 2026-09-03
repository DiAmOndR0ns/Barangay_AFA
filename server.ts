process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { getPool, isDatabaseConfigured, fetchAllDataFromPostgres, saveFullStateToPostgres } from "./src/api/db";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));

  // API to Check Live Cloud Database (Supabase / PostgreSQL) Status
  app.get("/api/db/status", async (req, res) => {
    const rawUrl = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '');

    if (!rawUrl) {
      return res.json({
        connected: false,
        configured: false,
        provider: 'Local Storage',
        message: 'DATABASE_URL is missing from environment. Please check your environment variables and restart/redeploy.',
      });
    }

    if (rawUrl.includes('[YOUR-PASSWORD]') || rawUrl.includes('<password>') || rawUrl.includes('YOUR_PASSWORD')) {
      return res.json({
        connected: false,
        configured: false,
        provider: 'Supabase',
        message: 'DATABASE_URL still contains placeholder "[YOUR-PASSWORD]". Replace it with your real password.',
      });
    }

    if (/:\[[^\]]+\]@/.test(rawUrl)) {
      return res.json({
        connected: false,
        configured: false,
        provider: 'Supabase',
        message: 'DATABASE_URL has square brackets around the password like :[password]@. Remove the square brackets [ and ].',
      });
    }

    if (!rawUrl.startsWith('postgres://') && !rawUrl.startsWith('postgresql://')) {
      return res.json({
        connected: false,
        configured: false,
        provider: 'Local Storage',
        message: 'DATABASE_URL must start with "postgresql://" or "postgres://".',
      });
    }

    const isSupabase = rawUrl.toLowerCase().includes('supabase');
    const isDirectPort = rawUrl.includes(':5432') && rawUrl.includes('db.');
    const provider = isSupabase ? 'Supabase' : 'PostgreSQL';

    try {
      const pool = getPool();
      const queryPromise = pool.query('SELECT NOW() as current_time, current_database() as db_name');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          reject(new Error(
            isDirectPort
              ? 'Connection timed out after 4 seconds. You are using the Direct URI (db.xxxx.supabase.co:5432) which requires IPv6. Vercel serverless functions require the Connection Pooler URI (aws-0-*.pooler.supabase.com:6543) over IPv4.'
              : 'Connection timed out after 4 seconds. Check if your Supabase project is active (not paused) or if your database password is correct.'
          ));
        }, 4000)
      );

      const result = (await Promise.race([queryPromise, timeoutPromise])) as any;
      return res.json({
        connected: true,
        configured: true,
        provider,
        database: result.rows[0]?.db_name || 'postgres',
        timestamp: result.rows[0]?.current_time,
        message: `Connected to ${provider} (${result.rows[0]?.db_name || 'postgres'})`,
      });
    } catch (err: any) {
      const errMsg = err?.message || 'Connection failed';
      let helpfulTip = '';
      if (errMsg.includes('password authentication failed')) {
        helpfulTip = ' Password incorrect. Reset your database password in Supabase > Project Settings > Database, update DATABASE_URL in Vercel, and Redeploy.';
      } else if (errMsg.includes('timed out') || errMsg.includes('ETIMEDOUT')) {
        helpfulTip = ' If your Supabase project was paused due to inactivity, open your Supabase dashboard and click "Restore project". Also ensure you use the Transaction Pooler (port 6543).';
      }

      return res.json({
        connected: false,
        configured: true,
        provider,
        error: errMsg,
        message: `Failed to connect to ${provider}: ${errMsg}.${helpfulTip}`,
      });
    }
  });

  // API to Pull Full Data from Cloud Database (PostgreSQL / Supabase)
  app.get("/api/sync/pull", async (req, res) => {
    if (!isDatabaseConfigured()) {
      return res.json({
        success: false,
        offlineMode: true,
        message: "DATABASE_URL is not configured. Running in offline/local storage mode.",
      });
    }

    try {
      const pool = getPool();
      const pullPromise = fetchAllDataFromPostgres(pool);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cloud DB query timed out after 5 seconds.')), 5000)
      );
      const data = await Promise.race([pullPromise, timeoutPromise]);
      return res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.warn("[Cloud DB Pull Warning]:", error?.message || error);
      return res.status(200).json({
        success: false,
        offlineMode: true,
        message: `Offline fallback: ${error.message}`,
      });
    }
  });

  // API to Push Full State / Sync Updates to Cloud Database (PostgreSQL / Supabase)
  app.post("/api/sync/push", async (req, res) => {
    if (!isDatabaseConfigured()) {
      return res.json({
        success: true,
        offlineMode: true,
        message: "Saved to local offline storage (DATABASE_URL not configured).",
      });
    }

    try {
      const pool = getPool();
      const savePromise = saveFullStateToPostgres(pool, req.body);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cloud DB push timed out after 6 seconds.')), 6000)
      );
      await Promise.race([savePromise, timeoutPromise]);
      return res.json({
        success: true,
        message: "State successfully synced to PostgreSQL Cloud DB!",
      });
    } catch (error: any) {
      console.warn("[Cloud DB Push Warning]:", error?.message || error);
      return res.status(200).json({
        success: true,
        offlineMode: true,
        message: `Saved locally. Cloud sync pending reconnection: ${error?.message || 'Database unavailable'}`,
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BAFA Express server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start BAFA server:", err);
});
