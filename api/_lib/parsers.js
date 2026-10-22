// Parsers for BNI Connect exports. These ".xls" files are actually SpreadsheetML 2003 XML.
// Both parsers take the raw file text and return structured rows. No external deps.

function decode(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

/** Returns array of rows, each an array of cell strings (null for empty). Honors ss:Index gaps. */
export function readSpreadsheetML(text) {
  if (!/urn:schemas-microsoft-com:office:spreadsheet/.test(text)) {
    throw new Error('Not a BNI Connect export (expected SpreadsheetML XML). Upload the .xls exactly as downloaded from BNI Connect.');
  }
  const rows = [];
  const rowRe = /<(?:ss:)?Row\b[^>]*>([\s\S]*?)<\/(?:ss:)?Row>/g;
  const cellRe = /<(?:ss:)?Cell\b([^>]*)>([\s\S]*?)<\/(?:ss:)?Cell>|<(?:ss:)?Cell\b([^>]*)\/>/g;
  const dataRe = /<(?:ss:)?Data\b[^>]*>([\s\S]*?)<\/(?:ss:)?Data>/;
  let m;
  while ((m = rowRe.exec(text))) {
    const cells = [];
    let c;
    while ((c = cellRe.exec(m[1]))) {
      // BNI Connect uses merged cells (MergeAcross) and ss:Index inconsistently; positional
      // reading (one Cell element = one column) is what lines header and data rows up.
      const d = c[2] ? c[2].match(dataRe) : null;
      cells.push(d ? decode(d[1].replace(/<[^>]+>/g, '')).trim() : null);
    }
    rows.push(cells);
  }
  return rows;
}

function metaValue(rows, label) {
  for (const r of rows) {
    const i = r.findIndex(x => x && x.replace(/:$/, '').trim().toLowerCase() === label.toLowerCase());
    if (i >= 0) { const v = r.slice(i + 1).find(x => x !== null && x !== ''); if (v !== undefined) return v; }
  }
  return null;
}

export function normChapter(name) {
  return String(name || '').toLowerCase().replace(/^bni\s+/, '').replace(/[^a-z0-9]/g, '');
}

/**
 * Region Meeting Statistics > Chapter Statistics (one month, From == To).
 * Returns { report, region, month: 'YYYY-MM', rows: [{chapter, mem_avg, one_to_one, one_to_one_per_member, referrals, visitors, tyfcb, ceus}] }
 */
export function parseChapterStatistics(text) {
  const rows = readSpreadsheetML(text);
  const title = (rows[0] && rows[0][0]) || '';
  if (!/Chapter Statistics/i.test(title)) throw new Error(`This is not a Chapter Statistics report (title: "${title}").`);
  const region = metaValue(rows, 'Region');
  const from = metaValue(rows, 'From'); const to = metaValue(rows, 'To');
  if (from !== to) throw new Error(`Report covers ${from} to ${to}. Export ONE month at a time (From and To must be the same month).`);
  const mm = /^(\d{2})\/(\d{4})$/.exec(from || '');
  if (!mm) throw new Error(`Could not read the month from "${from}".`);
  const month = `${mm[2]}-${mm[1]}`;

  const hIdx = rows.findIndex(r => r[0] === 'Chapter Name');
  if (hIdx < 0) throw new Error('Header row "Chapter Name" not found.');
  const h = rows[hIdx].map(x => (x || '').trim());
  const col = name => h.findIndex(x => x.toLowerCase() === name.toLowerCase());
  const cMem = col('Mem Avg'), c121 = col('1-2-1'), c121pm = col('1-2-1 Per Member');
  const cRef = col('Referrals'), cVis = col('Vis'), cTy = col('TYFCB'), cCeu = col('CEUs');
  if (cMem < 0 || c121pm < 0) throw new Error('Expected columns "Mem Avg" and "1-2-1 Per Member" not found.');

  const out = [];
  for (const r of rows.slice(hIdx + 1)) {
    if (!r[0] || !/^BNI\s/i.test(r[0])) continue;
    out.push({
      chapter: r[0].trim(),
      key: normChapter(r[0]),
      mem_avg: Number(r[cMem]),
      one_to_one: Number(r[c121]),
      one_to_one_per_member: Number(r[c121pm]),
      referrals: cRef >= 0 ? Number(r[cRef]) : null,
      visitors: cVis >= 0 ? Number(r[cVis]) : null,
      tyfcb: cTy >= 0 ? Number(r[cTy]) : null,
      ceus: cCeu >= 0 ? Number(r[cCeu]) : null,
    });
  }
  if (!out.length) throw new Error('No chapter rows found in the report.');
  return { report: 'chapter_statistics', region, month, rows: out };
}

/**
 * Region Member Training Report (members who attended), one calendar month.
 * Returns { report, region, month, attendances: [{chapter, key, first, last, member_key, event_date, event_type}],
 *           by_chapter: { key: { chapter, unique_members: n, attendances: n, by_event: {type: uniqueCount} } } }
 */
export function parseTrainingReport(text) {
  const rows = readSpreadsheetML(text);
  const title = (rows[0] && rows[0][0]) || '';
  if (!/Member Training Report/i.test(title)) throw new Error(`This is not a Region Member Training Report (title: "${title}").`);
  const region = metaValue(rows, 'Region');
  const from = metaValue(rows, 'From') || ''; const to = metaValue(rows, 'To') || '';
  const fm = from.slice(0, 7), tm = to.slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(fm)) throw new Error(`Could not read the From date "${from}".`);
  if (fm !== tm) throw new Error(`Report covers ${from.slice(0, 10)} to ${to.slice(0, 10)}. Export ONE calendar month at a time.`);
  const month = fm;

  const hIdx = rows.findIndex(r => r[0] === 'Chapter Name');
  if (hIdx < 0) throw new Error('Header row "Chapter Name" not found.');
  const h = rows[hIdx].map(x => (x || '').trim().toLowerCase());
  const col = n => h.indexOf(n.toLowerCase());
  const cFirst = col('First Name'), cLast = col('Last Name'), cDate = col('Event Date'), cType = col('Event Type'), cEmail = col('Email');

  const attendances = [];
  for (const r of rows.slice(hIdx + 1)) {
    if (!r[0] || !/^BNI\s/i.test(r[0])) continue;
    const first = (r[cFirst] || '').trim(), last = (r[cLast] || '').trim();
    const email = (r[cEmail] || '').trim().toLowerCase();
    attendances.push({
      chapter: r[0].trim(), key: normChapter(r[0]),
      first, last,
      member_key: email || `${first} ${last}`.toLowerCase().replace(/\s+/g, ' '),
      event_date: (r[cDate] || '').slice(0, 10),
      event_type: (r[cType] || '').trim(),
    });
  }
  const by_chapter = {};
  for (const a of attendances) {
    const b = by_chapter[a.key] || (by_chapter[a.key] = { chapter: a.chapter, members: new Set(), attendances: 0, by_event_members: {} });
    b.members.add(a.member_key); b.attendances++;
    (b.by_event_members[a.event_type] || (b.by_event_members[a.event_type] = new Set())).add(a.member_key);
  }
  for (const k of Object.keys(by_chapter)) {
    const b = by_chapter[k];
    b.unique_members = b.members.size; delete b.members;
    b.by_event = {}; for (const [t, set] of Object.entries(b.by_event_members)) b.by_event[t] = set.size;
    delete b.by_event_members;
  }
  const event_types = [...new Set(attendances.map(a => a.event_type))].sort();
  return { report: 'training', region, month, attendances, by_chapter, event_types };
}

/**
 * Compute online/offline % for a chapter from a training parse + member count + online event-type list.
 * Unique members counted once in combined; a member is "online" if ANY of their events is an online type.
 */
export function trainingPercents(attendances, chapterKey, memberCount, onlineTypes) {
  const online = new Set((onlineTypes || []).map(t => t.trim().toLowerCase()));
  const members = new Map();
  for (const a of attendances) {
    if (a.key !== chapterKey) continue;
    const isOnline = online.has(a.event_type.trim().toLowerCase());
    members.set(a.member_key, (members.get(a.member_key) || false) || isOnline);
  }
  let on = 0, off = 0;
  for (const v of members.values()) v ? on++ : off++;
  const pct = n => memberCount > 0 ? Math.round((n / memberCount) * 10000) / 100 : 0;
  return { online_count: on, offline_count: off, unique_members: members.size, online_pct: pct(on), offline_pct: pct(off) };
}

/**
 * All India Chapter Traffic Lights (xlsx). The browser converts the sheet to rows (SheetJS, header:1) and posts them;
 * this picks the header row by keywords so column order changes in the export do not break it.
 * Returns { report, month, rows: [{chapter, key, score, status, growth, retention, members, rank}], header }.
 * Status: the sheet's own status/colour column when present, else derived from the score (BNI: 70+ GREEN, 50 to 69.9 AMBER, below RED).
 */
export function parseTrafficLights(rows, monthHint) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Empty file.');
  const norm = v => String(v ?? '').trim().toLowerCase();
  const hIdx = rows.findIndex(r => Array.isArray(r) && r.filter(c => norm(c)).length >= 2
    && r.some(c => /chapter/.test(norm(c)) && norm(c).length <= 30)
    && r.some(c => /^(total\s*)?score|^status|traffic\s*light\s*(status|colou?r)/.test(norm(c)) && norm(c).length <= 30));
  if (hIdx < 0) throw new Error('Could not find a header row with "Chapter" and "Score" / "Status". Is this the All India Chapter Traffic Lights export?');
  const h = rows[hIdx].map(norm);
  const find = (...res) => { for (const re of res) { const i = h.findIndex(x => re.test(x)); if (i >= 0) return i; } return -1; };
  const cChap = find(/^chapter(\s*name)?$/, /chapter/);
  const cScore = find(/^(total\s*)?score$/, /^score/, /score(?!.*(percentile|rank))/);
  const cStatus = find(/^status$/, /traffic\s*light\s*(status|colou?r)?$/, /colou?r/, /status/);
  const cGrowth = find(/^(net\s*)?growth/, /net\s*(add|growth)/);
  const cRet = find(/retention/);
  const cMem = find(/^members?$/, /member\s*count|membership|size|^mem/);
  const cRank = find(/^(all\s*india\s*)?rank$/, /rank/);
  if (cChap < 0 || (cScore < 0 && cStatus < 0)) throw new Error('Header row found but no "Score" or "Status" column.');
  const num = v => { if (v === null || v === undefined || v === '') return null; const n = Number(String(v).replace(/[%,]/g, '')); return Number.isNaN(n) ? null : n; };
  const statusOf = (raw, score) => {
    const s = norm(raw);
    if (/green/.test(s)) return 'GREEN';
    if (/amber|yellow|orange/.test(s)) return 'AMBER';
    if (/red/.test(s)) return 'RED';
    if (/grey|gray/.test(s)) return 'GREY';
    if (score === null) return null;
    return score >= 70 ? 'GREEN' : score >= 50 ? 'AMBER' : 'RED';
  };
  const out = [];
  for (const r of rows.slice(hIdx + 1)) {
    if (!Array.isArray(r)) continue;
    const chapter = String(r[cChap] ?? '').trim();
    if (!chapter || /^(total|average|region)/i.test(chapter)) continue;
    const score = cScore >= 0 ? num(r[cScore]) : null;
    const status = statusOf(cStatus >= 0 ? r[cStatus] : null, score);
    if (score === null && !status) continue;
    let retention = cRet >= 0 ? num(r[cRet]) : null;
    if (retention !== null && retention <= 1) retention = Math.round(retention * 10000) / 100; // fractions in the export
    out.push({
      chapter, key: normChapter(chapter.replace(/\.+$/, '')), score, status,
      growth: cGrowth >= 0 ? num(r[cGrowth]) : null, retention,
      members: cMem >= 0 ? num(r[cMem]) : null, rank: cRank >= 0 ? num(r[cRank]) : null,
    });
  }
  if (!out.length) throw new Error('No chapter rows found under the header.');
  const title = String(rows.find(r => Array.isArray(r) && r.some(c => /traffic/i.test(String(c ?? ''))))?.find(c => /traffic/i.test(String(c ?? ''))) || '');
  return { report: 'traffic_lights', month: monthHint || null, title, header: rows[hIdx], rows: out };
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
/** "Oct 16, 2026" | "16 Oct 2026" | "2026-10-16" | "16/10/2026" -> "2026-10-16" (null if unreadable) */
export function readDate(str) {
  const s = String(str || '').trim(); let m;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  const mon = w => MONTHS[String(w).toLowerCase().slice(0, 4)] || MONTHS[String(w).toLowerCase().slice(0, 3)];
  if ((m = /([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/.exec(s)) && mon(m[1]))
    return `${m[3]}-${String(mon(m[1])).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  if ((m = /(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/.exec(s)) && mon(m[2]))
    return `${m[3]}-${String(mon(m[2])).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  if ((m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s))) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; // Indian dd/mm/yyyy
  return null;
}

/**
 * BNI Connect "Last Meeting Entered" (PALMS status) table, pasted as text from the browser
 * (tab-separated rows: Region, Chapter Name, Last Meeting Entered) or typed one chapter per line.
 * Returns [{ chapter, key, last: 'YYYY-MM-DD' }].
 */
export function parsePalmsStatus(text) {
  const out = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const cm = /\bBNI\s+([A-Za-z][A-Za-z .'-]*?)(?=\t|\s{2,}|\s+[A-Z][a-z]{2,8}\.?\s+\d{1,2},?\s+\d{4}|\s+\d{1,2}[\/ -]|$)/.exec(line);
    if (!cm) continue;
    const rest = line.slice(cm.index + cm[0].length);
    const last = readDate(rest);
    if (!last) continue;
    const chapter = `BNI ${cm[1].trim()}`;
    out.push({ chapter, key: normChapter(chapter.replace(/\.+$/, '')), last });
  }
  return out;
}
