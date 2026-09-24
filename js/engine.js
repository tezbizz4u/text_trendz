// Text Trendz tool engine — pure, dependency-free implementations of every
// text tool. Exposes window.TTE = { has, spec, names, defaults, example, run, diff }.
(function () {
'use strict';
const TE = new TextEncoder();
const A = s => Array.from(s);
const L = s => s.split(/\r\n|\r|\n/);
const ML = (s, f) => L(s).map(f).join('\n');
const WRE = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
const W = s => s.match(WRE) || [];
const SEN = s => (s.replace(/\s+/g, ' ').match(/[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)/g) || []).map(x => x.trim()).filter(x => /[\p{L}\p{N}]/u.test(x));
const PARA = s => s.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
const N = n => typeof n === 'number' ? n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : n;
const dur = sec => { sec = Math.round(sec); return sec < 60 ? sec + ' sec' : Math.floor(sec / 60) + ' min' + (sec % 60 ? ' ' + (sec % 60) + ' sec' : ''); };
const fail = m => { throw new Error(m); };
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tidy = s => s.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/gm, '').replace(/^[ \t]+/gm, '');
const pct = (a, b) => b ? (a / b * 100).toFixed(1) + '%' : '0%';
const STOP = new Set('a about above after again against all am an and any are aren\'t as at be because been before being below between both but by can can\'t cannot could did do does doing don\'t down during each few for from further had has have having he her here hers herself him himself his how i if in into is isn\'t it it\'s its itself just let\'s me more most my myself no nor not now of off on once only or other ought our ours ourselves out over own same she should so some such than that that\'s the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves'.split(' '));
function syl(w) { w = w.toLowerCase().replace(/[^a-z]/g, ''); if (!w) return 0; if (w.length <= 3) return 1; w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, ''); const m = w.match(/[aeiouy]{1,2}/g); return m ? m.length : 1; }
function ST(s) {
  const w = W(s), sen = SEN(s), wc = w.length, sc = sen.length || (wc ? 1 : 0);
  const sy = w.reduce((a, x) => a + syl(x), 0), letters = (s.match(/\p{L}/gu) || []).length;
  const lw = w.map(x => x.toLowerCase()), uniq = new Set(lw).size;
  return {
    words: wc, chars: A(s).length, nos: A(s.replace(/\s/g, '')).length, sen: sen.length, par: PARA(s).length,
    lines: s ? L(s).length : 0, uniq, letters, digits: (s.match(/\p{N}/gu) || []).length, spaces: (s.match(/ /g) || []).length,
    punct: (s.match(/\p{P}/gu) || []).length, syl: sy, read: wc / 238 * 60, speak: wc / 150 * 60,
    avgw: wc ? w.reduce((a, x) => a + A(x).length, 0) / wc : 0, avgs: sc ? wc / sc : 0, avgsyl: wc ? sy / wc : 0,
    fre: wc ? 206.835 - 1.015 * (wc / sc) - 84.6 * (sy / wc) : 0, fk: wc ? 0.39 * (wc / sc) + 11.8 * (sy / wc) - 15.59 : 0,
    complex: w.filter(x => syl(x) >= 3).length, stop: lw.filter(x => STOP.has(x)).length, sentences: sen, wordsList: w
  };
}
const LB = { words: 'Words', chars: 'Characters', nos: 'Characters (no spaces)', sen: 'Sentences', par: 'Paragraphs', lines: 'Lines', uniq: 'Unique words', letters: 'Letters', digits: 'Digits', spaces: 'Spaces', punct: 'Punctuation marks', syl: 'Syllables', read: 'Reading time', speak: 'Speaking time', avgw: 'Avg. word length', avgs: 'Avg. sentence length', avgsyl: 'Avg. syllables per word' };
const FM = (k, v) => k === 'read' || k === 'speak' ? dur(v) : k === 'avgw' ? v.toFixed(1) + ' chars' : k === 'avgs' ? v.toFixed(1) + ' words' : k === 'avgsyl' ? v.toFixed(2) : N(v);
const SR = (keys, note) => s => { const t = ST(s); return { rows: keys.map(k => [LB[k], FM(k, t[k])]), note }; };
const freLabel = f => f >= 90 ? 'Very easy' : f >= 80 ? 'Easy' : f >= 70 ? 'Fairly easy' : f >= 60 ? 'Plain English' : f >= 50 ? 'Fairly difficult' : f >= 30 ? 'Difficult' : 'Very difficult';
const HEUR = 'Heuristic: English-calibrated formula with estimated syllables.';

const seg = (k, l, c, v) => ({ k, l, t: 'seg', c, v: v ?? c[0] });
const txt = (k, l, v = '') => ({ k, l, t: 'txt', v });
const num = (k, l, v) => ({ k, l, t: 'num', v });
const bool = (k, l, v = false) => ({ k, l, t: 'bool', v });
const area = (k, l, v = '') => ({ k, l, t: 'area', v });

const T = {};
const def = (name, d, f, o = [], x = {}) => { T[name] = Object.assign({ d, f, o }, x); };

// ---------- helpers: case ----------
const SMALL = new Set('a an and as at but by for from in into nor of on or per the to vs via with'.split(' '));
const cap1 = w => w.charAt(0).toUpperCase() + w.slice(1);
function titleCase(s) { let first = true; return s.toLowerCase().replace(/([\p{L}\p{N}'’]+)|([^\p{L}\p{N}'’]+)/gu, (m, w, sep) => { if (sep) { if (/[\n:.!?—]/.test(sep)) first = true; return sep; } const o = first || !SMALL.has(w) ? cap1(w) : w; first = false; return o; }); }
const sentenceCase = s => s.toLowerCase().replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\bi\b/g, 'I');
const capCase = s => s.toLowerCase().replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const idw = l => l.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2').replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2').split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(w => w.toLowerCase());
const idCase = f => s => ML(s, l => l.trim() ? f(idw(l)) : l);

// ---------- helpers: encoding ----------
const bytes = s => TE.encode(s);
const unbytes = arr => { try { return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(arr)); } catch (e) { fail('Those bytes aren’t valid UTF-8 text. Check that nothing was cut off or mistyped.'); } };
function b64e(s, urlsafe) { let bin = ''; for (const b of bytes(s)) bin += String.fromCharCode(b); let o = btoa(bin); if (urlsafe) o = o.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); return o; }
function b64d(s) { let c = s.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/'); const bad = c.search(/[^A-Za-z0-9+/=]/); if (bad >= 0) fail(`“${c[bad]}” at position ${bad + 1} isn’t a Base64 character.`); while (c.length % 4) c += '='; let bin; try { bin = atob(c); } catch (e) { fail('This doesn’t look like complete Base64 — the length or padding is off.'); } return unbytes(A(bin).map(ch => ch.charCodeAt(0))); }
function groupsDecode(s, re, base, name, maxLen) {
  const g = s.trim().split(/[\s,]+/).filter(Boolean); if (!g.length) return '';
  const out = g.map((x, i) => { x = x.replace(/^0[xob]/i, ''); if (!re.test(x) || x.length > maxLen) fail(`Group ${i + 1} (“${x}”) isn’t valid ${name}.`); return parseInt(x, base); });
  return unbytes(out);
}
const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.' };
const RMORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
const morseE = s => L(s).map(l => l.toUpperCase().split(/\s+/).filter(Boolean).map(w => A(w).map(c => MORSE[c] || '').filter(Boolean).join(' ')).join(' / ')).join('\n');
const morseD = s => L(s).map(l => l.trim().split(/\s*\/\s*|\s{3,}/).map(w => w.split(/\s+/).filter(Boolean).map((c, i) => { if (!/^[.\-]+$/.test(c)) fail(`“${c}” isn’t Morse — use dots, dashes, spaces between letters and / between words.`); return RMORSE[c] ?? '?'; }).join('')).join(' ')).join('\n');
const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const htmlE = (s, all) => A(s).map(c => ENT[c] || (all && c.codePointAt(0) > 126 ? '&#x' + c.codePointAt(0).toString(16).toUpperCase() + ';' : c)).join('');
const htmlD = s => { const d = new DOMParser().parseFromString('<!doctype html><body>' + s.replace(/</g, '&lt;'), 'text/html'); return d.body.textContent; };
function uniE(s, f) { return A(s).map(c => { const cp = c.codePointAt(0); if (cp < 128 && f !== 'U+XXXX') return c; const h = cp.toString(16).toUpperCase(); if (f === 'U+XXXX') return 'U+' + h.padStart(4, '0') + ' '; if (f === '&#x…;') return '&#x' + h + ';'; return cp > 0xFFFF ? '\\u{' + h + '}' : '\\u' + h.padStart(4, '0'); }).join('').trim(); }
function uniD(s) { return s.replace(/\\u\{([0-9a-f]{1,6})\}|\\u([0-9a-f]{4})|U\+([0-9a-f]{4,6})\s?|&#x([0-9a-f]+);|&#(\d+);/gi, (m, a, b, c, d, e) => { const cp = a || b || c || d ? parseInt(a || b || c || d, 16) : parseInt(e, 10); if (cp > 0x10FFFF) fail(`${m.trim()} is beyond the Unicode range.`); return String.fromCodePoint(cp); }); }
const rot = (s, n) => s.replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + n + 26 * 10) % 26 + b); });
const rot47 = s => A(s).map(c => { const o = c.charCodeAt(0); return o >= 33 && o <= 126 ? String.fromCharCode(33 + (o + 14) % 94) : c; }).join('');
const atbash = s => s.replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode(25 - (c.charCodeAt(0) - b) + b); });
const baconE = s => A(s.toUpperCase()).map(c => /[A-Z]/.test(c) ? (c.charCodeAt(0) - 65).toString(2).padStart(5, '0').replace(/0/g, 'A').replace(/1/g, 'B') : c === ' ' ? '/' : '').filter(Boolean).join(' ');
const baconD = s => s.trim().split(/\s+/).map((g, i) => { if (g === '/') return ' '; if (!/^[AB]{5}$/i.test(g)) fail(`Group ${i + 1} (“${g}”) should be five A/B letters.`); const n = parseInt(g.toUpperCase().replace(/A/g, '0').replace(/B/g, '1'), 2); if (n > 25) fail(`Group ${i + 1} (“${g}”) is beyond Z.`); return String.fromCharCode(65 + n); }).join('');

// ---------- numbers ----------
const ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const SCALES = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion'];
function u1000(n) { const s = []; if (n >= 100) { s.push(ONES[Math.floor(n / 100)] + ' hundred'); n %= 100; } if (n >= 20) s.push(TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '')); else if (n > 0) s.push(ONES[n]); return s.join(' '); }
function n2w(str) {
  str = str.trim().replace(/[,_\s]/g, ''); if (!str) return '';
  if (!/^-?\d+(\.\d+)?$/.test(str)) fail(`“${str}” isn’t a number. Use digits like 1250 or -3.75.`);
  const neg = str[0] === '-'; if (neg) str = str.slice(1);
  let [int, frac] = str.split('.'); int = int.replace(/^0+(?=\d)/, '');
  if (int.length > 18) fail('That’s more than 18 digits — too big to spell out.');
  let n = BigInt(int), parts = [];
  if (n === 0n) parts = ['zero']; else { let i = 0; while (n > 0n) { const c = Number(n % 1000n); if (c) parts.unshift(u1000(c) + (SCALES[i] ? ' ' + SCALES[i] : '')); n /= 1000n; i++; } }
  return (neg ? 'minus ' : '') + parts.join(' ') + (frac ? ' point ' + A(frac).map(d => ONES[+d]).join(' ') : '');
}
const WV = Object.fromEntries(ONES.map((w, i) => [w, i]).concat(TENS.map((w, i) => [w, i * 10]).filter(x => x[0])));
function w2n(line) {
  const t = line.toLowerCase().replace(/-/g, ' ').replace(/,/g, '').split(/\s+/).filter(x => x && x !== 'and'); if (!t.length) return '';
  let neg = false, total = 0, cur = 0, frac = '', inFrac = false;
  for (const w of t) {
    if (w === 'minus' || w === 'negative') { neg = true; continue; }
    if (w === 'point') { inFrac = true; continue; }
    if (inFrac) { if (!(w in WV) || WV[w] > 9) fail(`After “point”, use single digits (found “${w}”).`); frac += WV[w]; continue; }
    if (w in WV) cur += WV[w]; else if (w === 'hundred') cur = (cur || 1) * 100;
    else if (SCALES.includes(w)) { total += (cur || 1) * Math.pow(1000, SCALES.indexOf(w)); cur = 0; }
    else fail(`“${w}” isn’t a number word I know.`);
  }
  const v = total + cur; return (neg ? '-' : '') + v.toLocaleString('en-US', { useGrouping: false }) + (frac ? '.' + frac : '');
}
const ROM = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const toRoman = n => { if (!Number.isInteger(n) || n < 1 || n > 3999) fail(`${n} is out of range — Roman numerals here go from 1 to 3999.`); let o = ''; for (const [v, r] of ROM) while (n >= v) { o += r; n -= v; } return o; };
const fromRoman = s => { const u = s.toUpperCase(); if (!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(u) || !u) fail(`“${s}” isn’t a valid Roman numeral.`); let n = 0, i = 0; for (const [v, r] of ROM) while (u.startsWith(r, i)) { n += v; i += r.length; } return n; };
const ORD = n => { const m = n % 100; return n + (m >= 11 && m <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'); };
const ordWord = w => { const irr = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' }; const p = w.split(/([ -])/); let last = p.pop(); last = irr[last] || (last.endsWith('y') ? last.slice(0, -1) + 'ieth' : last + 'th'); return p.join('') + last; };
function parseBig(x, base) {
  x = x.trim().replace(/[\s_]/g, ''); if (!x) return null;
  let neg = false; if (x[0] === '-') { neg = true; x = x.slice(1); }
  let b = base;
  if (base === 'Auto') { if (/^0x/i.test(x)) { b = 16; x = x.slice(2); } else if (/^0b/i.test(x)) { b = 2; x = x.slice(2); } else if (/^0o/i.test(x)) { b = 8; x = x.slice(2); } else b = 10; }
  else { b = { Binary: 2, Octal: 8, Decimal: 10, Hex: 16 }[base]; x = x.replace(/^0[xbo]/i, ''); }
  const ok = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/i }[b];
  if (!ok.test(x)) fail(`“${x}” isn’t a valid base-${b} number.`);
  const pre = { 2: '0b', 8: '0o', 10: '', 16: '0x' }[b];
  const v = BigInt(pre + x); return neg ? -v : v;
}
const grp = (s, n) => s.replace(new RegExp(`\\B(?=(\\d{${n}})+(?!\\d))`, 'g'), ' ');

// ---------- diff ----------
function tok(s, mode) { if (mode === 'Characters') return A(s); if (mode === 'Words') return s.match(/\s+|[\p{L}\p{N}'’]+|[^\s\p{L}\p{N}]/gu) || []; if (mode === 'Lines') return s.match(/[^\n]*\n|[^\n]+$/g) || []; return s.match(/[^.!?\n]+[.!?]*\s*|\n+/g) || []; }
function diff(a, b, mode) {
  const X = tok(a, mode), Y = tok(b, mode), ops = [];
  const push = (t, v) => { const l = ops[ops.length - 1]; if (l && l[0] === t) l[1] += v; else ops.push([t, v]); };
  let p = 0; while (p < X.length && p < Y.length && X[p] === Y[p]) p++;
  let ea = X.length, eb = Y.length; while (ea > p && eb > p && X[ea - 1] === Y[eb - 1]) { ea--; eb--; }
  if (p) push('eq', X.slice(0, p).join(''));
  const a2 = X.slice(p, ea), b2 = Y.slice(p, eb), n = a2.length, m = b2.length;
  if (n * m > 4e6) { if (n) push('del', a2.join('')); if (m) push('add', b2.join('')); }
  else {
    const Wd = m + 1, dp = new Uint32Array((n + 1) * Wd);
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i * Wd + j] = a2[i] === b2[j] ? dp[(i + 1) * Wd + j + 1] + 1 : Math.max(dp[(i + 1) * Wd + j], dp[i * Wd + j + 1]);
    let i = 0, j = 0;
    while (i < n && j < m) { if (a2[i] === b2[j]) { push('eq', a2[i]); i++; j++; } else if (dp[(i + 1) * Wd + j] >= dp[i * Wd + j + 1]) push('del', a2[i++]); else push('add', b2[j++]); }
    while (i < n) push('del', a2[i++]); while (j < m) push('add', b2[j++]);
  }
  if (ea < X.length) push('eq', X.slice(ea).join(''));
  let eq = 0, add = 0, del = 0, aw = 0, dw = 0;
  for (const [t, v] of ops) { const l = A(v).length; if (t === 'eq') eq += l; else if (t === 'add') { add += l; aw += W(v).length; } else { del += l; dw += W(v).length; } }
  const la = A(a).length, lb = A(b).length, sim = la + lb ? Math.round(2 * eq / (la + lb) * 1000) / 10 : 100;
  const wa = new Set(W(a).map(x => x.toLowerCase())), common = [...new Set(W(b).map(x => x.toLowerCase()))].filter(x => wa.has(x)).length;
  return { segs: ops, note: `${sim}% similar · +${N(add)} / −${N(del)} characters · +${aw} / −${dw} words · ${common} words in common` };
}

// ---------- JSON / CSV / XML / SQL ----------
function jparse(s) {
  if (!s.trim()) fail('Paste some JSON to get started.');
  try { return JSON.parse(s); } catch (e) {
    let line, col; const lc = /line (\d+) column (\d+)/.exec(e.message), pm = /position (\d+)/.exec(e.message);
    if (lc) { line = +lc[1]; col = +lc[2]; } else if (pm) { const pos = +pm[1], pre = s.slice(0, pos); line = pre.split('\n').length; col = pos - pre.lastIndexOf('\n'); }
    const msg = e.message.replace(/^JSON\.parse:\s*/, '').replace(/\s*in JSON at position \d+.*$/, '').replace(/\s*\(line \d+ column \d+\)/, '').replace(/^Unexpected token (.), "[\s\S]*" is not valid JSON$/, 'Unexpected “$1”');
    fail('Invalid JSON' + (line ? ` — line ${line}, column ${col}: ` : ': ') + msg);
  }
}
const IND = { '2 spaces': '  ', '4 spaces': '    ', 'Tab': '\t' };
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
const depth = v => v && typeof v === 'object' ? 1 + Math.max(0, ...Object.values(v).map(depth)) : 0;
function csvParse(s, d) {
  if (!d || d === 'Auto') { const f = s.split('\n')[0]; d = [',', ';', '\t', '|'].sort((a, b) => f.split(b).length - f.split(a).length)[0]; } else d = { Comma: ',', Semicolon: ';', Tab: '\t' }[d] || d;
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < s.length; i++) { const c = s[i]; if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === d) { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; }
  if (q) fail('A quoted field never closes — look for a stray " character.');
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}
const csvCell = v => { v = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
function yScalar(v) { if (v === null) return 'null'; if (typeof v === 'boolean' || typeof v === 'number') return String(v); if (Array.isArray(v)) return '[]'; if (typeof v === 'object') return '{}'; if (v === '' || /^(true|false|null|yes|no|on|off|~)$/i.test(v) || /^[-+]?[\d.]+([eE][-+]?\d+)?$/.test(v) || /^[\s\-?:,\[\]{}#&*!|>'"%@`]|:\s|\s#|\s$/.test(v) || /\n/.test(v)) return JSON.stringify(v); return v; }
function toYAML(v, ind) {
  const pad = '  '.repeat(ind);
  const nonEmpty = x => x && typeof x === 'object' && Object.keys(x).length;
  if (Array.isArray(v)) return v.length ? v.map(x => nonEmpty(x) ? pad + '- ' + toYAML(x, ind + 1).trimStart() : pad + '- ' + yScalar(x)).join('\n') : pad + '[]';
  if (v && typeof v === 'object') { const ks = Object.keys(v); return ks.length ? ks.map(k => { const key = /^[\w.\-]+$/.test(k) ? k : JSON.stringify(k); return nonEmpty(v[k]) ? pad + key + ':\n' + toYAML(v[k], ind + 1) : pad + key + ': ' + yScalar(v[k]); }).join('\n') : pad + '{}'; }
  return pad + yScalar(v);
}
function xmlCheck(s) { if (!s.trim()) fail('Paste some XML to get started.'); const d = new DOMParser().parseFromString(s, 'application/xml'); const e = d.getElementsByTagName('parsererror')[0]; if (e) fail('Invalid XML — ' + (e.textContent || '').replace(/\s+/g, ' ').replace(/^This page contains the following errors:\s*/i, '').replace(/Below is a rendering.*$/i, '').trim().slice(0, 180)); }
function xmlFormat(s, ind) {
  xmlCheck(s); const tk = s.replace(/>\s+</g, '><').trim().match(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || []; let lv = 0; const out = [];
  for (let i = 0; i < tk.length; i++) { const t = tk[i];
    if (/^<\//.test(t)) { lv = Math.max(0, lv - 1); out.push(ind.repeat(lv) + t); }
    else if (/^<[A-Za-z_]/.test(t) && !/\/>$/.test(t)) { const nx = tk[i + 1], cl = tk[i + 2]; if (nx && nx[0] !== '<' && cl && /^<\//.test(cl)) { out.push(ind.repeat(lv) + t + nx.trim() + cl); i += 2; } else { out.push(ind.repeat(lv) + t); lv++; } }
    else if (t.trim()) out.push(ind.repeat(lv) + t.trim()); }
  return out.join('\n');
}
const SQLKW = 'select|from|where|and|or|not|null|is|in|like|between|exists|as|on|group by|order by|having|limit|offset|insert into|values|update|set|delete from|join|left join|right join|inner join|full join|outer join|cross join|left outer join|union all|union|distinct|case|when|then|else|end|asc|desc|count|sum|avg|min|max|create table|primary key|with|into|default|returning';
function sqlFormat(s) {
  if (!s.trim()) return '';
  const parts = s.split(/('(?:''|[^'])*'|"[^"]*"|--[^\n]*)/);
  let o = parts.map((p, i) => i % 2 ? p : p.replace(/\s+/g, ' ').replace(new RegExp(`\\b(${SQLKW})\\b`, 'gi'), m => m.toUpperCase().replace(/\s+/g, ' '))).join('');
  o = o.replace(/\s*\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|VALUES|SET|UNION ALL|UNION|RETURNING|(?:LEFT OUTER |LEFT |RIGHT |INNER |FULL |OUTER |CROSS )?JOIN)\b/g, '\n$1').replace(/\s+\b(AND|OR)\b\s+/g, '\n  $1 ');
  let d = 0, q = false, r = '';
  for (let i = 0; i < o.length; i++) { const c = o[i]; if (c === "'") q = !q; if (!q) { if (c === '(') d++; if (c === ')') d--; if (c === ',' && d === 0) { r += ',\n  '; while (o[i + 1] === ' ') i++; continue; } } r += c; }
  return r.replace(/^(SELECT(?: DISTINCT)?) /gm, '$1\n  ').trim();
}

// ---------- extract / misc ----------
const RX = {
  email: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
  url: /\bhttps?:\/\/[^\s<>"'`)\]]+|\bwww\.[^\s<>"'`)\]]+/gi,
  phone: /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{2,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{2,4})?/g,
  number: /-?\d+(?:[.,]\d+)*/g,
  date: /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.? \d{1,2}(?:st|nd|rd|th)?,? \d{4}|\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]* \d{4})\b/gi,
  hashtag: /(?<![\p{L}\p{N}_&])#[\p{L}\p{N}_]+/gu,
  mention: /(?<![\w@.])@[A-Za-z0-9_](?:[A-Za-z0-9_.]{0,28}[A-Za-z0-9_])?/g,
  emoji: /\p{Extended_Pictographic}(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])?)*|[\u{1F1E6}-\u{1F1FF}]{2}/gu
};
const EXO = [bool('dedupe', 'Remove duplicates', true), bool('sort', 'Sort A→Z')];
const post = (list, o) => { let r = list.map(x => x.trim()).filter(Boolean); if (o.dedupe) r = [...new Set(r)]; if (o.sort) r = r.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })); return { chips: r, note: r.length + ' found', ext: 'txt' }; };
const exr = (re, filt) => (s, o) => post((s.match(re) || []).filter(filt || (() => true)), o);
function freq(s, o) {
  let w = W(s).map(x => x.toLowerCase()); const total = w.length;
  if (o.stop) w = w.filter(x => !STOP.has(x)); if (o.min) w = w.filter(x => A(x).length >= o.min);
  const n = +(o.n || 1); const grams = [];
  if (n === 1) grams.push(...w); else for (let i = 0; i + n <= w.length; i++) grams.push(w.slice(i, i + n).join(' '));
  const m = new Map(); grams.forEach(g => m.set(g, (m.get(g) || 0) + 1));
  const rows = [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, o.top || 50).map(([g, c]) => [g, N(c), pct(c, n === 1 ? total : Math.max(1, total - n + 1))]);
  return { head: [n === 1 ? 'Word' : 'Phrase', 'Count', 'Density'], rows, note: `${N(total)} words · ${N(m.size)} distinct`, ext: 'csv' };
}
function mkRe(o) {
  if (!o.find) return null; let src = o.regex ? o.find : esc(o.find);
  if (o.whole) src = '(?<![\\p{L}\\p{N}_])(?:' + src + ')(?![\\p{L}\\p{N}_])';
  try { return new RegExp(src, 'g' + (o.cs ? '' : 'i') + 'u'); } catch (e) { fail('That pattern isn’t valid: ' + e.message.replace(/^Invalid regular expression: /, '')); }
}
function countMatches(s, re) { let n = 0, m; re.lastIndex = 0; while ((m = re.exec(s)) && n < 100000) { n++; if (!m[0]) re.lastIndex++; } return n; }
const FRO = [txt('find', 'Find', 'text'), txt('repl', 'Replace with', 'writing'), bool('cs', 'Match case'), bool('whole', 'Whole words'), bool('regex', 'Regex')];
function findReplace(s, o) { const re = mkRe(o); if (!re) return { text: s, note: 'Type something in “Find”.' }; const n = countMatches(s, re); return { text: s.replace(re, o.regex ? o.repl : o.repl.replace(/\$/g, '$$$$')), note: n ? `${n} match${n > 1 ? 'es' : ''} replaced` : 'No matches — nothing changed.' }; }
function crcT() { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; }
let CRC; const crc32 = b => { CRC = CRC || crcT(); let c = 0xFFFFFFFF; for (const x of b) c = CRC[(c ^ x) & 0xFF] ^ (c >>> 8); return ((c ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0'); };
const fnv = s => { let h = 0x811c9dc5; for (const b of bytes(s)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
const hex = buf => A(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
async function sha(alg, s) { if (!(window.crypto && crypto.subtle)) return 'Not available here (needs a secure https page)'; return hex(await crypto.subtle.digest(alg, bytes(s))); }
const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
const pick = arr => arr[rnd(arr.length)];
const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
const ENW = 'time year people way day man thing woman life child world school state family student group country problem hand part place case week company system program question work government number night point home water room mother area money story fact month lot right study book eye job word business issue side kind head house service friend father power hour game line end member law car city community name president team minute idea kid body information back parent face others level office door health person art war history party result change morning reason research girl guy moment air teacher force education quiet bright small large early simple clear quick gentle careful honest brave open steady warm little good new first last long great old big high different local social important public able sure free full special easy strong whole real best better true hard'.split(' ');
const sentenceFrom = (list, min, max) => { const n = min + rnd(max - min + 1); const w = Array.from({ length: n }, () => pick(list)); return cap1(w.join(' ')) + '.'; };
const EMOJI = '😀 grinning face happy smile|😃 smiley happy|😄 smile grin|😁 beaming grin|😆 laughing|😅 sweat smile relief|😂 joy tears laugh|🙂 slight smile|😉 wink|😊 blush happy|😍 heart eyes love|😘 kiss|😎 cool sunglasses|🤔 thinking hmm|😐 neutral|🙄 eye roll|😴 sleeping tired|😭 crying sob|😡 angry|🤯 mind blown|🥳 party celebrate|😇 innocent halo|👍 thumbs up like yes|👎 thumbs down no|👏 clap applause|🙌 raised hands celebrate|🙏 pray thanks please|💪 muscle strong|👀 eyes look|👋 wave hello bye|✌️ victory peace|🤞 fingers crossed luck|👉 point right|✍️ writing hand|🤝 handshake deal|❤️ red heart love|🧡 orange heart|💛 yellow heart|💚 green heart|💙 blue heart|💜 purple heart|🖤 black heart|🤍 white heart|💔 broken heart|💯 hundred perfect|✨ sparkles|🔥 fire hot lit|⭐ star|⚡ lightning zap|💡 bulb idea|🎉 party popper tada|🎯 target goal|🚀 rocket launch ship|✅ check done yes|❌ cross no wrong|⚠️ warning caution|❓ question|💬 speech bubble chat|📝 memo note write|📌 pushpin pin|📎 paperclip attach|📅 calendar date|⏰ alarm clock time|⏳ hourglass wait|🔒 lock secure private|🔑 key|🔍 search magnifier|📈 chart up growth|💰 money bag|🛒 cart shopping|📦 package box|📧 email mail|📱 phone mobile|💻 laptop computer|⌨️ keyboard|🧠 brain think|📚 books study|🎓 graduation student|✏️ pencil|🛠️ tools|⚙️ gear settings|🐛 bug|🔗 link|☕ coffee|🍕 pizza|🍎 apple|🎵 music note|📷 camera photo|🏆 trophy win|🌍 globe earth world|☀️ sun|🌙 moon night|🌱 seedling grow|🌸 blossom flower|🍀 clover luck|🐶 dog|🐱 cat|🦊 fox|🌈 rainbow|❄️ snowflake cold'.split('|').map(x => { const i = x.indexOf(' '); return { ch: x.slice(0, i), name: x.slice(i + 1) }; });
const EGROUP = { All: [0, 999], Smileys: [0, 22], Hands: [22, 35], Hearts: [35, 45], Objects: [45, 87], Nature: [87, 999] };
const EMAP = Object.fromEntries(EMOJI.map(e => [e.ch.replace(/\uFE0F/g, ''), e.name.split(' ').slice(0, 2).join('_')]));
const SYM = {
  Math: '± × ÷ ≠ ≈ ≡ ≤ ≥ ∞ √ ∛ ∑ ∏ ∫ ∂ ∆ ∇ π µ θ λ σ ∈ ∉ ⊂ ⊃ ∪ ∩ ∧ ∨ ¬ ∀ ∃ ∅ ° ‰ ′ ″ ½ ⅓ ¼ ¾',
  Currency: '$ € £ ¥ ₹ ₩ ₽ ₺ ₪ ₫ ₦ ₱ ₿ ¢ ₴ ₸ ฿ ₡ ₲ ₵',
  Arrows: '← → ↑ ↓ ↔ ↕ ↖ ↗ ↘ ↙ ⇐ ⇒ ⇑ ⇓ ⇔ ↩ ↪ ↺ ↻ ➜ ➔ ⟶ ⟵ ⤴ ⤵',
  Checks: '✓ ✔ ✗ ✘ ☐ ☑ ☒ ● ○ ■ □ ▲ △ ◆ ◇ ★ ☆',
  Legal: '© ® ™ ℠ § ¶ † ‡ № ℗',
  Typography: '– — … • · ‹ › « » “ ” ‘ ’ ¡ ¿ ¦ ¨ ˆ ˜'
};
const symGrid = set => ({ grid: (set === 'All' ? Object.values(SYM).join(' ') : SYM[set]).split(' ').map(ch => ({ ch, name: 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') })), note: 'Click a symbol to copy it and add it to your text.' });
const INVIS = { 0x200B: 'Zero-width space', 0x200C: 'Zero-width non-joiner', 0x200D: 'Zero-width joiner', 0x2060: 'Word joiner', 0xFEFF: 'Byte order mark / ZWNBSP', 0x00AD: 'Soft hyphen', 0x00A0: 'No-break space', 0x202F: 'Narrow no-break space', 0x2009: 'Thin space', 0x200E: 'Left-to-right mark', 0x200F: 'Right-to-left mark', 0x202A: 'LTR embedding', 0x202B: 'RTL embedding', 0x202C: 'Pop directional formatting', 0x202D: 'LTR override', 0x202E: 'RTL override', 0x2061: 'Function application', 0x2062: 'Invisible times', 0x2063: 'Invisible separator', 0x2064: 'Invisible plus', 0x180E: 'Mongolian vowel separator', 0x3000: 'Ideographic space' };
const CTRL = { 0: 'NUL', 7: 'BEL (bell)', 8: 'BS (backspace)', 9: 'TAB', 10: 'LF (line feed)', 11: 'VT (vertical tab)', 12: 'FF (form feed)', 13: 'CR (carriage return)', 27: 'ESC', 127: 'DEL' };
function ctype(c) { const cp = c.codePointAt(0); if (INVIS[cp]) return INVIS[cp]; if (CTRL[cp]) return 'Control: ' + CTRL[cp]; if (cp < 32 || (cp >= 127 && cp < 160)) return 'Control character'; if (/\p{Extended_Pictographic}/u.test(c)) return 'Emoji'; if (/\p{Lu}/u.test(c)) return 'Uppercase letter'; if (/\p{Ll}/u.test(c)) return 'Lowercase letter'; if (/\p{L}/u.test(c)) return 'Letter'; if (/\p{Nd}/u.test(c)) return 'Digit'; if (/\p{N}/u.test(c)) return 'Number'; if (/\p{Zs}/u.test(c)) return 'Space'; if (/\p{P}/u.test(c)) return 'Punctuation'; if (/\p{Sc}/u.test(c)) return 'Currency symbol'; if (/\p{Sm}/u.test(c)) return 'Math symbol'; if (/\p{S}/u.test(c)) return 'Symbol'; if (/\p{M}/u.test(c)) return 'Combining mark'; return 'Other'; }
const show = c => c === ' ' ? '␠' : c === '\n' ? '↵' : c === '\t' ? '⇥' : c === '\r' ? '␍' : INVIS[c.codePointAt(0)] || c.codePointAt(0) < 32 ? '·' : c;
const uhex = c => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
function inspect(s, filt, empty) {
  const rows = []; let i = 0, found = 0;
  for (const c of s) { i++; if (filt && !filt(c)) continue; found++; if (rows.length < 400) rows.push([show(c), uhex(c), A(bytes(c)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' '), filt ? 'at ' + i + ' · ' + ctype(c) : ctype(c)]); }
  return { head: ['Char', 'Code point', 'UTF-8', filt ? 'Where · what' : 'Type'], rows, note: filt ? (found ? `${found} found` : empty) : `${found} characters${found > 400 ? ' · showing the first 400' : ''}`, ext: 'csv' };
}
const isInvis = c => { const cp = c.codePointAt(0); return !!INVIS[cp] || (cp < 32 && cp !== 10 && cp !== 13 && cp !== 9) || (cp >= 127 && cp < 160); };
function mathMap(s, U, Lo, D, ex) { ex = ex || {}; return A(s).map(c => { if (ex[c]) return ex[c]; const o = c.codePointAt(0); if (o >= 65 && o <= 90 && U) return String.fromCodePoint(U + o - 65); if (o >= 97 && o <= 122 && Lo) return String.fromCodePoint(Lo + o - 97); if (o >= 48 && o <= 57 && D) return String.fromCodePoint(D + o - 48); return c; }).join(''); }
const mapStr = (from, to) => { const f = A(from), t = A(to), m = {}; f.forEach((c, i) => { if (t[i] && t[i] !== '_') m[c] = t[i]; }); return s => A(s).map(c => m[c] || m[c.toLowerCase()] || c).join(''); };
const smallCaps = mapStr('abcdefghijklmnopqrstuvwxyz', 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ');
const supMap = (() => { const f = mapStr('0123456789+-=()abcdefghijklmnoprstuvwxyzABDEGHIJKLMNOPRTUVW', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂ'); return s => f(s); })();
const subMap = mapStr('0123456789+-=()aehijklmnoprstuvx', '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ');
const comb = (s, m) => A(s).map(c => /\s/.test(c) ? c : c + m).join('');
const FANCY = [
  ['Bold', s => mathMap(s, 0x1D400, 0x1D41A, 0x1D7CE)], ['Italic', s => mathMap(s, 0x1D434, 0x1D44E, 0, { h: 'ℎ' })], ['Bold italic', s => mathMap(s, 0x1D468, 0x1D482, 0)],
  ['Sans bold', s => mathMap(s, 0x1D5D4, 0x1D5EE, 0x1D7EC)], ['Sans italic', s => mathMap(s, 0x1D608, 0x1D622, 0)],
  ['Script', s => mathMap(s, 0x1D49C, 0x1D4B6, 0, { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' })], ['Bold script', s => mathMap(s, 0x1D4D0, 0x1D4EA, 0)],
  ['Fraktur', s => mathMap(s, 0x1D504, 0x1D51E, 0, { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' })], ['Double-struck', s => mathMap(s, 0x1D538, 0x1D552, 0x1D7D8, { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' })],
  ['Monospace', s => mathMap(s, 0x1D670, 0x1D68A, 0x1D7F6)], ['Fullwidth', s => A(s).map(c => { const o = c.codePointAt(0); return o >= 33 && o <= 126 ? String.fromCodePoint(o + 0xFEE0) : c === ' ' ? '\u3000' : c; }).join('')],
  ['Small caps', smallCaps], ['Circled', s => A(s).map(c => { const o = c.codePointAt(0); return o >= 65 && o <= 90 ? String.fromCodePoint(0x24B6 + o - 65) : o >= 97 && o <= 122 ? String.fromCodePoint(0x24D0 + o - 97) : o >= 49 && o <= 57 ? String.fromCodePoint(0x2460 + o - 49) : c === '0' ? '⓪' : c; }).join('')],
  ['Superscript', supMap], ['Strikethrough', s => comb(s, '\u0336')], ['Underline', s => comb(s, '\u0332')]
];
const stripMarker = l => l.replace(/^\s*(?:[-*+•·▪◦]|\d+[.)]|[a-z][.)]|[ivxlc]+[.)]|\[[ xX]?\]|☐|☑|✓)\s+/i, '');
const soc = (limit, mode, note) => (s) => {
  let used = A(s).length;
  if (mode === 'x') { const t = s.replace(/https?:\/\/[^\s]+/g, 'x'.repeat(23)); used = 0; const segs = Intl.Segmenter ? A(new Intl.Segmenter().segment(t)).map(x => x.segment) : A(t); for (const g of segs) { const c = g.codePointAt(0); used += /\p{Extended_Pictographic}/u.test(g) ? 2 : (c <= 0x10FF || (c >= 0x2000 && c <= 0x200D) || (c >= 0x2010 && c <= 0x201F) || (c >= 0x2032 && c <= 0x2037)) ? 1 : 2; } }
  if (mode === 'g') used = Intl.Segmenter ? A(new Intl.Segmenter().segment(s)).length : A(s).length;
  const over = used > limit, t = ST(s);
  return { meter: { used, limit, over }, rows: [['Characters counted', N(used)], ['Limit', N(limit)], [over ? 'Over by' : 'Left', N(Math.abs(limit - used))], ['Words', N(t.words)], ['Hashtags', N((s.match(RX.hashtag) || []).length)], ['Emoji', N((s.match(RX.emoji) || []).length)]], note };
};
const guide = (lo, hi, what) => s => { const n = A(s.trim()).length; const st = n === 0 ? 'Empty' : n < lo ? `Short — aim for ${lo}–${hi}` : n > hi ? `Long — may be cut off after ~${hi}` : 'Good length'; return { meter: { used: n, limit: hi, over: n > hi }, rows: [['Characters', N(n)], ['Words', N(W(s).length)], ['Guideline', `${lo}–${hi} characters`], ['Verdict', st]], note: `${what} Guideline, not a hard limit — search engines and inboxes truncate by width too.` }; };

// ======================= REGISTRY =======================
// Writing & Counting
def('Word Counter', 'Counts words as you type, plus the numbers people usually need next.', SR(['words', 'chars', 'nos', 'sen', 'par', 'read']));
def('Character Counter', 'Counts every character, including spaces and emoji, the way people see them.', SR(['chars', 'nos', 'words', 'lines', 'spaces']));
def('Character Counter Without Spaces', 'Counts characters with all spaces, tabs and line breaks left out.', SR(['nos', 'chars', 'spaces']));
def('Sentence Counter', 'Counts sentences ending in . ! ? or …', s => { const t = ST(s); return { rows: [['Sentences', N(t.sen)], ['Avg. sentence length', t.avgs.toFixed(1) + ' words'], ['Longest', N(Math.max(0, ...t.sentences.map(x => W(x).length))) + ' words']], note: 'Abbreviations like “e.g.” can split a sentence early.' }; });
def('Paragraph Counter', 'Counts paragraphs separated by a blank line.', SR(['par', 'sen', 'words', 'lines']));
def('Line Counter', 'Counts lines, including empty ones.', s => { const ls = s ? L(s) : []; const empty = ls.filter(l => !l.trim()).length; return { rows: [['Lines', N(ls.length)], ['Non-empty lines', N(ls.length - empty)], ['Empty lines', N(empty)], ['Longest line', N(Math.max(0, ...ls.map(l => A(l).length))) + ' chars']] }; });
def('Word Frequency Counter', 'Shows which words you use most.', freq, [bool('stop', 'Skip common words', true), num('min', 'Min. length', 1), num('top', 'Show top', 50)]);
def('Unique Word Counter', 'Counts distinct words, ignoring case.', s => { const t = ST(s); return { rows: [['Unique words', N(t.uniq)], ['Total words', N(t.words)], ['Unique ratio', pct(t.uniq, t.words)]] }; });
def('Duplicate Word Counter', 'Lists every word you’ve used more than once.', s => { const m = new Map(); W(s).forEach(w => { w = w.toLowerCase(); m.set(w, (m.get(w) || 0) + 1); }); const rows = [...m].filter(x => x[1] > 1).sort((a, b) => b[1] - a[1]).map(([w, c]) => [w, N(c)]); return { head: ['Word', 'Times used'], rows, note: rows.length ? rows.length + ' repeated words' : 'No repeated words.', ext: 'csv' }; });
def('Reading Time Calculator', 'Estimates silent reading time. Change the pace to match your readers.', (s, o) => { const w = W(s).length, wpm = Math.max(50, +o.wpm || 238); return { rows: [['Reading time', dur(w / wpm * 60)], ['Words', N(w)], ['Pace', wpm + ' words per minute']], note: '238 wpm is a typical adult average for non-fiction.' }; }, [num('wpm', 'Words per minute', 238)]);
def('Speaking Time Calculator', 'Estimates how long it takes to say out loud — handy for talks and voiceovers.', (s, o) => { const w = W(s).length, wpm = Math.max(50, +o.wpm || 150); return { rows: [['Speaking time', dur(w / wpm * 60)], ['Words', N(w)], ['Pace', wpm + ' words per minute']], note: '130–160 wpm is a comfortable presenting pace.' }; }, [num('wpm', 'Words per minute', 150)]);
def('Average Word Length', 'Average letters per word.', SR(['avgw', 'words', 'letters']));
def('Average Sentence Length', 'Average words per sentence.', SR(['avgs', 'sen', 'words'], 'Under 20 words per sentence reads comfortably for most people.'));
def('Letter Counter', 'Counts letters and shows how often each one appears.', (s, o) => { const m = new Map(); (s.match(/\p{L}/gu) || []).forEach(c => { c = o.cs ? c : c.toLowerCase(); m.set(c, (m.get(c) || 0) + 1); }); const total = [...m.values()].reduce((a, b) => a + b, 0); return { head: ['Letter', 'Count', 'Share'], rows: [...m].sort((a, b) => b[1] - a[1]).map(([c, n]) => [c, N(n), pct(n, total)]), note: N(total) + ' letters', ext: 'csv' }; }, [bool('cs', 'Match case')]);
def('Number Counter', 'Counts digits and whole numbers in your text.', s => { const nums = s.match(RX.number) || []; return { rows: [['Numbers', N(nums.length)], ['Digits', N((s.match(/\p{Nd}/gu) || []).length)], ['Sum of numbers', N(nums.reduce((a, x) => a + (parseFloat(x.replace(/,/g, '')) || 0), 0))]] }; });
def('Space Counter', 'Counts spaces, tabs and line breaks separately.', s => { const sp = (s.match(/ /g) || []).length, tb = (s.match(/\t/g) || []).length, lb = (s.match(/\n/g) || []).length, ot = (s.match(/[^\S \t\n\r]/g) || []).length; return { rows: [['Spaces', N(sp)], ['Tabs', N(tb)], ['Line breaks', N(lb)], ['Other whitespace', N(ot)], ['Total whitespace', N(sp + tb + lb + ot)]] }; });
def('Punctuation Counter', 'Counts punctuation marks, one row per mark.', s => { const m = new Map(); (s.match(/\p{P}/gu) || []).forEach(c => m.set(c, (m.get(c) || 0) + 1)); return { head: ['Mark', 'Count'], rows: [...m].sort((a, b) => b[1] - a[1]).map(([c, n]) => [c, N(n)]), note: N([...m.values()].reduce((a, b) => a + b, 0)) + ' punctuation marks' }; });
def('Syllable Counter', 'Estimates syllables for the whole text and each word.', s => { const w = [...new Set(W(s).map(x => x.toLowerCase()))]; const t = ST(s); return { head: ['Word', 'Syllables'], rows: [['Total syllables', N(t.syl)], ['Avg. per word', t.avgsyl.toFixed(2)]].concat(w.slice(0, 200).map(x => [x, String(syl(x))])), note: 'Estimated with English spelling rules — expect the odd miss.' }; });

// Text Case
def('UPPERCASE', 'MAKES EVERY LETTER A CAPITAL.', s => s.toUpperCase());
def('lowercase', 'makes every letter small.', s => s.toLowerCase());
def('Title Case', 'Capitalizes important words and keeps small ones (a, of, the) lowercase.', titleCase);
def('Sentence case', 'Capitalizes the first letter of each sentence.', sentenceCase);
def('Capitalized Case', 'Capitalizes The First Letter Of Every Word.', capCase);
def('Toggle Case', 'Flips every letter: upper becomes lower and lower becomes upper.', s => A(s).map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''));
def('aLtErNaTiNg CaSe', 'aLtErNaTeS lEtTeRs, sKiPpInG sPaCeS.', s => { let i = 0; return A(s).map(c => /\p{L}/u.test(c) ? (i++ % 2 ? c.toUpperCase() : c.toLowerCase()) : c).join(''); });
def('camelCase', 'Turns each line into a camelCase identifier.', idCase(w => w.map((x, i) => i ? cap1(x) : x).join('')));
def('PascalCase', 'Turns each line into a PascalCase identifier.', idCase(w => w.map(cap1).join('')));
def('snake_case', 'Turns each line into snake_case.', idCase(w => w.join('_')));
def('kebab-case', 'Turns each line into kebab-case.', idCase(w => w.join('-')));
def('CONSTANT_CASE', 'Turns each line into CONSTANT_CASE.', idCase(w => w.join('_').toUpperCase()));
def('dot.case', 'Turns each line into dot.case.', idCase(w => w.join('.')));
def('Header-Case', 'Turns each line into Header-Case (also called Train-Case).', idCase(w => w.map(cap1).join('-')));

// Text Cleaner
def('Remove Extra Spaces', 'Collapses repeated spaces and trims each line.', s => s.replace(/[ \t\u00A0]{2,}/g, ' ').replace(/^[ \t]+|[ \t]+$/gm, ''), [], { diff: true });
def('Remove Empty Lines', 'Deletes blank lines, including ones with only spaces.', s => L(s).filter(l => l.trim()).join('\n'), [], { diff: true });
def('Remove Duplicate Lines', 'Keeps the first copy of each line and drops the repeats.', (s, o) => { const seen = new Set(); let n = 0; const out = L(s).filter(l => { let k = o.trim ? l.trim() : l; if (!o.cs) k = k.toLowerCase(); if (!k.trim()) return true; if (seen.has(k)) { n++; return false; } seen.add(k); return true; }).join('\n'); return { text: out, note: n ? n + ' duplicate line' + (n > 1 ? 's' : '') + ' removed' : 'No duplicates found.' }; }, [bool('cs', 'Match case', true), bool('trim', 'Ignore surrounding spaces', true)], { diff: true });
def('Remove Duplicate Words', 'Removes repeated words — side by side (“the the”) or anywhere.', (s, o) => { if (o.mode === 'Side by side') return s.replace(/(?<![\p{L}\p{N}])([\p{L}\p{N}'’]+)(?:\s+\1(?![\p{L}\p{N}]))+/giu, '$1'); const seen = new Set(); return tidy(s.replace(/([\p{L}\p{N}'’]+)([ \t]*)/gu, (m, w) => { const k = w.toLowerCase(); if (seen.has(k)) return ''; seen.add(k); return m; })); }, [seg('mode', 'Remove', ['Side by side', 'Anywhere'])], { diff: true });
def('Remove Punctuation', 'Strips punctuation marks and keeps letters, numbers and spaces.', s => s.replace(/\p{P}/gu, ''), [], { diff: true });
def('Remove Numbers', 'Strips every digit.', s => tidy(s.replace(/\p{N}/gu, '')), [], { diff: true });
def('Remove Special Characters', 'Removes symbols and odd characters; keeps letters, numbers and spaces.', (s, o) => s.replace(o.keep ? /[^\p{L}\p{N}\s.,!?;:'"()\-]/gu : /[^\p{L}\p{N}\s]/gu, ''), [bool('keep', 'Keep basic punctuation', true)], { diff: true });
def('Remove Emojis', 'Strips emoji, including skin tones and combined emoji.', s => tidy(s.replace(RX.emoji, '').replace(/\uFE0F/g, '')), [], { diff: true });
def('Remove HTML Tags', 'Turns HTML into plain readable text.', s => { const t = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n').replace(/<[^>]+>/g, ''); return htmlD(t).replace(/\n{3,}/g, '\n\n').replace(/[ \t]+$/gm, '').trim(); }, [], { ex: '<article>\n  <h1>Release notes</h1>\n  <p>We made the editor <strong>twice as fast</strong> &amp; fixed <a href="#">three bugs</a>.</p>\n  <ul><li>New shortcuts</li><li>Dark mode</li></ul>\n</article>' });
def('Remove Markdown', 'Strips Markdown formatting and keeps the words.', s => s.replace(/```[^\n]*\n?([\s\S]*?)```/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^#{1,6}\s+/gm, '').replace(/^\s*>\s?/gm, '').replace(/^\s*[-*+]\s+/gm, '').replace(/^\s*\d+\.\s+/gm, '').replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '$2').replace(/(^|[^\w*])\*(?=\S)([^*\n]*?\S)\*/g, '$1$2').replace(/(^|[^\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1$2').replace(/~~(.+?)~~/g, '$1').replace(/^\s*([-*_]\s*){3,}$/gm, ''), [], { ex: '# Launch plan\n\nWe ship **Friday**. Read the [brief](https://example.com) first.\n\n- Write the _announcement_\n- Test `export`\n\n> Keep it simple.' });
def('Remove Line Breaks', 'Joins lines into one flowing text.', (s, o) => { const j = o.mode === 'Replace with a space' ? ' ' : ''; if (o.keep) return PARA(s).map(p => p.replace(/\s*\r?\n\s*/g, j)).join('\n\n'); return s.replace(/\s*\r?\n\s*/g, j).trim(); }, [seg('mode', 'Line breaks', ['Replace with a space', 'Remove entirely']), bool('keep', 'Keep paragraph breaks', true)], { diff: true });
def('Remove URLs', 'Strips web addresses.', s => tidy(s.replace(RX.url, '')), [], { diff: true });
def('Remove Emails', 'Strips email addresses.', s => tidy(s.replace(RX.email, '')), [], { diff: true });
def('Remove Hashtags', 'Strips #hashtags.', s => tidy(s.replace(RX.hashtag, '')), [], { diff: true });
def('Remove Mentions', 'Strips @mentions (but leaves emails alone).', s => tidy(s.replace(RX.mention, '')), [], { diff: true });
def('Normalize Whitespace', 'Turns odd spaces into normal ones, collapses runs and trims lines.', s => s.replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ').replace(/\t/g, ' ').replace(/ {2,}/g, ' ').replace(/^ +| +$/gm, '').replace(/\n{3,}/g, '\n\n').trim(), [], { diff: true });
def('Remove Invisible Characters', 'Removes zero-width, direction and control characters you can’t see.', s => { let n = 0; const t = A(s).filter(c => { const cp = c.codePointAt(0); const bad = (INVIS[cp] && cp !== 0x00A0 && cp !== 0x202F && cp !== 0x2009 && cp !== 0x3000) || (cp < 32 && cp !== 10 && cp !== 13 && cp !== 9) || (cp >= 127 && cp < 160); if (bad) n++; return !bad; }).join(''); return { text: t, note: n ? n + ' invisible character' + (n > 1 ? 's' : '') + ' removed' : 'No invisible characters found.' }; });

// Text Formatter
def('Indent / Unindent', 'Adds or removes indentation on every line.', (s, o) => { const n = Math.max(0, +o.n || 2), u = o.char === 'Tab' ? '\t' : ' '.repeat(n); return o.dir === 'Indent' ? ML(s, l => l ? u + l : l) : ML(s, l => l.replace(o.char === 'Tab' ? /^\t/ : new RegExp('^ {1,' + n + '}'), '')); }, [seg('dir', 'Direction', ['Indent', 'Unindent']), seg('char', 'Using', ['Spaces', 'Tab']), num('n', 'Spaces', 2)]);
def('Add Prefix', 'Adds text to the start of every line.', (s, o) => ML(s, l => (o.skip && !l.trim()) ? l : o.p + l), [txt('p', 'Prefix', '> '), bool('skip', 'Skip empty lines', true)]);
def('Add Suffix', 'Adds text to the end of every line.', (s, o) => ML(s, l => (o.skip && !l.trim()) ? l : l + o.p), [txt('p', 'Suffix', ';'), bool('skip', 'Skip empty lines', true)]);
def('Number Lines', 'Puts a number in front of every line.', (s, o) => { let i = (+o.start || 1) - 1; return ML(s, l => (o.skip && !l.trim()) ? l : (++i) + o.sep + l); }, [num('start', 'Start at', 1), txt('sep', 'Separator', '. '), bool('skip', 'Skip empty lines', true)]);
def('Remove Line Numbers', 'Strips numbers like “1.”, “2)” or “3:” from line starts.', s => s.replace(/^\s*\d+[.):\]-]?\s+/gm, ''), [], { ex: '1. Buy coffee\n2. Write draft\n3) Send to editor\n4: Publish' });
def('Join Lines', 'Joins all lines into one, with the separator you choose.', (s, o) => L(s).map(l => l.trim()).filter(Boolean).join(o.sep.replace(/\\n/g, '\n').replace(/\\t/g, '\t')), [txt('sep', 'Separator', ', ')]);
def('Split Lines', 'Splits text onto new lines wherever the separator appears.', (s, o) => { if (!o.sep) fail('Add a separator to split on.'); return s.split(o.sep.replace(/\\t/g, '\t')).map(x => o.trim ? x.trim() : x).join('\n'); }, [txt('sep', 'Split on', ','), bool('trim', 'Trim pieces', true)], { ex: 'apples, pears, plums, cherries, figs' });
def('Wrap Text', 'Wraps long lines at a fixed width, breaking between words.', (s, o) => { const w = Math.max(10, +o.w || 72); return L(s).map(line => { const out = []; let cur = ''; for (const word of line.split(/\s+/).filter(Boolean)) { if (cur && A(cur + ' ' + word).length > w) { out.push(cur); cur = word; } else cur = cur ? cur + ' ' + word : word; } out.push(cur); return out.join('\n'); }).join('\n'); }, [num('w', 'Width', 60)]);
def('Unwrap Text', 'Joins hard-wrapped lines back into paragraphs.', s => PARA(s).map(p => p.replace(/\s*\n\s*/g, ' ')).join('\n\n'), [], { ex: 'This paragraph was wrapped\nat a narrow width by an old\nemail client.\n\nThis one was too, and it\nlooks choppy.' });
def('Sort Lines', 'Sorts lines alphabetically, by length or by number.', (s, o) => { const ls = L(s).filter(l => o.empty ? l.trim() : true); const c = o.by === 'Length' ? (a, b) => A(a).length - A(b).length : (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: o.cs ? 'variant' : 'base' }); ls.sort(c); if (o.dir === 'Z → A') ls.reverse(); return ls.join('\n'); }, [seg('by', 'Sort by', ['Alphabet', 'Length']), seg('dir', 'Order', ['A → Z', 'Z → A']), bool('cs', 'Match case'), bool('empty', 'Drop empty lines', true)]);
def('Reverse Lines', 'Flips the order of lines, last to first.', s => L(s).reverse().join('\n'));
def('Add Quotes', 'Wraps each line in quotes.', (s, o) => { const [a, b] = { '"…"': ['"', '"'], "'…'": ["'", "'"], '“…”': ['“', '”'], '«…»': ['«', '»'] }[o.q]; return ML(s, l => l.trim() ? a + l + b : l); }, [seg('q', 'Style', ['"…"', "'…'", '“…”', '«…»'])]);
def('Add Brackets', 'Wraps each line in brackets.', (s, o) => { const [a, b] = A(o.b.replace('…', '')); return ML(s, l => l.trim() ? a + l + b : l); }, [seg('b', 'Style', ['(…)', '[…]', '{…}', '<…>'])]);
def('Text to Bullet List', 'Turns lines into a bulleted list, replacing any old markers.', (s, o) => ML(s, l => l.trim() ? o.b + ' ' + stripMarker(l).trim() : l), [seg('b', 'Bullet', ['•', '-', '*', '–'])]);
def('Text to Numbered List', 'Turns lines into a numbered list.', (s, o) => { let i = 0; return ML(s, l => l.trim() ? (o.style === 'a.' ? String.fromCharCode(97 + (i++ % 26)) + '. ' : (++i) + o.style.slice(1) + ' ') + stripMarker(l).trim() : l); }, [seg('style', 'Style', ['1.', '1)', 'a.'])]);
def('Normalize Paragraphs', 'One blank line between paragraphs, no stray spaces, no hard wraps.', s => PARA(s).map(p => p.replace(/\s*\n\s*/g, ' ').replace(/ {2,}/g, ' ')).join('\n\n'), [], { diff: true });

// Text Converter
const bi = (label, e, d, extra = []) => [(s, o) => o.dir === 'Text → ' + label ? e(s, o) : d(s, o), [seg('dir', 'Direction', ['Text → ' + label, label + ' → Text'])].concat(extra)];
def('Text ↔ ASCII', 'Converts text to character codes (decimal) and back.', ...bi('Codes', s => A(s).map(c => c.codePointAt(0)).join(' '), s => s.trim().split(/[\s,]+/).filter(Boolean).map((x, i) => { if (!/^\d+$/.test(x) || +x > 0x10FFFF) fail(`Code ${i + 1} (“${x}”) isn’t a valid character code.`); return String.fromCodePoint(+x); }).join('')));
def('Text ↔ Binary', 'Converts text to 8-bit binary bytes (UTF-8) and back.', ...bi('Binary', s => A(bytes(s)).map(b => b.toString(2).padStart(8, '0')).join(' '), s => { let t = s.trim(); if (/^[01]+$/.test(t) && t.length % 8 === 0 && t.length > 8) t = t.match(/.{8}/g).join(' '); return groupsDecode(t, /^[01]+$/, 2, 'binary (only 0 and 1)', 8); }));
def('Text ↔ Hex', 'Converts text to hexadecimal bytes (UTF-8) and back.', ...bi('Hex', s => A(bytes(s)).map(b => b.toString(16).padStart(2, '0')).join(' '), s => { let t = s.trim(); if (/^[0-9a-f]+$/i.test(t) && t.length > 2) { if (t.length % 2) fail('Hex needs pairs of digits — there’s an odd one out.'); t = t.match(/../g).join(' '); } return groupsDecode(t, /^[0-9a-f]+$/i, 16, 'hex', 2); }));
def('Text ↔ Octal', 'Converts text to octal bytes (UTF-8) and back.', ...bi('Octal', s => A(bytes(s)).map(b => b.toString(8).padStart(3, '0')).join(' '), s => groupsDecode(s, /^[0-7]+$/, 8, 'octal (digits 0–7)', 3)));
def('Text ↔ Morse', 'Converts text to Morse code and back. Letters split by spaces, words by /.', ...bi('Morse', morseE, morseD));
def('Text ↔ Base64', 'Encodes text as Base64 (UTF-8 safe) and decodes it back.', ...bi('Base64', (s, o) => b64e(s, o.url), b64d, [bool('url', 'URL-safe')]));
def('Text ↔ URL Encoded', 'Percent-encodes text for URLs and decodes it back.', ...bi('URL', s => encodeURIComponent(s), s => { try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { fail('There’s a broken % sequence — each % must be followed by two hex digits.'); } }));
def('Text ↔ HTML Entities', 'Escapes text as HTML entities and back.', ...bi('Entities', (s, o) => htmlE(s, o.all), htmlD, [bool('all', 'Also encode non-ASCII')]));
def('Text ↔ Unicode', 'Shows text as Unicode code points and back.', ...bi('Unicode', (s, o) => uniE(s, o.f), uniD, [seg('f', 'Format', ['U+XXXX', '\\uXXXX', '&#x…;'])]));
def('Number → Words', 'Spells out numbers in English, one per line.', s => ML(s, n2w), [], { ex: '42\n1250\n-3.75\n1000000' });
def('Words → Number', 'Turns spelled-out numbers into digits, one per line.', s => ML(s, w2n), [], { ex: 'forty-two\none thousand two hundred fifty\nminus three point seven five\nseven million' });
def('Number ↔ Roman', 'Converts numbers to Roman numerals and back — it detects which way per line.', s => ML(s, l => { l = l.trim(); if (!l) return ''; return /^\d+$/.test(l) ? toRoman(+l) : String(fromRoman(l)); }), [], { ex: '2026\n14\nMCMXCIV\nXLII' });

// Find & Replace
def('Find and Replace', 'Finds text and replaces every match.', findReplace, FRO);
def('Regex Find and Replace', 'Replace using a regular expression. Use $1, $2 for groups.', findReplace, [txt('find', 'Pattern', '(\\w+)@(\\w+)'), txt('repl', 'Replace with', '$1 at $2'), bool('cs', 'Match case'), bool('whole', 'Whole words'), bool('regex', 'Regex', true)], { ex: 'Write to maya@northwind or sam@contoso today.' });
def('Whole Word Replace', 'Replaces a word only where it stands alone — “cat” won’t touch “category”.', findReplace, [txt('find', 'Find', 'cat'), txt('repl', 'Replace with', 'dog'), bool('cs', 'Match case'), bool('whole', 'Whole words', true), bool('regex', 'Regex')], { ex: 'The cat sat in the category of cats. Cat food, cat toys.' });
def('Multi-Replace', 'Runs several replacements in one go. One rule per line: old => new', (s, o) => { let n = 0; for (const [i, r] of L(o.rules).entries()) { if (!r.trim()) continue; const k = r.indexOf('=>'); if (k < 0) fail(`Rule ${i + 1} needs “=>” between the old and new text.`); const a = r.slice(0, k).trim(), b = r.slice(k + 2).trim(); if (!a) continue; const re = new RegExp(esc(a), 'g' + (o.cs ? '' : 'i')); n += countMatches(s, re); s = s.replace(re, b.replace(/\$/g, '$$$$')); } return { text: s, note: n + ' replacements made' }; }, [area('rules', 'Rules', 'colour => color\nfavourite => favorite\norganise => organize'), bool('cs', 'Match case')], { ex: 'My favourite colour is green. We organise by colour.' });
def('Match Highlighter', 'Highlights every match so you can see them in context.', (s, o) => { const re = mkRe(o); if (!re) return { text: s, note: 'Type something in “Find”.' }; const segs = []; let last = 0, m, n = 0; re.lastIndex = 0; while ((m = re.exec(s)) && n < 20000) { if (m.index > last) segs.push(['eq', s.slice(last, m.index)]); if (m[0]) { segs.push(['hit', m[0]]); n++; } else re.lastIndex++; last = m.index + m[0].length; } if (last < s.length) segs.push(['eq', s.slice(last)]); return { segs, note: n + ' match' + (n === 1 ? '' : 'es') }; }, [txt('find', 'Find', 'text'), bool('cs', 'Match case'), bool('whole', 'Whole words'), bool('regex', 'Regex')]);

// Text Generator
const G = { gen: true };
def('Lorem Ipsum Generator', 'Classic placeholder Latin, as much as you need.', (s, o) => { const n = Math.min(200, Math.max(1, +o.n || 3)); const para = () => Array.from({ length: 4 + rnd(3) }, () => sentenceFrom(LOREM, 8, 16)).join(' '); let out = o.unit === 'Words' ? Array.from({ length: n }, () => pick(LOREM)).join(' ') : o.unit === 'Sentences' ? Array.from({ length: n }, () => sentenceFrom(LOREM, 8, 16)).join(' ') : Array.from({ length: n }, para).join('\n\n'); if (o.classic) out = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + out.replace(/^./, c => c); return out; }, [num('n', 'How many', 3), seg('unit', 'Of', ['Paragraphs', 'Sentences', 'Words']), bool('classic', 'Start with “Lorem ipsum”', true)], G);
def('Random Word Generator', 'Random everyday English words.', (s, o) => Array.from({ length: Math.min(1000, Math.max(1, +o.n || 10)) }, () => pick(ENW)).join(o.sep === 'New lines' ? '\n' : o.sep === 'Commas' ? ', ' : ' '), [num('n', 'How many', 12), seg('sep', 'Separate with', ['New lines', 'Spaces', 'Commas'])], G);
def('Random Sentence Generator', 'Random English-looking sentences for layouts and tests.', (s, o) => Array.from({ length: Math.min(200, Math.max(1, +o.n || 5)) }, () => sentenceFrom(ENW, 6, 14)).join(o.lines ? '\n' : ' '), [num('n', 'How many', 5), bool('lines', 'One per line', true)], G);
def('Random Paragraph Generator', 'Random English-looking paragraphs.', (s, o) => Array.from({ length: Math.min(50, Math.max(1, +o.n || 3)) }, () => Array.from({ length: 4 + rnd(3) }, () => sentenceFrom(ENW, 6, 14)).join(' ')).join('\n\n'), [num('n', 'How many', 3)], G);
def('Random String Generator', 'Random strings from a cryptographically secure source.', (s, o) => { const cs = { 'Letters + digits': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'Letters': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 'Hex': '0123456789abcdef', 'Digits': '0123456789', 'With symbols': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-_=+?' }[o.cs]; const len = Math.min(1024, Math.max(1, +o.len || 16)); return Array.from({ length: Math.min(500, Math.max(1, +o.n || 5)) }, () => Array.from({ length: len }, () => cs[rnd(cs.length)]).join('')).join('\n'); }, [num('len', 'Length', 16), num('n', 'How many', 5), seg('cs', 'Characters', ['Letters + digits', 'Letters', 'Hex', 'Digits', 'With symbols'])], G);
def('Random Number Generator', 'Random whole numbers in a range.', (s, o) => { const lo = Math.round(+o.min), hi = Math.round(+o.max), n = Math.min(10000, Math.max(1, +o.n || 10)); if (!(hi >= lo)) fail('“Max” needs to be at least “Min”.'); const span = hi - lo + 1; if (o.uniq && n > span) fail(`There are only ${span} different numbers between ${lo} and ${hi}.`); const out = [], seen = new Set(); while (out.length < n) { const v = lo + rnd(span); if (o.uniq && seen.has(v)) continue; seen.add(v); out.push(v); } return out.join('\n'); }, [num('n', 'How many', 10), num('min', 'Min', 1), num('max', 'Max', 100), bool('uniq', 'No repeats')], G);
def('UUID Generator', 'Random version-4 UUIDs.', (s, o) => Array.from({ length: Math.min(1000, Math.max(1, +o.n || 5)) }, () => { const u = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (c === 'x' ? rnd(16) : (rnd(4) + 8)).toString(16)); return o.up ? u.toUpperCase() : u; }).join('\n'), [num('n', 'How many', 5), bool('up', 'Uppercase')], G);
const slug = (s, o) => ML(s, l => l.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, o.sep === 'underscore' ? '_' : '-').replace(/^[-_]+|[-_]+$/g, ''));
def('Slug Generator', 'Turns titles into clean URL slugs, one per line.', slug, [seg('sep', 'Separator', ['hyphen', 'underscore'])], { ex: 'How to Write a Great Headline (in 5 Steps)\nCafé Déjà Vu & Friends' });
def('Username Generator', 'Friendly random usernames.', (s, o) => { const adj = 'quiet bright swift calm lucky bold clever sunny brave gentle mellow cosmic amber misty rusty velvet'.split(' '), noun = 'otter fox heron maple comet pixel harbor falcon willow ember lynx badger cedar raven orbit tulip'.split(' '); return Array.from({ length: Math.min(200, Math.max(1, +o.n || 10)) }, () => { const a = pick(adj), b = pick(noun), d = rnd(90) + 10; return o.style === 'word_word' ? a + '_' + b : o.style === 'word.word' ? a + '.' + b : cap1(a) + cap1(b) + d; }).join('\n'); }, [num('n', 'How many', 10), seg('style', 'Style', ['WordWord42', 'word_word', 'word.word'])], G);
def('Test String Generator', 'Tricky strings for testing inputs: unicode, emoji, quotes, whitespace, long text.', (s, o) => ({ 'Edge cases': ['', ' ', 'null', 'undefined', '0', '-1', 'O\'Brien', '"quoted"', 'Robert\'); DROP TABLE students;--', '<script>alert(1)</script>', '../../etc/passwd', 'a'.repeat(256)], 'Unicode': ['Café', 'naïve résumé', 'Straße', 'Ελληνικά', 'Русский', 'עברית (RTL)', 'العربية', '中文字符', '日本語テキスト', '한국어', 'Z̤͔ͧ̑̓ä͖̭̈̇lͮ̒ͫǫ̗'], 'Emoji': ['👍', '👍🏽', '👩‍💻', '🏳️‍🌈', '🇯🇵', '❤️‍🔥', 'emoji in text 🚀 here'], 'Whitespace': ['trailing space ', ' leading space', 'double  space', 'tab\there', 'no\u00A0break', 'zero\u200Bwidth', 'line\nbreak'] })[o.set].join('\n'), [seg('set', 'Set', ['Edge cases', 'Unicode', 'Emoji', 'Whitespace'])], G);

// Text Compare
const CMP = mode => (s, o) => diff(s, o.b, o.mode || mode);
const BEX = 'Plain text is the most durable format we have. It opens on every device, survives every migration, and asks nothing of the reader.\n\nWriters draft in it and developers configure systems with it.';
const AEX = 'Plain text is the most durable format there is. It opens on every machine, survives every migration, and asks nothing of the reader.\n\nWriters draft in it. Developers configure systems with it.';
def('Text Compare', 'Shows what changed between two texts. Your text is the original; paste the new version below.', CMP(), [seg('mode', 'Compare by', ['Words', 'Characters', 'Lines', 'Sentences']), area('b', 'Changed version', BEX)], { ex: AEX });
def('Character Diff', 'Compares two texts letter by letter.', CMP('Characters'), [area('b', 'Changed version', BEX)], { ex: AEX });
def('Word Diff', 'Compares two texts word by word.', CMP('Words'), [area('b', 'Changed version', BEX)], { ex: AEX });
def('Line Diff', 'Compares two texts line by line — best for lists and code.', CMP('Lines'), [area('b', 'Changed version', 'apples\npears\nplums\nkiwis\nfigs')], { ex: 'apples\npears\ncherries\nplums\nfigs' });
def('Sentence Diff', 'Compares two texts sentence by sentence.', CMP('Sentences'), [area('b', 'Changed version', BEX)], { ex: AEX });

// Extractors
def('Extract Emails', 'Pulls every email address out of your text.', exr(RX.email), EXO);
def('Extract URLs', 'Pulls every web link out of your text.', (s, o) => post((s.match(RX.url) || []).map(u => u.replace(/[.,;:!?]+$/, '')), o), EXO);
def('Extract Phone Numbers', 'Finds phone-number-shaped text (7–15 digits).', exr(RX.phone, x => { const d = x.replace(/\D/g, '').length; return d >= 7 && d <= 15 && !/^\d{4}-\d{2}-\d{2}$/.test(x.trim()); }), EXO);
def('Extract Numbers', 'Pulls out every number, including decimals and negatives.', exr(RX.number), [bool('dedupe', 'Remove duplicates'), bool('sort', 'Sort')]);
def('Extract Dates', 'Finds dates like 2026-10-14, 14/10/2026 or March 3, 2027.', exr(RX.date), EXO);
def('Extract Hashtags', 'Pulls out every #hashtag.', exr(RX.hashtag), EXO);
def('Extract Mentions', 'Pulls out every @mention, skipping email addresses.', exr(RX.mention), EXO);
def('Extract Keywords', 'The most frequent meaningful words, common words left out.', (s, o) => { const r = freq(s, { stop: true, min: 3, n: 1, top: +o.top || 15 }); return { chips: r.rows.map(x => x[0]), note: 'Ranked by frequency — a simple, transparent method, not AI.' }; }, [num('top', 'How many', 15)]);
def('Extract Quoted Text', 'Pulls out anything inside quotation marks.', (s, o) => { const r = []; s.replace(/"([^"\n]+)"|“([^”]+)”|(?<![\p{L}])'([^'\n]+)'(?![\p{L}])/gu, (m, a, b, c) => r.push(a || b || c)); return post(r, o); }, EXO);
def('Extract Text Between Characters', 'Pulls out whatever sits between a start and end marker.', (s, o) => { if (!o.a || !o.b) fail('Set both a start and an end marker.'); const re = new RegExp(esc(o.a) + '([\\s\\S]*?)' + esc(o.b), 'g'); return post([...s.matchAll(re)].map(m => m[1]), o); }, [txt('a', 'Start', '['), txt('b', 'End', ']')].concat(EXO), { ex: 'Tasks: [write intro] then [add examples] and finally [proofread].' });
def('Extract Text Between Tags', 'Pulls out the text inside a given HTML/XML tag.', (s, o) => { const t = o.tag.replace(/[<>\/\s]/g, ''); if (!t) fail('Type a tag name, like p or title.'); const re = new RegExp('<' + esc(t) + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + esc(t) + '>', 'gi'); return post([...s.matchAll(re)].map(m => htmlD(m[1].replace(/<[^>]+>/g, ''))), o); }, [txt('tag', 'Tag', 'li')].concat(EXO), { ex: '<ul>\n  <li>Count words</li>\n  <li>Clean text</li>\n  <li>Compare <b>drafts</b></li>\n</ul>' });
def('Extract Capitalized Words', 'Finds capitalized words — often names, places and brands.', (s, o) => post(s.match(/(?<![\p{L}])\p{Lu}[\p{L}'’]+/gu) || [], o), EXO);

// Encoding & Decoding
const ED = (e, d, extra = []) => [(s, o) => o.dir === 'Encode' ? e(s, o) : d(s, o), [seg('dir', 'Mode', ['Encode', 'Decode'])].concat(extra)];
def('Base64', 'Encode text to Base64 or decode it back. UTF-8 safe.', ...ED((s, o) => b64e(s, o.url), b64d, [bool('url', 'URL-safe')]));
def('URL Encoder / Decoder', 'Percent-encode text for URLs, or decode it back.', ...ED((s, o) => o.scope === 'Whole URL' ? encodeURI(s) : encodeURIComponent(s), s => { try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { fail('There’s a broken % sequence — each % must be followed by two hex digits.'); } }, [seg('scope', 'Encode as', ['Component', 'Whole URL'])]));
def('HTML Entity Encoder', 'Escape characters as HTML entities, or decode entities back.', ...ED((s, o) => htmlE(s, o.all), htmlD, [bool('all', 'Also encode non-ASCII')]));
def('Unicode Escape', 'Write text as \\u escapes (or U+ / &#x;) and back.', ...ED((s, o) => uniE(s, o.f), uniD, [seg('f', 'Format', ['\\uXXXX', 'U+XXXX', '&#x…;'])]));
def('ROT13', 'Shifts letters 13 places. Running it twice gets you back.', s => rot(s, 13));
def('ROT47', 'Rotates all visible ASCII characters by 47. Its own inverse.', rot47);
def('Caesar Cipher', 'Shifts each letter by a fixed amount.', (s, o) => { const k = Math.round(+o.k || 0); return rot(s, o.dir === 'Encode' ? k : -k); }, [seg('dir', 'Mode', ['Encode', 'Decode']), num('k', 'Shift', 3)]);
def('Atbash', 'Mirrors the alphabet: A↔Z, B↔Y. Its own inverse.', atbash);
def('Morse Code', 'Encode to Morse or decode Morse back to text.', ...ED(morseE, morseD));
def('Bacon Cipher', 'Francis Bacon’s cipher: each letter becomes five A/B letters.', ...ED(baconE, baconD));

// Unicode & Symbols
def('Unicode Inspector', 'Every character with its code point, UTF-8 bytes and type.', s => inspect(s));
def('Unicode Normalizer', 'Normalizes text to NFC, NFD, NFKC or NFKD.', (s, o) => { const t = s.normalize(o.f); return { text: t, note: `${A(s).length} → ${A(t).length} code points${s === t ? ' (already normalized)' : ''}` }; }, [seg('f', 'Form', ['NFC', 'NFD', 'NFKC', 'NFKD'])], { ex: 'Café vs Cafe\u0301 — ﬁne ① ｆｕｌｌ' });
def('Symbol Picker', 'Click to copy common symbols.', (s, o) => symGrid(o.set), [seg('set', 'Set', ['All', 'Math', 'Currency', 'Arrows', 'Checks', 'Legal', 'Typography'])], G);
def('Math Symbols', 'Click to copy math symbols.', () => symGrid('Math'), [], G);
def('Currency Symbols', 'Click to copy currency symbols.', () => symGrid('Currency'), [], G);
def('Arrow Symbols', 'Click to copy arrows.', () => symGrid('Arrows'), [], G);
def('Checkmark Symbols', 'Click to copy check marks, boxes and bullets.', () => symGrid('Checks'), [], G);
def('Copyright & Trademark', 'Click to copy ©, ®, ™ and friends.', () => symGrid('Legal'), [], G);
def('Invisible Character Detector', 'Finds characters you can’t see: zero-width, direction marks, odd spaces.', s => inspect(s, isInvis, 'No invisible characters — you’re clean.'));
def('Zero-Width Detector', 'Finds zero-width spaces, joiners and byte-order marks.', s => inspect(s, c => [0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF].includes(c.codePointAt(0)), 'No zero-width characters found.'));
def('Non-ASCII Detector', 'Finds every character outside plain ASCII.', s => inspect(s, c => c.codePointAt(0) > 127, 'Everything is plain ASCII.'));

// Emoji Tools
const eGrid = (q, g) => { const [a, b] = EGROUP[g || 'All']; q = (q || '').toLowerCase().trim(); const list = EMOJI.slice(a, b).filter(e => !q || e.name.includes(q)); return { grid: list.map(e => ({ ch: e.ch, name: e.name })), note: list.length ? list.length + ' emoji · click to copy and add to your text' : 'No emoji match that word.' }; };
def('Emoji Picker', 'Browse by group and click to copy.', (s, o) => eGrid('', o.g), [seg('g', 'Group', Object.keys(EGROUP))], G);
def('Emoji Search', 'Search emoji by name and click to copy.', (s, o) => eGrid(o.q), [txt('q', 'Search', 'heart')], G);
def('Emoji Counter', 'Counts emoji, including combined ones like 👩‍💻.', s => { const l = s.match(RX.emoji) || []; const m = new Map(); l.forEach(e => m.set(e, (m.get(e) || 0) + 1)); return { head: ['Emoji', 'Count'], rows: [['Total', N(l.length)], ['Different', N(m.size)]].concat([...m].sort((a, b) => b[1] - a[1]).map(([e, n]) => [e, N(n)])) }; });
def('Emoji Extractor', 'Pulls every emoji out of your text.', exr(RX.emoji), EXO);
def('Emoji Remover', 'Strips all emoji and tidies the spaces they leave.', s => tidy(s.replace(RX.emoji, '').replace(/\uFE0F/g, '')), [], { diff: true });
def('Emoji → Text', 'Replaces emoji with :short_names: (or code points when unknown).', s => s.replace(RX.emoji, e => { const k = e.replace(/\uFE0F/g, ''); return EMAP[k] ? ':' + EMAP[k] + ':' : '[' + A(e).map(uhex).join(' ') + ']'; }));
def('Emoji Inspector', 'Every emoji with its code points and name.', s => { const l = [...new Set(s.match(RX.emoji) || [])]; return { head: ['Emoji', 'Code points', 'Name'], rows: l.map(e => [e, A(e).map(uhex).join(' '), (EMOJI.find(x => x.ch.replace(/\uFE0F/g, '') === e.replace(/\uFE0F/g, '')) || {}).name || '—']), note: l.length + ' different emoji' }; });

// SEO Tools
def('Keyword Density Checker', 'How often each word or phrase appears, as a share of all words.', freq, [seg('n', 'Phrase length', ['1', '2', '3']), bool('stop', 'Skip common words', true), num('top', 'Show top', 30)]);
def('Title Length Checker', 'Checks a page title against the usual 50–60 character guideline.', guide(50, 60, 'Page titles.'), [], { ex: 'Free Word Counter — Count Words and Characters Online' });
def('Meta Description Length', 'Checks a meta description against the usual 120–160 character guideline.', guide(120, 160, 'Meta descriptions.'), [], { ex: 'Count words, characters, sentences and reading time instantly. Free, private and fast — your text never leaves your browser.' });
def('Heading Analyzer', 'Outlines your headings and flags skipped levels. Paste HTML or Markdown.', s => { const hs = []; s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (m, l, t) => hs.push([+l, htmlD(t.replace(/<[^>]+>/g, '')).trim()])); if (!hs.length) s.replace(/^(#{1,6})\s+(.+)$/gm, (m, h, t) => hs.push([h.length, t.trim()])); if (!hs.length) return { text: '', note: 'No headings found. Paste HTML (<h2>…</h2>) or Markdown (## Heading).' }; const warn = []; const h1 = hs.filter(h => h[0] === 1).length; if (h1 === 0) warn.push('⚠ No H1 heading.'); if (h1 > 1) warn.push(`⚠ ${h1} H1 headings — one is usual.`); hs.forEach((h, i) => { if (i && h[0] > hs[i - 1][0] + 1) warn.push(`⚠ Skips from H${hs[i - 1][0]} to H${h[0]} at “${h[1]}”.`); }); return { text: hs.map(([l, t]) => '  '.repeat(l - 1) + 'H' + l + '  ' + t).join('\n') + '\n\n' + (warn.length ? warn.join('\n') : '✓ Heading structure looks tidy.'), note: hs.length + ' headings' }; }, [], { ex: '# Word Counter\n## How it works\n#### Reading time\n## FAQ\n# Another H1' });
def('Sentence Length Analyzer', 'Lists sentences by length and flags long ones.', (s, o) => { const sen = SEN(s), lim = +o.lim || 25; const rows = sen.map((x, i) => [String(i + 1), W(x).length + (W(x).length > lim ? ' ▲' : ''), x.length > 90 ? x.slice(0, 90) + '…' : x]); const long = sen.filter(x => W(x).length > lim).length; return { head: ['#', 'Words', 'Sentence'], rows, note: `${long} of ${sen.length} sentences are over ${lim} words.`, ext: 'csv' }; }, [num('lim', 'Flag over', 25)]);
def('Readability Checker', 'Flesch scores and the numbers behind them.', s => { const t = ST(s); return { rows: [['Flesch Reading Ease', t.fre.toFixed(1) + ' · ' + freLabel(t.fre)], ['Flesch-Kincaid Grade', t.fk.toFixed(1)], ['Avg. sentence length', t.avgs.toFixed(1) + ' words'], ['Avg. syllables per word', t.avgsyl.toFixed(2)], ['Complex words (3+ syllables)', pct(t.complex, t.words)]], note: HEUR }; });
def('URL Slug Generator', 'Turns titles into clean URL slugs, one per line.', slug, [seg('sep', 'Separator', ['hyphen', 'underscore'])], { ex: 'How to Write a Great Headline (in 5 Steps)\nCafé Déjà Vu & Friends' });
def('Keyword Occurrence Finder', 'Finds every place a keyword appears, with context.', (s, o) => { const re = mkRe({ find: o.k, whole: o.whole }); if (!re) return { rows: [], note: 'Type a keyword.' }; const rows = []; let m; re.lastIndex = 0; while ((m = re.exec(s)) && rows.length < 500) { if (!m[0]) { re.lastIndex++; continue; } const a = Math.max(0, m.index - 40), b = Math.min(s.length, m.index + m[0].length + 40); rows.push([String(rows.length + 1), (a ? '…' : '') + s.slice(a, b).replace(/\s+/g, ' ') + (b < s.length ? '…' : '')]); } return { head: ['#', 'Context'], rows, note: `${rows.length} occurrences · ${pct(rows.length, W(s).length)} of words` }; }, [txt('k', 'Keyword', 'text'), bool('whole', 'Whole words', true)]);
def('Stop Word Checker', 'How much of your text is common filler words (the, and, of…).', s => { const w = W(s).map(x => x.toLowerCase()), st = w.filter(x => STOP.has(x)); const m = new Map(); st.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return { head: ['Word', 'Count'], rows: [['Stop words', N(st.length) + ' of ' + N(w.length)], ['Share', pct(st.length, w.length)]].concat([...m].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([x, n]) => [x, N(n)])), note: '40–60% is normal for everyday English.' }; });
def('Duplicate Content Comparator', 'Compares two texts sentence by sentence and scores how similar they are.', CMP('Sentences'), [area('b', 'Other text', BEX)], { ex: AEX });

// Social Media
const XN = 'Weighted like X: links count as 23, emoji and most CJK as 2.';
def('X Character Counter', 'Counts a post the way X does, against the 280 limit.', soc(280, 'x', XN));
def('Threads Counter', 'Checks a Threads post against its 500-character limit.', soc(500));
def('Bluesky Counter', 'Checks a Bluesky post against its 300-character limit (counted as graphemes).', soc(300, 'g'));
def('Instagram Caption Counter', 'Checks a caption against Instagram’s 2,200-character limit.', soc(2200, null, 'Instagram also allows up to 30 hashtags per post.'));
def('Instagram Bio Counter', 'Checks a bio against Instagram’s 150-character limit.', soc(150), [], { ex: 'Writer & editor ✍️ Helping teams say more with less. Newsletter below ↓' });
def('TikTok Caption Counter', 'Checks a caption against TikTok’s 4,000-character limit.', soc(4000));
def('LinkedIn Post Counter', 'Checks a post against LinkedIn’s 3,000-character limit.', soc(3000));
def('YouTube Title Counter', 'Checks a title against YouTube’s 100-character limit.', soc(100), [], { ex: 'I Tried Writing Every Day for 30 Days — Here’s What Changed' });
def('YouTube Description Counter', 'Checks a description against YouTube’s 5,000-character limit.', soc(5000));
def('Facebook Post Counter', 'Checks a post against Facebook’s 63,206-character limit.', soc(63206));
def('Hashtag Counter', 'Counts hashtags and lists them.', s => { const h = s.match(RX.hashtag) || [], u = [...new Set(h.map(x => x.toLowerCase()))]; return { head: ['Hashtag', ''], rows: [['Hashtags', N(h.length)], ['Different', N(u.length)]].concat(u.map(x => [x, ''])), note: 'Instagram allows up to 30 per post.' }; });
def('Unicode Font Generator', 'Your text in Unicode styles that paste anywhere. Click a row to copy.', s => ({ head: ['Style', 'Preview'], rows: FANCY.map(([n, f]) => [n, f(s.slice(0, 300))]), copyRows: true, note: 'Screen readers may read these characters oddly — use them for accents, not whole posts.' }), [], { ex: 'Text Trendz' });
def('Small Text Generator', 'Tiny text: small caps, superscript or subscript.', (s, o) => o.st === 'Small caps' ? smallCaps(s) : o.st === 'Superscript' ? supMap(s) : subMap(s.toLowerCase()), [seg('st', 'Style', ['Small caps', 'Superscript', 'Subscript'])], { ex: 'tiny but mighty 123' });
def('Strikethrough Generator', 'S̶t̶r̶i̶k̶e̶ or u̲n̲d̲e̲r̲l̲i̲n̲e̲ text with combining marks.', (s, o) => comb(s, { Strikethrough: '\u0336', Underline: '\u0332', Slash: '\u0338', 'Double underline': '\u0333' }[o.st]), [seg('st', 'Style', ['Strikethrough', 'Underline', 'Slash', 'Double underline'])], { ex: 'old price $49' });

// Developer Tools
const JEX = '{"name":"text-trendz","version":"1.4.0","private":true,"tools":246,"categories":["counting","case","cleaner"],"engine":{"local":true,"workers":2,"maxInput":null}}';
def('JSON Formatter', 'Pretty-prints JSON and points to the exact line if something’s wrong.', (s, o) => { let v = jparse(s); if (o.sort) v = sortKeys(v); return { text: JSON.stringify(v, null, IND[o.ind]), code: true, ext: 'json' }; }, [seg('ind', 'Indent', ['2 spaces', '4 spaces', 'Tab']), bool('sort', 'Sort keys')], { ex: JEX });
def('JSON Validator', 'Checks whether JSON is valid and tells you where it breaks.', s => { const v = jparse(s); const type = Array.isArray(v) ? `Array of ${v.length}` : v === null ? 'null' : typeof v === 'object' ? `Object with ${Object.keys(v).length} keys` : typeof v; return { rows: [['Valid', '✓ Yes'], ['Top level', type], ['Depth', String(depth(v))], ['Size', N(bytes(s).length) + ' bytes']] }; }, [], { ex: '{"name": "text-trendz", "tools": 221, "local": true, "tags": ["count", "clean"]}' });
def('JSON Minifier', 'Removes all whitespace from JSON.', s => { const o = JSON.stringify(jparse(s)); return { text: o, note: `${N(bytes(s).length)} → ${N(bytes(o).length)} bytes`, ext: 'json' }; }, [], { ex: JSON.stringify(JSON.parse(JEX), null, 2) });
def('JSON → CSV', 'Turns an array of JSON objects into CSV with a header row.', (s, o) => { let v = jparse(s); if (!Array.isArray(v)) v = [v]; if (!v.every(x => x && typeof x === 'object' && !Array.isArray(x))) fail('Needs an array of objects, like [{"a":1},{"a":2}].'); const keys = [...new Set(v.flatMap(Object.keys))]; const d = { Comma: ',', Semicolon: ';', Tab: '\t' }[o.d]; return { text: [keys.map(csvCell).join(d)].concat(v.map(r => keys.map(k => csvCell(r[k])).join(d))).join('\n'), ext: 'csv' }; }, [seg('d', 'Delimiter', ['Comma', 'Semicolon', 'Tab'])], { ex: '[{"name":"Maya","role":"Editor","posts":42},{"name":"Sam","role":"Writer","posts":17},{"name":"Ada, Jr.","role":"Intern"}]' });
def('CSV → JSON', 'Turns CSV into a JSON array.', (s, o) => { const rows = csvParse(s, o.d); if (!rows.length) return ''; let out; if (o.h) { const h = rows[0]; out = rows.slice(1).map(r => Object.fromEntries(h.map((k, i) => [k, r[i] ?? '']))); } else out = rows; return { text: JSON.stringify(out, null, 2), code: true, ext: 'json' }; }, [bool('h', 'First row is headers', true), seg('d', 'Delimiter', ['Auto', 'Comma', 'Semicolon', 'Tab'])], { ex: 'name,role,posts\nMaya,Editor,42\nSam,Writer,17\n"Ada, Jr.",Intern,' });
def('XML Formatter', 'Validates and indents XML.', (s, o) => ({ text: xmlFormat(s, IND[o.ind]), code: true, ext: 'xml' }), [seg('ind', 'Indent', ['2 spaces', '4 spaces', 'Tab'])], { ex: '<?xml version="1.0"?><feed><title>Text Trendz</title><entry><id>1</id><title>Word Counter</title></entry><entry><id>2</id><title>Case Converter</title></entry></feed>' });
def('JSON → YAML', 'Converts JSON into readable YAML.', s => ({ text: toYAML(jparse(s), 0), code: true, ext: 'yaml' }), [], { ex: JEX });
def('SQL Formatter', 'Puts clauses on their own lines and uppercases keywords.', s => ({ text: sqlFormat(s), code: true, ext: 'sql' }), [], { ex: "select u.id, u.name, count(p.id) as posts from users u left join posts p on p.user_id = u.id where u.active = 1 and p.created_at > '2026-01-01' group by u.id, u.name order by posts desc limit 10;" });
def('Regex Tester', 'Tests a regular expression and lists every match with its groups.', (s, o) => { if (!o.p) return { rows: [], note: 'Type a pattern.' }; if (!/^[dgimsuy]*$/.test(o.f)) fail('Flags can only be d, g, i, m, s, u or y.'); let re; try { re = new RegExp(o.p, o.f.includes('g') ? o.f : o.f + 'g'); } catch (e) { fail('That pattern isn’t valid: ' + e.message.replace(/^Invalid regular expression: /, '')); } const rows = []; let m; while ((m = re.exec(s)) && rows.length < 500) { if (!m[0]) { re.lastIndex++; continue; } rows.push([String(rows.length + 1), m[0], 'at ' + m.index, m.slice(1).map((g, i) => `$${i + 1}=${g ?? '∅'}`).join('  ') || '—']); } return { head: ['#', 'Match', 'Position', 'Groups'], rows, note: rows.length + ' match' + (rows.length === 1 ? '' : 'es') }; }, [txt('p', 'Pattern', '([\\w.+-]+)@([\\w-]+\\.[\\w.]+)'), txt('f', 'Flags', 'gi')], { ex: 'Contact maya.chen@northwind.co or sam@contoso.com — not this@one' });
def('Regex Escape', 'Escapes characters that mean something special in regex.', s => esc(s), [], { ex: 'Price: $5.00 (approx.) [sale]?' });
def('String Escape / Unescape', 'Escapes text as a JavaScript/JSON string literal, or unescapes one.', (s, o) => { if (o.dir === 'Escape') return JSON.stringify(s).slice(1, -1); return s.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (m, c) => { if (c[0] === 'u') return String.fromCodePoint(parseInt(c.replace(/[u{}]/g, ''), 16)); if (c[0] === 'x' && c.length === 3) return String.fromCharCode(parseInt(c.slice(1), 16)); return { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }[c] ?? c; }); }, [seg('dir', 'Mode', ['Escape', 'Unescape'])], { ex: 'She said "hi"\nthen left — tab:\there' });
def('HTML Escape', 'Escapes <, >, & and quotes so HTML shows as text — or unescapes it.', (s, o) => o.dir === 'Escape' ? htmlE(s, false) : htmlD(s), [seg('dir', 'Mode', ['Escape', 'Unescape'])], { ex: '<a href="/tools?q=case&sort=new">Tools & tips</a>' });
def('CSS Minifier', 'Strips comments and whitespace from CSS.', s => { const o = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>+~])\s*/g, '$1').replace(/;}/g, '}').trim(); return { text: o, note: `${N(s.length)} → ${N(o.length)} characters (${pct(s.length - o.length, s.length)} smaller)`, ext: 'css' }; }, [], { ex: '/* Buttons */\n.button {\n  color: #171614;\n  padding: 8px 12px;\n}\n\n.button:hover > span {\n  color: red;\n}' });
def('HTML Minifier', 'Strips comments and extra whitespace between tags.', s => { const o = s.replace(/<!--(?!\[if)[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim(); return { text: o, note: `${N(s.length)} → ${N(o.length)} characters (${pct(s.length - o.length, s.length)} smaller) · <pre> blocks aren’t protected`, ext: 'html' }; }, [], { ex: '<!-- nav -->\n<nav>\n    <a href="/">Home</a>\n    <a href="/tools">Tools</a>\n</nav>' });

// Number & Code
def('Number Base Converter', 'Shows each number in decimal, hex, octal and binary.', (s, o) => L(s).map(l => { const v = parseBig(l, o.from); if (v === null) return ''; const neg = v < 0n, a = neg ? -v : v, sg = neg ? '-' : ''; return `${l.trim()}\n  DEC  ${sg}${a.toString(10)}\n  HEX  ${sg}${a.toString(16).toUpperCase()}\n  OCT  ${sg}${a.toString(8)}\n  BIN  ${sg}${grp(a.toString(2), 4)}`; }).filter(Boolean).join('\n\n'), [seg('from', 'Input is', ['Auto', 'Binary', 'Octal', 'Decimal', 'Hex'])], { ex: '255\n0xFF\n0b101010\n2026' });
const baseTool = (name, B, lbl) => def(name, `Converts ${lbl.toLowerCase()} numbers to decimal and back, one per line.`, (s, o) => ML(s, l => { if (!l.trim()) return ''; if (o.dir === lbl + ' → Decimal') return parseBig(l, lbl).toString(10); const v = parseBig(l, 'Decimal'); return (v < 0n ? '-' : '') + (v < 0n ? -v : v).toString(B).toUpperCase(); }), [seg('dir', 'Direction', [lbl + ' → Decimal', 'Decimal → ' + lbl])], { ex: B === 2 ? '1010\n11111111\n100000' : B === 16 ? 'FF\n1A3F\n7E6' : '17\n377\n755' });
baseTool('Binary Converter', 2, 'Binary'); baseTool('Hex Converter', 16, 'Hex'); baseTool('Octal Converter', 8, 'Octal');
def('Character Code Converter', 'Every character’s code in decimal, hex and binary.', s => ({ head: ['Char', 'DEC', 'HEX', 'BIN'], rows: A(s).slice(0, 400).map(c => { const cp = c.codePointAt(0); return [show(c), String(cp), cp.toString(16).toUpperCase(), cp.toString(2)]; }), ext: 'csv' }), [], { ex: 'Hi! ✓' });
def('Roman Numeral Converter', 'Numbers to Roman numerals and back — detected per line.', s => ML(s, l => { l = l.trim(); if (!l) return ''; return /^\d+$/.test(l) ? toRoman(+l) : String(fromRoman(l)); }), [], { ex: '2026\n14\nMCMXCIV\nXLII' });
def('Number to Words', 'Spells out numbers in English, one per line.', s => ML(s, n2w), [], { ex: '42\n1250\n-3.75\n1000000' });
def('Ordinal Number Generator', 'Turns numbers into ordinals: 1st, 2nd… or first, second…', (s, o) => ML(s, l => { l = l.trim().replace(/,/g, ''); if (!l) return ''; if (!/^\d+$/.test(l)) fail(`“${l}” isn’t a whole number.`); return o.st === '1st' ? ORD(+l) : ordWord(n2w(l)); }), [seg('st', 'Style', ['1st', 'first'])], { ex: '1\n2\n3\n11\n22\n101' });

// Reading & Language
def('Reading Time', 'How long your text takes to read silently.', (s, o) => T['Reading Time Calculator'].f(s, o), [num('wpm', 'Words per minute', 238)]);
def('Speaking Time', 'How long your text takes to say out loud.', (s, o) => T['Speaking Time Calculator'].f(s, o), [num('wpm', 'Words per minute', 150)]);
def('Flesch Reading Ease', '0–100: higher is easier. 60–70 is plain English.', s => { const t = ST(s); return { rows: [['Reading ease', t.fre.toFixed(1)], ['Verdict', freLabel(t.fre)], ['Words per sentence', t.avgs.toFixed(1)], ['Syllables per word', t.avgsyl.toFixed(2)]], note: HEUR }; });
def('Flesch-Kincaid Grade', 'Roughly the US school grade needed to follow your text.', s => { const t = ST(s); return { rows: [['Grade level', t.fk.toFixed(1)], ['Words per sentence', t.avgs.toFixed(1)], ['Syllables per word', t.avgsyl.toFixed(2)]], note: HEUR + ' Grade 7–9 suits most general readers.' }; });
def('Sentence Complexity', 'How long and layered your sentences are.', s => { const sen = SEN(s), lens = sen.map(x => W(x).length); const commas = sen.reduce((a, x) => a + (x.match(/[,;:]/g) || []).length, 0); return { rows: [['Sentences', N(sen.length)], ['Avg. length', (lens.reduce((a, b) => a + b, 0) / (sen.length || 1)).toFixed(1) + ' words'], ['Longest', Math.max(0, ...lens) + ' words'], ['Over 20 words', pct(lens.filter(x => x > 20).length, sen.length)], ['Clauses marks per sentence', (commas / (sen.length || 1)).toFixed(1)]], note: 'Heuristic: based on length and punctuation, not grammar parsing.' }; });
def('Word Complexity', 'How long and syllable-heavy your words are.', s => { const t = ST(s), w = [...new Set(t.wordsList.map(x => x.toLowerCase()))].sort((a, b) => syl(b) - syl(a) || b.length - a.length); return { rows: [['Complex words (3+ syllables)', N(t.complex) + ' · ' + pct(t.complex, t.words)], ['Avg. syllables per word', t.avgsyl.toFixed(2)], ['Avg. word length', t.avgw.toFixed(1) + ' chars'], ['Most complex', w.slice(0, 5).join(', ') || '—']], note: HEUR }; });
def('Vocabulary Density', 'How varied your vocabulary is.', s => { const t = ST(s), content = t.wordsList.filter(x => !STOP.has(x.toLowerCase())).length; return { rows: [['Lexical density', pct(content, t.words)], ['Unique words', N(t.uniq) + ' of ' + N(t.words)], ['Type-token ratio', t.words ? (t.uniq / t.words).toFixed(3) : '0']], note: 'Lexical density = share of words that aren’t common function words. Heuristic.' }; });
def('Unique Word Ratio', 'Unique words divided by total words.', s => { const t = ST(s); return { rows: [['Unique word ratio', t.words ? (t.uniq / t.words).toFixed(3) : '0'], ['Unique words', N(t.uniq)], ['Total words', N(t.words)]], note: 'Longer texts naturally score lower — compare texts of similar length.' }; });
def('Stop Word Counter', 'Counts common filler words (the, and, of…).', s => T['Stop Word Checker'].f(s));
def('Common Word Analyzer', 'Your most-used words, common ones included.', freq, [num('top', 'Show top', 25)]);

// Business Tools
def('Email Signature Generator', 'A tidy signature from your details, in plain text, Markdown or HTML.', (s, o) => { const lines = [o.name, [o.role, o.company].filter(Boolean).join(', '), o.phone, o.email, o.web].filter(Boolean); if (o.f === 'Plain text') return '—\n' + lines.join('\n'); if (o.f === 'Markdown') return `**${o.name}**  \n` + lines.slice(1).map(l => l === o.email ? `[${l}](mailto:${l})` : l === o.web ? `[${l}](https://${l.replace(/^https?:\/\//, '')})` : l).join('  \n'); const e = x => htmlE(x || '', false); return { text: `<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:13px;color:#222">\n  <tr><td style="font-weight:bold;font-size:14px">${e(o.name)}</td></tr>\n  <tr><td style="color:#666">${e([o.role, o.company].filter(Boolean).join(', '))}</td></tr>\n` + (o.phone ? `  <tr><td>${e(o.phone)}</td></tr>\n` : '') + (o.email ? `  <tr><td><a href="mailto:${e(o.email)}" style="color:#222">${e(o.email)}</a></td></tr>\n` : '') + (o.web ? `  <tr><td><a href="https://${e(o.web.replace(/^https?:\/\//, ''))}" style="color:#222">${e(o.web)}</a></td></tr>\n` : '') + '</table>', code: true, ext: 'html' }; }, [txt('name', 'Name', 'Maya Chen'), txt('role', 'Role', 'Head of Content'), txt('company', 'Company', 'Northwind'), txt('phone', 'Phone', '+1 415 555 0132'), txt('email', 'Email', 'maya@northwind.co'), txt('web', 'Website', 'northwind.co'), seg('f', 'Format', ['Plain text', 'Markdown', 'HTML'])], G);
def('Email Subject Length Checker', 'Checks a subject line — many inboxes cut off around 40–60 characters.', guide(20, 60, 'Email subjects.'), [], { ex: 'Your October writing report is ready 📈' });
def('Address Formatter', 'Turns one-line addresses into mailing-label blocks. One address per line.', (s, o) => L(s).filter(l => l.trim()).map(l => { const p = l.split(',').map(x => x.trim()).filter(Boolean); const out = o.st === 'One line' ? p.join(', ') : p.join('\n'); return o.up ? out.toUpperCase() : out; }).join(o.st === 'One line' ? '\n' : '\n\n'), [seg('st', 'Layout', ['Label block', 'One line']), bool('up', 'Postal uppercase')], { ex: 'Maya Chen, Northwind Co., 500 Market St, Suite 12, San Francisco, CA 94105, USA\nSam Patel, 21 Baker Street, London NW1 6XE, UK' });
def('Phone Number Formatter', 'Formats US/Canada 10-digit numbers consistently, one per line.', (s, o) => ML(s, l => { if (!l.trim()) return ''; let d = l.replace(/\D/g, ''); if (d.length === 11 && d[0] === '1') d = d.slice(1); if (d.length !== 10) return `⚠ ${l.trim()} — not a 10-digit US/Canada number, left as is`; const [a, b, c] = [d.slice(0, 3), d.slice(3, 6), d.slice(6)]; return { '(555) 123-4567': `(${a}) ${b}-${c}`, '555-123-4567': `${a}-${b}-${c}`, '555.123.4567': `${a}.${b}.${c}`, '+1 555 123 4567': `+1 ${a} ${b} ${c}`, 'E.164': `+1${d}` }[o.f]; }), [seg('f', 'Format', ['(555) 123-4567', '555-123-4567', '555.123.4567', '+1 555 123 4567', 'E.164'])], { ex: '4155550132\n(212) 555 0199\n+1-646-555-0100\n020 7946 0958' });
def('Meeting Notes Formatter', 'Sorts rough notes into decisions, action items and notes. Start lines with “action:”, “decision:” or “q:”.', (s, o) => { const sec = { d: [], a: [], q: [], n: [] }; L(s).forEach(l => { const t = stripMarker(l).trim(); if (!t) return; const m = t.match(/^(action|todo|to do|ai|decision|decided|agreed|question|q)\s*[:\-–]\s*(.+)$/i); if (!m) return sec.n.push(t); const k = m[1].toLowerCase(); (/^(action|todo|to do|ai)$/.test(k) ? sec.a : /^(decision|decided|agreed)$/.test(k) ? sec.d : sec.q).push(m[2]); }); const out = [`# ${o.title}` + (o.date ? ` — ${o.date}` : '')]; if (sec.d.length) out.push('\n## Decisions', ...sec.d.map(x => '- ' + x)); if (sec.a.length) out.push('\n## Action items', ...sec.a.map(x => '- [ ] ' + x)); if (sec.q.length) out.push('\n## Open questions', ...sec.q.map(x => '- ' + x)); if (sec.n.length) out.push('\n## Notes', ...sec.n.map(x => '- ' + x)); return { text: out.join('\n'), ext: 'md' }; }, [txt('title', 'Title', 'Weekly sync'), txt('date', 'Date', '')], { ex: 'launch moved to oct 14\ndecision: ship without dark mode\naction: Maya to update the brief\naction: Sam books the venue\nq: do we need a press kit?\nbudget is on track' });
def('Checklist Generator', 'Turns lines into a checklist.', (s, o) => { let i = 0; return ML(s, l => { const t = stripMarker(l).trim(); if (!t) return ''; return (o.num ? (++i) + '. ' : '') + o.st + ' ' + t; }); }, [seg('st', 'Box', ['☐', '- [ ]', '[ ]']), bool('num', 'Number items')], { ex: 'Draft the post\nAdd images\nProofread\nSchedule' });
def('Agenda Formatter', 'Turns “Topic — 15” lines into a timed agenda.', (s, o) => { const m0 = /^(\d{1,2}):(\d{2})$/.exec(o.start.trim()); if (!m0) fail('Start time should look like 09:00.'); let t = +m0[1] * 60 + +m0[2]; const hm = x => String(Math.floor(x / 60) % 24).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); const rows = L(s).filter(l => l.trim()).map(l => { const m = /^(.*?)(?:\s*[|,\-–—]\s*|\s+)(\d+)\s*(?:m|min|mins|minutes)?\s*$/i.exec(l.trim()); const topic = stripMarker(m ? m[1] : l).trim(), d = m ? +m[2] : (+o.def || 10); const r = `${hm(t)}–${hm(t + d)}  ${topic} (${d} min)`; t += d; return r; }); return rows.join('\n') + `\n\nEnds at ${hm(t)}`; }, [txt('start', 'Starts at', '09:00'), num('def', 'Default minutes', 10)], { ex: 'Welcome — 5\nMetrics review — 15\nLaunch plan | 25\nQ&A 10\nWrap up' });
def('Invoice Text Formatter', 'Turns “item, qty, price” lines into an aligned plain-text invoice.', (s, o) => { const cur = o.cur || ''; const items = [], bad = []; L(s).filter(l => l.trim()).forEach(l => { const p = l.split(/\s*[,|\t]\s*/); const q = parseFloat(p[1]), pr = parseFloat((p[2] || '').replace(/[^\d.\-]/g, '')); if (p.length < 3 || isNaN(q) || isNaN(pr)) bad.push(l); else items.push([p[0], q, pr]); }); if (!items.length) fail('Use one item per line: description, quantity, price.'); const money = x => cur + x.toFixed(2); const w = Math.max(11, ...items.map(i => A(i[0]).length)); const line = (a, b, c, d) => a.padEnd(w) + '  ' + b.padStart(5) + '  ' + c.padStart(10) + '  ' + d.padStart(11); const sub = items.reduce((a, i) => a + i[1] * i[2], 0), tax = sub * (+o.tax || 0) / 100; const out = [line('Description', 'Qty', 'Price', 'Amount'), '-'.repeat(w + 32)].concat(items.map(i => line(i[0], String(i[1]), money(i[2]), money(i[1] * i[2]))), ['-'.repeat(w + 32), line('Subtotal', '', '', money(sub))]); if (+o.tax) out.push(line(`Tax ${+o.tax}%`, '', '', money(tax))); out.push(line('Total', '', '', money(sub + tax))); if (bad.length) out.push('', '⚠ Skipped: ' + bad.join(' / ')); return out.join('\n'); }, [txt('cur', 'Currency', '$'), num('tax', 'Tax %', 8.5)], { ex: 'Copy editing, 6, 85\nHeadline pack, 1, 240\nRush fee, 1, 50' });
def('Quote Formatter', 'Formats a quote with proper marks and attribution.', (s, o) => { const t = s.trim().replace(/^["“'‘]+|["”'’]+$/g, ''); if (!t) return ''; const by = o.by.trim() ? ` — ${o.by.trim()}` : ''; return o.st === 'Blockquote' ? t.split('\n').map(l => '> ' + l).join('\n') + (by ? '\n>\n>' + by : '') : o.st === 'Pull quote' ? `“${t.toUpperCase()}”${by ? '\n\n' + by.trim().toUpperCase() : ''}` : `“${t}”${by}`; }, [txt('by', 'Attribution', 'Ursula K. Le Guin'), seg('st', 'Style', ['Curly quotes', 'Blockquote', 'Pull quote'])], { ex: 'The creative adult is the child who has survived.' });

// Student Tools
def('Essay Word Counter', 'Tracks your essay against a word target.', (s, o) => { const t = ST(s), goal = Math.max(1, +o.goal || 500); return { meter: { used: t.words, limit: goal, over: t.words > goal * 1.1, label: 'words' }, rows: [['Words', N(t.words) + ' of ' + N(goal)], [t.words >= goal ? 'Over target by' : 'Still to write', N(Math.abs(goal - t.words))], ['Paragraphs', N(t.par)], ['Avg. sentence', t.avgs.toFixed(1) + ' words'], ['Reading time', dur(t.read)]], note: 'Most markers allow ±10% of the target — check your brief.' }; }, [num('goal', 'Target words', 500)]);
def('Notes Formatter', 'Turns messy notes into tidy bullets with headings.', (s, o) => L(s).map(l => { const t = l.replace(/\s+/g, ' ').trim(); if (!t) return ''; if (/:$/.test(t) || (t.length > 3 && t === t.toUpperCase() && /\p{L}/u.test(t))) return '\n## ' + titleCase(t.replace(/:$/, '')); const indent = /^\s{2,}|\t/.test(l) ? '  ' : ''; return indent + o.b + ' ' + cap1(stripMarker(t)); }).join('\n').replace(/\n{3,}/g, '\n\n').trim(), [seg('b', 'Bullet', ['-', '•', '*'])], { ex: 'CELL BIOLOGY\nmitochondria   make energy (ATP)\n  * double membrane\nribosomes build proteins\nexam topics:\nosmosis\n- diffusion vs active transport' });
def('Study Time Calculator', 'Estimates how long to study a text: one careful read plus review passes.', (s, o) => { const w = W(s).length, wpm = Math.max(30, +o.wpm || 150), p = Math.max(0, +o.p || 0); const first = w / wpm * 60, rev = w / (wpm * 2) * 60 * p, notes = o.notes ? first * 0.5 : 0; return { rows: [['Total study time', dur(first + rev + notes)], ['Careful first read', dur(first)], [`Review passes (×${p}, at double pace)`, dur(rev)], ['Note-taking', o.notes ? dur(notes) : '—'], ['Words', N(w)]], note: 'A planning estimate — dense or technical material takes longer.' }; }, [num('wpm', 'Study pace (wpm)', 150), num('p', 'Review passes', 2), bool('notes', 'Include note-taking', true)]);
def('Text → Outline', 'Turns indented lines into a numbered outline.', (s, o) => { const cnt = []; return L(s).filter(l => l.trim()).map(l => { const ind = (l.match(/^[\t ]*/)[0].replace(/\t/g, '  ').length / 2) | 0; cnt.length = ind + 1; cnt[ind] = (cnt[ind] || 0) + 1; for (let i = 0; i < ind; i++) cnt[i] = cnt[i] || 1; const t = stripMarker(l).trim(); let mk; if (o.st === 'Decimal') mk = cnt.slice(0, ind + 1).join('.') + '.'; else if (o.st === 'Bullets') mk = ['•', '◦', '▪'][ind % 3]; else { const n = cnt[ind]; mk = [toRoman(Math.min(n, 3999)), String.fromCharCode(64 + ((n - 1) % 26) + 1), String(n), String.fromCharCode(96 + ((n - 1) % 26) + 1)][ind % 4] + '.'; } return '   '.repeat(ind) + mk + ' ' + t; }).join('\n'); }, [seg('st', 'Style', ['Decimal', 'Classic', 'Bullets'])], { ex: 'Introduction\n  Why plain text matters\n  What this essay covers\nHistory\n  Typewriters\n  Early computers\n    ASCII\nConclusion' });
def('Outline → Text', 'Turns an outline back into paragraphs — each top-level point starts one.', s => { const paras = []; L(s).forEach(l => { if (!l.trim()) return; const ind = l.match(/^[\t ]*/)[0].length; let t = stripMarker(l.trim()).replace(/^(?:\d+\.)+\s*|^[IVXLC]+\.\s+|^[A-Z]\.\s+/, '').trim(); if (!/[.!?]$/.test(t)) t += '.'; t = cap1(t); if (ind === 0 || !paras.length) paras.push([t]); else paras[paras.length - 1].push(t); }); return paras.map(p => p.join(' ')).join('\n\n'); }, [], { ex: '1. Plain text lasts\n   1.1 It opens anywhere\n   1.2 It survives migrations\n2. Tools should be quiet\n   2.1 Fast feedback\n   2.2 No sign-up' });
def('Citation Formatter', 'Builds a book citation in APA, MLA or Chicago from its parts.', (s, o) => { const a = o.a.trim(), t = o.t.trim(), y = o.y.trim(), p = o.p.trim(), u = o.u.trim(); if (!t) fail('A title is needed.'); const j = (...x) => x.filter(Boolean).join(' '); if (o.st === 'APA 7') return j(a ? a.replace(/\.$/, '') + '.' : '', y ? `(${y}).` : '(n.d.).', t + '.', p ? p + '.' : '', u); if (o.st === 'MLA 9') return j(a ? a.replace(/\.$/, '') + '.' : '', t + '.', [p, y].filter(Boolean).join(', ') + (p || y ? '.' : ''), u); return j(a ? a.replace(/\.$/, '') + '.' : '', y ? y + '.' : '', t + '.', p ? p + '.' : '', u); }, [txt('a', 'Author (Last, First)', 'Le Guin, Ursula K.'), txt('t', 'Title', 'The Language of the Night'), txt('y', 'Year', '1979'), txt('p', 'Publisher', 'Putnam'), txt('u', 'URL / DOI', ''), seg('st', 'Style', ['APA 7', 'MLA 9', 'Chicago'])], Object.assign({ note: 'Titles should be italic in print — add that in your editor.' }, G));
def('Bibliography Formatter', 'Sorts, de-duplicates and optionally numbers your references.', (s, o) => { let r = L(s).map(x => x.trim()).filter(Boolean); if (o.dd) r = [...new Map(r.map(x => [x.toLowerCase().replace(/\s+/g, ' '), x])).values()]; if (o.sort) r.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })); return r.map((x, i) => (o.num ? `[${i + 1}] ` : '') + x).join('\n\n'); }, [bool('sort', 'Sort A→Z', true), bool('dd', 'Remove duplicates', true), bool('num', 'Number them')], { ex: 'Strunk, W. (1918). The Elements of Style.\nLe Guin, U. K. (1979). The Language of the Night. Putnam.\nOrwell, G. (1946). Politics and the English Language.\nstrunk, w. (1918). The Elements of Style.' });
def('Flashcard Formatter', 'Turns “term - definition” lines into flashcards for Anki, CSV or Q&A.', (s, o) => { const cards = L(s).filter(l => l.trim()).map(l => { const m = l.match(/^(.+?)\s*(?:\t| - | – | — |: | = )\s*(.+)$/); return m ? [m[1].trim(), m[2].trim()] : [l.trim(), '']; }); if (o.f === 'Tab-separated (Anki)') return { text: cards.map(c => c.join('\t')).join('\n'), ext: 'txt' }; if (o.f === 'CSV') return { text: cards.map(c => c.map(csvCell).join(',')).join('\n'), ext: 'csv' }; if (o.f === 'Markdown table') return { text: '| Term | Definition |\n| --- | --- |\n' + cards.map(c => `| ${c[0].replace(/\|/g, '\\|')} | ${c[1].replace(/\|/g, '\\|')} |`).join('\n'), ext: 'md' }; return cards.map(c => `Q: ${c[0]}\nA: ${c[1] || '—'}`).join('\n\n'); }, [seg('f', 'Output', ['Q & A', 'Tab-separated (Anki)', 'CSV', 'Markdown table'])], { ex: 'Osmosis - movement of water across a membrane\nMitochondria: where cells make ATP\nRibosome — builds proteins' });

// Advanced Tools
def('Text Deduplicator', 'Removes duplicate lines, with control over case and spacing.', (s, o) => T['Remove Duplicate Lines'].f(s, o), [bool('cs', 'Match case'), bool('trim', 'Ignore surrounding spaces', true)], { diff: true });
def('Text Normalizer', 'One pass to tidy text: Unicode form, spaces, quotes and dashes.', (s, o) => { let t = s; if (o.nfc) t = t.normalize('NFC'); if (o.inv) t = t.replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, ''); if (o.ws) t = T['Normalize Whitespace'].f(t); if (o.q) t = t.replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'"); if (o.d) t = t.replace(/[‐‑‒–—―]/g, '-'); return t; }, [bool('nfc', 'Unicode NFC', true), bool('inv', 'Strip invisible', true), bool('ws', 'Whitespace', true), bool('q', 'Straight quotes'), bool('d', 'Plain dashes')], { diff: true });
def('Line Ending Converter', 'Converts line endings between LF (Mac/Linux), CRLF (Windows) and CR.', (s, o) => { const lf = (s.match(/(?<!\r)\n/g) || []).length, crlf = (s.match(/\r\n/g) || []).length, cr = (s.match(/\r(?!\n)/g) || []).length; const t = s.replace(/\r\n|\r|\n/g, { LF: '\n', CRLF: '\r\n', CR: '\r' }[o.to]); return { text: t, note: `Found ${lf} LF · ${crlf} CRLF · ${cr} CR → all ${o.to}. Download to keep the exact endings.` }; }, [seg('to', 'Convert to', ['LF', 'CRLF', 'CR'])]);
def('Tabs ↔ Spaces', 'Converts leading tabs to spaces or spaces to tabs.', (s, o) => { const n = Math.max(1, +o.n || 4); return o.dir === 'Tabs → Spaces' ? s.replace(/\t/g, ' '.repeat(n)) : ML(s, l => l.replace(/^ +/, m => '\t'.repeat(Math.floor(m.length / n)) + ' '.repeat(m.length % n))); }, [seg('dir', 'Direction', ['Tabs → Spaces', 'Spaces → Tabs']), num('n', 'Tab width', 4)], { ex: 'function hello() {\n\tif (ready) {\n\t\treturn "hi";\n\t}\n}' });
const smart = s => s.replace(/(^|[\s(\[{\u2014-])"/g, '$1“').replace(/"/g, '”').replace(/(^|[\s(\[{\u2014-])'/g, '$1‘').replace(/'/g, '’');
def('Smart Quotes Converter', 'Straight quotes to curly “smart” quotes, or back.', (s, o) => o.dir === 'Straight → Curly' ? smart(s) : s.replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'"), [seg('dir', 'Direction', ['Straight → Curly', 'Curly → Straight'])], { ex: 'She said "it\'s done" and we said \'finally\'.' });
def('Typography Converter', 'Fixes typewriter habits: -- to —, ... to …, (c) to ©, quotes to curly.', s => smart(s.replace(/\.\.\./g, '…').replace(/ -- /g, ' — ').replace(/--/g, '—').replace(/\(c\)/gi, '©').replace(/\(r\)/gi, '®').replace(/\(tm\)/gi, '™').replace(/->/g, '→').replace(/<-/g, '←').replace(/(\d) ?x ?(\d)/g, '$1×$2')), [], { ex: '"Wait..." she said -- it\'s 1920x1080 (c) 2026 -> done', diff: true });
def('Control Character Detector', 'Finds control characters (NUL, BEL, ESC…) that can break files and forms.', s => inspect(s, c => { const cp = c.codePointAt(0); return (cp < 32 && cp !== 10 && cp !== 13 && cp !== 9) || (cp >= 127 && cp < 160); }, 'No control characters found.'), [], { ex: 'Normal text\u0007 with a bell, an escape\u001B and a null\u0000 byte.' });
def('Character Frequency', 'How often each character appears.', (s, o) => { const m = new Map(); let total = 0; for (let c of s) { if (!o.sp && /\s/.test(c)) continue; if (!o.cs) c = c.toLowerCase(); m.set(c, (m.get(c) || 0) + 1); total++; } return { head: ['Char', 'Count', 'Share'], rows: [...m].sort((a, b) => b[1] - a[1]).map(([c, n]) => [show(c), N(n), pct(n, total)]), note: N(total) + ' characters counted', ext: 'csv' }; }, [bool('cs', 'Match case'), bool('sp', 'Include spaces')]);
def('Text Entropy', 'Shannon entropy — how unpredictable your characters are.', s => { const m = new Map(), a = A(s); a.forEach(c => m.set(c, (m.get(c) || 0) + 1)); let h = 0; m.forEach(n => { const p = n / a.length; h -= p * Math.log2(p); }); return { rows: [['Entropy', h.toFixed(3) + ' bits per character'], ['Total information', N(Math.round(h * a.length)) + ' bits'], ['Different characters', N(m.size)], ['Maximum for this set', (m.size ? Math.log2(m.size) : 0).toFixed(3) + ' bits']], note: 'English prose is usually around 4–4.5 bits per character; random strings are higher.' }; });
def('Text Checksum', 'SHA-256, SHA-1, SHA-512, CRC32 and FNV-1a of your text (UTF-8).', async s => ({ rows: [['SHA-256', await sha('SHA-256', s)], ['SHA-1', await sha('SHA-1', s)], ['SHA-512', await sha('SHA-512', s)], ['CRC32', crc32(bytes(s))], ['FNV-1a (32-bit)', fnv(s).toString(16).padStart(8, '0')]], copyRows: true, note: 'Click a row to copy. Hashes are computed on your device.' }));
def('Text Fingerprint', 'A fingerprint that ignores case, spacing and punctuation — so near-identical copies match.', async s => { const norm = W(s).map(x => x.toLowerCase()).join(' '); const w = norm.split(' ').filter(Boolean), v = new Array(32).fill(0); for (let i = 0; i < Math.max(1, w.length - 2); i++) { const h = fnv(w.slice(i, i + 3).join(' ')); for (let b = 0; b < 32; b++) v[b] += (h >>> b) & 1 ? 1 : -1; } let sim = 0; if (w.length) for (let b = 0; b < 32; b++) if (v[b] > 0) sim |= (1 << b); return { rows: [['Normalized SHA-256', await sha('SHA-256', norm)], ['SimHash (32-bit)', (sim >>> 0).toString(16).padStart(8, '0')], ['Words used', N(w.length)]], copyRows: true, note: 'Same text with different spacing, case or punctuation gets the same SHA-256. Similar texts get similar SimHashes.' }; });

// ---------- examples ----------
const PROSE = 'Plain text is the most durable format we have. It opens on every machine, survives every migration, and asks nothing of the reader.\n\nWriters draft in it. Developers configure systems with it. Researchers archive decades of data in it. Yet most text tools treat it as an afterthought — a box to paste into, a button to press.\n\nA good tool should feel like an instrument: immediate, precise, and quiet until you need it.';
const EX = {
  'Writing & Counting': PROSE, 'Reading & Language': PROSE, 'SEO Tools': PROSE, 'Student Tools': PROSE, 'Find & Replace': PROSE, 'Text Compare': AEX,
  'Text Case': 'the quick brown fox jumps over the lazy dog\nuser account settings\nparse HTML response body',
  'Text Cleaner': '  Hello   world!!  This    line has   extra spaces.\n\n\nhello world!! 🚀 Visit https://example.com or email team@example.com\n<p>Some <b>HTML</b> markup</p>\t#launch @studio 42\n\nDuplicate line\nDuplicate line\nzero\u200Bwidth here',
  'Text Formatter': 'banana\nApple\ncherry\n  date\nelderberry\n\nfig',
  'Text Converter': 'Hello, world!', 'Encoding & Decoding': 'Meet me at the old library at noon.',
  'Extractors': 'Reach Maya Chen at maya.chen@northwind.co or +1 (415) 555-0132.\nOur docs live at https://docs.northwind.co/start and www.northwind.co/blog.\nKickoff is on 2026-10-14; the review follows on March 3, 2027.\nOrder 4471 totals 1,249.50 across 12 items. Tag us @northwind #buildinpublic #writing.\nShe said "ship it on Friday" and meant it.',
  'Unicode & Symbols': 'Café “quotes” — zero\u200Bwidth and no\u00A0break space ✓',
  'Emoji Tools': 'Launch day 🚀🚀 Thanks team 🙌 ❤️ Coffee first ☕ then ship 🎉 👩‍💻',
  'Social Media': 'Shipping day. 🚀\n\nWe rebuilt our editor from scratch — faster, quieter, and it never leaves your browser.\n\nTry it and tell us what breaks: https://texttrendz.app @texttrendz #buildinpublic #writing',
  'Developer Tools': JEX, 'Number & Code': '42\n255\n2026', 'Business Tools': PROSE,
  'Advanced Tools': 'Café  “smart”  quotes…\r\nzero\u200Bwidth here\r\nDuplicate line\nDuplicate line'
};

window.TTE = {
  has: n => !!T[n],
  diff: (a, b, m) => diff(a, b, m || 'Characters'),
  spec: n => T[n],
  names: () => Object.keys(T),
  defaults: n => Object.fromEntries((T[n] ? T[n].o : []).map(x => [x.k, x.v])),
  example: (n, cat) => (T[n] && T[n].ex) || EX[cat] || PROSE,
  run: (n, s, o) => { const t = T[n]; if (!t) fail('This tool isn’t available.'); if (s.length > 500000) fail('That’s over 500,000 characters — try splitting it into smaller pieces.'); return t.f(s, Object.assign({}, window.TTE.defaults(n), o || {})); }
};
})();
