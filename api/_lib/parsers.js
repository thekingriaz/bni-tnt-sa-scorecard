import { DEFAULT_SETTINGS } from './scoring.js';
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
 * All India Chapter Traffic Lights (xlsx). The browser converts the sheet to rows (SheetJS, header:1) and posts them.
 * Real export (Sept 2026): header "Rank | Region | Chapter Name | Chapter Size | Member Growth (6 Months) | Retention | ... |
 * Score Aug 2026 | Score Sept 2026 | Current Position"; ~1,600 chapters, all of India; no colour column.
 * - Chapter names repeat across India (several "BNI Kings"), so rows are filtered to `regions` when given.
 * - Several "Score <Month YYYY>" columns: the one for `monthHint` is used, else the latest month in the header.
 * - Status: the sheet's own status/colour column when present, else from the score (BNI: 70+ GREEN, 50+ AMBER, 30+ RED, else GREY).
 * Returns { report, month, title, header, score_column, rows: [{chapter, key, region, score, status, growth, retention, members, rank}] }.
 */
export function parseTrafficLights(rows, monthHint, regions) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Empty file.');
  const norm = v => String(v ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const hIdx = rows.findIndex(r => Array.isArray(r) && r.filter(c => norm(c)).length >= 2
    && r.some(c => /chapter/.test(norm(c)) && norm(c).length <= 30)
    && r.some(c => /^(total )?score|^status|traffic light (status|colou?r)/.test(norm(c)) && norm(c).length <= 40));
  if (hIdx < 0) throw new Error('Could not find a header row with "Chapter" and "Score". Is this the All India Chapter Traffic Lights export?');
  const h = rows[hIdx].map(norm);
  const find = (...res) => { for (const re of res) { const i = h.findIndex(x => re.test(x)); if (i >= 0) return i; } return -1; };
  const cChap = find(/^chapter( name)?$/, /chapter name/, /chapter/);
  const cRegion = find(/^region/);
  const cStatus = find(/^status$/, /traffic light (status|colou?r)$/, /^colou?r$/);
  const cGrowth = find(/growth/, /net (add|growth)/);
  const cRet = find(/retention/);
  const cMem = find(/chapter size/, /^members?$/, /member count|membership|^size/);
  const cRank = find(/^rank$/, /rank/);
  const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
  // every "Score ..." column, with the month it names
  const scoreCols = h.map((x, i) => ({ x, i })).filter(o => /^(total )?score\b/.test(o.x) && !/^scoring/.test(o.x)).map(o => {
    const m = /([a-z]{3,9})\.?\s+(\d{4})/.exec(o.x); const mo = m && (MON[m[1].slice(0, 4)] || MON[m[1].slice(0, 3)]);
    return { i: o.i, ym: mo ? `${m[2]}-${String(mo).padStart(2, '0')}` : null, label: rows[hIdx][o.i] };
  });
  if (cChap < 0 || (!scoreCols.length && cStatus < 0)) throw new Error('Header row found but no "Score" or "Status" column.');
  let sc = monthHint ? scoreCols.find(c => c.ym === monthHint) : null;
  if (!sc) sc = [...scoreCols].sort((a, b) => String(b.ym).localeCompare(String(a.ym)))[0] || null;
  const month = sc?.ym || monthHint || null;
  const want = regions && regions.length ? new Set(regions.map(norm)) : null;
  const num = v => { if (v === null || v === undefined || v === '') return null; const n = Number(String(v).replace(/[%,]/g, '')); return Number.isNaN(n) ? null : n; };
  const statusOf = (raw, score) => {
    const s = norm(raw);
    if (/green/.test(s)) return 'GREEN';
    if (/amber|yellow|orange/.test(s)) return 'AMBER';
    if (/red/.test(s)) return 'RED';
    if (/grey|gray/.test(s)) return 'GREY';
    if (score === null) return null;
    return score >= 70 ? 'GREEN' : score >= 50 ? 'AMBER' : score >= 30 ? 'RED' : 'GREY';
  };
  const out = [];
  for (const r of rows.slice(hIdx + 1)) {
    if (!Array.isArray(r)) continue;
    const chapter = String(r[cChap] ?? '').trim();
    if (!chapter || /^(total|average|region)/i.test(chapter)) continue;
    const region = cRegion >= 0 ? String(r[cRegion] ?? '').trim() : null;
    if (want && cRegion >= 0 && !want.has(norm(region))) continue;
    const score = sc ? num(r[sc.i]) : null;
    const status = statusOf(cStatus >= 0 ? r[cStatus] : null, score);
    if (score === null && !status) continue;
    let retention = cRet >= 0 ? num(r[cRet]) : null;
    if (retention !== null && retention > 0 && retention <= 1) retention = Math.round(retention * 10000) / 100; // fractions in some exports
    out.push({
      chapter, key: normChapter(chapter.replace(/\.+$/, '')), region, score, status,
      growth: cGrowth >= 0 ? num(r[cGrowth]) : null, retention,
      members: cMem >= 0 ? num(r[cMem]) : null, rank: cRank >= 0 ? num(r[cRank]) : null,
    });
  }
  if (!out.length) throw new Error(want ? 'None of our regions (' + regions.join(', ') + ') found in the file.' : 'No chapter rows found under the header.');
  const title = String(rows.find(r => Array.isArray(r) && r.some(c => /traffic/i.test(String(c ?? ''))))?.find(c => /traffic/i.test(String(c ?? ''))) || '');
  return { report: 'traffic_lights', month, title, header: rows[hIdx], score_column: sc ? String(sc.label).replace(/\s+/g, ' ').trim() : null, rows: out };
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
/** "Oct 16, 2026" | "16 Oct 2026" | "2026-10-16" | "16/10/2026" -> "2026-10-16" (null if unreadable) */
export function readDate(str) {
  const s = String(str || '').trim(); let m;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  const mon = w => MONTHS[String(w).toLowerCase().slice(0, 4)] || MONTHS[String(w).toLowerCase().slice(0, 3)];
  if ((m = /([A-Za-z]{3,9})\.?\s*(\d{1,2})\s*[,.]?\s*(\d{4})/.exec(s)) && mon(m[1]))
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
    const cm = /\bBNI\s+([A-Za-z][A-Za-z .'-]*?)(?=\t|\s{2,}|\s+[A-Z][a-z]{2,8}\.?\s*\d{1,2}\s*[,.]?\s*\d{4}|\s+\d{1,2}[\/ -]|$)/.exec(line);
    if (!cm) continue;
    const rest = line.slice(cm.index + cm[0].length);
    const last = readDate(rest);
    if (!last) continue;
    const chapter = `BNI ${cm[1].trim()}`;
    out.push({ chapter, key: normChapter(chapter.replace(/\.+$/, '')), last });
  }
  return out;
}

/**
 * Region Meeting Statistics > Membership Activity by Chapter (one calendar month, both From and To in that month).
 * Header: Chapter | Member Count At Start | Joined (Count, Percent) | Left (Count, Percent) | Member Count At End | Change (Count, Percent) | Joined And Left | Renewed
 * Returns { report, region, month, rows: [{chapter, key, start, joined, left, end, change}] }.
 */
export function parseMembershipActivity(text) {
  const rows = readSpreadsheetML(text);
  const title = (rows[0] && rows[0][0]) || '';
  if (!/Membership Activity by Chapter/i.test(title)) throw new Error(`This is not a Membership Activity by Chapter report (title: "${title}").`);
  const region = metaValue(rows, 'Region');
  const from = String(metaValue(rows, 'From') || ''), to = String(metaValue(rows, 'To') || '');
  const fm = from.slice(0, 7), tm = to.slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(fm)) throw new Error(`Could not read the From date "${from}".`);
  if (fm !== tm) throw new Error(`Report covers ${from.slice(0, 10)} to ${to.slice(0, 10)}. Run it for ONE calendar month (From = 1st, To = last day).`);
  const hIdx = rows.findIndex(r => r[0] === 'Chapter' && r.some(c => /Member Count At Start/i.test(c || '')));
  if (hIdx < 0) throw new Error('Header row "Chapter / Member Count At Start" not found.');
  // Joined, Left and Change each span two data columns (Count, Percent); the others span one
  const col = {}; let i = 1;
  for (const label of rows[hIdx].slice(1)) {
    if (!label) continue;
    const l = label.trim().toLowerCase(); col[l] = i;
    i += ['joined', 'left', 'change'].includes(l) ? 2 : 1;
  }
  const need = ['member count at start', 'joined', 'left', 'member count at end', 'change'];
  for (const n of need) if (!(n in col)) throw new Error(`Column "${n}" not found in the report.`);
  const num = v => (v === null || v === undefined || v === '' ? null : Number(v));
  const out = [];
  for (const r of rows.slice(hIdx + 1)) {
    if (!r[0] || !/^BNI\s/i.test(r[0])) continue;
    out.push({
      chapter: r[0].trim(), key: normChapter(r[0].replace(/\.+$/, '')),
      start: num(r[col['member count at start']]), joined: num(r[col['joined']]), left: num(r[col['left']]),
      end: num(r[col['member count at end']]), change: num(r[col['change']]),
    });
  }
  if (!out.length) throw new Error('No chapter rows found in the report.');
  return { report: 'membership_activity', region, month: fm, rows: out };
}

/** Levenshtein distance (for OCR'd chapter names: "Kumani" -> "kumari"). */
export function editDistance(a, b) {
  a = String(a); b = String(b);
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/** Closest known chapter key within 2 edits, or null if none / ambiguous. */
export function closestKey(key, keys) {
  if (keys.includes(key)) return key;
  let best = null, bestD = 99, tie = false;
  for (const k of keys) { const dd = editDistance(key, k); if (dd < bestD) { best = k; bestD = dd; tie = false; } else if (dd === bestD) tie = true; }
  return bestD <= 2 && !tie ? best : null;
}

/**
 * BNI "New 3+1 traffic lights" workbook. Only the "Overall Retention Rates (Rolling)" column is used (NPS is ignored).
 * It lives on the sheet BNI calls "Chapter NPS (Total to Date)", the only per-chapter sheet: one row per chapter worldwide,
 * retention as fractions ('.' when the chapter is under 12 months old).
 * rows: that sheet as arrays (SheetJS header:1). regions: our BNI Connect region names. fileName: used for the month ("... 2026-09 Sep ...").
 * Returns { report, month, rows: [{chapter, key, region, overall_pct, first_year_pct, young}] }.
 */
export function parseChapterRetention(rows, regions, fileName, monthHint) {
  const norm = v => String(v ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const hIdx = (rows || []).findIndex(r => Array.isArray(r) && r.some(c => /^chapter name$/.test(norm(c))) && r.some(c => /overall retention/.test(norm(c))));
  if (hIdx < 0) throw new Error('This is not the 3+1 Traffic Lights "Chapter NPS (Total to Date)" sheet (no "Chapter Name" / "Overall Retention" header).');
  const h = rows[hIdx].map(norm);
  const col = re => h.findIndex(x => re.test(x));
  const cCountry = col(/^country/), cRegion = col(/^region name/), cChap = col(/^chapter name$/);
  const cOverall = col(/overall retention/), cFirst = col(/first year retention/), cYoung = col(/launched in last year/);
  const want = new Set((regions || []).map(norm));
  const pct = v => { if (v === null || v === undefined || v === '' || String(v).trim() === '.') return null; const n = Number(v); if (Number.isNaN(n)) return null; return Math.round((n <= 1 ? n * 100 : n) * 10) / 10; };
  const out = [];
  for (const r of rows.slice(hIdx + 1)) {
    if (!Array.isArray(r) || !r[cChap]) continue;
    if (cCountry >= 0 && norm(r[cCountry]) && norm(r[cCountry]) !== 'india') continue;
    if (want.size && !want.has(norm(r[cRegion]))) continue;
    const chapter = String(r[cChap]).trim();
    const overall = pct(r[cOverall]);
    out.push({ chapter, key: normChapter(chapter.replace(/\.+$/, '')), region: String(r[cRegion] ?? '').trim(), overall_pct: overall,
      first_year_pct: cFirst >= 0 ? pct(r[cFirst]) : null, young: overall === null || (cYoung >= 0 && Number(r[cYoung]) === 1 && overall === null) });
  }
  if (!out.length) throw new Error('None of our regions (' + (regions || []).join(', ') + ') found in the sheet.');
  const fm = /(\d{4})[-_ ](\d{2})/.exec(String(fileName || ''));
  return { report: 'chapter_retention', month: fm ? `${fm[1]}-${fm[2]}` : (monthHint || null), rows: out };
}

/** BNI TNT membership fees (ex-GST) as they appear in the Region Commission Report. Defined with the R&D deduction in scoring.js (settings `fee_types`). */
export const DEFAULT_FEE_TYPES = DEFAULT_SETTINGS.fee_types;

/**
 * BNI Connect Region Commission Report (.xls SpreadsheetML): one row per paid invoice.
 * Header: First Name | Last Name | Invoice Ref | Chapter Name | Period Date | Fee | Commission; last row "Director Total".
 * New vs renewal comes from the fee amount (feeTypes). Returns { report, month, rows: [{name, invoice, chapter, key, date, fee, type, years}], unknown: [...] }.
 */
export function parseCommissionReport(text, feeTypes = DEFAULT_FEE_TYPES) {
  const rows = readSpreadsheetML(text);
  const hIdx = rows.findIndex(r => r.some(c => /^chapter name$/i.test(String(c || '').trim())) && r.some(c => /^fee$/i.test(String(c || '').trim())));
  if (hIdx < 0) throw new Error('This is not a Region Commission Report (no "Chapter Name" / "Fee" header).');
  const h = rows[hIdx].map(c => String(c || '').trim().toLowerCase());
  const ci = n => h.indexOf(n);
  const cFirst = ci('first name'), cLast = ci('last name'), cInv = ci('invoice ref'), cChap = ci('chapter name'), cDate = ci('period date'), cFee = ci('fee');
  const out = [], unknown = [], months = {};
  for (const r of rows.slice(hIdx + 1)) {
    const chapter = String(r[cChap] || '').trim();
    if (!/^BNI\s/i.test(chapter)) continue; // skips the "Director Total" line
    const fee = Math.round(Number(r[cFee]) * 100) / 100;
    const ft = feeTypes.find(t => Math.abs(Number(t.fee) - fee) < 1);
    const date = String(r[cDate] || '').slice(0, 10);
    const row = { name: `${r[cFirst] || ''} ${r[cLast] || ''}`.trim(), invoice: r[cInv] || null, chapter, key: normChapter(chapter.replace(/\.+$/, '')), date, fee,
      type: ft ? ft.type : null, years: ft ? ft.years : null };
    if (!ft) unknown.push(row);
    months[date.slice(0, 7)] = (months[date.slice(0, 7)] || 0) + 1;
    out.push(row);
  }
  if (!out.length) throw new Error('No invoice rows found in the report.');
  const month = Object.entries(months).sort((a, b) => b[1] - a[1])[0][0];
  if (Object.keys(months).length > 1) throw new Error(`Report covers ${Object.keys(months).sort().join(', ')}. Run it for ONE month.`);
  return { report: 'commission', month, rows: out, unknown };
}

// ---------- LTRT / DCRT attendance (Google Sheet downloaded as .xlsx; green = attended, red = absent) ----------
const personKey = s => String(s || '').toLowerCase().replace(/\bdr\b\.?/g, '').replace(/[^a-z]/g, '');
/**
 * Matches attendance records to SA / SDC users.
 * records: [{programme:'sdc'|'sa', chapter?: 'Dilnadu', name: 'Krian', attended: true|false|null}] (LTRT sheets give the chapter column, DCRT lists give names only)
 * users: [{id, role, name, jotform_alias, chapter_id, chapter_key, active}]
 * Returns { matches: [{record, users:[...]}], unmatched: [record] }. A dual-role person (same name on two chapters) matches every chapter.
 */
export function matchAttendance(records, users) {
  const matches = [], unmatched = [];
  for (const rec of records || []) {
    if (rec.attended === null || rec.attended === undefined) continue;
    const pool = users.filter(u => u.active !== false && u.role === rec.programme);
    let found = [];
    if (rec.chapter) { // LTRT grid: the chapter column decides; the name is only a cross-check
      const ck = closestKey(normChapter(rec.chapter), [...new Set(pool.map(u => u.chapter_key))]);
      found = pool.filter(u => u.chapter_key === ck);
    } else {
      const n = personKey(rec.name);
      const first = v => personKey(String(v || '').replace(/^\s*dr\.?\s*/i, '').split(/[\s.]+/)[0]);
      const keys = u => [...new Set([personKey(u.name), personKey(u.jotform_alias), first(u.name), first(u.jotform_alias)].filter(k => k && k.length >= 3))];
      found = pool.filter(u => keys(u).includes(n));
      if (!found.length && n.length >= 4) found = pool.filter(u => keys(u).some(k => k.startsWith(n) || n.startsWith(k) || k.endsWith(n) || n.endsWith(k)));
      if (!found.length) {
        let best = 99; for (const u of pool) for (const k of keys(u)) best = Math.min(best, editDistance(n, k), editDistance(n.slice(0, 6), k.slice(0, 6)));
        if (best <= 2) found = pool.filter(u => keys(u).some(k => Math.min(editDistance(n, k), editDistance(n.slice(0, 6), k.slice(0, 6))) === best));
      }
      // same name, several chapters (dual role) is fine; several different people is ambiguous
      if (new Set(found.map(u => personKey(u.name))).size > 1) found = [];
    }
    if (found.length) matches.push({ record: rec, users: found }); else unmatched.push(rec);
  }
  return { matches, unmatched };
}

/** Points for LTRT / DCRT: each meeting held counts equally (both held: 2.5 + 2.5; one held: 5). Falls back to the single manual flag. */
export function attendancePoints(e, max) {
  const held = ['ltrt_att', 'dcrt_att'].filter(k => e[k] === true || e[k] === false);
  if (held.length) return Math.round(held.filter(k => e[k] === true).length / held.length * max * 10) / 10;
  return e.ltrt_attended ? max : 0;
}
