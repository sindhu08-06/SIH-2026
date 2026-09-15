import crypto from 'node:crypto';
import { db } from './db';

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createSession(userId: string, role: string): string {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  db.prepare(`
    INSERT INTO sessions (token, user_id, role, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(token, userId, role, expiresAt);
  return token;
}

export function getUserByToken(token: string) {
  if (!token) return null;
  const session = db.prepare(`
    SELECT s.user_id, s.role, u.email, u.phone, u.name, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, new Date().toISOString()) as any;

  return session || null;
}
