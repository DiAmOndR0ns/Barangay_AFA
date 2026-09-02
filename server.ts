process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express from "express";
import path from "path";
import dotenv from "dotenv";
import pg from "pg";
import { createServer as createViteServer } from "vite";
import { getPool, isDatabaseConfigured, cleanDatabaseUrl, migrateSeedData, fetchAllDataFromPostgres, saveFullStateToPostgres } from "./src/server/db";

dotenv.config();

const { Pool } = pg;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));

  // Database Connection Test Endpoint
  app.get("/api/db-test", async (req, res) => {
    if (!isDatabaseConfigured()) {
      return res.status(200).json({
        connected: false,
        status: "missing_config",
        message: "DATABASE_URL is not configured. Running in offline/local storage mode. To sync with Aiven PostgreSQL, configure DATABASE_URL in environment variables.",
      });
    }

    let pool: pg.Pool | null = null;
    try {
      const startTime = Date.now();
      pool = getPool();
      const { hostInfo } = cleanDatabaseUrl(process.env.DATABASE_URL || '');

      // Test basic connection & query DB info
      const timeResult = await pool.query(
        "SELECT NOW() as current_time, version() as pg_version, current_database() as db_name;"
      );

      // Check existing tables count
      const tablesResult = await pool.query(
        "SELECT COUNT(*)::int as table_count FROM information_schema.tables WHERE table_schema = 'public';"
      );

      const latencyMs = Date.now() - startTime;
      const dbInfo = timeResult.rows[0];
      const tableCount = tablesResult.rows[0].table_count;

      return res.json({
        connected: true,
        status: "success",
        message: "Successfully connected to Aiven PostgreSQL database!",
        details: {
          host: hostInfo,
          databaseName: dbInfo.db_name,
          serverTime: dbInfo.current_time,
          version: dbInfo.pg_version ? dbInfo.pg_version.split(",")[0] : 'PostgreSQL',
          publicTablesCount: tableCount,
          latencyMs,
        },
      });
    } catch (error: any) {
      console.warn("[Aiven DB Test Error]:", error?.message || error);
      return res.status(200).json({
        connected: false,
        status: "connection_error",
        message: `Failed to connect to Aiven database: ${error.message || "Unknown error"}`,
        errorDetails: error.toString(),
      });
    }
  });

  // API to Migrate All Seed Data into Aiven PostgreSQL
  app.post("/api/migrate-seed", async (req, res) => {
    if (!isDatabaseConfigured()) {
      return res.status(200).json({
        success: false,
        offlineMode: true,
        message: "DATABASE_URL is not configured. Seed data remains in local offline storage.",
      });
    }

    try {
      const pool = getPool();
      const summary = await migrateSeedData(pool);
      return res.json({
        success: true,
        message: "All BAFA seed data successfully migrated to Aiven PostgreSQL!",
        summary,
      });
    } catch (error: any) {
      console.error("[Aiven Seed Migration Error]:", error);
      return res.status(500).json({
        success: false,
        message: `Migration failed: ${error.message || "Unknown error"}`,
        errorDetails: error.toString(),
      });
    }
  });

  // API to Pull Full Data from Aiven PostgreSQL
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
      console.warn("[Aiven Pull Warning]:", error?.message || error);
      return res.status(200).json({
        success: false,
        offlineMode: true,
        message: `Offline fallback: ${error.message}`,
      });
    }
  });

  // API to Push Full State / Sync Updates to Aiven PostgreSQL
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
        message: "State successfully synced to Aiven PostgreSQL!",
      });
    } catch (error: any) {
      console.warn("[Aiven Push Warning]:", error?.message || error);
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
