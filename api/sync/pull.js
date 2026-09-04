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
var INITIAL_HOG_RAISING = {
  capitalGrant: 1e6,
  produces: ["Hog Raising", "Poultry Raising", "Tilapia Breeding"],
  expenses: [
    {
      id: "pig-exp-prev-1",
      category: "Piglets",
      description: "Purchased 20 piglets for 2025 batch",
      amount: 6e4,
      date: "2025-10-10",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE Integrated Livelihood Program (DILP) Capital Grant"
    },
    {
      id: "pig-exp-prev-2",
      category: "Feeds",
      description: "Feeds for 2025 batch",
      amount: 15e3,
      date: "2025-11-15",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE-DILP Revolving Feed Allocation"
    },
    {
      id: "pig-exp-q1-1",
      category: "Feeds",
      description: "Purchased starter feeds for early 2026 cycle",
      amount: 12e3,
      date: "2026-02-10",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE Integrated Livelihood Program (DILP) Capital Grant"
    },
    {
      id: "pig-exp-1",
      category: "Piglets",
      description: "Purchased 25 hybrid piglets (F1 high-quality breed) for fattening project",
      amount: 75e3,
      date: "2026-06-15",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE Integrated Livelihood Program (DILP) Capital Grant"
    },
    {
      id: "pig-exp-2",
      category: "Feeds",
      description: "Bought 15 bags of Hog Starter Crumbles & booster feeds",
      amount: 24e3,
      date: "2026-06-20",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE Integrated Livelihood Program (DILP) Capital Grant"
    },
    {
      id: "pig-exp-3",
      category: "Vitamins/Medicines",
      description: "Acquired anti-cholera vaccine vials, dewormer powders, and swine growth booster vitamins",
      amount: 8500,
      date: "2026-06-22",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "Dispersal & 5% Livestock Insurance Risk Pool"
    },
    {
      id: "pig-exp-4",
      category: "Feeds",
      description: "Bought 10 bags of Hog Grower Pellets for the second month feeding cycle",
      amount: 18500,
      date: "2026-07-05",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE Integrated Livelihood Program (DILP) Capital Grant"
    }
  ],
  sales: [
    {
      id: "pig-sale-prev-1",
      date: "2025-12-20",
      hogsCount: 15,
      revenue: 21e4,
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      notes: "Final sales for 2025 cycle. Books closed."
    },
    {
      id: "pig-sale-q1-1",
      date: "2026-03-18",
      hogsCount: 4,
      revenue: 65e3,
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      notes: "Sold 4 hogs to local dealers."
    },
    {
      id: "pig-sale-1",
      date: "2026-07-08",
      hogsCount: 8,
      revenue: 135e3,
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      notes: "Sold first batch of 8 mature fattened hogs to Cebu Meat Dealers. Average live weight 88kg at PHP 191/kg."
    }
  ],
  groups: [
    {
      id: "grp-1",
      name: "Batch 1 (Lunes - Monday Group)",
      members: ['Roberto "Nong Berting" Caballes', 'Zenaida "Nang Nene" Elbi\xF1a'],
      scheduleDays: ["Monday"]
    },
    {
      id: "grp-2",
      name: "Batch 2 (Miyerkules - Wednesday Group)",
      members: ['Maria "Nang Mary" Alcoser', 'Florencia "Nang Flor" Ruelan'],
      scheduleDays: ["Wednesday"]
    },
    {
      id: "grp-3",
      name: "Batch 3 (Biyernes - Friday Group)",
      members: ['Anselna "Nang Seling" Arnado', 'Gaudioso "Nong Gaudy" Mendoza'],
      scheduleDays: ["Friday"]
    }
  ],
  choreLogs: [
    {
      id: "chore-1",
      date: "2026-07-10",
      time: "07:30 AM",
      batchName: "Batch 1 (Lunes - Monday Group)",
      checkedBy: 'Roberto "Nong Berting" Caballes',
      activities: ["Feeding", "Cleaning", "Water Refill"],
      notes: "Cleaned and disinfected the pig pens. Refilled clean water troughs and fed morning rations. All piglets are healthy and active."
    },
    {
      id: "chore-2",
      date: "2026-07-11",
      time: "08:00 AM",
      batchName: "Batch 2 (Miyerkules - Wednesday Group)",
      checkedBy: 'Maria "Nang Mary" Alcoser',
      activities: ["Feeding", "Vitamins"],
      notes: "Administered vitamin booster powder mixed in the morning grower feeds. Pigs are growing rapidly."
    }
  ],
  closedYears: [2025]
};

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
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "0.0.0.0" || parsed.hostname.endsWith(".local");
    const hasExplicitSsl = parsed.searchParams.get("sslmode") === "require" || parsed.searchParams.get("ssl") === "true";
    const isSsl = !isLocal || hasExplicitSsl;
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("ssl");
    return {
      connectionString: parsed.toString(),
      isSsl,
      hostInfo
    };
  } catch {
    const isLocal = urlStr.includes("localhost") || urlStr.includes("127.0.0.1");
    const cleaned = urlStr.replace(/[\?&]sslmode=[^&]*/g, "").replace(/[\?&]ssl=[^&]*/g, "").replace(/\?$/, "");
    return { connectionString: cleaned, isSsl: !isLocal, hostInfo };
  }
}
function getPool() {
  const rawDbUrl = process.env.DATABASE_URL;
  if (!rawDbUrl || !isDatabaseConfigured()) {
    throw new Error("DATABASE_URL environment variable is not configured");
  }
  const { connectionString, isSsl } = cleanDatabaseUrl(rawDbUrl);
  if (!poolInstance || lastUsedConnectionString !== connectionString) {
    if (poolInstance) {
      poolInstance.end().catch(() => {
      });
    }
    if (isSsl) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }
    poolInstance = new PgPool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
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
async function ensureDatabaseSchema(pool) {
  const client = await pool.connect();
  try {
    const check = await client.query(`SELECT to_regclass('public.members') as table_exists`);
    if (check.rows[0]?.table_exists) {
      return;
    }
    await initDatabaseSchema(pool);
  } finally {
    client.release();
  }
}
async function initDatabaseSchema(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name TEXT NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_approved BOOLEAN DEFAULT TRUE,
        joined_date VARCHAR(50),
        farm_location TEXT,
        farm_size NUMERIC,
        primary_crops TEXT[],
        contact_number VARCHAR(50),
        status VARCHAR(50)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        farm_location TEXT,
        farm_size NUMERIC,
        primary_crops TEXT[],
        contact_number VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Active',
        joined_date VARCHAR(50)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        date VARCHAR(50),
        location TEXT,
        attendance_count INTEGER DEFAULT 0,
        agenda TEXT,
        minutes TEXT,
        officer_in_charge TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS resolutions (
        id VARCHAR(100) PRIMARY KEY,
        resolution_number VARCHAR(100) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        date_agreed VARCHAR(50),
        moved_by TEXT,
        seconded_by TEXT,
        vote_in_favor INTEGER DEFAULT 0,
        vote_against INTEGER DEFAULT 0,
        vote_abstain INTEGER DEFAULT 0,
        status VARCHAR(50)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC NOT NULL,
        date VARCHAR(50),
        description TEXT,
        recorded_by TEXT,
        audited_status VARCHAR(50) DEFAULT 'Unaudited',
        audited_by TEXT,
        audited_date VARCHAR(50),
        audit_notes TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        category VARCHAR(100),
        content TEXT,
        date_posted VARCHAR(50),
        priority VARCHAR(50),
        posted_by TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id VARCHAR(100) PRIMARY KEY,
        timestamp VARCHAR(100),
        user_name TEXT,
        role VARCHAR(50),
        action TEXT,
        details TEXT,
        sync_status VARCHAR(50),
        hash TEXT,
        previous_hash TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS hog_raising (
        id VARCHAR(100) PRIMARY KEY,
        capital_grant NUMERIC,
        produces TEXT[],
        expenses JSONB,
        sales JSONB,
        groups JSONB,
        chore_logs JSONB,
        closed_years INT[]
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        ceb_name TEXT,
        category VARCHAR(100),
        description TEXT,
        unit VARCHAR(50),
        price NUMERIC,
        quantity_available VARCHAR(100),
        stock_status VARCHAR(50),
        farmer_name TEXT,
        farmer_sitio TEXT,
        farmer_phone VARCHAR(50),
        contact_person TEXT,
        is_published BOOLEAN DEFAULT TRUE,
        updated_by TEXT,
        managed_by TEXT,
        date_updated VARCHAR(50)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        category VARCHAR(100),
        scheduled_date VARCHAR(50),
        date_scheduled VARCHAR(50),
        scheduled_time VARCHAR(100),
        time_scheduled VARCHAR(100),
        location TEXT,
        description TEXT,
        organizer TEXT,
        status VARCHAR(50),
        documented_notes TEXT,
        attendees_count INTEGER DEFAULT 0
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_funds (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        allocated_amount NUMERIC DEFAULT 0,
        current_balance NUMERIC DEFAULT 0,
        description TEXT,
        custodian TEXT,
        last_updated VARCHAR(50)
      );
    `);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
async function fetchAllDataFromPostgres(pool) {
  await ensureDatabaseSchema(pool);
  const client = await pool.connect();
  try {
    const usersRes = await client.query("SELECT * FROM users ORDER BY name ASC");
    const membersRes = await client.query("SELECT * FROM members ORDER BY name ASC");
    const meetingsRes = await client.query("SELECT * FROM meetings ORDER BY date DESC");
    const resolutionsRes = await client.query("SELECT * FROM resolutions ORDER BY date_agreed DESC");
    const transactionsRes = await client.query("SELECT * FROM financial_transactions ORDER BY date DESC");
    const announcementsRes = await client.query("SELECT * FROM announcements ORDER BY date_posted DESC");
    const logsRes = await client.query("SELECT * FROM system_logs ORDER BY timestamp DESC");
    const hogRes = await client.query("SELECT * FROM hog_raising WHERE id = $1", ["hog_raising_main"]);
    const productsRes = await client.query("SELECT * FROM products ORDER BY name ASC");
    const activitiesRes = await client.query("SELECT * FROM activities ORDER BY scheduled_date DESC");
    const fundsRes = await client.query("SELECT * FROM organization_funds ORDER BY name ASC");
    let hogState = INITIAL_HOG_RAISING;
    if (hogRes.rows.length > 0) {
      const row = hogRes.rows[0];
      hogState = {
        capitalGrant: Number(row.capital_grant || 0),
        produces: row.produces || [],
        expenses: row.expenses || [],
        sales: row.sales || [],
        groups: row.groups || [],
        choreLogs: row.chore_logs || [],
        closedYears: row.closed_years || []
      };
    }
    return {
      users: usersRes.rows.map((r) => ({
        id: r.id,
        username: r.username,
        password: r.password,
        name: r.name,
        role: r.role,
        isApproved: r.is_approved,
        joinedDate: r.joined_date,
        farmLocation: r.farm_location,
        farmSize: Number(r.farm_size || 0),
        primaryCrops: r.primary_crops || [],
        contactNumber: r.contact_number,
        status: r.status
      })),
      members: membersRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        farmLocation: r.farm_location,
        farmSize: Number(r.farm_size || 0),
        primaryCrops: r.primary_crops || [],
        contactNumber: r.contact_number,
        status: r.status,
        joinedDate: r.joined_date
      })),
      meetings: meetingsRes.rows.map((r) => ({
        id: r.id,
        title: r.title,
        date: r.date,
        location: r.location,
        attendanceCount: Number(r.attendance_count || 0),
        agenda: r.agenda,
        minutes: r.minutes,
        officerInCharge: r.officer_in_charge
      })),
      resolutions: resolutionsRes.rows.map((r) => ({
        id: r.id,
        resolutionNumber: r.resolution_number,
        title: r.title,
        description: r.description,
        dateAgreed: r.date_agreed,
        movedBy: r.moved_by,
        secondedBy: r.seconded_by,
        voteInFavor: Number(r.vote_in_favor || 0),
        voteAgainst: Number(r.vote_against || 0),
        voteAbstain: Number(r.vote_abstain || 0),
        status: r.status
      })),
      transactions: transactionsRes.rows.map((r) => ({
        id: r.id,
        type: r.type,
        category: r.category,
        amount: Number(r.amount || 0),
        date: r.date,
        description: r.description,
        recordedBy: r.recorded_by,
        auditedStatus: r.audited_status,
        auditedBy: r.audited_by,
        auditedDate: r.audited_date,
        auditNotes: r.audit_notes
      })),
      announcements: announcementsRes.rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        content: r.content,
        datePosted: r.date_posted,
        priority: r.priority,
        postedBy: r.posted_by
      })),
      logs: logsRes.rows.map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        user: r.user_name,
        role: r.role,
        action: r.action,
        details: r.details,
        syncStatus: r.sync_status || "synced",
        hash: r.hash,
        previousHash: r.previous_hash
      })),
      hogRaising: hogState,
      products: productsRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        cebName: r.ceb_name,
        category: r.category,
        description: r.description,
        unit: r.unit,
        price: Number(r.price || 0),
        quantityAvailable: r.quantity_available,
        stockStatus: r.stock_status,
        farmerName: r.farmer_name,
        farmerSitio: r.farmer_sitio,
        farmerPhone: r.farmer_phone,
        contactPerson: r.contact_person,
        isPublished: r.is_published,
        updatedBy: r.updated_by,
        managedBy: r.managed_by,
        dateUpdated: r.date_updated
      })),
      activities: activitiesRes.rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        scheduledDate: r.scheduled_date || r.date_scheduled,
        dateScheduled: r.date_scheduled || r.scheduled_date,
        scheduledTime: r.scheduled_time || r.time_scheduled,
        timeScheduled: r.time_scheduled || r.scheduled_time,
        location: r.location,
        description: r.description,
        organizer: r.organizer,
        status: r.status,
        documentedNotes: r.documented_notes,
        attendeesCount: Number(r.attendees_count || 0)
      })),
      funds: fundsRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        allocatedAmount: Number(r.allocated_amount || 0),
        currentBalance: Number(r.current_balance || 0),
        description: r.description,
        custodian: r.custodian,
        lastUpdated: r.last_updated
      }))
    };
  } finally {
    client.release();
  }
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

// src/api/pull.ts
async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      if (typeof res.status === "function") return res.status(200).end();
      res.statusCode = 200;
      return res.end();
    }
    if (!isDatabaseConfigured()) {
      return sendResponse(res, 200, {
        success: false,
        offlineMode: true,
        message: "DATABASE_URL is not configured. Running in offline/local storage mode."
      });
    }
    const pool = getPool();
    const pullPromise = fetchAllDataFromPostgres(pool);
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Cloud DB query timed out after 5 seconds.")), 5e3)
    );
    const data = await Promise.race([pullPromise, timeoutPromise]);
    return sendResponse(res, 200, {
      success: true,
      data
    });
  } catch (error) {
    console.warn("[Cloud DB Pull Warning]:", error?.message || error);
    return sendResponse(res, 200, {
      success: false,
      offlineMode: true,
      message: `Offline fallback: ${error?.message || "Database unavailable"}`
    });
  }
}
export {
  handler as default
};
