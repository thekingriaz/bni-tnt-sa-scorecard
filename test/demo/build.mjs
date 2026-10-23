// Builds a single-file demo page (public/index.html + in-browser fake backend). node test/demo/build.mjs <esbuild> <out>
import fs from 'fs'; import { execFileSync } from 'child_process';
const [esbuild, out] = process.argv.slice(2);
const bundle = execFileSync(esbuild, ['test/demo/backend.js', '--bundle', '--format=iife', '--minify', '--target=es2020'], { encoding: 'utf8' });
let h = fs.readFileSync('public/index.html', 'utf8');
h = h.replace(/<!doctype html>\s*<html[^>]*>\s*<head>\s*/i, '').replace(/<meta charset[^>]*>\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '')
  .replace(/<\/head>\s*<body>/i, '').replace(/<\/body>\s*<\/html>\s*$/i, '');
h = h.replace('<title>BNI TNT Scorecard</title>', '<title>SA Scorecard Demo</title>');
h = h.replace("localStorage.getItem('prog') || 'sa'", "(() => { try { return localStorage.getItem('prog') || 'sa'; } catch (e) { return 'sa'; } })()")
     .replace("localStorage.setItem('prog', state.prog);", "try { localStorage.setItem('prog', state.prog); } catch (e) {}");
const banner = `<style>.demo-bar{background:#FFF4D6;color:#5A4300;border-bottom:1px solid #F0D98A;font-size:13px;line-height:1.4;padding-block:8px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));text-align:center}.demo-bar b{color:#3D2E00}</style>
<div class="demo-bar"><b>Demo with invented data.</b> Names and October 2026 numbers are made up; scores are calculated by the real app. Support Ambassador or Support DC: pick any chapter, PIN <b>1234</b>. Admin: type any email and password. Uploads and Jotform sync are off; changes reset when you reload.</div>`;
const i = h.indexOf('<script>\n'); if (i < 0) throw new Error('main script not found');
h = h.replace(/(<\/style>\s*)/, '$1') ;
const bodyStart = h.indexOf('</style>') + '</style>'.length;
h = h.slice(0, bodyStart) + '\n' + banner + h.slice(bodyStart);
const j = h.indexOf('<script>\n');
h = h.slice(0, j) + '<script>' + bundle + '</script>\n' + h.slice(j);
fs.writeFileSync(out, h); console.log('wrote', out, Math.round(h.length / 1024) + ' KB');
