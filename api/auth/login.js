import bcrypt from 'bcryptjs';
import { db, handler, fail, signSession, setSessionCookie } from '../_lib/db.js';

// POST { mode: 'sa', chapter_id, pin }  or  { mode: 'admin', email, password }
export default handler(async ({ req, res, body }) => {
  if (req.method !== 'POST') throw fail('POST only', 405);
  let user;
  if (body.mode === 'admin') {
    const email = String(body.email || '').trim().toLowerCase();
    const { data } = await db.from('sa_users').select('*').eq('role', 'admin').eq('email', email).eq('active', true).maybeSingle();
    if (!data || !data.password_hash || !(await bcrypt.compare(String(body.password || ''), data.password_hash))) {
      throw fail('Wrong email or password', 401);
    }
    user = data;
  } else {
    const chapter_id = Number(body.chapter_id);
    const pin = String(body.pin || '').trim();
    if (!chapter_id || !pin) throw fail('Pick your chapter and enter your PIN');
    const { data } = await db.from('sa_users').select('*').eq('role', 'sa').eq('chapter_id', chapter_id).eq('active', true);
    for (const u of data || []) {
      if (u.pin_hash && (await bcrypt.compare(pin, u.pin_hash))) { user = u; break; }
    }
    if (!user) throw fail('Wrong PIN for this chapter', 401);
  }
  await db.from('sa_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);
  setSessionCookie(res, await signSession(user));
  return { ok: true, user: { id: user.id, role: user.role, name: user.name, chapter_id: user.chapter_id } };
});
