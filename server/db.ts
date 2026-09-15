import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';

// In serverless environments like Vercel, process.cwd() is read-only.
// We store runtime SQLite databases in os.tmpdir() or fallback to memory.
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NODE_ENV === 'test'
);

const dataDir = isServerless ? path.join(os.tmpdir(), 'sahakar_data') : path.join(process.cwd(), 'data');

let databaseInstance: DatabaseSync;
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'sahakar_seva.db');
  databaseInstance = new DatabaseSync(dbPath);
} catch (err) {
  console.warn('Notice: SQLite directory creation or file open fallback to in-memory SQLite:', err);
  databaseInstance = new DatabaseSync(':memory:');
}

export const db = databaseInstance;

let isDbInitialized = false;

// Initialize schema
export function initDatabase(force = false) {
  if (isDbInitialized && !force) {
    return;
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('worker', 'customer', 'admin')),
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      society_id TEXT,
      society_name TEXT,
      coop_member_id TEXT,
      primary_skill TEXT NOT NULL,
      skills_json TEXT NOT NULL,
      hourly_rate REAL DEFAULT 350,
      service_radius_km REAL DEFAULT 15,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      city TEXT NOT NULL,
      area TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('unverified', 'under_review', 'verified', 'rejected')),
      verification_notes TEXT,
      verified_at TEXT,
      verified_by TEXT,
      id_proof_type TEXT,
      id_proof_number TEXT,
      cert_title TEXT,
      cert_number TEXT,
      issuing_body TEXT,
      emergency_certified INTEGER DEFAULT 0,
      availability TEXT DEFAULT 'available' CHECK(availability IN ('available', 'on_job', 'offline')),
      rating REAL DEFAULT 4.8,
      completed_jobs_count INTEGER DEFAULT 0,
      bank_upi TEXT,
      welfare_fund_balance REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_code TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      service_category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_emergency INTEGER DEFAULT 0,
      emergency_priority TEXT DEFAULT 'normal',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      area TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'assigned', 'in_transit', 'in_progress', 'completed', 'cancelled')),
      assigned_worker_id TEXT,
      assigned_worker_name TEXT,
      total_amount REAL NOT NULL,
      worker_payout REAL NOT NULL,
      coop_welfare_fee REAL NOT NULL,
      platform_fee REAL NOT NULL,
      scheduled_time TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      payment_status TEXT DEFAULT 'pending',
      invoice_number TEXT,
      rating REAL,
      review_comment TEXT,
      FOREIGN KEY(assigned_worker_id) REFERENCES workers(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL,
      worker_name TEXT,
      society_name TEXT,
      primary_skill TEXT,
      title TEXT NOT NULL,
      issuing_body TEXT NOT NULL,
      credential_number TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT,
      document_type TEXT NOT NULL,
      file_url TEXT,
      verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
      verified_at TEXT,
      verified_by TEXT,
      rejection_reason TEXT,
      digital_seal_code TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(worker_id) REFERENCES workers(id)
    );
  `);

  // Migration for new rating columns in bookings & users if not already present
  const safeAddColumn = (table: string, columnDef: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
    } catch {
      // Column already exists, safe to ignore
    }
  };

  safeAddColumn('bookings', 'worker_rating REAL');
  safeAddColumn('bookings', 'worker_review TEXT');
  safeAddColumn('bookings', 'worker_rating_tags TEXT');
  safeAddColumn('bookings', 'worker_rated_at TEXT');
  safeAddColumn('bookings', 'booker_rating REAL');
  safeAddColumn('bookings', 'booker_review TEXT');
  safeAddColumn('bookings', 'booker_rating_tags TEXT');
  safeAddColumn('bookings', 'booker_rated_at TEXT');

  safeAddColumn('users', 'booker_rating REAL DEFAULT 5.0');
  safeAddColumn('users', 'booker_ratings_count INTEGER DEFAULT 0');
  safeAddColumn('users', 'booker_completed_jobs INTEGER DEFAULT 0');

  // Skill checks & credentials verification columns for workers
  safeAddColumn('workers', 'skill_check_score REAL DEFAULT 100');
  safeAddColumn('workers', "skill_check_status TEXT DEFAULT 'passed'");
  safeAddColumn('workers', 'skill_check_completed_at TEXT');
  safeAddColumn('workers', 'credential_doc_type TEXT');
  safeAddColumn('workers', 'credential_file_name TEXT');
  safeAddColumn('workers', 'digital_seal_code TEXT');

  // Ensure default federation admin user exists for verification board
  const adminId = 'u-admin-1';
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPw = hashPassword('coop1234', salt);
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, phone, name, role, password_hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(adminId, 'admin@sahakar.coop', '+919800011222', 'Federation Board Officer', 'admin', hashedPw, salt, now);

  // Ensure default demo customer user exists for easy testing
  const custId = 'u-customer-1';
  const custSalt = crypto.randomBytes(16).toString('hex');
  const custHashedPw = hashPassword('customer123', custSalt);
  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, phone, name, role, password_hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(custId, 'customer@sahakar.coop', '+919822481092', 'Teja Reddy', 'customer', custHashedPw, custSalt, now);

  isDbInitialized = true;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

