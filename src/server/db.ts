import pg from 'pg';
import { 
  SEED_USERS, INITIAL_MEMBERS, INITIAL_MEETINGS, INITIAL_RESOLUTIONS, 
  INITIAL_TRANSACTIONS, INITIAL_ANNOUNCEMENTS, INITIAL_LOGS, INITIAL_HOG_RAISING, 
  INITIAL_PRODUCTS, INITIAL_ACTIVITIES, INITIAL_FUNDS 
} from '../initialData';

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;
let lastUsedConnectionString: string | null = null;

export function isDatabaseConfigured(): boolean {
  const dbUrl = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '');
  return Boolean(
    dbUrl && 
    dbUrl !== '' && 
    !dbUrl.includes('your_aiven_connection_string') && 
    !dbUrl.includes('YOUR_PASSWORD') &&
    (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))
  );
}

export function cleanDatabaseUrl(rawUrl: string): { connectionString: string; isSsl: boolean; hostInfo: string } {
  let urlStr = rawUrl.trim().replace(/^["']|["']$/g, '');
  let hostInfo = 'PostgreSQL';

  try {
    const parsed = new URL(urlStr);
    hostInfo = `${parsed.hostname}${parsed.port ? ':' + parsed.port : ''}${parsed.pathname}`;
    // Strip sslmode and ssl query params so pg-connection-string does not conflict with explicit SSL options
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('ssl');
    return {
      connectionString: parsed.toString(),
      isSsl: true,
      hostInfo,
    };
  } catch {
    // Fallback regex cleaner
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
    poolInstance = new Pool({
      connectionString,
      ssl: { 
        rejectUnauthorized: false 
      },
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

    poolInstance.on('error', (err) => {
      console.warn('[PostgreSQL Pool Client Error]:', err?.message || err);
    });

    lastUsedConnectionString = connectionString;
  }

  return poolInstance;
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
        status VARCHAR(50)
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
        joined_date VARCHAR(50)
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
        officer_in_charge TEXT
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

    // 11. Organization Funds
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_funds (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        code VARCHAR(50) NOT NULL,
        allocated_amount NUMERIC NOT NULL,
        current_balance NUMERIC NOT NULL,
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

export async function migrateSeedData(pool: pg.Pool) {
  await initDatabaseSchema(pool);

  const client = await pool.connect();
  const summary: Record<string, number> = {};

  try {
    await client.query('BEGIN');

    // 1. Migrate SEED_USERS
    let usersCount = 0;
    for (const u of SEED_USERS) {
      await client.query(`
        INSERT INTO users (id, username, password, name, role, is_approved, joined_date, farm_location, farm_size, primary_crops, contact_number, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
          status = EXCLUDED.status;
      `, [
        u.id, u.username, u.password || 'password123', u.name, u.role, u.isApproved, 
        u.joinedDate || null, u.farmLocation || null, u.farmSize || null, 
        u.primaryCrops || [], u.contactNumber || null, u.status || 'Active'
      ]);
      usersCount++;
    }
    summary.users = usersCount;

    // 2. Migrate INITIAL_MEMBERS
    let membersCount = 0;
    for (const m of INITIAL_MEMBERS) {
      await client.query(`
        INSERT INTO members (id, name, farm_location, farm_size, primary_crops, contact_number, status, joined_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          farm_location = EXCLUDED.farm_location,
          farm_size = EXCLUDED.farm_size,
          primary_crops = EXCLUDED.primary_crops,
          contact_number = EXCLUDED.contact_number,
          status = EXCLUDED.status,
          joined_date = EXCLUDED.joined_date;
      `, [
        m.id, m.name, m.farmLocation, m.farmSize, m.primaryCrops, 
        m.contactNumber, m.status, m.joinedDate
      ]);
      membersCount++;
    }
    summary.members = membersCount;

    // 3. Migrate INITIAL_MEETINGS
    let meetingsCount = 0;
    for (const mt of INITIAL_MEETINGS) {
      await client.query(`
        INSERT INTO meetings (id, title, date, location, attendance_count, agenda, minutes, officer_in_charge)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          date = EXCLUDED.date,
          location = EXCLUDED.location,
          attendance_count = EXCLUDED.attendance_count,
          agenda = EXCLUDED.agenda,
          minutes = EXCLUDED.minutes,
          officer_in_charge = EXCLUDED.officer_in_charge;
      `, [
        mt.id, mt.title, mt.date, mt.location, mt.attendanceCount, 
        mt.agenda, mt.minutes, mt.officerInCharge
      ]);
      meetingsCount++;
    }
    summary.meetings = meetingsCount;

    // 4. Migrate INITIAL_RESOLUTIONS
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

    // 5. Migrate INITIAL_TRANSACTIONS
    let transactionsCount = 0;
    for (const t of INITIAL_TRANSACTIONS) {
      await client.query(`
        INSERT INTO financial_transactions (id, type, category, amount, date, description, recorded_by, audited_status, audited_by, audited_date, audit_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          category = EXCLUDED.category,
          amount = EXCLUDED.amount,
          date = EXCLUDED.date,
          description = EXCLUDED.description,
          recorded_by = EXCLUDED.recorded_by,
          audited_status = EXCLUDED.audited_status,
          audited_by = EXCLUDED.audited_by,
          audited_date = EXCLUDED.audited_date,
          audit_notes = EXCLUDED.audit_notes;
      `, [
        t.id, t.type, t.category, t.amount, t.date, t.description,
        t.recordedBy, t.auditedStatus, t.auditedBy || null, t.auditedDate || null, t.auditNotes || null
      ]);
      transactionsCount++;
    }
    summary.financialTransactions = transactionsCount;

    // 6. Migrate INITIAL_ANNOUNCEMENTS
    let announcementsCount = 0;
    for (const a of INITIAL_ANNOUNCEMENTS) {
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
        a.id, a.title, a.category, a.content, a.datePosted, a.priority, a.postedBy
      ]);
      announcementsCount++;
    }
    summary.announcements = announcementsCount;

    // 7. Migrate INITIAL_LOGS
    let logsCount = 0;
    for (const l of INITIAL_LOGS) {
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
        l.id, l.timestamp, l.user, l.role, l.action, l.details, 'synced', l.hash, l.previousHash
      ]);
      logsCount++;
    }
    summary.systemLogs = logsCount;

    // 8. Migrate INITIAL_HOG_RAISING
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
      'main_state',
      INITIAL_HOG_RAISING.capitalGrant,
      INITIAL_HOG_RAISING.produces || ['Hog Raising'],
      JSON.stringify(INITIAL_HOG_RAISING.expenses),
      JSON.stringify(INITIAL_HOG_RAISING.sales),
      JSON.stringify(INITIAL_HOG_RAISING.groups),
      JSON.stringify(INITIAL_HOG_RAISING.choreLogs),
      INITIAL_HOG_RAISING.closedYears || [2025]
    ]);
    summary.hogRaising = 1;

    // 9. Migrate INITIAL_PRODUCTS
    let productsCount = 0;
    for (const p of INITIAL_PRODUCTS) {
      await client.query(`
        INSERT INTO products (id, name, ceb_name, category, description, unit, price, quantity_available, stock_status, farmer_name, farmer_sitio, farmer_phone, contact_person, is_published, updated_by, managed_by, date_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
          is_published = EXCLUDED.is_published,
          updated_by = EXCLUDED.updated_by,
          managed_by = EXCLUDED.managed_by,
          date_updated = EXCLUDED.date_updated;
      `, [
        p.id, p.name, p.cebName || null, p.category, p.description, p.unit, p.price,
        p.quantityAvailable || null, p.stockStatus, p.farmerName || null, p.farmerSitio || null,
        p.farmerPhone || null, p.contactPerson || null, p.isPublished, p.updatedBy,
        p.managedBy || null, p.dateUpdated
      ]);
      productsCount++;
    }
    summary.products = productsCount;

    // 10. Migrate INITIAL_ACTIVITIES
    let activitiesCount = 0;
    for (const act of INITIAL_ACTIVITIES) {
      await client.query(`
        INSERT INTO activities (id, title, category, scheduled_date, date_scheduled, scheduled_time, time_scheduled, location, description, organizer, status, documented_notes, attendees_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
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
          attendees_count = EXCLUDED.attendees_count;
      `, [
        act.id, act.title, act.category, act.scheduledDate, act.dateScheduled || act.scheduledDate,
        act.scheduledTime, act.timeScheduled || act.scheduledTime, act.location, act.description,
        act.organizer, act.status, act.documentedNotes || null, act.attendeesCount || 0
      ]);
      activitiesCount++;
    }
    summary.activities = activitiesCount;

    // 11. Migrate INITIAL_FUNDS
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
      `, [f.id, f.name, f.code, f.allocatedAmount, f.currentBalance, f.description, f.custodian, f.lastUpdated]);
      fundsCount++;
    }
    summary.funds = fundsCount;

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
  await initDatabaseSchema(pool);
  const client = await pool.connect();

  try {
    const usersRes = await client.query('SELECT * FROM users');
    const membersRes = await client.query('SELECT * FROM members ORDER BY name ASC');
    const meetingsRes = await client.query('SELECT * FROM meetings ORDER BY date DESC');
    const resolutionsRes = await client.query('SELECT * FROM resolutions ORDER BY resolution_number DESC');
    const txRes = await client.query('SELECT * FROM financial_transactions ORDER BY date DESC');
    const annRes = await client.query('SELECT * FROM announcements ORDER BY date_posted DESC');
    const logsRes = await client.query('SELECT * FROM system_logs ORDER BY timestamp DESC');
    const hogRes = await client.query("SELECT * FROM hog_raising WHERE id = 'main_state'");
    const productsRes = await client.query('SELECT * FROM products ORDER BY name ASC');
    const activitiesRes = await client.query('SELECT * FROM activities ORDER BY scheduled_date DESC');
    const fundsRes = await client.query('SELECT * FROM organization_funds ORDER BY code ASC');

    const hogData = hogRes.rows[0] ? {
      capitalGrant: Number(hogRes.rows[0].capital_grant),
      produces: hogRes.rows[0].produces || ['Hog Raising'],
      expenses: typeof hogRes.rows[0].expenses === 'string' ? JSON.parse(hogRes.rows[0].expenses) : hogRes.rows[0].expenses || [],
      sales: typeof hogRes.rows[0].sales === 'string' ? JSON.parse(hogRes.rows[0].sales) : hogRes.rows[0].sales || [],
      groups: typeof hogRes.rows[0].groups === 'string' ? JSON.parse(hogRes.rows[0].groups) : hogRes.rows[0].groups || [],
      choreLogs: typeof hogRes.rows[0].chore_logs === 'string' ? JSON.parse(hogRes.rows[0].chore_logs) : hogRes.rows[0].chore_logs || [],
      closedYears: hogRes.rows[0].closed_years || [2025]
    } : INITIAL_HOG_RAISING;

    return {
      users: usersRes.rows.map(r => ({
        id: r.id,
        username: r.username,
        password: r.password,
        name: r.name,
        role: r.role,
        isApproved: r.is_approved,
        joinedDate: r.joined_date,
        farmLocation: r.farm_location,
        farmSize: r.farm_size ? Number(r.farm_size) : undefined,
        primaryCrops: r.primary_crops,
        contactNumber: r.contact_number,
        status: r.status
      })),
      members: membersRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        farmLocation: r.farm_location,
        farmSize: Number(r.farm_size),
        primaryCrops: r.primary_crops || [],
        contactNumber: r.contact_number,
        status: r.status,
        joinedDate: r.joined_date
      })),
      meetings: meetingsRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        date: r.date,
        location: r.location,
        attendanceCount: Number(r.attendance_count),
        agenda: r.agenda,
        minutes: r.minutes,
        officerInCharge: r.officer_in_charge
      })),
      resolutions: resolutionsRes.rows.map(r => ({
        id: r.id,
        resolutionNumber: r.resolution_number,
        title: r.title,
        description: r.description,
        dateAgreed: r.date_agreed,
        movedBy: r.moved_by,
        secondedBy: r.seconded_by,
        voteInFavor: Number(r.vote_in_favor),
        voteAgainst: Number(r.vote_against),
        voteAbstain: Number(r.vote_abstain),
        status: r.status
      })),
      financialTransactions: txRes.rows.map(r => ({
        id: r.id,
        type: r.type,
        category: r.category,
        amount: Number(r.amount),
        date: r.date,
        description: r.description,
        recordedBy: r.recorded_by,
        auditedStatus: r.audited_status,
        auditedBy: r.audited_by,
        auditedDate: r.audited_date,
        auditNotes: r.audit_notes
      })),
      announcements: annRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        content: r.content,
        datePosted: r.date_posted,
        priority: r.priority,
        postedBy: r.posted_by
      })),
      systemLogs: logsRes.rows.map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        user: r.user_name,
        role: r.role,
        action: r.action,
        details: r.details,
        syncStatus: 'synced',
        hash: r.hash,
        previousHash: r.previous_hash
      })),
      hogRaising: hogData,
      products: productsRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        cebName: r.ceb_name,
        category: r.category,
        description: r.description,
        unit: r.unit,
        price: Number(r.price),
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
      activities: activitiesRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        scheduledDate: r.scheduled_date,
        dateScheduled: r.date_scheduled,
        scheduledTime: r.scheduled_time,
        timeScheduled: r.time_scheduled,
        location: r.location,
        description: r.description,
        organizer: r.organizer,
        status: r.status,
        documentedNotes: r.documented_notes,
        attendeesCount: Number(r.attendees_count)
      })),
      funds: fundsRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        code: r.code,
        allocatedAmount: Number(r.allocated_amount),
        currentBalance: Number(r.current_balance),
        description: r.description,
        custodian: r.custodian,
        lastUpdated: r.last_updated
      }))
    };
  } finally {
    client.release();
  }
}

export async function saveFullStateToPostgres(pool: pg.Pool, state: any) {
  await initDatabaseSchema(pool);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (state.members && Array.isArray(state.members)) {
      for (const m of state.members) {
        await client.query(`
          INSERT INTO members (id, name, farm_location, farm_size, primary_crops, contact_number, status, joined_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            farm_location = EXCLUDED.farm_location,
            farm_size = EXCLUDED.farm_size,
            primary_crops = EXCLUDED.primary_crops,
            contact_number = EXCLUDED.contact_number,
            status = EXCLUDED.status,
            joined_date = EXCLUDED.joined_date;
        `, [m.id, m.name, m.farmLocation, m.farmSize, m.primaryCrops, m.contactNumber, m.status, m.joinedDate]);
      }
    }

    if (state.meetings && Array.isArray(state.meetings)) {
      for (const mt of state.meetings) {
        await client.query(`
          INSERT INTO meetings (id, title, date, location, attendance_count, agenda, minutes, officer_in_charge)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            date = EXCLUDED.date,
            location = EXCLUDED.location,
            attendance_count = EXCLUDED.attendance_count,
            agenda = EXCLUDED.agenda,
            minutes = EXCLUDED.minutes,
            officer_in_charge = EXCLUDED.officer_in_charge;
        `, [mt.id, mt.title, mt.date, mt.location, mt.attendanceCount, mt.agenda, mt.minutes, mt.officerInCharge]);
      }
    }

    if (state.financialTransactions && Array.isArray(state.financialTransactions)) {
      for (const t of state.financialTransactions) {
        await client.query(`
          INSERT INTO financial_transactions (id, type, category, amount, date, description, recorded_by, audited_status, audited_by, audited_date, audit_notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            type = EXCLUDED.type,
            category = EXCLUDED.category,
            amount = EXCLUDED.amount,
            date = EXCLUDED.date,
            description = EXCLUDED.description,
            recorded_by = EXCLUDED.recorded_by,
            audited_status = EXCLUDED.audited_status,
            audited_by = EXCLUDED.audited_by,
            audited_date = EXCLUDED.audited_date,
            audit_notes = EXCLUDED.audit_notes;
        `, [t.id, t.type, t.category, t.amount, t.date, t.description, t.recordedBy, t.auditedStatus, t.auditedBy || null, t.auditedDate || null, t.auditNotes || null]);
      }
    }

    if (state.systemLogs && Array.isArray(state.systemLogs)) {
      for (const l of state.systemLogs) {
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
        `, [l.id, l.timestamp, l.user || l.userName, l.role, l.action, l.details, 'synced', l.hash || '', l.previousHash || '']);
      }
    }

    if (state.funds && Array.isArray(state.funds)) {
      for (const f of state.funds) {
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
        `, [f.id, f.name, f.code, f.allocatedAmount, f.currentBalance, f.description, f.custodian, f.lastUpdated]);
      }
    }

    if (state.hogRaising) {
      const h = state.hogRaising;
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
        'main_state',
        h.capitalGrant || 1000000,
        h.produces || ['Hog Raising'],
        JSON.stringify(h.expenses || []),
        JSON.stringify(h.sales || []),
        JSON.stringify(h.groups || []),
        JSON.stringify(h.choreLogs || []),
        h.closedYears || [2025]
      ]);
    }

    if (state.products && Array.isArray(state.products)) {
      for (const p of state.products) {
        await client.query(`
          INSERT INTO products (id, name, ceb_name, category, description, unit, price, quantity_available, stock_status, farmer_name, farmer_sitio, farmer_phone, contact_person, is_published, updated_by, managed_by, date_updated)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
            is_published = EXCLUDED.is_published,
            updated_by = EXCLUDED.updated_by,
            managed_by = EXCLUDED.managed_by,
            date_updated = EXCLUDED.date_updated;
        `, [
          p.id, p.name, p.cebName || null, p.category, p.description, p.unit, p.price,
          p.quantityAvailable || null, p.stockStatus, p.farmerName || null, p.farmerSitio || null,
          p.farmerPhone || null, p.contactPerson || null, p.isPublished, p.updatedBy,
          p.managedBy || null, p.dateUpdated
        ]);
      }
    }

    if (state.resolutions && Array.isArray(state.resolutions)) {
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

    if (state.announcements && Array.isArray(state.announcements)) {
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

    if (state.activities && Array.isArray(state.activities)) {
      for (const act of state.activities) {
        await client.query(`
          INSERT INTO activities (id, title, category, scheduled_date, date_scheduled, scheduled_time, time_scheduled, location, description, organizer, status, documented_notes, attendees_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
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
            attendees_count = EXCLUDED.attendees_count;
        `, [
          act.id, act.title, act.category,
          act.scheduledDate || act.dateScheduled || null,
          act.dateScheduled || act.scheduledDate || null,
          act.scheduledTime || act.timeScheduled || null,
          act.timeScheduled || act.scheduledTime || null,
          act.location, act.description, act.organizer, act.status,
          act.documentedNotes || null, act.attendeesCount || 0
        ]);
      }
    }

    if (state.users && Array.isArray(state.users)) {
      for (const u of state.users) {
        await client.query(`
          INSERT INTO users (id, username, password, name, role, is_approved, joined_date, farm_location, farm_size, primary_crops, contact_number, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
            status = EXCLUDED.status;
        `, [
          u.id, u.username, u.password || 'password123', u.name, u.role, u.isApproved,
          u.joinedDate || null, u.farmLocation || null, u.farmSize || null,
          u.primaryCrops || [], u.contactNumber || null, u.status || 'Active'
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
