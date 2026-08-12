process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express from "express";
import path from "path";
import dotenv from "dotenv";
import pg from "pg";
import { createServer as createViteServer } from "vite";
import { getPool, migrateSeedData, fetchAllDataFromPostgres, saveFullStateToPostgres } from "./src/server/db";

dotenv.config();

const { Pool } = pg;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database Connection Test Endpoint
  app.get("/api/db-test", async (req, res) => {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl || dbUrl.trim() === "" || dbUrl.includes("your_aiven_connection_string")) {
      return res.status(200).json({
        connected: false,
        status: "missing_config",
        message: "DATABASE_URL is not set or contains placeholder text. Please configure your Aiven connection string in the Settings menu.",
      });
    }

    let pool: pg.Pool | null = null;
    try {
      pool = getPool();

      // Test basic connection & query DB info
      const timeResult = await pool.query(
        "SELECT NOW() as current_time, version() as pg_version, current_database() as db_name;"
      );

      // Check existing tables count
      const tablesResult = await pool.query(
        "SELECT COUNT(*)::int as table_count FROM information_schema.tables WHERE table_schema = 'public';"
      );

      const dbInfo = timeResult.rows[0];
      const tableCount = tablesResult.rows[0].table_count;

      return res.json({
        connected: true,
        status: "success",
        message: "Successfully connected to Aiven PostgreSQL database!",
        details: {
          databaseName: dbInfo.db_name,
          serverTime: dbInfo.current_time,
          version: dbInfo.pg_version.split(",")[0],
          publicTablesCount: tableCount,
        },
      });
    } catch (error: any) {
      console.error("[Aiven DB Test Error]:", error);
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
    try {
      const pool = getPool();
      const data = await fetchAllDataFromPostgres(pool);
      return res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("[Aiven Pull Error]:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch data: ${error.message}`,
      });
    }
  });

  // API to Push Full State / Sync Updates to Aiven PostgreSQL
  app.post("/api/sync/push", async (req, res) => {
    try {
      const pool = getPool();
      await saveFullStateToPostgres(pool, req.body);
      return res.json({
        success: true,
        message: "State successfully synced to Aiven PostgreSQL!",
      });
    } catch (error: any) {
      console.error("[Aiven Push Error]:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to sync state: ${error.message}`,
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
