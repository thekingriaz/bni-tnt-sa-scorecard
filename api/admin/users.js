import bcrypt from 'bcryptjs';
import { db, handler, fail, audit } from '../_lib/db.js';

// GET -> all users
// POST { action:'create_sa', name, chapter_id, pin, jotform_alias }
// POST { action:'create_admin', name, email, password }
// POST { action:'update', id, name?, chapter_id?, jotform_alias?, active?, email? }
// POST { action:'set_pin', id, pin }      POST { action:'set_password', id, password }
// POST { action:'replace_sa', chapter_id, name, pin, jotform_alias, from_ym }  -> deactivates current SA, creates new one,
//        re-points draft entries from from_ym onward to the new SA (history by person).
export default handler(async ({ req, session, body }) => {
  if (req.method === 'GET') {
    const { data } = await db.from('sa_users').select('id,role,name,email,chapter_id,jotform_alias,active,created_at,last_login_at, chapter:sa_chapters(name)').order('role').order('name');
    return { users: data };
  }
  if (req.method !== 'POST') throw fail('POST only', 405);
  const a = body.action;
  const hash = v => bcrypt.hash(String(v), 10);

  if (a === 'create_sa') {
    if (!body.name || !body.chapter_id || !body.pin) throw fail('name, chapter_id and pin are required');
    if (!/^\d{4,8}$/.test(String(body.pin))) throw fail('PIN must be 4 to 8 digits');
    const r = await db.from('sa_users').insert({ role: 'sa', name: body.name.trim(), chapter_id: Number(body.chapter_id), pin_hash: await hash(body.pin), jotform_alias: body.jotform_alias || body.name.trim() }).select().single();
    if (r.error) throw r.error;
    await audit(session.uid, 'user.create_sa', { id: r.data.id, name: body.name });
    return { ok: true, id: r.data.id };
  }
  if (a === 'create_admin') {
    if (!body.name || !body.email || !body.password) throw fail('name, email and password are required');
    if (String(body.password).length < 8) throw fail('Password must be at least 8 characters');
    const r = await db.from('sa_users').insert({ role: 'admin', name: body.name.trim(), email: body.email.trim().toLowerCase(), password_hash: await hash(body.password) }).select().single();
    if (r.error) throw r.error;
    await audit(session.uid, 'user.create_admin', { id: r.data.id, email: body.email });
    return { ok: true, id: r.data.id };
  }
  if (a === 'update') {
    const patch = {};
    for (const k of ['name', 'chapter_id', 'jotform_alias', 'active', 'email']) if (k in body) patch[k] = body[k];
    if ('chapter_id' in patch) patch.chapter_id = patch.chapter_id ? Number(patch.chapter_id) : null;
    if (Number(body.id) === session.uid && patch.active === false) throw fail('You cannot deactivate yourself');
    const r = await db.from('sa_users').update(patch).eq('id', Number(body.id));
    if (r.error) throw r.error;
    await audit(session.uid, 'user.update', { id: body.id, patch });
    return { ok: true };
  }
  if (a === 'set_pin') {
    if (!/^\d{4,8}$/.test(String(body.pin || ''))) throw fail('PIN must be 4 to 8 digits');
    const r = await db.from('sa_users').update({ pin_hash: await hash(body.pin) }).eq('id', Number(body.id)).eq('role', 'sa');
    if (r.error) throw r.error;
    await audit(session.uid, 'user.set_pin', { id: body.id });
    return { ok: true };
  }
  if (a === 'set_password') {
    if (String(body.password || '').length < 8) throw fail('Password must be at least 8 characters');
    const r = await db.from('sa_users').update({ password_hash: await hash(body.password) }).eq('id', Number(body.id)).eq('role', 'admin');
    if (r.error) throw r.error;
    await audit(session.uid, 'user.set_password', { id: body.id });
    return { ok: true };
  }
  if (a === 'replace_sa') {
    const chapter_id = Number(body.chapter_id);
    if (!chapter_id || !body.name || !body.pin) throw fail('chapter_id, name and pin are required');
    if (!/^\d{4,8}$/.test(String(body.pin))) throw fail('PIN must be 4 to 8 digits');
    await db.from('sa_users').update({ active: false }).eq('role', 'sa').eq('chapter_id', chapter_id).eq('active', true);
    const r = await db.from('sa_users').insert({ role: 'sa', name: body.name.trim(), chapter_id, pin_hash: await hash(body.pin), jotform_alias: body.jotform_alias || body.name.trim() }).select().single();
    if (r.error) throw r.error;
    if (body.from_ym) {
      const { data: months } = await db.from('sa_months').select('id,ym').gte('ym', body.from_ym).eq('status', 'draft');
      for (const m of months || []) await db.from('sa_entries').update({ sa_user_id: r.data.id }).eq('month_id', m.id).eq('chapter_id', chapter_id);
    }
    await audit(session.uid, 'user.replace_sa', { chapter_id, new_id: r.data.id, from_ym: body.from_ym });
    return { ok: true, id: r.data.id };
  }
  throw fail('Unknown action');
}, { role: 'admin' });
