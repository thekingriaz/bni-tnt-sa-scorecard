import { handler, clearSessionCookie } from '../_lib/db.js';
export default handler(async ({ res }) => { clearSessionCookie(res); return { ok: true }; });
