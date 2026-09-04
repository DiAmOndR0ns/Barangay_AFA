import pg from 'pg';
import { 
  SEED_USERS, INITIAL_MEMBERS, INITIAL_MEETINGS, INITIAL_RESOLUTIONS, 
  INITIAL_TRANSACTIONS, INITIAL_ANNOUNCEMENTS, INITIAL_LOGS, INITIAL_HOG_RAISING, 
  INITIAL_PRODUCTS, INITIAL_ACTIVITIES, INITIAL_FUNDS 
} from '../initialData';

// Bulletproof Pool resolution across CJS, ESM, and bundled Vercel serverless environments
const PgPool = (pg as any)?.Pool || (pg as any)?.default?.Pool || (pg as any)?.default || pg;

let poolInstance: pg.Pool | null = null;
let lastUsedConnectionString: string | null = null;

export function isDatabaseConfigured(): boolean {
  const dbUrl = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '');
  return Boolean(
    dbUrl && 
    dbUrl !== '' && 
    !dbUrl.includes('[YOUR-PASSWORD]') && 
    !dbUrl.includes('<password>') &&
    !dbUrl.includes('YOUR_PASSWORD') && 
    !dbUrl.includes('your_aiven_connection_string') && 
    !dbUrl.includes('your_supabase_connection_string') &&
    (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))
  );
}

export function cleanDatabaseUrl(rawUrl: string): { connectionString: string; isSsl: boolean; hostInfo: string } {
  let urlStr = rawUrl.trim().replace(/^["']|["']$/g, '');
  let hostInfo = 'PostgreSQL';

  try {
    const parsed = new URL(urlStr);
    hostInfo = `${parsed.hostname}${parsed.port ? ':' + parsed.port : ''}${parsed.pathname}`;
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('ssl');
    return {
      connectionString: parsed.toString(),
      isSsl: true,
      hostInfo,
    };
  } catch {
    const cleaned = urlStr
      .replace(/[\?&]sslmode=[^&]*/g, '')
      .replace(/[\?&]ssl=[^&]*/g, '')
      .replace(/\?$/, '');
    return { connectionString: cleaned, isSsl: true, hostInfo };
  }
}

export function getPool(): pg.Pool {
  const rawDbUrl = process.env.DATABASE_URL;
  if (!rawDbUrl || !isDatabaseConfigured()) {
    throw new Error('DATABASE_URL environment variable is not configured');
  }

  const { connectionString } = cleanDatabaseUrl(rawDbUrl);

  if (!poolInstance || lastUsedConnectionString !== connectionString) {
    if (poolInstance) {
      poolInstance.end().catch(() => {});
    }
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    poolInstance = new PgPool({
      connectionString,
      ssl: { 
        rejectUnauthorized: false 
      },
      connectionTimeoutMillis: 6000,
      idleTimeoutMillis: 10000,
      max: 6,
    });

    poolInstance.on('error', (err: any) => {
      console.warn('[PostgreSQL Pool Client Error]:', err?.message || err);
    });

    lastUsedConnectionString = connectionString;
  }

  return poolInstance;
}

export async function runSchemaMigrations(client: pg.PoolClient) {
  const statements = [
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS member_id_number VARCHAR(100);`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS rsbsa_number VARCHAR(100);`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS is_rsbsa_registered BOOLEAN DEFAULT FALSE;`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS avatar_url TEXT;`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_date VARCHAR(50);`,

    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id_number VARCHAR(100);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS rsbsa_number VARCHAR(100);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_rsbsa_registered BOOLEAN DEFAULT FALSE;`,

    `ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS fund_source TEXT;`,

    `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS attendance_record JSONB;`,

    `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;`,

    `ALTER TABLE activities ADD COLUMN IF NOT EXISTS ceb_title TEXT;`,
    `ALTER TABLE activities ADD COLUMN IF NOT EXISTS target_audience TEXT;`,
    `ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_url TEXT;`
  ];

  for (const stmt of statements) {
    try {
      await client.query(stmt);
    } catch {
      // safe fallback if column exists or dialect differences
    }
  }
}

export async function initDatabaseSchema(pool: pg.Pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Users
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
        status VARCHAR(50),
        avatar_url TEXT,
        member_id_number VARCHAR(100),
        rsbsa_number VARCHAR(100),
        is_rsbsa_registered BOOLEAN DEFAULT FALSE
      );
    `);

    // 2. Members
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        farm_location TEXT,
        farm_size NUMERIC,
        primary_crops TEXT[],
        contact_number VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Active',
        joined_date VARCHAR(50),
        member_id_number VARCHAR(100),
        rsbsa_number VARCHAR(100),
        is_rsbsa_registered BOOLEAN DEFAULT FALSE,
        avatar_url TEXT,
        gender VARCHAR(20),
        birth_date VARCHAR(50)
      );
    `);

    // 3. Meetings
    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        date VARCHAR(50),
        location TEXT,
        attendance_count INTEGER DEFAULT 0,
        agenda TEXT,
        minutes TEXT,
        officer_in_charge TEXT,
        attendance_record JSONB
      );
    `);

    // 4. Resolutions
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

    // 5. Financial Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC NOT NULL,
        date VARCHAR(50),
        description TEXT,
        recorded_by TEXT,
        fund_source TEXT,
        audited_status VARCHAR(50) DEFAULT 'Unaudited',
        audited_by TEXT,
        audited_date VARCHAR(50),
        audit_notes TEXT
      );
    `);

    // 6. Announcements
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

    // 7. System Logs (Audit chain)
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

    // 8. Hog Raising IGP State
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

    // 9. Products
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
        image_url TEXT,
        is_published BOOLEAN DEFAULT TRUE,
        updated_by TEXT,
        managed_by TEXT,
        date_updated VARCHAR(50)
      );
    `);

    // 10. Activities
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        ceb_title TEXT,
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
        attendees_count INTEGER DEFAULT 0,
        target_audience TEXT,
        image_url TEXT
      );
    `);

    // 11. Organization Funds
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

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getTableStats(pool: pg.Pool): Promise<{
  tableCounts: Record<string, number>;
  totalRecords: number;
}> {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT
        (SELECT count(*) FROM users) as users,
        (SELECT count(*) FROM members) as members,
        (SELECT count(*) FROM meetings) as meetings,
        (SELECT count(*) FROM resolutions) as resolutions,
        (SELECT count(*) FROM financial_transactions) as financial_transactions,
        (SELECT count(*) FROM announcements) as announcements,
        (SELECT count(*) FROM system_logs) as system_logs,
        (SELECT count(*) FROM hog_raising) as hog_raising,
        (SELECT count(*) FROM products) as products,
        (SELECT count(*) FROM activities) as activities,
        (SELECT count(*) FROM organization_funds) as organization_funds
    `);
    const row = res.rows[0] || {};
    const tableCounts: Record<string, number> = {
      users: Number(row.users || 0),
      members: Number(row.members || 0),
      meetings: Number(row.meetings || 0),
      resolutions: Number(row.resolutions || 0),
      financial_transactions: Number(row.financial_transactions || 0),
      announcements: Number(row.announcements || 0),
      system_logs: Number(row.system_logs || 0),
      hog_raising: Number(row.hog_raising || 0),
      products: Number(row.products || 0),
      activities: Number(row.activities || 0),
      organization_funds: Number(row.organization_funds || 0),
    };
    const totalRecords = Object.values(tableCounts).reduce((a, b) => a + b, 0);
    return { tableCounts, totalRecords };
  } catch {
    return {
      tableCounts: {},
      totalRecords: 0,
    };
  } finally {
    client.release();
  }
}

export async function ensureDatabaseSchema(pool: pg.Pool) {
  const client = await pool.connect();
  try {
    // 1. Check if core table exists
    const check = await client.query(`SELECT to_regclass('public.members') as members_table`);
    if (!check.rows[0]?.members_table) {
      await initDatabaseSchema(pool);
    } else {
      await runSchemaMigrations(client);
    }

    // 2. Check if primary tables are empty
    const counts = await client.query(`
      SELECT 
        (SELECT count(*) FROM users) as users_count,
        (SELECT count(*) FROM members) as members_count,
        (SELECT count(*) FROM financial_transactions) as tx_count,
        (SELECT count(*) FROM organization_funds) as funds_count
    `);
    const usersCount = Number(counts.rows[0]?.users_count || 0);
    const membersCount = Number(counts.rows[0]?.members_count || 0);

    // If tables are empty in Supabase/PostgreSQL, auto-populate initial seed records!
    if (usersCount === 0 || membersCount === 0) {
      console.log(`[Supabase / PostgreSQL]: Empty tables detected (users: ${usersCount}, members: ${membersCount}). Auto-seeding initial association dataset...`);
      await migrateSeedData(pool);
      console.log('[Supabase / PostgreSQL]: Initial dataset auto-seeded into Supabase successfully!');
    }
  } catch (err: any) {
    console.warn('[ensureDatabaseSchema warning]:', err?.message || err);
  } finally {
    client.release();
  }
}

export async function migrateSeedData(pool: pg.Pool) {
  await initDatabaseSchema(pool);
  const client = await pool.connect();
  const summary: Record<string, number> = {};

  try {
    await client.query('BEGIN');
    await runSchemaMigrations(client);

    // 1. Users
    let usersCount = 0;
    for (const u of SEED_USERS) {
      await client.query(`
        INSERT INTO users (id, username, password, name, role, is_approved, joined_date, farm_location, farm_size, primary_crops, contact_number, status, avatar_url, member_id_number, rsbsa_number, is_rsbsa_registered)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          password = EXCLUDED.password,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          is_approved = EXCLUDED.is_approved,
          joined_date = EXCLUDED.joined_date,
          farm_location = EXCLUDED.farm_location,
          farm_size = EXCLUDED.farm_size,
          primary_crops = EXCLUDED.primary_crops,
          contact_number = EXCLUDED.contact_number,
          status = EXCLUDED.status,
          avatar_url = EXCLUDED.avatar_url,
          member_id_number = EXCLUDED.member_id_number,
          rsbsa_number = EXCLUDED.rsbsa_number,
          is_rsbsa_registered = EXCLUDED.is_rsbsa_registered;
      `, [
        u.id, u.username, u.password || 'password123', u.name, u.role, u.isApproved,
        u.joinedDate || null, u.farmLocation || null, u.farmSize || null,
        u.primaryCrops || [], u.contactNumber || null, u.status || 'Active',
        u.avatarUrl || null, u.memberIdNumber || null, u.rsbsaNumber || null,
        Boolean(u.isRsbsaRegistered)
      ]);
      usersCount++;
    }
    summary.users = usersCount;

    // 2. Members
    let membersCount = 0;
    for (const m of INITIAL_MEMBERS) {
      await client.query(`
        INSERT INTO members (id, name, farm_location, farm_size, primary_crops, contact_number, status, joined_date, member_id_number, rsbsa_number, is_rsbsa_registered, avatar_url, gender, birth_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          farm_location = EXCLUDED.farm_location,
          farm_size = EXCLUDED.farm_size,
          primary_crops = EXCLUDED.primary_crops,
          contact_number = EXCLUDED.contact_number,
          status = EXCLUDED.status,
          joined_date = EXCLUDED.joined_date,
          member_id_number = EXCLUDED.member_id_number,
          rsbsa_number = EXCLUDED.rsbsa_number,
          is_rsbsa_registered = EXCLUDED.is_rsbsa_registered,
          avatar_url = EXCLUDED.avatar_url,
          gender = EXCLUDED.gender,
          birth_date = EXCLUDED.birth_date;
      `, [
        m.id, m.name, m.farmLocation || null, m.farmSize || null,
        m.primaryCrops || [], m.contactNumber || null, m.status || 'Active',
        m.joinedDate || null, m.memberIdNumber || null, m.rsbsaNumber || null,
        Boolean(m.isRsbsaRegistered), m.avatarUrl || null, m.gender || null,
        m.birthDate || null
      ]);
      membersCount++;
    }
    summary.members = membersCount;

    // 3. Meetings
    let meetingsCount = 0;
    for (const mt of INITIAL_MEETINGS) {
      await client.query(`
        INSERT INTO meetings (id, title, date, location, attendance_count, agenda, minutes, officer_in_charge, attendance_record)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          date = EXCLUDED.date,
          location = EXCLUDED.location,
          attendance_count = EXCLUDED.attendance_count,
          agenda = EXCLUDED.agenda,
          minutes = EXCLUDED.minutes,
          officer_in_charge = EXCLUDED.officer_in_charge,
          attendance_record = EXCLUDED.attendance_record;
      `, [
        mt.id, mt.title, mt.date, mt.location, mt.attendanceCount || 0,
        mt.agenda || '', mt.minutes || '', mt.officerInCharge || '',
        JSON.stringify(mt.attendanceRecord || {})
      ]);
      meetingsCount++;
    }
    summary.meetings = meetingsCount;

    // 4. Resolutions
    let resolutionsCount = 0;
    for (const r of INITIAL_RESOLUTIONS) {
      await client.query(`
        INSERT INTO resolutions (id, resolution_number, title, description, date_agreed, moved_by, seconded_by, vote_in_favor, vote_against, vote_abstain, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          resolution_number = EXCLUDED.resolution_number,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          date_agreed = EXCLUDED.date_agreed,
          moved_by = EXCLUDED.moved_by,
          seconded_by = EXCLUDED.seconded_by,
          vote_in_favor = EXCLUDED.vote_in_favor,
          vote_against = EXCLUDED.vote_against,
          vote_abstain = EXCLUDED.vote_abstain,
          status = EXCLUDED.status;
      `, [
        r.id, r.resolutionNumber, r.title, r.description, r.dateAgreed,
        r.movedBy, r.secondedBy, r.voteInFavor, r.voteAgainst, r.voteAbstain, r.status
      ]);
      resolutionsCount++;
    }
    summary.resolutions = resolutionsCount;

    // 5. Transactions
    let txCount = 0;
    for (const tx of INITIAL_TRANSACTIONS) {
      await client.query(`
        INSERT INTO financial_transactions (id, type, category, amount, date, description, recorded_by, fund_source, audited_status, audited_by, audited_date, audit_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          category = EXCLUDED.category,
          amount = EXCLUDED.amount,
          date = EXCLUDED.date,
          description = EXCLUDED.description,
          recorded_by = EXCLUDED.recorded_by,
          fund_source = EXCLUDED.fund_source,
          audited_status = EXCLUDED.audited_status,
          audited_by = EXCLUDED.audited_by,
          audited_date = EXCLUDED.audited_date,
          audit_notes = EXCLUDED.audit_notes;
      `, [
        tx.id, tx.type, tx.category, tx.amount, tx.date, tx.description,
        tx.recordedBy, tx.fundSource || null, tx.auditedStatus || 'Unaudited', tx.auditedBy || null,
        tx.auditedDate || null, tx.auditNotes || null
      ]);
      txCount++;
    }
    summary.financial_transactions = txCount;

    // 6. Announcements
    let annCount = 0;
    for (const an of INITIAL_ANNOUNCEMENTS) {
      await client.query(`
        INSERT INTO announcements (id, title, category, content, date_posted, priority, posted_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          content = EXCLUDED.content,
          date_posted = EXCLUDED.date_posted,
          priority = EXCLUDED.priority,
          posted_by = EXCLUDED.posted_by;
      `, [
        an.id, an.title, an.category, an.content, an.datePosted, an.priority, an.postedBy
      ]);
      annCount++;
    }
    summary.announcements = annCount;

    // 7. System Logs
    let logsCount = 0;
    for (const lg of INITIAL_LOGS) {
      await client.query(`
        INSERT INTO system_logs (id, timestamp, user_name, role, action, details, sync_status, hash, previous_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          timestamp = EXCLUDED.timestamp,
          user_name = EXCLUDED.user_name,
          role = EXCLUDED.role,
          action = EXCLUDED.action,
          details = EXCLUDED.details,
          sync_status = EXCLUDED.sync_status,
          hash = EXCLUDED.hash,
          previous_hash = EXCLUDED.previous_hash;
      `, [
        lg.id, lg.timestamp, (lg as any).user || (lg as any).userName || 'System', lg.role, lg.action, lg.details,
        lg.syncStatus || 'synced', lg.hash || null, lg.previousHash || null
      ]);
      logsCount++;
    }
    summary.system_logs = logsCount;

    // 8. Hog Raising IGP
    await client.query(`
      INSERT INTO hog_raising (id, capital_grant, produces, expenses, sales, groups, chore_logs, closed_years)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        capital_grant = EXCLUDED.capital_grant,
        produces = EXCLUDED.produces,
        expenses = EXCLUDED.expenses,
        sales = EXCLUDED.sales,
        groups = EXCLUDED.groups,
        chore_logs = EXCLUDED.chore_logs,
        closed_years = EXCLUDED.closed_years;
    `, [
      'hog_raising_main',
      INITIAL_HOG_RAISING.capitalGrant,
      INITIAL_HOG_RAISING.produces,
      JSON.stringify(INITIAL_HOG_RAISING.expenses),
      JSON.stringify(INITIAL_HOG_RAISING.sales),
      JSON.stringify(INITIAL_HOG_RAISING.groups),
      JSON.stringify(INITIAL_HOG_RAISING.choreLogs),
      INITIAL_HOG_RAISING.closedYears || []
    ]);
    summary.hog_raising = 1;

    // 9. Products
    let productsCount = 0;
    for (const p of INITIAL_PRODUCTS) {
      await client.query(`
        INSERT INTO products (id, name, ceb_name, category, description, unit, price, quantity_available, stock_status, farmer_name, farmer_sitio, farmer_phone, contact_person, image_url, is_published, updated_by, managed_by, date_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          ceb_name = EXCLUDED.ceb_name,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          unit = EXCLUDED.unit,
          price = EXCLUDED.price,
          quantity_available = EXCLUDED.quantity_available,
          stock_status = EXCLUDED.stock_status,
          farmer_name = EXCLUDED.farmer_name,
          farmer_sitio = EXCLUDED.farmer_sitio,
          farmer_phone = EXCLUDED.farmer_phone,
          contact_person = EXCLUDED.contact_person,
          image_url = EXCLUDED.image_url,
          is_published = EXCLUDED.is_published,
          updated_by = EXCLUDED.updated_by,
          managed_by = EXCLUDED.managed_by,
          date_updated = EXCLUDED.date_updated;
      `, [
        p.id, p.name, p.cebName, p.category, p.description, p.unit,
        p.price, p.quantityAvailable, p.stockStatus, p.farmerName || null,
        p.farmerSitio || null, p.farmerPhone || null, p.contactPerson || null,
        p.imageUrl || null, p.isPublished ?? true, p.updatedBy || null,
        p.managedBy || null, p.dateUpdated || null
      ]);
      productsCount++;
    }
    summary.products = productsCount;

    // 10. Activities
    let activitiesCount = 0;
    for (const act of INITIAL_ACTIVITIES) {
      await client.query(`
        INSERT INTO activities (id, title, ceb_title, category, scheduled_date, date_scheduled, scheduled_time, time_scheduled, location, description, organizer, status, documented_notes, attendees_count, target_audience, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          ceb_title = EXCLUDED.ceb_title,
          category = EXCLUDED.category,
          scheduled_date = EXCLUDED.scheduled_date,
          date_scheduled = EXCLUDED.date_scheduled,
          scheduled_time = EXCLUDED.scheduled_time,
          time_scheduled = EXCLUDED.time_scheduled,
          location = EXCLUDED.location,
          description = EXCLUDED.description,
          organizer = EXCLUDED.organizer,
          status = EXCLUDED.status,
          documented_notes = EXCLUDED.documented_notes,
          attendees_count = EXCLUDED.attendees_count,
          target_audience = EXCLUDED.target_audience,
          image_url = EXCLUDED.image_url;
      `, [
        act.id, act.title, act.cebTitle || null, act.category,
        act.scheduledDate || act.dateScheduled || null,
        act.dateScheduled || act.scheduledDate || null,
        act.scheduledTime || act.timeScheduled || null,
        act.timeScheduled || act.scheduledTime || null,
        act.location, act.description, act.organizer, act.status,
        act.documentedNotes || null, act.attendeesCount || 0,
        act.targetAudience || null, act.imageUrl || null
      ]);
      activitiesCount++;
    }
    summary.activities = activitiesCount;

    // 11. Funds
    let fundsCount = 0;
    for (const f of INITIAL_FUNDS) {
      await client.query(`
        INSERT INTO organization_funds (id, name, code, allocated_amount, current_balance, description, custodian, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          code = EXCLUDED.code,
          allocated_amount = EXCLUDED.allocated_amount,
          current_balance = EXCLUDED.current_balance,
          description = EXCLUDED.description,
          custodian = EXCLUDED.custodian,
          last_updated = EXCLUDED.last_updated;
      `, [
        f.id, f.name, f.code, f.allocatedAmount || 0, f.currentBalance || 0,
        f.description || '', f.custodian || '', f.lastUpdated || new Date().toISOString().split('T')[0]
      ]);
      fundsCount++;
    }
    summary.organization_funds = fundsCount;

    await client.query('COMMIT');
    return summary;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function fetchAllDataFromPostgres(pool: pg.Pool) {
  await ensureDatabaseSchema(pool);
  const client = await pool.connect();
  try {
    const usersRes = await client.query('SELECT * FROM users ORDER BY name ASC');
    const membersRes = await client.query('SELECT * FROM members ORDER BY name ASC');
    const meetingsRes = await client.query('SELECT * FROM meetings ORDER BY date DESC');
    const resolutionsRes = await client.query('SELECT * FROM resolutions ORDER BY date_agreed DESC');
    const transactionsRes = await client.query('SELECT * FROM financial_transactions ORDER BY date DESC');
    const announcementsRes = await client.query('SELECT * FROM announcements ORDER BY date_posted DESC');
    const logsRes = await client.query('SELECT * FROM system_logs ORDER BY timestamp DESC');
    const hogRes = await client.query('SELECT * FROM hog_raising WHERE id = $1', ['hog_raising_main']);
    const productsRes = await client.query('SELECT * FROM products ORDER BY name ASC');
    const activitiesRes = await client.query('SELECT * FROM activities ORDER BY scheduled_date DESC');
    const fundsRes = await client.query('SELECT * FROM organization_funds ORDER BY name ASC');

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

    const members = membersRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      farmLocation: r.farm_location,
      farmSize: Number(r.farm_size || 0),
      primaryCrops: r.primary_crops || [],
      contactNumber: r.contact_number,
      status: r.status,
      joinedDate: r.joined_date,
      memberIdNumber: r.member_id_number,
      rsbsaNumber: r.rsbsa_number,
      isRsbsaRegistered: Boolean(r.is_rsbsa_registered),
      avatarUrl: r.avatar_url,
      gender: r.gender,
      birthDate: r.birth_date
    }));

    const users = usersRes.rows.map(r => ({
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
      status: r.status,
      avatarUrl: r.avatar_url,
      memberIdNumber: r.member_id_number,
      rsbsaNumber: r.rsbsa_number,
      isRsbsaRegistered: Boolean(r.is_rsbsa_registered)
    }));

    const meetings = meetingsRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      date: r.date,
      location: r.location,
      attendanceCount: Number(r.attendance_count || 0),
      agenda: r.agenda,
      minutes: r.minutes,
      officerInCharge: r.officer_in_charge,
      attendanceRecord: r.attendance_record || {}
    }));

    const resolutions = resolutionsRes.rows.map(r => ({
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
    }));

    const transactions = transactionsRes.rows.map(r => ({
      id: r.id,
      type: r.type,
      category: r.category,
      amount: Number(r.amount || 0),
      date: r.date,
      description: r.description,
      recordedBy: r.recorded_by,
      fundSource: r.fund_source,
      auditedStatus: r.audited_status,
      auditedBy: r.audited_by,
      auditedDate: r.audited_date,
      auditNotes: r.audit_notes
    }));

    const announcements = announcementsRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      content: r.content,
      datePosted: r.date_posted,
      priority: r.priority,
      postedBy: r.posted_by
    }));

    const logs = logsRes.rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      user: r.user_name,
      role: r.role,
      action: r.action,
      details: r.details,
      syncStatus: r.sync_status || 'synced',
      hash: r.hash,
      previousHash: r.previous_hash
    }));

    const products = productsRes.rows.map(r => ({
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
      imageUrl: r.image_url,
      isPublished: r.is_published,
      updatedBy: r.updated_by,
      managedBy: r.managed_by,
      dateUpdated: r.date_updated
    }));

    const activities = activitiesRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      cebTitle: r.ceb_title,
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
      attendeesCount: Number(r.attendees_count || 0),
      targetAudience: r.target_audience,
      imageUrl: r.image_url
    }));

    const funds = fundsRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      allocatedAmount: Number(r.allocated_amount || 0),
      currentBalance: Number(r.current_balance || 0),
      description: r.description,
      custodian: r.custodian,
      lastUpdated: r.last_updated
    }));

    return {
      users,
      members,
      meetings,
      resolutions,
      transactions,
      financialTransactions: transactions,
      announcements,
      logs,
      systemLogs: logs,
      hogRaising: hogState,
      products,
      activities,
      funds,
      organizationFunds: funds
    };
  } finally {
    client.release();
  }
}

export async function saveFullStateToPostgres(pool: pg.Pool, state: any) {
  await ensureDatabaseSchema(pool);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await runSchemaMigrations(client);

    // 1. Users
    if (state.users && Array.isArray(state.users) && state.users.length > 0) {
      for (const u of state.users) {
        await client.query(`
          INSERT INTO users (id, username, password, name, role, is_approved, joined_date, farm_location, farm_size, primary_crops, contact_number, status, avatar_url, member_id_number, rsbsa_number, is_rsbsa_registered)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            password = EXCLUDED.password,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            is_approved = EXCLUDED.is_approved,
            joined_date = EXCLUDED.joined_date,
            farm_location = EXCLUDED.farm_location,
            farm_size = EXCLUDED.farm_size,
            primary_crops = EXCLUDED.primary_crops,
            contact_number = EXCLUDED.contact_number,
            status = EXCLUDED.status,
            avatar_url = EXCLUDED.avatar_url,
            member_id_number = EXCLUDED.member_id_number,
            rsbsa_number = EXCLUDED.rsbsa_number,
            is_rsbsa_registered = EXCLUDED.is_rsbsa_registered;
        `, [
          u.id, u.username, u.password || 'password123', u.name, u.role, u.isApproved,
          u.joinedDate || null, u.farmLocation || null, u.farmSize || null,
          u.primaryCrops || [], u.contactNumber || null, u.status || 'Active',
          u.avatarUrl || null, u.memberIdNumber || null, u.rsbsaNumber || null,
          Boolean(u.isRsbsaRegistered)
        ]);
      }
    }

    // 2. Members
    if (state.members && Array.isArray(state.members) && state.members.length > 0) {
      for (const m of state.members) {
        await client.query(`
          INSERT INTO members (id, name, farm_location, farm_size, primary_crops, contact_number, status, joined_date, member_id_number, rsbsa_number, is_rsbsa_registered, avatar_url, gender, birth_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            farm_location = EXCLUDED.farm_location,
            farm_size = EXCLUDED.farm_size,
            primary_crops = EXCLUDED.primary_crops,
            contact_number = EXCLUDED.contact_number,
            status = EXCLUDED.status,
            joined_date = EXCLUDED.joined_date,
            member_id_number = EXCLUDED.member_id_number,
            rsbsa_number = EXCLUDED.rsbsa_number,
            is_rsbsa_registered = EXCLUDED.is_rsbsa_registered,
            avatar_url = EXCLUDED.avatar_url,
            gender = EXCLUDED.gender,
            birth_date = EXCLUDED.birth_date;
        `, [
          m.id, m.name, m.farmLocation || null, m.farmSize || null,
          m.primaryCrops || [], m.contactNumber || null, m.status || 'Active',
          m.joinedDate || null, m.memberIdNumber || null, m.rsbsaNumber || null,
          Boolean(m.isRsbsaRegistered), m.avatarUrl || null, m.gender || null,
          m.birthDate || null
        ]);
      }
    }

    // 3. Transactions (handles financialTransactions OR transactions)
    const txList = state.financialTransactions || state.transactions;
    if (txList && Array.isArray(txList) && txList.length > 0) {
      for (const tx of txList) {
        await client.query(`
          INSERT INTO financial_transactions (id, type, category, amount, date, description, recorded_by, fund_source, audited_status, audited_by, audited_date, audit_notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            type = EXCLUDED.type,
            category = EXCLUDED.category,
            amount = EXCLUDED.amount,
            date = EXCLUDED.date,
            description = EXCLUDED.description,
            recorded_by = EXCLUDED.recorded_by,
            fund_source = EXCLUDED.fund_source,
            audited_status = EXCLUDED.audited_status,
            audited_by = EXCLUDED.audited_by,
            audited_date = EXCLUDED.audited_date,
            audit_notes = EXCLUDED.audit_notes;
        `, [
          tx.id, tx.type, tx.category, tx.amount, tx.date, tx.description,
          tx.recordedBy, tx.fundSource || null, tx.auditedStatus || 'Unaudited', tx.auditedBy || null,
          tx.auditedDate || null, tx.auditNotes || null
        ]);
      }
    }

    // 4. Meetings
    if (state.meetings && Array.isArray(state.meetings) && state.meetings.length > 0) {
      for (const mt of state.meetings) {
        await client.query(`
          INSERT INTO meetings (id, title, date, location, attendance_count, agenda, minutes, officer_in_charge, attendance_record)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            date = EXCLUDED.date,
            location = EXCLUDED.location,
            attendance_count = EXCLUDED.attendance_count,
            agenda = EXCLUDED.agenda,
            minutes = EXCLUDED.minutes,
            officer_in_charge = EXCLUDED.officer_in_charge,
            attendance_record = EXCLUDED.attendance_record;
        `, [
          mt.id, mt.title, mt.date, mt.location, mt.attendanceCount || 0,
          mt.agenda || '', mt.minutes || '', mt.officerInCharge || '',
          JSON.stringify(mt.attendanceRecord || {})
        ]);
      }
    }

    // 5. Hog Raising IGP State
    if (state.hogRaising) {
      await client.query(`
        INSERT INTO hog_raising (id, capital_grant, produces, expenses, sales, groups, chore_logs, closed_years)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          capital_grant = EXCLUDED.capital_grant,
          produces = EXCLUDED.produces,
          expenses = EXCLUDED.expenses,
          sales = EXCLUDED.sales,
          groups = EXCLUDED.groups,
          chore_logs = EXCLUDED.chore_logs,
          closed_years = EXCLUDED.closed_years;
      `, [
        'hog_raising_main',
        state.hogRaising.capitalGrant || 0,
        state.hogRaising.produces || [],
        JSON.stringify(state.hogRaising.expenses || []),
        JSON.stringify(state.hogRaising.sales || []),
        JSON.stringify(state.hogRaising.groups || []),
        JSON.stringify(state.hogRaising.choreLogs || []),
        state.hogRaising.closedYears || []
      ]);
    }

    // 6. System Logs (handles systemLogs OR logs)
    const logList = state.systemLogs || state.logs;
    if (logList && Array.isArray(logList) && logList.length > 0) {
      for (const lg of logList) {
        await client.query(`
          INSERT INTO system_logs (id, timestamp, user_name, role, action, details, sync_status, hash, previous_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            timestamp = EXCLUDED.timestamp,
            user_name = EXCLUDED.user_name,
            role = EXCLUDED.role,
            action = EXCLUDED.action,
            details = EXCLUDED.details,
            sync_status = EXCLUDED.sync_status,
            hash = EXCLUDED.hash,
            previous_hash = EXCLUDED.previous_hash;
        `, [
          lg.id, lg.timestamp, (lg as any).user || (lg as any).userName || 'Officer', lg.role, lg.action, lg.details,
          lg.syncStatus || 'Synced', lg.hash || null, lg.previousHash || null
        ]);
      }
    }

    // 7. Products
    if (state.products && Array.isArray(state.products) && state.products.length > 0) {
      for (const p of state.products) {
        await client.query(`
          INSERT INTO products (id, name, ceb_name, category, description, unit, price, quantity_available, stock_status, farmer_name, farmer_sitio, farmer_phone, contact_person, image_url, is_published, updated_by, managed_by, date_updated)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            ceb_name = EXCLUDED.ceb_name,
            category = EXCLUDED.category,
            description = EXCLUDED.description,
            unit = EXCLUDED.unit,
            price = EXCLUDED.price,
            quantity_available = EXCLUDED.quantity_available,
            stock_status = EXCLUDED.stock_status,
            farmer_name = EXCLUDED.farmer_name,
            farmer_sitio = EXCLUDED.farmer_sitio,
            farmer_phone = EXCLUDED.farmer_phone,
            contact_person = EXCLUDED.contact_person,
            image_url = EXCLUDED.image_url,
            is_published = EXCLUDED.is_published,
            updated_by = EXCLUDED.updated_by,
            managed_by = EXCLUDED.managed_by,
            date_updated = EXCLUDED.date_updated;
        `, [
          p.id, p.name, p.cebName, p.category, p.description, p.unit,
          p.price, p.quantityAvailable, p.stockStatus, p.farmerName || null,
          p.farmerSitio || null, p.farmerPhone || null, p.contactPerson || null,
          p.imageUrl || null, p.isPublished ?? true, p.updatedBy || null,
          p.managedBy || null, p.dateUpdated || null
        ]);
      }
    }

    // 8. Resolutions
    if (state.resolutions && Array.isArray(state.resolutions) && state.resolutions.length > 0) {
      for (const r of state.resolutions) {
        await client.query(`
          INSERT INTO resolutions (id, resolution_number, title, description, date_agreed, moved_by, seconded_by, vote_in_favor, vote_against, vote_abstain, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            resolution_number = EXCLUDED.resolution_number,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            date_agreed = EXCLUDED.date_agreed,
            moved_by = EXCLUDED.moved_by,
            seconded_by = EXCLUDED.seconded_by,
            vote_in_favor = EXCLUDED.vote_in_favor,
            vote_against = EXCLUDED.vote_against,
            vote_abstain = EXCLUDED.vote_abstain,
            status = EXCLUDED.status;
        `, [
          r.id, r.resolutionNumber, r.title, r.description, r.dateAgreed,
          r.movedBy, r.secondedBy, r.voteInFavor, r.voteAgainst, r.voteAbstain, r.status
        ]);
      }
    }

    // 9. Announcements
    if (state.announcements && Array.isArray(state.announcements) && state.announcements.length > 0) {
      for (const a of state.announcements) {
        await client.query(`
          INSERT INTO announcements (id, title, category, content, date_posted, priority, posted_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            content = EXCLUDED.content,
            date_posted = EXCLUDED.date_posted,
            priority = EXCLUDED.priority,
            posted_by = EXCLUDED.posted_by;
        `, [a.id, a.title, a.category, a.content, a.datePosted, a.priority, a.postedBy]);
      }
    }

    // 10. Activities
    if (state.activities && Array.isArray(state.activities) && state.activities.length > 0) {
      for (const act of state.activities) {
        await client.query(`
          INSERT INTO activities (id, title, ceb_title, category, scheduled_date, date_scheduled, scheduled_time, time_scheduled, location, description, organizer, status, documented_notes, attendees_count, target_audience, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            ceb_title = EXCLUDED.ceb_title,
            category = EXCLUDED.category,
            scheduled_date = EXCLUDED.scheduled_date,
            date_scheduled = EXCLUDED.date_scheduled,
            scheduled_time = EXCLUDED.scheduled_time,
            time_scheduled = EXCLUDED.time_scheduled,
            location = EXCLUDED.location,
            description = EXCLUDED.description,
            organizer = EXCLUDED.organizer,
            status = EXCLUDED.status,
            documented_notes = EXCLUDED.documented_notes,
            attendees_count = EXCLUDED.attendees_count,
            target_audience = EXCLUDED.target_audience,
            image_url = EXCLUDED.image_url;
        `, [
          act.id, act.title, act.cebTitle || null, act.category,
          act.scheduledDate || act.dateScheduled || null,
          act.dateScheduled || act.scheduledDate || null,
          act.scheduledTime || act.timeScheduled || null,
          act.timeScheduled || act.scheduledTime || null,
          act.location, act.description, act.organizer, act.status,
          act.documentedNotes || null, act.attendeesCount || 0,
          act.targetAudience || null, act.imageUrl || null
        ]);
      }
    }

    // 11. Organization Funds (handles organizationFunds OR funds)
    const fundList = state.organizationFunds || state.funds;
    if (fundList && Array.isArray(fundList) && fundList.length > 0) {
      for (const f of fundList) {
        await client.query(`
          INSERT INTO organization_funds (id, name, code, allocated_amount, current_balance, description, custodian, last_updated)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            code = EXCLUDED.code,
            allocated_amount = EXCLUDED.allocated_amount,
            current_balance = EXCLUDED.current_balance,
            description = EXCLUDED.description,
            custodian = EXCLUDED.custodian,
            last_updated = EXCLUDED.last_updated;
        `, [
          f.id, f.name, f.code, f.allocatedAmount || 0, f.currentBalance || 0,
          f.description || '', f.custodian || '', f.lastUpdated || new Date().toISOString().split('T')[0]
        ]);
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
