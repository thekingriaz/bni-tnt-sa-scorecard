import { createClient } from '@supabase/supabase-js';
import { SignJWT, jwtVerify } from 'jose';
import { mergeSettings } from './scoring.js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY env vars');

export const db = createClient(url || 'http://localhost', key || 'x', { auth: { persistSession: false } });

const COOKIE = 'sa_session';
const secret = () => new TextEncoder().encode(process.env.APP_SECRET || 'dev-secret-change-me');

export async function signSession(user) {
  return new SignJWT({ uid: user.id, role: user.role, name: user.name, chapter_id: user.chapter_id || null })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(secret());
}

export function setSessionCookie(res, token) {
  const secure = process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}${secure}`);
}
export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export async function getSession(req) {
  const raw = req.headers.cookie || '';
  const m = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return null;
  try { const { payload } = await jwtVerify(m[1], secret()); return payload; } catch { return null; }
}

/** Wraps a handler: parses JSON body, enforces role, catches errors. */
export function handler(fn, { role } = {}) {
  return async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return res.status(204).end();
      const session = await getSession(req);
      if (role) {
        if (!session) return res.status(401).json({ error: 'Not signed in' });
        if (role === 'admin' && session.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
      }
      const result = await fn({ req, res, session, body: req.body || {} });
      if (result !== undefined && !res.headersSent) res.status(200).json(result);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(e.status || 500).json({ error: e.message || 'Server error' });
    }
  };
}

export function fail(msg, status = 400) { const e = new Error(msg); e.status = status; return e; }

export async function loadSettings() {
  const { data, error } = await db.from('sa_settings').select('key,value');
  if (error) throw error;
  const o = {}; for (const r of data) o[r.key] = r.value;
  return mergeSettings(o);
}

export async function audit(user_id, action, detail) {
  await db.from('sa_audit').insert({ user_id, action, detail });
}
