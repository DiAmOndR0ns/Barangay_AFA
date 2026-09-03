// src/api/db.ts
import pg from "pg";

// src/utils/audit.ts
function sha256(ascii) {
  function rightRotate(value, amount) {
    return value >>> amount | value << 32 - amount;
  }
  const lengthProperty = "length";
  let i, j;
  const words = [];
  const asciiLength = ascii[lengthProperty];
  const hash = [
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ];
  const k = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ];
  const wordsLength = (asciiLength + 8 >> 6) + 1 << 4;
  for (i = 0; i < wordsLength; i++) {
    words[i] = 0;
  }
  for (i = 0; i < asciiLength; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << 24 - i % 4 * 8;
  }
  words[asciiLength >> 2] |= 128 << 24 - asciiLength % 4 * 8;
  words[wordsLength - 1] = asciiLength * 8;
  for (j = 0; j < wordsLength; j += 16) {
    const w = [];
    for (i = 0; i < 16; i++) {
      w[i] = words[j + i];
    }
    for (i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ w[i - 15] >>> 3;
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ w[i - 2] >>> 10;
      w[i] = w[i - 16] + s0 + w[i - 7] + s1 | 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = e & f ^ ~e & g;
      const temp1 = h + S1 + ch + k[i] + w[i] | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = a & b ^ a & c ^ b & c;
      const temp2 = S0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + temp1 | 0;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2 | 0;
    }
    hash[0] = hash[0] + a | 0;
    hash[1] = hash[1] + b | 0;
    hash[2] = hash[2] + c | 0;
    hash[3] = hash[3] + d | 0;
    hash[4] = hash[4] + e | 0;
    hash[5] = hash[5] + f | 0;
    hash[6] = hash[6] + g | 0;
    hash[7] = hash[7] + h | 0;
  }
  let hex = "";
  for (i = 0; i < 8; i++) {
    const word = hash[i];
    for (j = 0; j < 4; j++) {
      const byte = word >>> 24 - j * 8 & 255;
      hex += (byte < 16 ? "0" : "") + byte.toString(16);
    }
  }
  return hex;
}
function calculateLogHash(log, previousHash) {
  const contentString = [
    log.id,
    log.timestamp,
    log.user,
    log.role,
    log.action,
    log.details,
    log.syncStatus,
    previousHash
  ].join("|");
  return sha256(contentString);
}
function buildAuditChain(logs) {
  if (logs.length === 0) return [];
  const chronological = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const chainedLogs = [];
  let currentPreviousHash = "0";
  for (const log of chronological) {
    const hash = calculateLogHash(log, currentPreviousHash);
    const chainedLog = {
      ...log,
      previousHash: currentPreviousHash,
      hash
    };
    chainedLogs.push(chainedLog);
    currentPreviousHash = hash;
  }
  return chainedLogs.reverse();
}

// src/initialData.ts
var INITIAL_LOGS = buildAuditChain([
  {
    id: "log-1",
    timestamp: "2026-07-10T09:30:00Z",
    user: "Ida S Manera",
    role: "PIO",
    action: "Posted Announcement",
    details: 'Created announcement: "Free Cacao & Coffee Seedlings Distribution"',
    syncStatus: "synced",
    hash: "",
    previousHash: ""
  },
  {
    id: "log-2",
    timestamp: "2026-07-09T14:15:00Z",
    user: "Lorena B Pinote",
    role: "Auditor",
    action: "Flagged Transaction",
    details: "Flagged transaction t-4 (shared grass cutter repair) due to missing receipt.",
    syncStatus: "synced",
    hash: "",
    previousHash: ""
  },
  {
    id: "log-3",
    timestamp: "2026-07-08T11:00:00Z",
    user: "Gracelyn P Asendiente",
    role: "Treasurer",
    action: "Recorded Expense",
    details: "Logged PHP 4,500 expense for equipment maintenance (grass cutter).",
    syncStatus: "synced",
    hash: "",
    previousHash: ""
  }
]);

// src/api/db.ts
var PgPool = pg?.Pool || pg?.default?.Pool || pg?.default || pg;
var poolInstance = null;
var lastUsedConnectionString = null;
function isDatabaseConfigured() {
  const dbUrl = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, "");
  return Boolean(
    dbUrl && dbUrl !== "" && !dbUrl.includes("[YOUR-PASSWORD]") && !dbUrl.includes("<password>") && !dbUrl.includes("YOUR_PASSWORD") && !dbUrl.includes("your_aiven_connection_string") && !dbUrl.includes("your_supabase_connection_string") && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))
  );
}
function cleanDatabaseUrl(rawUrl) {
  let urlStr = rawUrl.trim().replace(/^["']|["']$/g, "");
  let hostInfo = "PostgreSQL";
  try {
    const parsed = new URL(urlStr);
    hostInfo = `${parsed.hostname}${parsed.port ? ":" + parsed.port : ""}${parsed.pathname}`;
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("ssl");
    return {
      connectionString: parsed.toString(),
      isSsl: true,
      hostInfo
    };
  } catch {
    const cleaned = urlStr.replace(/[\?&]sslmode=[^&]*/g, "").replace(/[\?&]ssl=[^&]*/g, "").replace(/\?$/, "");
    return { connectionString: cleaned, isSsl: true, hostInfo };
  }
}
function getPool() {
  const rawDbUrl = process.env.DATABASE_URL;
  if (!rawDbUrl || !isDatabaseConfigured()) {
    throw new Error("DATABASE_URL environment variable is not configured");
  }
  const { connectionString } = cleanDatabaseUrl(rawDbUrl);
  if (!poolInstance || lastUsedConnectionString !== connectionString) {
    if (poolInstance) {
      poolInstance.end().catch(() => {
      });
    }
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    poolInstance = new PgPool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5e3,
      idleTimeoutMillis: 1e4,
      max: 4
    });
    poolInstance.on("error", (err) => {
      console.warn("[PostgreSQL Pool Client Error]:", err?.message || err);
    });
    lastUsedConnectionString = connectionString;
  }
  return poolInstance;
}

// src/api/helper.ts
function sendResponse(res, statusCode, data) {
  try {
    if (res.headersSent) return;
    if (typeof res.status === "function" && typeof res.json === "function") {
      return res.status(statusCode).json(data);
    }
    res.statusCode = statusCode;
    if (typeof res.setHeader === "function") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    return res.end(JSON.stringify(data));
  } catch (err) {
    console.error("[sendResponse Error]:", err);
  }
}

// src/api/status.ts
async function handler(req, res) {
  try {
    if (req.method === "OPTIONS") {
      if (typeof res.status === "function") return res.status(200).end();
      res.statusCode = 200;
      return res.end();
    }
    const rawUrl = (process.env.DATABASE_URL || "").trim().replace(/^["']|["']$/g, "");
    if (!rawUrl) {
      return sendResponse(res, 200, {
        connected: false,
        configured: false,
        provider: "Local Storage",
        message: "DATABASE_URL is not set in Vercel environment variables. Go to Vercel Project Settings > Environment Variables, add DATABASE_URL (check Production), and Redeploy."
      });
    }
    if (rawUrl.includes("[YOUR-PASSWORD]") || rawUrl.includes("<password>") || rawUrl.includes("YOUR_PASSWORD")) {
      return sendResponse(res, 200, {
        connected: false,
        configured: false,
        provider: "Supabase",
        message: 'DATABASE_URL still contains the placeholder "[YOUR-PASSWORD]". Replace it with your actual Supabase database password in Vercel Settings and redeploy.'
      });
    }
    if (/:\[[^\]]+\]@/.test(rawUrl)) {
      return sendResponse(res, 200, {
        connected: false,
        configured: false,
        provider: "Supabase",
        message: "DATABASE_URL has square brackets around your password like :[password]@. Remove the brackets [ and ] from the password."
      });
    }
    if (!rawUrl.startsWith("postgres://") && !rawUrl.startsWith("postgresql://")) {
      return sendResponse(res, 200, {
        connected: false,
        configured: false,
        provider: "Local Storage",
        message: 'DATABASE_URL must start with "postgresql://" or "postgres://". Please copy the URI from Supabase Project Settings > Database.'
      });
    }
    const isSupabase = rawUrl.toLowerCase().includes("supabase");
    const isDirectPort = rawUrl.includes(":5432") && rawUrl.includes("db.");
    const provider = isSupabase ? "Supabase" : "PostgreSQL";
    const pool = getPool();
    const queryPromise = pool.query("SELECT NOW() as current_time, current_database() as db_name");
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => {
        reject(new Error(
          isDirectPort ? "Connection timed out after 4 seconds. You are using the Direct URI (db.xxxx.supabase.co:5432) which requires IPv6. Vercel serverless functions require the Connection Pooler URI (aws-0-*.pooler.supabase.com:6543) over IPv4." : "Connection timed out after 4 seconds. Check if your Supabase project is active (not paused) or if your database password is correct."
        ));
      }, 4e3)
    );
    const result = await Promise.race([queryPromise, timeoutPromise]);
    return sendResponse(res, 200, {
      connected: true,
      configured: true,
      provider,
      database: result.rows[0]?.db_name || "postgres",
      timestamp: result.rows[0]?.current_time,
      message: `Connected to ${provider} (${result.rows[0]?.db_name || "postgres"})`
    });
  } catch (err) {
    const rawUrl = (process.env.DATABASE_URL || "").trim().replace(/^["']|["']$/g, "");
    const isSupabase = rawUrl.toLowerCase().includes("supabase");
    const errMsg = err?.message || "Connection failed";
    let helpfulTip = "";
    if (errMsg.includes("password authentication failed")) {
      helpfulTip = " Password incorrect. Reset your database password in Supabase > Project Settings > Database, update DATABASE_URL in Vercel, and Redeploy.";
    } else if (errMsg.includes("timed out") || errMsg.includes("ETIMEDOUT")) {
      helpfulTip = ' If your Supabase project was paused due to inactivity, open your Supabase dashboard and click "Restore project". Also ensure you use the Transaction Pooler (port 6543).';
    }
    return sendResponse(res, 200, {
      connected: false,
      configured: true,
      provider: isSupabase ? "Supabase" : "PostgreSQL",
      error: errMsg,
      message: `Failed to connect to ${isSupabase ? "Supabase" : "database"}: ${errMsg}.${helpfulTip}`
    });
  }
}
export {
  handler as default
};
