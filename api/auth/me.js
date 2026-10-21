import { db, handler } from '../_lib/db.js';

// GET: session + chapter list (chapters are public so the login screen can show the dropdown)
export default handler(async ({ session }) => {
  const { data: chapters } = await db.from('sa_chapters').select('id,name,region,sort_order').eq('active', true).order('sort_order');
  return { user: session ? { id: session.uid, role: session.role, name: session.name, chapter_id: session.chapter_id } : null, chapters };
});
