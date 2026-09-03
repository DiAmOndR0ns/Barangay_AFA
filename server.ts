process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { getPool, isDatabaseConfigured, fetchAllDataFromPostgres, saveFullStateToPostgres } from "./api/_db";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));

  // API to Check Live Cloud Database (Supabase / PostgreSQL) Status
  app.get("/api/db/status", async (req, res) => {
    if (!isDatabaseConfigured()) {
      return res.json({
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
      return res.json({
        connected: true,
        configured: true,
        provider,
        database: result.rows[0]?.db_name || 'postgres',
        timestamp: result.rows[0]?.current_time,
        message: `Connected to ${provider} (${result.rows[0]?.db_name || 'postgres'})`,
      });
    } catch (err: any) {
      return res.json({
        connected: false,
        configured: true,
        provider,
        error: err?.message || 'Connection failed',
        message: `Failed to connect to ${provider}: ${err?.message || 'Unknown error'}`,
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
      const data = await fetchAllDataFromPostgres(pool);
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
      await saveFullStateToPostgres(pool, req.body);
      return res.json({
        success: true,
        message: "State successfully synced to PostgreSQL Cloud DB!",
      });
    } catch (error: any) {
      console.warn("[Cloud DB Push Warning]:", error?.message || error);
      return res.status(200).json({
        success: true,
        offlineMode: true,
        message: `Saved locally. Cloud sync pending reconnection: ${error.message}`,
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
