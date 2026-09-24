// Text Trendz app data: categories, platforms, quick actions, and the pure
// stats/search helpers shared by both homepage layouts. No DOM here.
(function () {
'use strict';

const SAMPLE = "Plain text is the most honest format there is. It opens anywhere, it lasts for decades, and it never asks you to install anything.\n\nPaste your own words here — a caption, an essay, a product description — and watch the numbers move as you type.\n\n\nEverything happens right in your browser.   Nothing is uploaded. 🚀\nEverything happens right in your browser.   Nothing is uploaded. 🚀\n\nhttps://texttrendz.app #writing #texttools @texttrendz";

const PLATFORMS = [
  { id: 'x', name: 'X post', limit: 280, mode: 'x' },
  { id: 'threads', name: 'Threads', limit: 500 },
  { id: 'bsky', name: 'Bluesky', limit: 300, mode: 'g' },
  { id: 'igc', name: 'Instagram caption', limit: 2200 },
  { id: 'igb', name: 'Instagram bio', limit: 150 },
  { id: 'tt', name: 'TikTok caption', limit: 4000 },
  { id: 'li', name: 'LinkedIn post', limit: 3000 },
  { id: 'ytt', name: 'YouTube title', limit: 100 },
  { id: 'ytd', name: 'YouTube description', limit: 5000 },
  { id: 'fb', name: 'Facebook post', limit: 63206 }
];

const CATS = [
  ['Writing & Counting', 'Word Counter|Character Counter|Character Counter Without Spaces|Sentence Counter|Paragraph Counter|Line Counter|Word Frequency Counter|Unique Word Counter|Duplicate Word Counter|Reading Time Calculator|Speaking Time Calculator|Average Word Length|Average Sentence Length|Letter Counter|Number Counter|Space Counter|Punctuation Counter|Syllable Counter'],
  ['Text Case', 'UPPERCASE|lowercase|Title Case|Sentence case|Capitalized Case|Toggle Case|aLtErNaTiNg CaSe|camelCase|PascalCase|snake_case|kebab-case|CONSTANT_CASE|dot.case|Header-Case'],
  ['Text Cleaner', 'Remove Extra Spaces|Remove Empty Lines|Remove Duplicate Lines|Remove Duplicate Words|Remove Punctuation|Remove Numbers|Remove Special Characters|Remove Emojis|Remove HTML Tags|Remove Markdown|Remove Line Breaks|Remove URLs|Remove Emails|Remove Hashtags|Remove Mentions|Normalize Whitespace|Remove Invisible Characters'],
  ['Text Formatter', 'Indent / Unindent|Add Prefix|Add Suffix|Number Lines|Remove Line Numbers|Join Lines|Split Lines|Wrap Text|Unwrap Text|Sort Lines|Reverse Lines|Add Quotes|Add Brackets|Text to Bullet List|Text to Numbered List|Normalize Paragraphs'],
  ['Text Converter', 'Text ↔ ASCII|Text ↔ Binary|Text ↔ Hex|Text ↔ Octal|Text ↔ Morse|Text ↔ Base64|Text ↔ URL Encoded|Text ↔ HTML Entities|Text ↔ Unicode|Number → Words|Words → Number|Number ↔ Roman'],
  ['Find & Replace', 'Find and Replace|Regex Find and Replace|Whole Word Replace|Multi-Replace|Match Highlighter'],
  ['Text Generator', 'Lorem Ipsum Generator|Random Word Generator|Random Sentence Generator|Random Paragraph Generator|Random String Generator|Random Number Generator|UUID Generator|Slug Generator|Username Generator|Test String Generator'],
  ['Text Compare', 'Text Compare|Character Diff|Word Diff|Line Diff|Sentence Diff'],
  ['Extractors', 'Extract Emails|Extract URLs|Extract Phone Numbers|Extract Numbers|Extract Dates|Extract Hashtags|Extract Mentions|Extract Keywords|Extract Quoted Text|Extract Text Between Characters|Extract Text Between Tags|Extract Capitalized Words'],
  ['Encoding & Decoding', 'Base64|URL Encoder / Decoder|HTML Entity Encoder|Unicode Escape|ROT13|ROT47|Caesar Cipher|Atbash|Morse Code|Bacon Cipher'],
  ['Unicode & Symbols', 'Unicode Inspector|Unicode Normalizer|Symbol Picker|Math Symbols|Currency Symbols|Arrow Symbols|Checkmark Symbols|Copyright & Trademark|Invisible Character Detector|Zero-Width Detector|Non-ASCII Detector'],
  ['Emoji Tools', 'Emoji Picker|Emoji Search|Emoji Counter|Emoji Extractor|Emoji Remover|Emoji → Text|Emoji Inspector'],
  ['SEO Tools', 'Keyword Density Checker|Title Length Checker|Meta Description Length|Heading Analyzer|Sentence Length Analyzer|Readability Checker|URL Slug Generator|Keyword Occurrence Finder|Stop Word Checker|Duplicate Content Comparator'],
  ['Social Media', 'X Character Counter|Threads Counter|Bluesky Counter|Instagram Caption Counter|Instagram Bio Counter|TikTok Caption Counter|LinkedIn Post Counter|YouTube Title Counter|YouTube Description Counter|Facebook Post Counter|Hashtag Counter|Unicode Font Generator|Small Text Generator|Strikethrough Generator'],
  ['Developer Tools', 'JSON Formatter|JSON Validator|JSON Minifier|JSON → CSV|CSV → JSON|XML Formatter|JSON → YAML|SQL Formatter|Regex Tester|Regex Escape|String Escape / Unescape|HTML Escape|CSS Minifier|HTML Minifier'],
  ['Number & Code', 'Number Base Converter|Binary Converter|Hex Converter|Octal Converter|Character Code Converter|Roman Numeral Converter|Number to Words|Ordinal Number Generator'],
  ['Reading & Language', 'Reading Time|Speaking Time|Flesch Reading Ease|Flesch-Kincaid Grade|Sentence Complexity|Word Complexity|Vocabulary Density|Unique Word Ratio|Stop Word Counter|Common Word Analyzer'],
  ['Business Tools', 'Email Signature Generator|Email Subject Length Checker|Address Formatter|Phone Number Formatter|Meeting Notes Formatter|Checklist Generator|Agenda Formatter|Invoice Text Formatter|Quote Formatter'],
  ['Student Tools', 'Essay Word Counter|Notes Formatter|Study Time Calculator|Text → Outline|Outline → Text|Citation Formatter|Bibliography Formatter|Flashcard Formatter'],
  ['Advanced Tools', 'Text Deduplicator|Text Normalizer|Line Ending Converter|Tabs ↔ Spaces|Smart Quotes Converter|Typography Converter|Control Character Detector|Character Frequency|Text Entropy|Text Checksum|Text Fingerprint']
];

const LIVE = {};
['Word Counter', 'Character Counter', 'Character Counter Without Spaces', 'Sentence Counter', 'Paragraph Counter', 'Line Counter',
 'Unique Word Counter', 'Reading Time Calculator', 'Speaking Time Calculator', 'Average Word Length', 'Average Sentence Length',
 'Punctuation Counter', 'Reading Time', 'Speaking Time', 'Essay Word Counter'].forEach(n => LIVE[n] = { mode: 'count' });
['X Character Counter', 'Threads Counter', 'Bluesky Counter', 'Instagram Caption Counter', 'Instagram Bio Counter',
 'TikTok Caption Counter', 'LinkedIn Post Counter', 'YouTube Title Counter', 'YouTube Description Counter',
 'Facebook Post Counter', 'Title Length Checker'].forEach(n => LIVE[n] = { mode: 'social' });

const POPULAR = [
  ['Word Counter', 'Writing & Counting'], ['Character Counter', 'Writing & Counting'],
  ['X Character Counter', 'Social Media'], ['Instagram Caption Counter', 'Social Media'],
  ['Remove Duplicate Lines', 'Text Cleaner'], ['Title Case', 'Text Case'],
  ['Reading Time Calculator', 'Writing & Counting'], ['Remove Extra Spaces', 'Text Cleaner']
];

const SYN = { letters: ['charact', 'letter'], letter: ['charact', 'letter'], chars: ['charact'], capital: ['case', 'upper', 'capital'], caps: ['upper', 'case'], spaces: ['space'], dupes: ['duplicate', 'dedup'], dups: ['duplicate', 'dedup'], tweet: ['x '], twitter: ['x '], insta: ['instagram'], ig: ['instagram'], yt: ['youtube'], diff: ['diff', 'compare'], strip: ['remove'], delete: ['remove'], b64: ['base64'], small: ['small', 'lower'] };
const STOPQ = new Set(['make', 'a', 'the', 'to', 'my', 'text', 'tool', 'tools', 'online', 'free', 'for', 'of', 'in']);

// ---------- quick actions (case / clean, no tool open) ----------
const TF = {
  upper: s => s.toUpperCase(),
  lower: s => s.toLowerCase(),
  title: s => {
    const small = new Set('a an and as at but by for from in into nor of on or per the to vs via with'.split(' '));
    let first = true;
    return s.toLowerCase().replace(/([\p{L}\p{N}'’]+)|([^\p{L}\p{N}'’]+)/gu, (m, w, sep) => {
      if (sep) { if (/[\n:.!?—]/.test(sep)) first = true; return sep; }
      const out = first || !small.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w;
      first = false; return out;
    });
  },
  sentence: s => s.toLowerCase().replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\bi\b/g, 'I'),
  cap: s => s.toLowerCase().replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()),
  toggle: s => Array.from(s).map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''),
  alt: s => { let i = 0; return Array.from(s).map(c => /\p{L}/u.test(c) ? (i++ % 2 ? c.toUpperCase() : c.toLowerCase()) : c).join(''); },
  camel: s => { const w = idWords(s); return w.map((x, i) => i ? x.charAt(0).toUpperCase() + x.slice(1) : x).join(''); },
  snake: s => idWords(s).join('_'),
  kebab: s => idWords(s).join('-'),
  tidy: s => s.replace(/[ \t ]{2,}/g, ' ').replace(/^[ \t]+|[ \t]+$/gm, ''),
  empty: s => s.split(/\r?\n/).filter(l => l.trim()).join('\n'),
  dedupe: s => { const seen = new Set(); return s.split(/\r?\n/).filter(l => { const k = l.trim(); if (!k) return true; if (seen.has(k)) return false; seen.add(k); return true; }).join('\n'); },
  emoji: s => s.replace(/\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}]*/gu, '').replace(/[ \t]+$/gm, ''),
  urls: s => s.replace(/\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+/gi, ''),
  tags: s => s.replace(/(^|\s)[#@][\p{L}\p{N}_.]+/gu, '$1')
};
function idWords(s) { return s.split(/\r?\n/)[0].replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2').split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(w => w.toLowerCase()); }
const CLEAN_OPTS = [['tidy', 'Extra spaces'], ['empty', 'Empty lines'], ['dedupe', 'Duplicate lines'], ['emoji', 'Emoji'], ['urls', 'Links'], ['tags', 'Hashtags & mentions']];
function runClean(s, clean) { for (const [k] of CLEAN_OPTS) if (clean[k]) s = TF[k](s); return s; }

// ---------- stats & meters ----------
function words(s) { return s.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []; }
function stats(s) {
  const w = words(s);
  const sen = (s.replace(/\s+/g, ' ').match(/[^.!?…]+(?:[.!?…]+|$)/g) || []).filter(x => /[\p{L}\p{N}]/u.test(x)).length;
  const letters = (s.match(/[\p{L}\p{N}]/gu) || []).length;
  return {
    words: w.length, chars: Array.from(s).length, nos: Array.from(s.replace(/\s/g, '')).length, sen,
    par: s.split(/\n\s*\n/).filter(p => p.trim()).length, lines: s ? s.split(/\r\n|\r|\n/).length : 0,
    uniq: new Set(w.map(x => x.toLowerCase())).size, read: Math.round(w.length / 238 * 60), speak: Math.round(w.length / 150 * 60),
    punct: (s.match(/\p{P}/gu) || []).length, avgw: w.length ? letters / w.length : 0, avgs: sen ? w.length / sen : 0
  };
}
function n(v) { return Math.round(v || 0).toLocaleString('en-US'); }
function dur(sec) { sec = Math.round(sec || 0); return sec < 60 ? sec + ' sec' : Math.floor(sec / 60) + ' min ' + (sec % 60 ? (sec % 60) + ' sec' : ''); }
function xCount(s) {
  const t = s.replace(/https?:\/\/[^\s]+/g, 'x'.repeat(23));
  const segs = typeof Intl !== 'undefined' && Intl.Segmenter ? Array.from(new Intl.Segmenter().segment(t), x => x.segment) : Array.from(t);
  let c = 0;
  for (const g of segs) {
    const cp = g.codePointAt(0);
    if (/\p{Extended_Pictographic}/u.test(g)) c += 2;
    else if (cp <= 0x10FF || (cp >= 0x2000 && cp <= 0x200D) || (cp >= 0x2010 && cp <= 0x201F) || (cp >= 0x2032 && cp <= 0x2037)) c += 1;
    else c += 2;
  }
  return c;
}
function graphemes(s) { return typeof Intl !== 'undefined' && Intl.Segmenter ? Array.from(new Intl.Segmenter().segment(s)).length : Array.from(s).length; }
function meters(s) {
  return PLATFORMS.map(p => {
    const used = p.mode === 'x' ? xCount(s) : p.mode === 'g' ? graphemes(s) : Array.from(s).length;
    const over = used > p.limit;
    return {
      id: p.id, name: p.name, used, limit: p.limit,
      pct: Math.min(100, used / p.limit * 100),
      over,
      remLabel: over ? n(used - p.limit) + ' over' : n(p.limit - used) + ' left'
    };
  });
}

// ---------- search / index ----------
let _all = null;
function allTools() {
  if (!_all) { _all = []; CATS.forEach(([cat, list]) => list.split('|').forEach(name => _all.push({ name, cat, hay: (name + ' ' + cat).toLowerCase() }))); }
  return _all;
}
function catOf(name) { const c = CATS.find(([cat, list]) => list.split('|').includes(name)); return c ? c[0] : ''; }
function match(t, q) {
  const toks = q.toLowerCase().split(/\s+/).filter(x => x && !STOPQ.has(x));
  if (!toks.length) return q.trim() ? 0 : 1;
  let score = 0;
  for (const tk of toks) {
    const alts = SYN[tk] ? [tk, ...SYN[tk]] : [tk];
    let hit = 0;
    for (const a of alts) {
      const name = ' ' + t.name.toLowerCase() + ' ';
      if (name.includes(' ' + a)) hit = Math.max(hit, 10); else if (name.includes(a)) hit = Math.max(hit, 6); else if (t.hay.includes(a)) hit = Math.max(hit, 3);
    }
    if (!hit) return 0;
    score += hit;
  }
  return score + (LIVE[t.name] ? 1 : 0);
}
function searchTools(q, limit) {
  if (!q.trim()) return [];
  return allTools().map(t => [match(t, q), t]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, limit || 8).map(x => x[1]);
}
function filteredCats(q) {
  const query = q.trim();
  return CATS.map(([cat, list], i) => {
    const catHit = query && cat.toLowerCase().includes(query.toLowerCase());
    const tools = list.split('|').filter(name => !query || catHit || match({ name, hay: (name + ' ' + cat).toLowerCase() }, query) > 0);
    return { num: String(i + 1).padStart(2, '0'), name: cat, count: tools.length, tools };
  }).filter(c => c.tools.length);
}

window.TTData = {
  SAMPLE, PLATFORMS, CATS, LIVE, POPULAR, TF, CLEAN_OPTS,
  runClean, stats, n, dur, meters, allTools, catOf, match, searchTools, filteredCats
};
})();
