import { db, handler } from '../_lib/db.js';

// GET: session + chapter list (chapters are public so the login screen can show the dropdown)
export default handler(async ({ session }) => {
  const { data: chapters, error } = await db.from('sa_chapters').select('id,name,region,sort_order').eq('active', true).order('sort_order');
  if (error) throw new Error(`Database error: ${error.message} (check SUPABASE_URL / SUPABASE_SERVICE_KEY in Vercel)`);
  return {
    user: session ? { id: session.uid, role: session.role, name: session.name, chapter_id: session.chapter_id } : null,
    chapters,
    env: { supabase_url_set: !!process.env.SUPABASE_URL, service_key_set: !!process.env.SUPABASE_SERVICE_KEY, app_secret_set: !!process.env.APP_SECRET, jotform_key_set: !!process.env.JOTFORM_API_KEY },
  };
});
