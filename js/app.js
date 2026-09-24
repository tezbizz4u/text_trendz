// Text Trendz — app shell: state, rendering and events for both homepage layouts.
(function () {
'use strict';
const D = window.TTData;
const E = window.TTE;

// ---------------------------------------------------------------- state ---
const state = {
  text: D.SAMPLE,
  layout: localStorage.getItem('tt.layout') === 'broadsheet' ? 'broadsheet' : 'workbench',
  theme: localStorage.getItem('tt.theme') || null,
  accent: localStorage.getItem('tt.accent') || 'vermilion',
  tool: null,
  opts: {},
  nonce: 0,
  q: '', qFocus: false, qSel: 0,
  idxQ: '',
  mode: 'count',
  clean: { tidy: true, empty: true, dedupe: true, emoji: false, urls: false, tags: false },
  flash: ''
};
let hist = [];
let lastExample = null;
let flashTimer = null;
let memo = null; // {key, res, err, pending, changes}
let toolDebounce = null;

// ------------------------------------------------------------- dom refs ---
const $ = id => document.getElementById(id);
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

// ----------------------------------------------------------------- init ---
function init() {
  document.documentElement.setAttribute('data-accent', state.accent);
  if (state.theme) document.documentElement.setAttribute('data-theme', state.theme);
  $('workbench-root').hidden = state.layout !== 'workbench';
  $('broadsheet-root').hidden = state.layout !== 'broadsheet';
  setPressed('[data-action="set-layout"]', 'layout', state.layout);
  setPressed('[data-action="set-accent"]', 'accent', state.accent);

  $('wb-textarea').value = state.text;
  $('bs-textarea').value = state.text;

  renderCatNav();
  renderPopular();
  renderThemeButtons();
  renderAll();
  wireEvents();
}

function setPressed(sel, attr, val) {
  document.querySelectorAll(sel).forEach(b => b.setAttribute('aria-pressed', b.dataset[attr] === val ? 'true' : 'false'));
}

// ------------------------------------------------------------- top-level render ---
function renderAll() {
  renderStatsAndMeters();
  renderIndexBoth();
  renderQuickbar();
  renderToolPanels();
  renderBroadsheetTabs();
  renderBroadsheetModeViews();
  renderFlash();
  renderUndoButtons();
}

// ----------------------------------------------------------------- theme ---
function sysDark() { return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches; }
function effectiveTheme() { return state.theme || (sysDark() ? 'dark' : 'light'); }
function toggleTheme() {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  state.theme = next;
  try { localStorage.setItem('tt.theme', next); } catch (e) {}
  document.documentElement.setAttribute('data-theme', next);
  renderThemeButtons();
}
function renderThemeButtons() {
  const label = effectiveTheme() === 'dark' ? 'Light' : 'Dark';
  document.querySelectorAll('[data-action="toggle-theme"]').forEach(b => b.textContent = label);
}
function setAccent(a) {
  state.accent = a;
  try { localStorage.setItem('tt.accent', a); } catch (e) {}
  document.documentElement.setAttribute('data-accent', a);
  setPressed('[data-action="set-accent"]', 'accent', a);
}
function setLayout(name) {
  state.layout = name;
  try { localStorage.setItem('tt.layout', name); } catch (e) {}
  $('workbench-root').hidden = name !== 'workbench';
  $('broadsheet-root').hidden = name !== 'broadsheet';
  setPressed('[data-action="set-layout"]', 'layout', name);
}

// ------------------------------------------------------------- flash msg ---
function flash(msg) {
  state.flash = msg;
  clearTimeout(flashTimer);
  renderFlash();
  flashTimer = setTimeout(() => { state.flash = ''; renderFlash(); }, 2200);
}
function renderFlash() { $('wb-flash').textContent = state.flash; $('bs-flash').textContent = state.flash; }

// --------------------------------------------------------------- history ---
function pushHistory() { hist.push(state.text); if (hist.length > 50) hist.shift(); renderUndoButtons(); }
function renderUndoButtons() {
  const empty = !hist.length;
  $('wb-undo').disabled = empty; $('wb-undo').style.opacity = empty ? '0.4' : '1';
  $('bs-undo').disabled = empty; $('bs-undo').style.opacity = empty ? '0.4' : '1';
}
function undo() {
  if (!hist.length) return;
  setText(hist.pop(), false, 'Undone');
  renderUndoButtons();
}
function rememberTool(name) {
  try {
    const r = JSON.parse(localStorage.getItem('tt.recent') || '[]').filter(x => x !== name);
    r.unshift(name);
    localStorage.setItem('tt.recent', JSON.stringify(r.slice(0, 12)));
  } catch (e) {}
}

// ------------------------------------------------------------- text set ---
function setText(v, push, label) {
  if (push) pushHistory();
  state.text = v;
  $('wb-textarea').value = v;
  $('bs-textarea').value = v;
  if (label) flash(label);
  renderStatsAndMeters();
  scheduleToolRecompute();
  renderBroadsheetModeViews();
  renderQuickbar();
}
function delta(a, b) { const d = Array.from(b).length - Array.from(a).length; return d === 0 ? 'same length' : (d > 0 ? '+' : '−') + Math.abs(d).toLocaleString('en-US') + ' chars'; }

// ---------------------------------------------------------- copy / dl ---
function fallbackCopy(t) { const el2 = document.createElement('textarea'); el2.value = t; el2.style.position = 'fixed'; el2.style.opacity = '0'; document.body.appendChild(el2); el2.select(); try { document.execCommand('copy'); } catch (e) {} el2.remove(); }
function copyToClipboard(t, btn, doneLabel) {
  const orig = btn ? btn.textContent : null;
  const done = () => { if (btn) { btn.textContent = doneLabel || 'Copied ✓'; setTimeout(() => { btn.textContent = orig; }, 1400); } };
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, () => { fallbackCopy(t); done(); }); else { fallbackCopy(t); done(); }
}
function downloadText(name, str, ext) {
  const blob = new Blob([str], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.' + ext;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// --------------------------------------------------------- stats/meters ---
function renderStatsAndMeters() {
  const st = D.stats(state.text);
  $('wb-big-words').textContent = D.n(st.words);
  $('wb-sub-chars').textContent = D.n(st.chars) + ' characters';
  $('wb-sub-nos').textContent = D.n(st.nos) + ' without spaces';
  $('wb-s-words').textContent = D.n(st.words);
  $('wb-s-chars').textContent = D.n(st.chars);
  $('wb-s-sen').textContent = D.n(st.sen);
  $('wb-s-read').textContent = D.dur(st.read);

  const rows = $('wb-stat-rows'); clear(rows);
  [['Sentences', D.n(st.sen)], ['Paragraphs', D.n(st.par)], ['Lines', D.n(st.lines)], ['Unique words', D.n(st.uniq)],
   ['Punctuation marks', D.n(st.punct)], ['Avg. word length', st.avgw.toFixed(1) + ' chars'], ['Avg. sentence', st.avgs.toFixed(1) + ' words'],
   ['Reading time', D.dur(st.read)], ['Speaking time', D.dur(st.speak)]].forEach(([l, v]) => {
    const row = el('div', 'wb-stat-row');
    row.appendChild(el('span', null, l));
    row.appendChild(el('span', 'v mono', v));
    rows.appendChild(row);
  });

  $('bs-big-words').textContent = D.n(st.words);
  const bstats = $('bs-bigstats'); clear(bstats);
  [['Characters', D.n(st.chars)], ['Without spaces', D.n(st.nos)], ['Sentences', D.n(st.sen)], ['Paragraphs', D.n(st.par)],
   ['Reading time', D.dur(st.read)], ['Speaking time', D.dur(st.speak)], ['Unique words', D.n(st.uniq)], ['Avg. word length', st.avgw.toFixed(1)]].forEach(([l, v]) => {
    const cell = el('div', 'bs-bigstat');
    cell.appendChild(el('div', 'v', v));
    cell.appendChild(el('div', 'l', l));
    bstats.appendChild(cell);
  });
  $('bs-s-chars').textContent = D.n(st.chars);
  $('bs-s-lines').textContent = D.n(st.lines);
  $('bs-s-read').textContent = D.dur(st.read);

  const meters = D.meters(state.text);
  const wbg = $('wb-meters-grid'); clear(wbg);
  meters.forEach(m => {
    const cell = el('div', 'wb-meter-cell');
    const top = el('div', 'top');
    top.appendChild(el('span', 'nm', m.name));
    const rem = el('span', 'rem mono', m.remLabel); rem.style.color = m.over ? 'var(--acc)' : 'var(--mute)';
    top.appendChild(rem);
    cell.appendChild(top);
    const bar = el('div', 'meterbar bar' + (m.over ? ' over' : ''));
    const fill = document.createElement('span'); fill.style.width = Math.min(100, m.pct) + '%';
    bar.appendChild(fill); cell.appendChild(bar);
    cell.appendChild(el('div', 'used mono', D.n(m.used) + ' / ' + D.n(m.limit)));
    wbg.appendChild(cell);
  });
  const bsl = $('bs-meters-list'); clear(bsl);
  meters.forEach(m => {
    const row = el('div', 'bs-meter-row');
    row.appendChild(el('span', 'nm', m.name));
    const bar = el('div', 'bar' + (m.over ? ' over' : ''));
    const fill = document.createElement('span'); fill.style.width = Math.min(100, m.pct) + '%';
    bar.appendChild(fill); row.appendChild(bar);
    const rem = el('span', 'rem mono', m.remLabel); rem.style.color = m.over ? 'var(--acc)' : 'var(--mute)';
    row.appendChild(rem);
    bsl.appendChild(row);
  });
}

// --------------------------------------------------------------- search ---
function renderSearchDropdown() {
  const box = $('wb-search-results');
  const q = state.q;
  let results = [];
  if (q.trim()) results = D.searchTools(q, 8);
  else if (state.qFocus) results = D.POPULAR.slice(0, 6).map(([name, cat]) => ({ name, cat }));
  const sel = Math.min(state.qSel, Math.max(0, results.length - 1));
  clear(box);
  if (!state.qFocus) { box.classList.remove('open'); return; }
  box.classList.add('open');
  const hd = el('div', 'wb-results-hd');
  hd.appendChild(el('span', null, q.trim() ? results.length + ' match' + (results.length === 1 ? '' : 'es') : 'Popular'));
  hd.appendChild(el('span', null, '↵ to open'));
  box.appendChild(hd);
  if (q.trim() && !results.length) {
    box.appendChild(el('div', null, 'No tool by that name yet. Try fewer words — “dupes”, “caps”, “tweet”.'));
    return;
  }
  results.forEach((t, i) => {
    const btn = el('button', 'wb-result-item' + (i === sel ? ' sel' : ''));
    btn.type = 'button';
    btn.appendChild(el('span', 'name', t.name));
    btn.appendChild(el('span', 'cat mono', t.cat));
    btn.addEventListener('mousedown', e => { e.preventDefault(); openTool(t.name); state.q = ''; state.qFocus = false; $('wb-search-input').value = ''; renderSearchDropdown(); });
    box.appendChild(btn);
  });
}

// --------------------------------------------------------------- catnav ---
function renderCatNav() {
  const nav = $('wb-catnav'); clear(nav);
  D.CATS.forEach(([cat, list], i) => {
    const btn = el('button', 'wb-catnav-item' + (state.idxQ === cat ? ' active' : ''));
    btn.type = 'button';
    btn.appendChild(el('span', 'num mono', String(i + 1).padStart(2, '0')));
    btn.appendChild(el('span', 'nm', cat));
    btn.appendChild(el('span', 'ct mono', String(list.split('|').length)));
    btn.addEventListener('click', () => { state.idxQ = state.idxQ === cat ? '' : cat; $('wb-index-q').value = state.idxQ; renderIndexBoth(); renderCatNav(); });
    nav.appendChild(btn);
  });
  $('wb-total-tools').textContent = D.allTools().length;
  $('bs-total-tools').textContent = D.allTools().length;
}

// --------------------------------------------------------------- index ---
function renderIndexBoth() {
  const total = D.allTools().length;
  const cats = D.filteredCats(state.idxQ);
  const shown = cats.reduce((a, c) => a + c.tools.length, 0);
  const countLabel = state.idxQ.trim() ? shown + ' of ' + total : total + ' tools';
  $('wb-index-count').textContent = countLabel;
  $('bs-index-count').textContent = countLabel;
  $('wb-index-clear').style.display = state.idxQ ? '' : 'none';
  $('wb-index-empty').style.display = cats.length ? 'none' : '';
  $('bs-index-empty').style.display = cats.length ? 'none' : '';

  const wbCols = $('wb-index-cols'); clear(wbCols);
  cats.forEach(c => {
    const box = el('div', 'wb-index-cat');
    const hd = el('div', 'wb-index-cat-hd');
    hd.appendChild(el('span', 'num mono', c.num));
    hd.appendChild(el('span', 'nm', c.name));
    hd.appendChild(el('span', 'ct mono', String(c.count)));
    box.appendChild(hd);
    c.tools.forEach(name => {
      const t = el('button', 'wb-index-tool', name);
      t.type = 'button';
      t.addEventListener('click', () => openTool(name));
      box.appendChild(t);
    });
    wbCols.appendChild(box);
  });

  const bsRows = $('bs-index-rows'); clear(bsRows);
  cats.forEach(c => {
    const row = el('div', 'bs-index-row');
    row.appendChild(el('span', 'num mono', c.num));
    row.appendChild(el('span', 'catname', c.name));
    const toolsWrap = el('div', 'tools');
    c.tools.forEach(name => {
      const s = el('span', null, name);
      s.addEventListener('click', () => openTool(name));
      toolsWrap.appendChild(s);
    });
    row.appendChild(toolsWrap);
    row.appendChild(el('span', 'bs-index-count mono', String(c.count)));
    bsRows.appendChild(row);
  });
}

// ------------------------------------------------------------- popular ---
function renderPopular() {
  const grid = $('wb-popular-grid'); clear(grid);
  D.POPULAR.forEach(([name, cat], i) => {
    const item = el('button', 'wb-popular-item');
    item.type = 'button';
    const row = el('div', 'row');
    row.appendChild(el('span', 'num mono', String(i + 1).padStart(2, '0')));
    row.appendChild(el('span', 'nm', name));
    item.appendChild(row);
    item.appendChild(el('div', 'cat', cat));
    item.addEventListener('click', () => openTool(name));
    grid.appendChild(item);
  });
}

// -------------------------------------------------------- quick actions ---
const CASE_QUICK = [['UPPER', 'upper', 'UPPERCASE'], ['lower', 'lower', 'lowercase'], ['Title', 'title', 'Title Case'], ['Sentence', 'sentence', 'Sentence case']];
const CLEAN_QUICK = [['Extra spaces', 'tidy', 'Remove Extra Spaces'], ['Empty lines', 'empty', 'Remove Empty Lines'], ['Duplicate lines', 'dedupe', 'Remove Duplicate Lines']];
function applyQuick(fn, full) {
  rememberTool(full);
  const s = state.text, out = D.TF[fn](s);
  if (out === s) { flash(full + ' — nothing to change'); return; }
  setText(out, true, full + ' applied · ' + delta(s, out));
}
function renderQuickbar() {
  const bar = $('wb-quickbar'); clear(bar);
  if (state.tool) { bar.hidden = true; return; }
  bar.hidden = false;
  const caseLabel = el('span', 'grp-label', 'Case'); bar.appendChild(caseLabel);
  CASE_QUICK.forEach(([label, fn, full]) => {
    const b = el('button', 'btn', label); b.type = 'button';
    b.addEventListener('click', () => applyQuick(fn, full));
    bar.appendChild(b);
  });
  bar.appendChild(el('span', 'sep'));
  bar.appendChild(el('span', 'grp-label', 'Clean'));
  CLEAN_QUICK.forEach(([label, fn, full]) => {
    const b = el('button', 'btn', label); b.type = 'button';
    b.addEventListener('click', () => applyQuick(fn, full));
    bar.appendChild(b);
  });
}

// ---------------------------------------------------------- tool engine ---
function computeToolVals() {
  const name = state.tool;
  if (!name) return { hasTool: false };
  const cat = D.catOf(name);
  const base = { hasTool: true, name, cat };
  if (!E || !E.has(name)) return Object.assign(base, { desc: 'This tool isn’t available.', hasErr: true, err: 'This tool isn’t available.', opts: [] });
  const spec = E.spec(name);
  const o = Object.assign({}, E.defaults(name), state.opts || {});
  const text = state.text;
  const key = name + '\u0001' + (spec.gen ? '' : text) + '\u0001' + JSON.stringify(o) + '\u0001' + state.nonce;
  if (!memo || memo.key !== key) {
    memo = { key };
    try {
      const r = E.run(name, spec.gen ? '' : text, o);
      if (r && typeof r.then === 'function') {
        memo.pending = true;
        const tok = memo;
        r.then(v => { if (memo === tok) { memo.res = typeof v === 'string' ? { text: v } : v; memo.pending = false; renderToolPanels(); } },
               e => { if (memo === tok) { memo.err = e.message; memo.pending = false; renderToolPanels(); } });
      } else memo.res = typeof r === 'string' ? { text: r } : r;
    } catch (e) { memo.err = e.message; }
    if (spec.diff && memo.res && typeof memo.res.text === 'string' && text.length < 8000 && memo.res.text !== text) {
      try { memo.changes = E.diff(text, memo.res.text, 'Characters').segs; } catch (e) {}
    }
  }
  const r = memo.res || {}, err = memo.err;
  const opts = spec.o.map(op => {
    const v = o[op.k];
    return {
      k: op.k, label: op.l, type: op.t, value: v == null ? '' : v,
      choices: op.t === 'seg' ? op.c : [], on: !!v
    };
  });
  let out = null;
  if (typeof r.text === 'string') out = r.text;
  else if (r.chips) out = r.chips.join('\n');
  else if (r.rows) out = (r.head ? [r.head] : []).concat(r.rows).map(x => x.join('\t')).join('\n');
  else if (r.segs) out = r.segs.map(x => x[1]).join('');
  const ext = r.ext || 'txt';
  const toFile = () => {
    if (ext === 'csv' && r.rows) {
      const cell = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      return (r.head ? [r.head] : []).concat(r.rows).map(row => row.map(cell).join(',')).join('\n');
    }
    return out;
  };
  const ok = !err && !memo.pending;
  return Object.assign({}, base, {
    desc: spec.d, opts, hasOpts: opts.length > 0, hasInput: !spec.gen, isGen: !!spec.gen,
    pending: !!memo.pending, hasErr: !!err, err,
    note: err || memo.pending ? '' : (r.note || spec.note || ''),
    isText: ok && typeof r.text === 'string', text: r.text, code: !!r.code,
    isRows: ok && !!r.rows, head: r.head || [], rows: (r.rows || []).slice(0, 400), copyRows: !!r.copyRows,
    isChips: ok && !!r.chips, chips: (r.chips || []).slice(0, 600),
    isGrid: ok && !!r.grid, grid: r.grid || [],
    isSegs: ok && !!r.segs, segs: r.segs || [],
    hasChanges: ok && !!memo.changes, changes: memo.changes || [],
    meter: ok ? r.meter : null,
    out, ext, toFile,
    canCopy: ok && out != null && out !== '',
    canUse: ok && (typeof r.text === 'string' || !!r.chips) && out !== '' && out !== text,
    canDl: ok && out != null && out !== ''
  });
}

function scheduleToolRecompute() {
  if (!state.tool) return;
  clearTimeout(toolDebounce);
  const spec = E && E.has(state.tool) ? E.spec(state.tool) : null;
  const heavy = spec && spec.diff;
  toolDebounce = setTimeout(renderToolPanels, heavy ? 200 : 60);
}

function segClass(t) { return t === 'add' ? 'seg-add' : t === 'del' ? 'seg-del' : t === 'hit' ? 'seg-hit' : ''; }
function buildSegsNode(segs) {
  const wrap = el('div', 'segs-wrap');
  segs.slice(0, 3000).forEach(([t, v]) => {
    const cls = segClass(t);
    if (!cls) { wrap.appendChild(document.createTextNode(v)); return; }
    const span = el('span', cls, v);
    wrap.appendChild(span);
  });
  return wrap;
}

function buildOptNode(op, onChange) {
  const field = el('div', 'opt-field' + (op.type === 'area' ? ' area' : ''));
  if (op.type !== 'bool') field.appendChild(el('span', 'opt-label', op.label));
  if (op.type === 'seg') {
    const seg = el('div', 'seg'); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', op.label);
    op.choices.forEach(c => {
      const b = el('button', null, c); b.type = 'button'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', c === op.value ? 'true' : 'false');
      b.addEventListener('click', () => onChange(c));
      seg.appendChild(b);
    });
    field.appendChild(seg);
  } else if (op.type === 'txt') {
    const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'tt-input'; inp.value = op.value; inp.spellcheck = false;
    inp.style.width = /pattern|find|repl|rules|name|email|title|author/i.test(op.k + ' ' + op.label) ? '220px' : '150px';
    inp.addEventListener('input', () => onChange(inp.value));
    field.appendChild(inp);
  } else if (op.type === 'num') {
    const inp = document.createElement('input'); inp.type = 'number'; inp.className = 'tt-input'; inp.value = op.value; inp.style.width = '92px';
    inp.addEventListener('input', () => onChange(inp.value));
    field.appendChild(inp);
  } else if (op.type === 'bool') {
    const b = el('button', 'sw'); b.type = 'button'; b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', op.on ? 'true' : 'false');
    const box = el('span', 'box', op.on ? '✓' : '');
    b.appendChild(box); b.appendChild(document.createTextNode(op.label));
    b.addEventListener('click', () => onChange(!op.value));
    field.replaceChildren(b);
  } else if (op.type === 'area') {
    const ta = document.createElement('textarea'); ta.className = 'opt-area'; ta.rows = 5; ta.spellcheck = false; ta.value = op.value;
    ta.addEventListener('input', () => onChange(ta.value));
    field.appendChild(ta);
  }
  return field;
}

function buildToolHeader(tv, onOptChange) {
  const wrap = document.createDocumentFragment();
  const row = el('div', 'wb-tool-head-row');
  const info = el('div'); info.style.flex = '1'; info.style.minWidth = '0';
  info.appendChild(el('div', 'wb-tool-cat', tv.cat));
  info.appendChild(el('h2', 'wb-tool-name', tv.name));
  info.appendChild(el('p', 'wb-tool-desc', tv.desc));
  row.appendChild(info);
  const close = el('button', 'btn', '← Close'); close.type = 'button';
  close.addEventListener('click', closeTool);
  row.appendChild(close);
  wrap.appendChild(row);
  if (tv.hasOpts) {
    const optsWrap = el('div', 'wb-tool-opts');
    tv.opts.forEach(op => optsWrap.appendChild(buildOptNode(op, v => onOptChange(op.k, v))));
    wrap.appendChild(optsWrap);
  }
  return wrap;
}

function buildResultBar(tv) {
  const bar = document.createDocumentFragment();
  bar.appendChild(el('span', 'label', 'Result'));
  bar.appendChild(el('span', 'note', tv.note || ''));
  if (tv.isGen) {
    const b = el('button', 'btn', 'New batch'); b.type = 'button';
    b.addEventListener('click', () => { state.nonce++; renderToolPanels(); });
    bar.appendChild(b);
  }
  if (tv.hasInput) {
    const b = el('button', 'btn', 'Try example'); b.type = 'button';
    b.addEventListener('click', () => { const ex = E.example(tv.name, tv.cat); lastExample = ex; setText(ex, true, 'Example loaded'); });
    bar.appendChild(b);
  }
  if (tv.canUse) {
    const b = el('button', 'btn', 'Use as text'); b.type = 'button';
    b.addEventListener('click', () => setText(tv.out, true, 'Result moved into your text — Undo to go back'));
    bar.appendChild(b);
  }
  if (tv.canDl) {
    const b = el('button', 'btn', 'Download .' + tv.ext); b.type = 'button';
    b.addEventListener('click', () => downloadText(tv.name, tv.toFile(), tv.ext));
    bar.appendChild(b);
  }
  if (tv.canCopy) {
    const b = el('button', 'btn btn-primary', 'Copy result'); b.type = 'button'; b.style.minWidth = '92px';
    b.addEventListener('click', () => copyToClipboard(tv.out, b, 'Copied ✓'));
    bar.appendChild(b);
  }
  return bar;
}

function buildResultBody(tv) {
  const wrap = document.createDocumentFragment();
  if (tv.hasErr) {
    const box = el('div', 'tool-error');
    box.appendChild(el('span', 'bang', '!'));
    box.appendChild(el('span', null, tv.err));
    wrap.appendChild(box);
    return wrap;
  }
  if (tv.pending) { wrap.appendChild(el('div', 'tool-pending', 'Working it out…')); return wrap; }
  if (tv.meter) {
    const m = tv.meter, pct = Math.min(100, m.used / m.limit * 100);
    const box = el('div'); box.style.padding = '12px 16px 4px';
    const top = el('div'); top.style.cssText = 'display:flex;justify-content:space-between;font:500 12px \'Geist Mono\',monospace;margin-bottom:6px';
    top.appendChild(el('span', null, D.n(m.used) + ' / ' + D.n(m.limit) + (m.label ? ' ' + m.label : '')));
    const rem = el('span', null, m.over ? (D.n(m.used - m.limit) + ' over') : (D.n(m.limit - m.used) + ' left'));
    rem.style.color = m.over ? 'var(--acc)' : 'var(--mute)';
    top.appendChild(rem); box.appendChild(top);
    const bar = el('div', 'meterbar' + (m.over ? ' over' : '')); const fill = document.createElement('span'); fill.style.width = pct + '%'; bar.appendChild(fill);
    box.appendChild(bar); wrap.appendChild(box);
  }
  if (tv.isText) {
    const pre = document.createElement('pre');
    pre.style.fontFamily = tv.code ? "'Geist Mono',monospace" : "'Geist',system-ui,sans-serif";
    pre.style.fontSize = tv.code ? '12.5px' : '14.5px';
    if (tv.text === '') { pre.textContent = 'Nothing yet — add some text above.'; pre.style.color = 'var(--mute)'; }
    else pre.textContent = tv.text;
    wrap.appendChild(pre);
  }
  if (tv.isRows) {
    const n = tv.rows.length && tv.rows[0].length || tv.head.length;
    const cols = n <= 1 ? 'minmax(0,1fr)' : n === 2 ? 'minmax(0,1.2fr) minmax(0,1fr)' : 'minmax(0,1.2fr) ' + Array(n - 1).fill('minmax(0,1fr)').join(' ');
    const box = el('div', 'rows-wrap');
    if (tv.head.length) {
      const hd = el('div', 'rowgrid head'); hd.style.gridTemplateColumns = cols;
      tv.head.forEach(h => hd.appendChild(el('span', null, h)));
      box.appendChild(hd);
    }
    tv.rows.forEach(row => {
      const rg = el('div', 'rowgrid' + (tv.copyRows ? ' clickable' : '')); rg.style.gridTemplateColumns = cols;
      row.forEach((c, i) => { const span = el('span', i ? 'mono' : null, String(c)); rg.appendChild(span); });
      if (tv.copyRows) rg.addEventListener('click', () => { copyToClipboard(String(row[row.length - 1])); flash('Copied ' + row[0]); });
      box.appendChild(rg);
    });
    wrap.appendChild(box);
  }
  if (tv.isChips) {
    const box = el('div', 'chips-wrap');
    tv.chips.forEach(v => {
      const b = el('button', 'chip', v); b.type = 'button'; b.title = 'Click to copy';
      b.addEventListener('click', () => { copyToClipboard(v); flash('Copied “' + (v.length > 30 ? v.slice(0, 30) + '…' : v) + '”'); });
      box.appendChild(b);
    });
    wrap.appendChild(box);
  }
  if (tv.isGrid) {
    const box = el('div', 'grid-wrap');
    tv.grid.forEach(g => {
      const b = el('button', null, g.ch); b.type = 'button'; b.title = g.name; b.setAttribute('aria-label', g.name);
      b.addEventListener('click', () => { copyToClipboard(g.ch); state.text += g.ch; $('wb-textarea').value = state.text; $('bs-textarea').value = state.text; renderStatsAndMeters(); flash('Copied ' + g.ch + ' and added it to your text'); });
      box.appendChild(b);
    });
    wrap.appendChild(box);
  }
  if (tv.isSegs) wrap.appendChild(buildSegsNode(tv.segs));
  if (tv.hasChanges) {
    const box = el('div', 'changes-wrap');
    box.appendChild(el('div', 'changes-hd', 'What changed · removed text is struck through'));
    const body = el('div', 'changes-body');
    tv.changes.slice(0, 3000).forEach(([t, v]) => {
      const cls = segClass(t);
      if (!cls) { body.appendChild(document.createTextNode(v)); return; }
      body.appendChild(el('span', cls, v));
    });
    box.appendChild(body);
    wrap.appendChild(box);
  }
  return wrap;
}

function setOpt(k, v) { state.opts = Object.assign({}, state.opts, { [k]: v }); renderToolPanels(); }

function renderToolPanels() {
  const tv = computeToolVals();
  // workbench
  const wbHeader = $('wb-tool-header'), wbBar = $('wb-result-bar'), wbBody = $('wb-result-body'), wbTa = $('wb-textarea');
  const bsHeader = $('bs-tool-header'), bsBar = $('bs-result-bar'), bsBody = $('bs-result-body'), bsToolView = $('bs-tool-view'), bsTab = $('bs-tool-tab');
  if (!tv.hasTool) {
    wbHeader.hidden = true; clear(wbHeader);
    wbBar.hidden = true; clear(wbBar);
    clear(wbBody);
    wbTa.hidden = false;
    bsToolView.hidden = true;
    bsTab.hidden = true;
    return;
  }
  wbHeader.hidden = false; clear(wbHeader); wbHeader.appendChild(buildToolHeader(tv, setOpt));
  wbBar.hidden = false; clear(wbBar); wbBar.appendChild(buildResultBar(tv));
  clear(wbBody); wbBody.appendChild(buildResultBody(tv));
  wbTa.hidden = tv.hasInput === false;

  clear(bsHeader); bsHeader.appendChild(buildToolHeader(tv, setOpt));
  clear(bsBar); bsBar.appendChild(buildResultBar(tv));
  clear(bsBody); bsBody.appendChild(buildResultBody(tv));
  bsTab.hidden = false;
  $('bs-tool-tab-label').textContent = tv.name;
  bsToolView.hidden = state.mode !== 'tool';
}

function openTool(name) {
  if (!E || !E.has(name)) { flash('Tools are still loading — try again in a second'); return; }
  rememberTool(name);
  const cat = D.catOf(name);
  const spec = E.spec(name);
  state.tool = name; state.opts = {}; state.nonce = 0;
  if (state.layout === 'broadsheet' || true) state.mode = 'tool';
  memo = null;
  if (!spec.gen && (!state.text.trim() || state.text === D.SAMPLE || state.text === lastExample)) {
    const ex = E.example(name, cat);
    if (ex !== state.text) { lastExample = ex; pushHistory(); state.text = ex; $('wb-textarea').value = ex; $('bs-textarea').value = ex; renderStatsAndMeters(); }
  }
  flash('Opened ' + name);
  renderToolPanels();
  renderBroadsheetTabs();
  renderQuickbar();
  const active = state.layout === 'workbench' ? $('wb-tool-header') : $('bs-tool-header');
  active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function closeTool() {
  state.tool = null; state.opts = {}; memo = null;
  if (state.mode === 'tool') state.mode = 'count';
  renderToolPanels(); renderBroadsheetTabs(); renderQuickbar();
}

// ----------------------------------------------------- broadsheet tabs ---
function renderBroadsheetTabs() {
  document.querySelectorAll('.bs-tab').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === state.mode ? 'true' : 'false'));
}
function renderBroadsheetModeViews() {
  $('bs-count-view').hidden = state.mode !== 'count';
  $('bs-social-view').hidden = state.mode !== 'social';
  $('bs-case-view').hidden = state.mode !== 'case';
  $('bs-clean-view').hidden = state.mode !== 'clean';
  $('bs-tool-view').hidden = state.mode !== 'tool' || !state.tool;
  if (state.mode === 'case') renderCaseList();
  if (state.mode === 'clean') renderCleanList();
}
function renderCaseList() {
  const first = (state.text.split(/\r?\n/).find(l => l.trim()) || 'the quick brown fox jumps over the lazy dog').slice(0, 80);
  const defs = [['UPPERCASE', 'upper'], ['lowercase', 'lower'], ['Title Case', 'title'], ['Sentence case', 'sentence'], ['Capitalized Case', 'cap'], ['aLtErNaTiNg CaSe', 'alt'], ['tOGGLE cASE', 'toggle'], ['camelCase', 'camel'], ['snake_case', 'snake'], ['kebab-case', 'kebab']];
  const box = $('bs-case-list'); clear(box);
  defs.forEach(([label, fn]) => {
    const btn = el('button', 'bs-case-row'); btn.type = 'button';
    btn.appendChild(el('div', 'lbl', label));
    btn.appendChild(el('div', 'prev', D.TF[fn](first) || '—'));
    btn.addEventListener('click', () => {
      rememberTool(label);
      if (['camel', 'snake', 'kebab'].includes(fn)) {
        const out = state.text.split(/\r?\n/).map(l => l.trim() ? D.TF[fn](l) : l).join('\n');
        setText(out, true, label + ' applied, line by line');
      } else applyQuick(fn, label);
    });
    box.appendChild(btn);
  });
}
function renderCleanList() {
  const s = state.text;
  const box = $('bs-clean-list'); clear(box);
  D.CLEAN_OPTS.forEach(([k, label]) => {
    const on = !!state.clean[k];
    const d = Array.from(s).length - Array.from(D.TF[k](s)).length;
    const btn = el('button', 'bs-clean-row'); btn.type = 'button'; btn.setAttribute('role', 'switch'); btn.setAttribute('aria-checked', on ? 'true' : 'false');
    btn.appendChild(el('span', 'box' + (on ? ' on' : ''), on ? '✓' : ''));
    btn.appendChild(el('span', 'lbl', label));
    btn.appendChild(el('span', 'delta mono', d ? '−' + D.n(d) : '—'));
    btn.addEventListener('click', () => { state.clean = Object.assign({}, state.clean, { [k]: !state.clean[k] }); renderCleanList(); });
    box.appendChild(btn);
  });
  const cleaned = D.runClean(s, state.clean);
  const d = Array.from(s).length - Array.from(cleaned).length;
  $('bs-clean-delta').textContent = d ? '−' + D.n(d) + ' characters' : 'Already clean';
}
function applyClean() {
  const s = state.text, cleaned = D.runClean(s, state.clean);
  if (cleaned === s) { flash('Nothing to clean'); return; }
  setText(cleaned, true, 'Cleaned · ' + delta(s, cleaned));
}

// ------------------------------------------------------------- events ---
function wireEvents() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    if (a === 'set-layout') setLayout(b.dataset.layout);
    else if (a === 'set-accent') setAccent(b.dataset.accent);
    else if (a === 'toggle-theme') toggleTheme();
    else if (a === 'home') e.preventDefault();
    else if (a === 'undo') undo();
    else if (a === 'sample') setText(D.SAMPLE, true, 'Example loaded');
    else if (a === 'clear') setText('', true, 'Cleared — Undo brings it back');
    else if (a === 'copy-main') copyToClipboard(state.text, b, 'Copied ✓');
    else if (a === 'clear-history') { try { localStorage.removeItem('tt.recent'); } catch (err) {} b.textContent = 'Cleared ✓'; setTimeout(() => { b.textContent = 'Clear recent tools'; }, 1400); }
    else if (a === 'apply-clean') applyClean();
    else if (a === 'clear-index-q') { state.idxQ = ''; $('wb-index-q').value = ''; renderIndexBoth(); renderCatNav(); }
  });

  document.querySelectorAll('.bs-tab').forEach(tab => tab.addEventListener('click', () => { state.mode = tab.dataset.mode; renderBroadsheetTabs(); renderBroadsheetModeViews(); }));

  ['wb-textarea', 'bs-textarea'].forEach(id => {
    $(id).addEventListener('input', e => { setText(e.target.value, false); });
  });

  const q = $('wb-search-input');
  q.addEventListener('input', e => { state.q = e.target.value; state.qSel = 0; renderSearchDropdown(); });
  q.addEventListener('focus', () => { state.qFocus = true; renderSearchDropdown(); });
  q.addEventListener('blur', () => { setTimeout(() => { state.qFocus = false; renderSearchDropdown(); }, 150); });
  q.addEventListener('keydown', e => {
    let results = state.q.trim() ? D.searchTools(state.q, 8) : D.POPULAR.slice(0, 6).map(([name, cat]) => ({ name, cat }));
    const sel = Math.min(state.qSel, Math.max(0, results.length - 1));
    if (e.key === 'ArrowDown') { e.preventDefault(); state.qSel = Math.min(sel + 1, results.length - 1); renderSearchDropdown(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); state.qSel = Math.max(0, sel - 1); renderSearchDropdown(); }
    else if (e.key === 'Enter' && results[sel]) { openTool(results[sel].name); state.q = ''; state.qFocus = false; q.value = ''; renderSearchDropdown(); q.blur(); }
    else if (e.key === 'Escape') { state.q = ''; state.qFocus = false; q.value = ''; renderSearchDropdown(); q.blur(); }
  });

  const idxQ = $('wb-index-q');
  idxQ.addEventListener('input', e => { state.idxQ = e.target.value; renderIndexBoth(); renderCatNav(); });

  const bsSearch = $('bs-search-input');
  bsSearch.addEventListener('input', e => { state.idxQ = e.target.value; $('wb-index-q').value = state.idxQ; renderIndexBoth(); renderCatNav(); $('bs-search-hint').textContent = state.idxQ.trim() ? D.filteredCats(state.idxQ).reduce((a, c) => a + c.tools.length, 0) + ' found' : '⌘K'; });
  bsSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const cats = D.filteredCats(state.idxQ); if (cats[0] && cats[0].tools[0]) { openTool(cats[0].tools[0]); bsSearch.blur(); } }
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const target = state.layout === 'workbench' ? $('wb-search-input') : $('bs-search-input');
      target.focus(); target.select();
    }
  });

  window.matchMedia && matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!state.theme) renderThemeButtons(); });
}

document.addEventListener('DOMContentLoaded', init);
})();
