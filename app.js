/* Dnevnik Treningov – generator treningov za vadeče
   Vsi podatki o strankah in treningih ostanejo v tej napravi (localStorage). */
'use strict';

// ---------- konstante ----------
const ROLES = {
  pocep: 'Počep', izpadni: 'Izpadni / step', hip: 'Hip thrust / most', hinge: 'Deadlift / hinge',
  poteg: 'Poteg', potisk: 'Potisk', core: 'Trup / core', poskoki: 'Poskoki', kondicija: 'Kondicija',
  ravnotezje: 'Ravnotežje', kolk: 'Kolk (abd/add)', roke: 'Roke', meca: 'Meča', mobilnost: 'Mobilnost', celo: 'Celo telo'
};
const TAGS = {
  koleno: 'Koleno', kolk: 'Kolk', kriz: 'Križ', rama: 'Rama', komolec: 'Komolec',
  fleksija: 'Brez trebušnjakov (diastaza)', poskoki: 'Brez poskokov', izpadni: 'Brez izpadnih',
  enonozno: 'Brez enonožnih', glava: 'Brez glave navzdol', rotacija: 'Brez rotacij',
  ravnotezje: 'Ravnotežje', zahtevno: 'Začetnik'
};
const CHAIN = { P: 'Posteriorna', A: 'Anteriorna', O: 'Obe / celotna' };
const LVL = { 1: 'Lahka', 2: 'Srednja', 3: 'Težka' };
const FMT = { kl: 'Klasično', ss: 'Superserije', tri: 'Trojčki' };
const TPL = {
  SIPL: { name: 'Počep · izpadni · potegi', slots: [['pocep'], ['poteg'], ['izpadni'], ['poteg'], ['pocep', 'izpadni'], ['core'], ['core', 'kolk'], ['poteg']] },
  HDPU: { name: 'Hip thrust · deadlift · potiski', slots: [['hip'], ['potisk'], ['hinge'], ['potisk'], ['hip', 'hinge'], ['core'], ['core', 'kolk'], ['potisk']] },
  HDPL: { name: 'Hip thrust · deadlift · potegi', slots: [['hip'], ['poteg'], ['hinge'], ['poteg'], ['hip', 'hinge'], ['core'], ['core', 'kolk'], ['poteg']] },
  SIPU: { name: 'Počep · izpadni · potiski', slots: [['pocep'], ['potisk'], ['izpadni'], ['potisk'], ['pocep', 'izpadni'], ['core'], ['core', 'kolk'], ['potisk']] },
  FB: { name: 'Full body', slots: [['pocep', 'izpadni'], ['poteg'], ['hip', 'hinge'], ['potisk'], ['izpadni', 'pocep'], ['core'], ['hinge', 'hip', 'kolk'], ['core']] },
  ANT: { name: 'Anteriorna veriga', ch: 'A', slots: [['pocep'], ['potisk'], ['izpadni'], ['potisk'], ['pocep', 'izpadni'], ['core'], ['roke', 'potisk'], ['core']] },
  POST: { name: 'Posteriorna veriga', ch: 'P', slots: [['hinge'], ['poteg'], ['hip'], ['poteg'], ['hinge', 'hip'], ['core'], ['kolk', 'hip'], ['poteg']] },
  KOND: { name: 'Full body + poskoki / kondicija', slots: [['poskoki'], ['pocep', 'izpadni'], ['poteg', 'potisk'], ['hip', 'hinge'], ['poskoki', 'kondicija'], ['core'], ['core'], ['potisk', 'poteg']] },
  CORE: { name: 'Trup / core', slots: [['core'], ['core'], ['core'], ['core'], ['core'], ['core'], ['core'], ['core']] },
  STAB: { name: 'Stabilizacija / kolk / ravnotežje', slots: [['kolk'], ['ravnotezje'], ['core'], ['hip'], ['kolk', 'mobilnost'], ['core'], ['ravnotezje', 'core'], ['mobilnost']] },
  KMOC: { name: 'Kardio (3–4 vaje) + moč', slots: [['poskoki'], ['kondicija', 'poskoki'], ['poskoki'], ['pocep', 'izpadni'], ['hip', 'hinge'], ['poteg'], ['potisk'], ['core']] },
  KTRUP: { name: 'Kardio + moč trupa', slots: [['poskoki'], ['core'], ['kondicija', 'poskoki'], ['core'], ['poskoki'], ['core'], ['kondicija', 'poskoki'], ['core']] },
  MSK: { name: '3 moč · 3 stabilizacija medenice · 3 kardio', slots: [['pocep', 'izpadni'], ['hip', 'hinge'], ['poteg', 'potisk'], ['kolk'], ['kolk', 'ravnotezje'], ['core'], ['poskoki'], ['kondicija', 'poskoki'], ['poskoki']] }
};
const TIMED = /plank|wall sit|hold|drža|carry|hoja|visenje|ravnotež|kolebnica|airbike|medo|medved/i;
const CLIENT_RULES = [
  [/kolen|kolenu|koleni|menisk|acl|križn\w* vez|hrustan|valgus|hiperekstenz/, 'koleno'],
  [/križ(?!n)|ledven|hernij|stenoz|vretenc|lordoz|skolioz|osteopor/, 'kriz'],
  [/(^|[^a-zčšž])ram|kalcinac/, 'rama'],
  [/komol/, 'komolec'],
  [/kolk|piriform|endoprotez|displaz/, 'kolk'],
  [/diastaz|po porodu/, 'fleksija'],
  [/medeničn|inkontin|inkotien/, 'poskoki'],
  [/enonož/, 'enonozno'],
  [/izpadn/, 'izpadni'],
  [/gledat dol|očesn|vratn|vratom/, 'glava'],
  [/začetni/, 'zahtevno']
];
const DAYNAMES = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob'];

// ---------- shramba ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('dt_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) {
    try { localStorage.setItem('dt_' + k, JSON.stringify(v)); return true; }
    catch (e) { toast('Shranjevanje ni uspelo – naredi izvoz podatkov!'); return false; }
  }
};
const S = {
  clients: store.get('clients', []),
  sessions: store.get('sessions', []),
  exEdits: store.get('exEdits', {}),
  exCustom: store.get('exCustom', []),
  meta: store.get('meta', {}),
  draft: store.get('draft', null),
  view: 'week', week: mondayOf(todayISO()), wday: (new Date().getDay() + 6) % 7, clientId: store.get('lastClient', null), q: '', exQ: '', exRole: '', exCh: '', showHidden: false,
  onlyActive: true, editClient: null, pickQ: ''
};
const save = {
  clients() { store.set('clients', S.clients); },
  sessions() { store.set('sessions', S.sessions); },
  ex() { store.set('exEdits', S.exEdits); store.set('exCustom', S.exCustom); EXC = null; },
  meta() { store.set('meta', S.meta); },
  draft() { store.set('draft', S.draft); }
};
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }

// ---------- pomožne ----------
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function todayISO() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
function fmtDate(iso) { if (!iso) return ''; const d = new Date(iso + 'T12:00'); return DAYNAMES[d.getDay()] + ', ' + d.getDate() + '. ' + (d.getMonth() + 1) + '. ' + d.getFullYear(); }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2600); }

let EXC = null;
function allEx() {
  if (EXC) return EXC;
  const base = (window.VAJE || []).map(e => S.exEdits[e.id] ? Object.assign({}, e, S.exEdits[e.id]) : e);
  EXC = base.concat(S.exCustom);
  EXC.byId = {}; EXC.forEach(e => EXC.byId[e.id] = e);
  return EXC;
}
const exById = id => allEx().byId[id];
const clientById = id => S.clients.find(c => c.id === id);
const conflicts = (e, c) => (e.t || []).filter(t => (c.tags || []).includes(t));
const clientSessions = id => S.sessions.filter(s => s.clientId === id).sort((a, b) => (b.date + b.ts).localeCompare(a.date + a.ts));

function parseClientTags(txt) {
  const out = new Set();
  String(txt || '').toLowerCase().split(/[,;(\n]/).forEach(cl => {
    if (/vse ok/.test(cl) && !/hernij/.test(cl)) return;
    CLIENT_RULES.forEach(([rx, tag]) => { if (rx.test(cl)) out.add(tag); });
  });
  return [...out];
}
function lastLoad(clientId, exId, skipSid) {
  for (const s of clientSessions(clientId)) {
    if (s.id === skipSid) continue;
    const it = s.items.find(i => i.ex === exId && (i.load || '').trim());
    if (it) return { load: it.load, sets: it.sets, date: s.date };
  }
  return null;
}
function nextPlanIdx(c) {
  const last = clientSessions(c.id)[0];
  const n = (c.plan || ['FB']).length;
  return last && last.planIdx != null && last.planIdx >= 0 ? (last.planIdx + 1) % n : 0;
}

// ---------- generator ----------
function slotsFor(tpl, n) {
  const base = (TPL[tpl] || TPL.FB).slots;
  const out = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}
// avoid = vaje, ki se jim izognemo (ta in prejšnji teden); če ni druge možnosti, jih vseeno dovoli
function candidates(roles, c, tpl, used, avoid) {
  const ch = (TPL[tpl] || {}).ch;
  avoid = avoid || new Set();
  const pool = allEx().filter(e => !e.off && roles.includes(e.r) && !used.has(e.id) && !excluded(e, c));
  const lvlOk = e => e.l <= (c.maxL || 3);
  const chOk = e => !ch || e.ch !== (ch === 'A' ? 'P' : 'A');
  const fresh = e => !avoid.has(e.id);
  const base = [
    e => lvlOk(e) && !conflicts(e, c).length && chOk(e),
    e => lvlOk(e) && !conflicts(e, c).length,
    e => !conflicts(e, c).length,
    () => true
  ];
  const stages = [];
  base.forEach(f => { stages.push(e => f(e) && fresh(e)); stages.push(f); });
  for (const f of stages) { const r = pool.filter(f); if (r.length) return r; }
  return [];
}
// teden
function isoOf(d) { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); }
function addDays(iso, n) { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return isoOf(d); }
function mondayOf(iso) { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return isoOf(d); }
// vaje stranke v tem in prejšnjem tednu (razen trenutnega treninga)
function avoidFor(clientId, date, sid) {
  const mon = mondayOf(date), from = addDays(mon, -7), to = addDays(mon, 6), set = new Set();
  S.sessions.forEach(s => { if (s.clientId === clientId && s.id !== sid && s.date >= from && s.date <= to) s.items.forEach(i => set.add(i.ex)); });
  return set;
}
// kolikokrat je bila vaja ta teden že dana (vsem strankam) – za raznolikost med strankami
function weekUsage(date, skipSid) {
  const mon = mondayOf(date), to = addDays(mon, 6), m = new Map();
  S.sessions.forEach(s => { if (s.id !== skipSid && s.date >= mon && s.date <= to) s.items.forEach(i => m.set(i.ex, (m.get(i.ex) || 0) + 1)); });
  return m;
}
function pick(cands, usage) {
  if (!cands.length) return null;
  usage = usage || new Map();
  const w = cands.map(e => (e.l === 2 ? 1.2 : 1) / (1 + 1.5 * (usage.get(e.id) || 0)));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cands.length; i++) { r -= w[i]; if (r <= 0) return cands[i]; }
  return cands[cands.length - 1];
}
// izključene vaje stranke (ključne besede v imenu, ločene z vejico)
const kwList = s => String(s || '').split(/[,;\n]/).map(x => norm(x).trim()).filter(Boolean);
function excluded(e, c) { const kws = kwList(c.excl); if (!kws.length) return false; const n = norm(e.n); return kws.some(k => n.includes(k)); }
function mustMatch(e, c) { const n = norm(e.n); return kwList(c.must).some(k => n.includes(k)); }
// če stranka zahteva obvezno vajo (npr. rotacijo) in je trening nima, jo doda namesto zadnje vaje za trup
function ensureMust(items, c, tpl, o) {
  if (!kwList(c.must).length || items.some(i => { const e = exById(i.ex); return e && mustMatch(e, c); })) return items;
  const used = new Set(items.map(i => i.ex));
  let cands = allEx().filter(e => !e.off && !used.has(e.id) && !excluded(e, c) && mustMatch(e, c) && !conflicts(e, c).length && e.l <= (c.maxL || 3));
  const fresh = cands.filter(e => !(o.avoid || new Set()).has(e.id) && !(o.used || new Set()).has(e.id));
  if (fresh.length) cands = fresh;
  const e = pick(cands, o.usage); if (!e) return items;
  if (o.used) o.used.add(e.id);
  const item = mkItem(e, [e.r], c);
  let k = -1; items.forEach((it, i) => { if (!it.lock && (it.roles || []).includes('core')) k = i; });
  if (k >= 0) items[k] = item; else items.push(item);
  return items;
}
function buildItems(c, tpl, n, o) {
  const used = o.used || new Set(), items = [];
  slotsFor(tpl, n).forEach((roles, i) => {
    const prev = o.keep && o.keep[i];
    if (prev && prev.lock) { items.push(prev); used.add(prev.ex); return; }
    const e = pick(candidates(roles, c, tpl, used, o.avoid), o.usage);
    if (e) { used.add(e.id); if (o.usage) o.usage.set(e.id, (o.usage.get(e.id) || 0) + 1); items.push(mkItem(e, roles, c)); }
  });
  return ensureMust(items, c, tpl, o);
}
const DAYIDX = { Pon: 0, Tor: 1, Sre: 2, 'Čet': 3, Pet: 4, Sob: 5 };
function datesFor(c, mon, count) {
  let offs = [...new Set((c.days || []).map(d => DAYIDX[d]).filter(x => x != null))].sort();
  [0, 2, 4, 1, 3, 5].forEach(o => { if (offs.length < count && !offs.includes(o)) offs.push(o); });
  return offs.slice(0, count).sort().map(o => addDays(mon, o));
}
const stripItem = i => ({ ex: i.ex, name: i.name, roles: i.roles, sets: i.sets, load: i.load || '', note: i.note || '' });
function generateWeek(mon) {
  const end = addDays(mon, 6);
  S.sessions = S.sessions.filter(s => !(s.planned && !s.done && s.date >= mon && s.date <= end));
  const usage = weekUsage(mon);
  const prevFrom = addDays(mon, -7), prevTo = addDays(mon, -1);
  const clients = S.clients.filter(c => c.active !== false).sort(() => Math.random() - 0.5);
  let count = 0;
  clients.forEach(c => {
    const plan = c.plan && c.plan.length ? c.plan : ['FB'];
    const mine = S.sessions.filter(s => s.clientId === c.id && s.date >= mon && s.date <= end);
    const used = new Set(), avoid = new Set();
    mine.forEach(s => s.items.forEach(i => used.add(i.ex)));
    S.sessions.forEach(s => { if (s.clientId === c.id && s.date >= prevFrom && s.date <= prevTo) s.items.forEach(i => avoid.add(i.ex)); });
    const dates = datesFor(c, mon, plan.length);
    plan.forEach((tpl, i) => {
      if (mine.some(s => s.planIdx === i)) return; // že opravljen
      const items = buildItems(c, tpl, c.n || 6, { used, avoid, usage });
      S.sessions.push({ id: uid(), ts: new Date().toISOString(), clientId: c.id, date: dates[i], planIdx: i, tpl, fmt: c.fmt || 'kl', note: '', planned: true, done: false, items: items.map(stripItem) });
      count++;
    });
  });
  save.sessions();
  return count;
}
function regenSession(sid) {
  const s = S.sessions.find(x => x.id === sid), c = clientById(s.clientId);
  const items = buildItems(c, s.tpl, s.items.length || c.n || 6, { used: new Set(), avoid: avoidFor(c.id, s.date, s.id), usage: weekUsage(s.date, s.id) });
  s.items = items.map(stripItem); save.sessions();
}
// ura termina za določen dan (npr. "ponedeljek 6.00 sreda 17:00" → sreda = 17:00)
function timeFor(c, date) {
  const t = String(c.termin || '').toLowerCase();
  const stem = ['ned', 'pon', 'tor', 'sre', 'čet', 'pet', 'sob'][new Date(date + 'T12:00').getDay()];
  const k = t.indexOf(stem);
  const m = (k >= 0 ? t.slice(k) : t).match(/(\d{1,2})[:.](\d{2})/) || t.match(/(\d{1,2})[:.](\d{2})/);
  return m ? m[1].padStart(2, '0') + ':' + m[2] : '';
}
function timeOf(c, date) { return timeFor(c, date || todayISO()) || '99:99'; }
function defaultSets(e, c) { return TIMED.test(e.n) ? '3×30 s' : (c.sets || '3×10'); }
function mkItem(e, roles, c) {
  return { uid: uid(), ex: e.id, name: e.n, roles: roles, sets: defaultSets(e, c), load: '', note: '', lock: false };
}
function generate(keepLocked) {
  const d = S.draft, c = clientById(d.clientId); if (!c) return;
  const old = d.items || [];
  const items = buildItems(c, d.tpl, d.n, { keep: keepLocked ? old : null, avoid: avoidFor(c.id, d.date, d.sid), usage: weekUsage(d.date, d.sid) });
  if (keepLocked) old.slice(d.n).filter(i => i.lock).forEach(i => items.push(i));
  d.items = items;
  save.draft();
}
function swapItem(idx) {
  const d = S.draft, c = clientById(d.clientId), it = d.items[idx];
  const used = new Set(d.items.map(i => i.ex));
  const roles = it.roles && it.roles.length ? it.roles : [exById(it.ex) ? exById(it.ex).r : 'core'];
  const e = pick(candidates(roles, c, d.tpl, used, avoidFor(c.id, d.date, d.sid)), weekUsage(d.date, d.sid));
  if (!e) { toast('Ni druge primerne vaje za to mesto.'); return; }
  d.items[idx] = Object.assign(mkItem(e, roles, c), { sets: it.sets });
  save.draft();
}
function groupSize(fmt) { return fmt === 'ss' ? 2 : fmt === 'tri' ? 3 : 1; }
function labelFor(i, fmt) {
  const g = groupSize(fmt);
  return g === 1 ? String(i + 1) : (Math.floor(i / g) + 1) + 'abc'[i % g];
}
function newDraft(c, planIdx) {
  const plan = c.plan && c.plan.length ? c.plan : ['FB'];
  const idx = planIdx == null ? nextPlanIdx(c) : planIdx;
  S.draft = { sid: null, clientId: c.id, date: todayISO(), planIdx: idx, tpl: plan[idx] || 'FB', fmt: c.fmt || 'kl', n: c.n || 6, items: [], note: '' };
  save.draft();
}
function sessionText(d) {
  const c = clientById(d.clientId) || { name: '' };
  const plan = d.planIdx >= 0 ? (d.planIdx + 1) + '. trening: ' : '';
  let t = 'Trening – ' + c.name + '\n' + fmtDate(d.date) + ' · ' + plan + (TPL[d.tpl] || {}).name + ' (' + FMT[d.fmt].toLowerCase() + ')\n';
  const g = groupSize(d.fmt);
  d.items.forEach((it, i) => {
    if (g > 1 && i % g === 0) t += '\n';
    if (g === 1 && i === 0) t += '\n';
    t += labelFor(i, d.fmt) + '  ' + it.name + ' — ' + (it.sets || '') + (it.load ? ' · ' + it.load : '') + (it.note ? ' (' + it.note + ')' : '') + '\n';
  });
  if (d.note) t += '\nOpomba: ' + d.note + '\n';
  return t;
}
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); toast('Kopirano'); return; } catch (e) { }
  const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('Kopirano'); } catch (e) { toast('Kopiranje ni uspelo'); }
  ta.remove();
}

// ---------- prikazi ----------
function render() {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  const n = S.clients.filter(c => c.active !== false).length;
  $('#topSub').textContent = S.clients.length ? n + ' aktivnih strank · ' + allEx().filter(e => !e.off).length + ' vaj' : '';
  const v = { week: viewWeek, gen: viewGen, clients: viewClients, client: viewClient, ex: viewEx, more: viewMore }[S.view] || viewGen;
  $('#main').innerHTML = v();
}

function backupBanner() {
  if (!S.sessions.length) return '';
  const last = S.meta.lastExport;
  const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 864e5) : 999;
  if (days < 7) return '';
  return `<div class="banner w">Podatki so shranjeni samo v tej napravi. ${last ? 'Zadnja varnostna kopija pred ' + days + ' dnevi.' : 'Še nimaš varnostne kopije.'} <a href="#" data-act="nav" data-view="more">Naredi izvoz →</a></div>`;
}

function clientPickerHTML() {
  const q = norm(S.q);
  const list = q ? S.clients.filter(c => norm(c.name).includes(q)).slice(0, 30) : [];
  return `<div class="picker">
    <input type="search" id="clientQ" placeholder="Poišči stranko …" value="${esc(S.q)}" autocomplete="off">
    ${list.length ? `<div class="plist">${list.map(c => `<div data-act="pickClient" data-id="${c.id}"><b>${esc(c.name)}</b> <span class="mute small">${esc(c.termin || '')}</span>${c.active === false ? ' <span class="tag">ne hodi</span>' : ''}</div>`).join('')}</div>` : ''}
  </div>`;
}

function weekSessions(mon) {
  const end = addDays(mon, 6);
  return S.sessions.filter(s => s.date >= mon && s.date <= end && clientById(s.clientId));
}
function viewWeek() {
  if (!S.clients.length) return viewGen();
  const mon = S.week, end = addDays(mon, 6), all = weekSessions(mon);
  const dShort = iso => { const d = new Date(iso + 'T12:00'); return d.getDate() + '. ' + (d.getMonth() + 1) + '.'; };
  const done = all.filter(s => s.done).length, open = all.filter(s => !s.done).length;
  const active = S.clients.filter(c => c.active !== false).length;
  let h = backupBanner() + `<div class="row" style="justify-content:space-between">
      <button class="btn icon" data-act="weekNav" data-d="-7">‹</button>
      <div style="text-align:center"><b style="font-size:17px">Teden ${dShort(mon)} – ${dShort(end)}</b><div class="tiny mute">${all.length} treningov · ${done} opravljenih</div></div>
      <button class="btn icon" data-act="weekNav" data-d="7">›</button></div>
    <button class="btn acc wide" style="margin-top:12px" data-act="genWeek">${open ? '↻ Generiraj teden znova' : 'Generiraj teden za vse stranke'}</button>
    <div class="tiny mute" style="text-align:center;margin:6px 0 12px">${active} aktivnih strank · vaje se v tednu ne ponavljajo in se razlikujejo od prejšnjega tedna${open ? ' · opravljeni treningi ostanejo' : ''}</div>`;
  const days = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned'];
  h += `<div class="seg" style="margin-bottom:12px">${days.map((d, i) => { const n = all.filter(s => s.date === addDays(mon, i)).length; return `<button data-act="wday" data-i="${i}" class="${S.wday === i ? 'on' : ''}">${d}${n ? `<br><span class="tiny">${n}</span>` : ''}</button>`; }).join('')}</div>`;
  const date = addDays(mon, S.wday);
  const list = all.filter(s => s.date === date).sort((a, b) => (timeOf(clientById(a.clientId), date) + clientById(a.clientId).name).localeCompare(timeOf(clientById(b.clientId), date) + clientById(b.clientId).name));
  if (!list.length) return h + `<div class="empty"><b>${fmtDate(date)}</b>${all.length ? 'Ta dan ni treningov.' : 'Klikni »Generiraj teden« in app pripravi treninge za vse stranke.'}</div>`;
  h += `<div class="row" style="margin-bottom:8px"><b>${fmtDate(date)}</b><button class="btn sm right" data-act="copyDay">${navigator.share ? 'Deli dan' : 'Kopiraj dan'}</button></div>`;
  h += list.map(s => {
    const c = clientById(s.clientId);
    return `<div class="card" style="${s.done ? 'opacity:.6' : ''}">
      <div class="row"><div class="grow"><b>${esc(c.name)}</b> <span class="mute small">${esc(timeFor(c, s.date))}</span>
        <div class="tiny mute">${s.planIdx >= 0 ? (s.planIdx + 1) + '. trening · ' : ''}${esc((TPL[s.tpl] || {}).name || '')} · ${FMT[s.fmt] || ''}</div></div>
        <button class="btn sm ${s.done ? 'pri' : ''}" data-act="toggleDone" data-id="${s.id}">${s.done ? '✓ Opravljen' : '✓'}</button></div>
      ${c.pos ? `<div class="notice" style="padding:6px 9px;font-size:12.5px">⚠ ${esc(c.pos)}</div>` : ''}
      <div class="small" style="margin:8px 0">${s.items.map((it, i) => `<div><b style="color:var(--accent)">${labelFor(i, s.fmt)}</b> ${esc(it.name)} <span class="mute">${esc(it.sets)}${it.load ? ' · ' + esc(it.load) : ''}</span></div>`).join('')}</div>
      <div class="row"><button class="btn sm" data-act="openSession" data-id="${s.id}">Odpri / uredi</button>
        ${s.done ? '' : `<button class="btn sm" data-act="regenOne" data-id="${s.id}">↻ Nov</button>`}
        <button class="btn sm" data-act="shareSession" data-id="${s.id}">${navigator.share ? 'Deli' : 'Kopiraj'}</button></div>
    </div>`;
  }).join('');
  return h;
}

function viewGen() {
  if (!S.clients.length) {
    return `<div class="empty"><b>Ni še strank</b>Uvozi datoteko s strankami (zavihek <i>Več</i>) ali dodaj prvo stranko.<br><br>
      <button class="btn pri" data-act="nav" data-view="more">Uvozi podatke</button> <button class="btn" data-act="newClient">+ Nova stranka</button></div>`;
  }
  const c = clientById(S.clientId);
  let h = backupBanner() + clientPickerHTML();
  if (!c) {
    const today = DAYNAMES[new Date().getDay()];
    const todays = S.clients.filter(x => x.active !== false && (x.days || []).includes(today));
    h += `<h3>Danes (${today})</h3>`;
    h += todays.length ? `<div class="card list">${todays.map(x => clientRow(x)).join('')}</div>` : `<p class="mute small">Za danes ni vpisanih strank. Poišči stranko zgoraj.</p>`;
    return h;
  }
  if (!S.draft || S.draft.clientId !== c.id) newDraft(c);
  const d = S.draft;
  const plan = c.plan && c.plan.length ? c.plan : ['FB'];
  const nx = nextPlanIdx(c);
  h += `<div class="card" style="margin-top:12px">
    <div class="client-head"><div><div class="name">${esc(c.name)}</div><div class="mute small">${esc(c.termin || '')}</div></div>
      <button class="btn sm" data-act="openClient" data-id="${c.id}">Uredi</button></div>
    ${c.pos ? `<div class="notice">⚠ ${esc(c.pos)}</div>` : ''}
    ${(c.tags || []).length ? `<div class="chips" style="margin-top:8px">${c.tags.map(t => `<span class="chip warn">${esc(TAGS[t] || t)}</span>`).join('')}</div>` : ''}
    ${c.sistem ? `<div class="sistem">${esc(c.sistem)}</div>` : ''}
  </div>`;
  h += `<h3>Kateri trening</h3><div class="plans">` + plan.map((t, i) => `
    <button class="plan ${d.planIdx === i ? 'on' : ''}" data-act="setPlan" data-i="${i}">
      ${i === nx ? '<span class="nx">naslednji</span>' : ''}<div class="k">${i + 1}. trening</div><div class="v">${esc((TPL[t] || TPL.FB).name)}</div></button>`).join('') +
    `<select id="tplOther"><option value="">Drug tip treninga …</option>${Object.keys(TPL).map(k => `<option value="${k}" ${d.planIdx === -1 && d.tpl === k ? 'selected' : ''}>${TPL[k].name}</option>`).join('')}</select></div>`;
  h += `<div class="card" style="margin-top:12px">
    <div class="seg">${Object.keys(FMT).map(k => `<button data-act="setFmt" data-f="${k}" class="${d.fmt === k ? 'on' : ''}">${FMT[k]}</button>`).join('')}</div>
    <div class="row" style="margin-top:10px">
      <div class="stepper"><span class="mute small">Št. vaj</span><button class="btn icon" data-act="nMinus">−</button><b>${d.n}</b><button class="btn icon" data-act="nPlus">+</button></div>
      <input type="date" id="dDate" value="${esc(d.date)}" style="width:auto;margin-left:auto">
    </div>
    <button class="btn acc wide" style="margin-top:12px" data-act="generate">${d.items.length ? '↻ Generiraj znova' : 'Generiraj trening'}</button>
    ${d.items.some(i => i.lock) ? '<div class="tiny mute" style="margin-top:6px;text-align:center">Zaklenjene vaje 🔒 ostanejo.</div>' : ''}
  </div>`;
  if (d.items.length) {
    h += d.sid ? `<div class="banner">Urejaš shranjen trening (${fmtDate(d.date)}). <a href="#" data-act="discardDraft">Nov trening</a> · <a href="#" data-act="nav" data-view="week">‹ Teden</a></div>` : '';
    h += workoutHTML(d, c);
    h += `<label class="f">Opomba k treningu</label><textarea id="dNote" placeholder="npr. počutje, bolečine …">${esc(d.note || '')}</textarea>
      <div class="actions">
        <button class="btn" data-act="addEx">+ Vaja</button>
        <button class="btn" data-act="copy">${navigator.share ? 'Deli' : 'Kopiraj'}</button>
        <button class="btn pri" data-act="saveSession">${d.sid ? 'Shrani spremembe' : 'Shrani trening'}</button>
      </div>`;
  }
  return h;
}

function workoutHTML(d, c) {
  const g = groupSize(d.fmt);
  let h = '', open = false;
  d.items.forEach((it, i) => {
    if (i % g === 0) {
      if (open) h += '</div>';
      const title = g === 1 ? '' : (g === 2 ? 'Superserija ' : 'Trojček ') + (Math.floor(i / g) + 1);
      h += `<div class="block">${title ? `<div class="block-h">${title}</div>` : ''}`; open = true;
    }
    const e = exById(it.ex) || { r: '', ch: 'O', t: [] };
    const cf = conflicts(e, c);
    const last = lastLoad(c.id, it.ex, d.sid);
    h += `<div class="item">
      <div class="item-top">
        <span class="lbl">${labelFor(i, d.fmt)}</span>
        <div class="grow"><div class="iname" data-act="exInfo" data-id="${esc(it.ex)}">${esc(it.name)}</div>
          <div class="imeta tiny"><span class="dot ${e.ch}"></span>${esc(ROLES[e.r] || '')} · ${esc(LVL[e.l] || '')}${cf.length ? ` <span class="tag warn">⚠ ${cf.map(t => esc(TAGS[t] || t)).join(', ')}</span>` : ''}</div></div>
        <div class="ibtns">
          <button class="btn ${it.lock ? 'on' : ''}" title="Zakleni" data-act="lock" data-i="${i}">${it.lock ? '🔒' : '🔓'}</button>
          <button class="btn" title="Zamenjaj" data-act="swap" data-i="${i}">↻</button>
          <button class="btn" title="Izberi drugo" data-act="replaceEx" data-i="${i}">⋯</button>
        </div>
      </div>
      <div class="item-in">
        <input class="sets" data-item="${i}" data-field="sets" value="${esc(it.sets)}" placeholder="3×10">
        <input class="load" data-item="${i}" data-field="load" value="${esc(it.load)}" placeholder="${last ? 'zadnjič ' + esc(last.load) : 'teža / opomba'}">
        <button class="btn sm ghost" data-act="up" data-i="${i}" title="Premakni gor" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="btn sm ghost bad" data-act="removeItem" data-i="${i}" title="Odstrani">✕</button>
      </div>
      ${last ? `<div class="last">Zadnjič (${fmtDate(last.date)}): ${esc(last.sets || '')} · ${esc(last.load)}</div>` : ''}
    </div>`;
  });
  if (open) h += '</div>';
  return h;
}

function clientRow(c) {
  const last = clientSessions(c.id)[0];
  return `<div class="li ${c.active === false ? 'off' : ''}" data-act="pickClient" data-id="${c.id}">
    <div class="grow"><div class="t">${esc(c.name)}</div>
      <div class="s">${esc(c.termin || '—')}${last ? ' · zadnji trening ' + fmtDate(last.date) : ''}</div>
      ${(c.tags || []).length ? `<div>${c.tags.map(t => `<span class="tag warn">${esc(TAGS[t] || t)}</span>`).join('')}</div>` : ''}
    </div><span class="mute">›</span></div>`;
}

function viewClients() {
  const q = norm(S.q2 || '');
  let list = S.clients.slice().sort((a, b) => a.name.localeCompare(b.name, 'sl'));
  if (S.onlyActive) list = list.filter(c => c.active !== false);
  if (q) list = list.filter(c => norm(c.name + ' ' + c.pos + ' ' + c.termin).includes(q));
  return `<div class="row"><h2 class="grow">Stranke</h2><button class="btn pri sm" data-act="newClient">+ Nova</button></div>
    <input type="search" id="clientsQ" placeholder="Išči po imenu, posebnostih, terminu …" value="${esc(S.q2 || '')}">
    <div class="row" style="margin-top:8px"><span class="chip ${S.onlyActive ? 'on' : ''}" data-act="toggleActive">Samo aktivne</span><span class="count right">${list.length} strank</span></div>
    <div class="card list" style="margin-top:8px;padding:0 12px">${list.map(clientRow).join('') || '<div class="empty">Ni zadetkov.</div>'}</div>`;
}

function planEditor(c) {
  return (c.plan || []).map((t, i) => `<div class="row" style="margin-bottom:6px"><span class="small" style="width:76px">${i + 1}. trening</span>
    <select class="grow" data-plan="${i}">${Object.keys(TPL).map(k => `<option value="${k}" ${t === k ? 'selected' : ''}>${TPL[k].name}</option>`).join('')}</select>
    <button class="btn icon bad" data-act="planDel" data-i="${i}">✕</button></div>`).join('') +
    `<button class="btn sm" data-act="planAdd">+ Dodaj trening v tednu</button>`;
}

function viewClient() {
  const c = S.editClient; if (!c) { S.view = 'clients'; return viewClients(); }
  const isNew = !clientById(c.id);
  const sess = isNew ? [] : clientSessions(c.id);
  return `<div class="row"><button class="btn sm ghost" data-act="nav" data-view="clients">‹ Nazaj</button><h2 class="grow" style="margin:0">${isNew ? 'Nova stranka' : esc(c.name)}</h2>
    ${isNew ? '' : `<button class="btn sm acc" data-act="trainClient">Trening</button>`}</div>
  <div class="card" style="margin-top:10px">
    <label class="f">Ime in priimek</label><input type="text" data-c="name" value="${esc(c.name)}">
    <div class="row"><div class="grow"><label class="f">Telefon</label><input type="tel" data-c="tel" value="${esc(c.tel)}"></div>
      <div class="grow"><label class="f">Termin vadbe</label><input type="text" data-c="termin" value="${esc(c.termin)}" placeholder="ponedeljek in četrtek 17:00"></div></div>
    <label class="f">Posebnosti / poškodbe</label><textarea data-c="pos">${esc(c.pos)}</textarea>
    <label class="f">Omejitve pri izbiri vaj <a href="#" data-act="suggestTags" class="tiny">predlagaj iz posebnosti</a></label>
    <div class="chips">${Object.keys(TAGS).map(t => `<span class="chip ${(c.tags || []).includes(t) ? 'on' : ''}" data-act="toggleTag" data-t="${t}">${TAGS[t]}</span>`).join('')}</div>
    <div class="row"><div class="grow"><label class="f">Najtežje vaje</label><select data-c="maxL">${[1, 2, 3].map(l => `<option value="${l}" ${+c.maxL === l ? 'selected' : ''}>do ${LVL[l]}</option>`).join('')}</select></div>
      <div class="grow"><label class="f">Privzeto serije×pon.</label><input type="text" data-c="sets" value="${esc(c.sets || '3×10')}"></div></div>
  </div>
  <div class="card">
    <label class="f" style="margin-top:0">Sistem treningov (opis)</label><textarea data-c="sistem">${esc(c.sistem)}</textarea>
    <label class="f">Tedenski plan</label>${planEditor(c)}
    <div class="row"><div class="grow"><label class="f">Način</label><select data-c="fmt">${Object.keys(FMT).map(k => `<option value="${k}" ${c.fmt === k ? 'selected' : ''}>${FMT[k]}</option>`).join('')}</select></div>
      <div class="grow"><label class="f">Št. vaj</label><input type="text" inputmode="numeric" data-c="n" value="${esc(c.n || 6)}"></div></div>
    <label class="f">Izključi vaje, ki v imenu vsebujejo (ločeno z vejico)</label><input type="text" data-c="excl" value="${esc(c.excl || '')}" placeholder="npr. pull up, bosu, leg press">
    <label class="f">Vsak trening naj vključi vajo z (ločeno z vejico)</label><input type="text" data-c="must" value="${esc(c.must || '')}" placeholder="npr. rotac">
    <label class="f">Opombe</label><textarea data-c="note">${esc(c.note || '')}</textarea>
    <label class="row small" style="margin-top:12px"><input type="checkbox" data-c="active" ${c.active !== false ? 'checked' : ''}> Aktivna stranka (trenutno hodi)</label>
  </div>
  <div class="row"><button class="btn pri grow" data-act="saveClient">Shrani</button>${isNew ? '' : '<button class="btn bad" data-act="delClient">Izbriši</button>'}</div>
  ${isNew ? '' : `<h3>Zgodovina treningov (${sess.length})</h3><div class="card">${sess.length ? sess.map(s => `<div class="sess">
      <div class="row"><b>${fmtDate(s.date)}</b><span class="mute small">${s.planIdx >= 0 ? (s.planIdx + 1) + '. · ' : ''}${esc((TPL[s.tpl] || {}).name || '')}</span></div>
      <div class="small mute" style="margin:4px 0">${s.items.map(i => esc(i.name) + (i.load ? ' <b>' + esc(i.load) + '</b>' : '')).join(' · ')}</div>
      <div class="row"><button class="btn sm" data-act="openSession" data-id="${s.id}">Odpri</button><button class="btn sm" data-act="repeatSession" data-id="${s.id}">Ponovi</button><button class="btn sm ghost bad right" data-act="delSession" data-id="${s.id}">Izbriši</button></div>
    </div>`).join('') : '<div class="mute small">Še ni shranjenih treningov.</div>'}</div>`}`;
}

function exListFilter() {
  const q = norm(S.exQ);
  return allEx().filter(e => (S.showHidden || !e.off) && (!S.exRole || e.r === S.exRole) && (!S.exCh || e.ch === S.exCh) &&
    (!q || norm(e.n + ' ' + e.d + ' ' + e.m + ' ' + e.eq).includes(q)));
}
function exRows(list, act, c) {
  return list.slice(0, 150).map(e => {
    const cf = c ? conflicts(e, c) : [];
    return `<div class="li ${e.off ? 'off' : ''}" data-act="${act}" data-id="${esc(e.id)}"><div class="grow">
      <div class="t"><span class="dot ${e.ch}"></span>${esc(e.n)}</div>
      <div class="s">${esc(ROLES[e.r] || e.r)} · ${esc(LVL[e.l])} · ${esc(e.eq)}${cf.length ? ` <span class="tag warn">⚠ ${cf.map(t => esc(TAGS[t] || t)).join(', ')}</span>` : ''}</div></div></div>`;
  }).join('') + (list.length > 150 ? `<div class="count">… in še ${list.length - 150}. Zoži iskanje.</div>` : '');
}
function viewEx() {
  const list = exListFilter();
  return `<div class="row"><h2 class="grow">Baza vaj</h2><button class="btn pri sm" data-act="newEx">+ Nova vaja</button></div>
    <input type="search" id="exQ" placeholder="Išči vajo …" value="${esc(S.exQ)}">
    <div class="row" style="margin-top:8px">
      <select id="exRole" class="grow"><option value="">Vse skupine</option>${Object.keys(ROLES).map(r => `<option value="${r}" ${S.exRole === r ? 'selected' : ''}>${ROLES[r]}</option>`).join('')}</select>
      <select id="exCh" class="grow"><option value="">Vse verige</option>${Object.keys(CHAIN).map(k => `<option value="${k}" ${S.exCh === k ? 'selected' : ''}>${CHAIN[k]}</option>`).join('')}</select>
    </div>
    <div class="row" style="margin-top:8px"><span class="chip ${S.showHidden ? 'on' : ''}" data-act="toggleHidden">Pokaži skrite</span>
      <span class="tiny mute"><span class="dot P"></span>Posteriorna <span class="dot A"></span>Anteriorna <span class="dot O"></span>Obe</span><span class="count right">${list.length}</span></div>
    <div class="card list" style="margin-top:8px;padding:0 12px">${exRows(list, 'editEx') || '<div class="empty">Ni zadetkov.</div>'}</div>`;
}

function viewMore() {
  const nS = S.sessions.length, nC = S.clients.length;
  return `<h2>Podatki in nastavitve</h2>
  <div class="card"><b>Varnostna kopija</b>
    <p class="small mute">Stranke in treningi so shranjeni <b>samo v tem brskalniku na tej napravi</b> (ne na GitHubu, ne v oblaku). Redno naredi izvoz in datoteko shrani npr. na Google Drive. Z uvozom iste datoteke preneseš podatke na drugo napravo.</p>
    <p class="small">${nC} strank · ${nS} shranjenih treningov${S.meta.lastExport ? ' · zadnji izvoz ' + fmtDate(S.meta.lastExport.slice(0, 10)) : ''}</p>
    <div class="row"><button class="btn pri" data-act="export">⬇ Izvozi podatke</button>
      <label class="btn">⬆ Uvozi datoteko<input type="file" id="importFile" accept=".json,application/json" hidden></label></div>
  </div>
  <div class="card"><b>Namesti kot app</b>
    <p class="small mute"><b>Android (Chrome):</b> meni ⋮ → <i>Dodaj na začetni zaslon / Namesti aplikacijo</i>.<br>
    <b>iPhone (Safari):</b> gumb Deli → <i>Dodaj na začetni zaslon</i>.<br>
    <b>Računalnik (Chrome/Edge):</b> ikona za namestitev v naslovni vrstici.</p>
    <button class="btn ${window.__installEvt ? '' : 'hide'}" data-act="install">Namesti zdaj</button>
  </div>
  <div class="card"><b>Kako deluje generator</b>
    <p class="small mute">Za vsako stranko izbere vaje glede na tip treninga (npr. <i>Počep · izpadni · potegi</i>), omejitve stranke (koleno, križ, rama …) in najvišjo težavnost. Vaj iz zadnjih dveh treningov se izogiba, da je trening raznolik. Vaje z ⚠ so po bazi »ni prva izbira« za to stranko. Z 🔒 zakleneš vajo, z ↻ jo zamenjaš z drugo iz iste skupine, z ⋯ izbereš sam.</p>
  </div>
  <div class="card"><b>Nevarno območje</b><p class="small mute">Izbriše vse stranke, treninge in tvoje spremembe vaj na tej napravi.</p>
    <button class="btn bad" data-act="wipe">Izbriši vse podatke</button></div>`;
}

// ---------- modali ----------
function openModal(html) { $('#modalBox').innerHTML = html; $('#modal').hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#modalBox').innerHTML = ''; S.modalCtx = null; }
function confirmModal(text, yesLabel, onYes) {
  S.modalCtx = { onYes };
  openModal(`<p style="font-size:16px;margin:6px 0 16px">${text}</p><div class="row"><button class="btn grow" data-act="closeModal">Prekliči</button><button class="btn pri grow" data-act="confirmYes">${yesLabel}</button></div>`);
}
function exInfoModal(id) {
  const e = exById(id); if (!e) return;
  openModal(`<div class="mhead"><h2>${esc(e.n)}</h2><button class="btn icon" data-act="closeModal">✕</button></div>
    ${e.d ? `<p>${esc(e.d)}</p>` : ''}
    <p class="small"><span class="dot ${e.ch}"></span>${CHAIN[e.ch]} veriga · ${esc(ROLES[e.r])} · ${LVL[e.l]}<br>
    <b>Oprema:</b> ${esc(e.eq)}<br>${e.m ? `<b>Mišice:</b> ${esc(e.m)}${e.m2 ? ' (+ ' + esc(e.m2) + ')' : ''}<br>` : ''}${e.tip ? `<b>Tip:</b> ${esc(e.tip)}<br>` : ''}</p>
    ${e.p ? `<div class="notice">Previdnost: ${esc(e.p)}</div>` : ''}
    <div class="row" style="margin-top:14px"><button class="btn grow" data-act="editEx" data-id="${esc(e.id)}">Uredi vajo</button></div>`);
}
function pickerModal(mode, idx) {
  S.modalCtx = { mode, idx };
  const it = mode === 'replace' ? S.draft.items[idx] : null;
  const roles = it && it.roles ? it.roles : [];
  S.pickRole = roles.length === 1 ? roles[0] : '';
  S.pickQ = '';
  openModal(`<div class="mhead"><h2>${mode === 'replace' ? 'Zamenjaj vajo' : 'Dodaj vajo'}</h2><button class="btn icon" data-act="closeModal">✕</button></div>
    <input type="search" id="pickQ" placeholder="Išči vajo …">
    <div class="chips" style="margin-top:8px" id="pickRoles">${pickRolesHTML()}</div>
    <div class="res list" id="pickRes"></div>`);
  renderPick();
  setTimeout(() => { const i = $('#pickQ'); i && i.focus(); }, 50);
}
function pickRolesHTML() {
  return `<span class="chip ${!S.pickRole ? 'on' : ''}" data-act="pickRole" data-r="">Vse</span>` +
    Object.keys(ROLES).map(r => `<span class="chip ${S.pickRole === r ? 'on' : ''}" data-act="pickRole" data-r="${r}">${ROLES[r]}</span>`).join('');
}
function renderPick() {
  const q = norm(S.pickQ), c = clientById(S.draft.clientId);
  const list = allEx().filter(e => !e.off && (!S.pickRole || e.r === S.pickRole) && (!q || norm(e.n + ' ' + e.d).includes(q)));
  $('#pickRes').innerHTML = exRows(list, 'pickEx', c) || '<div class="empty">Ni zadetkov.</div>';
  $('#pickRoles').innerHTML = pickRolesHTML();
}
function exEditModal(id) {
  const ex = id ? exById(id) : { id: 'u' + uid(), n: '', d: '', r: 'core', ch: 'O', l: 2, eq: 'Lastna teža', m: '', m2: '', tip: '', p: '', t: [], custom: true };
  S.modalCtx = { ex: JSON.parse(JSON.stringify(ex)), isNew: !id };
  const e = S.modalCtx.ex;
  openModal(`<div class="mhead"><h2>${id ? 'Uredi vajo' : 'Nova vaja'}</h2><button class="btn icon" data-act="closeModal">✕</button></div>
    <label class="f">Ime</label><input type="text" data-e="n" value="${esc(e.n)}">
    <label class="f">Opis / izvedba</label><textarea data-e="d">${esc(e.d)}</textarea>
    <div class="row"><div class="grow"><label class="f">Skupina (za generator)</label><select data-e="r">${Object.keys(ROLES).map(r => `<option value="${r}" ${e.r === r ? 'selected' : ''}>${ROLES[r]}</option>`).join('')}</select></div>
      <div class="grow"><label class="f">Veriga</label><select data-e="ch">${Object.keys(CHAIN).map(k => `<option value="${k}" ${e.ch === k ? 'selected' : ''}>${CHAIN[k]}</option>`).join('')}</select></div></div>
    <div class="row"><div class="grow"><label class="f">Težavnost</label><select data-e="l">${[1, 2, 3].map(l => `<option value="${l}" ${+e.l === l ? 'selected' : ''}>${LVL[l]}</option>`).join('')}</select></div>
      <div class="grow"><label class="f">Oprema</label><input type="text" data-e="eq" value="${esc(e.eq)}"></div></div>
    <label class="f">Ni primerna pri (previdnost)</label>
    <div class="chips" id="exTags">${exTagChips(e)}</div>
    <label class="row small" style="margin-top:14px"><input type="checkbox" data-e="off" ${e.off ? 'checked' : ''}> Skrij vajo (generator je ne bo izbiral)</label>
    <div class="row" style="margin-top:14px"><button class="btn pri grow" data-act="saveEx">Shrani</button>
      ${!id ? '' : e.custom ? '<button class="btn bad" data-act="delEx">Izbriši</button>' : (S.exEdits[e.id] ? '<button class="btn" data-act="resetEx">Ponastavi</button>' : '')}</div>`);
}
const exTagChips = e => Object.keys(TAGS).map(t => `<span class="chip ${(e.t || []).includes(t) ? 'on' : ''}" data-act="exTag" data-t="${t}">${TAGS[t]}</span>`).join('');

// ---------- dejanja ----------
const ACT = {
  weekNav(b) { S.week = addDays(S.week, +b.dataset.d); render(); },
  wday(b) { S.wday = +b.dataset.i; render(); },
  genWeek() {
    const open = weekSessions(S.week).filter(s => !s.done).length;
    const run = () => { const n = generateWeek(S.week); toast('Pripravljenih ' + n + ' treningov ✓'); render(); };
    if (open) confirmModal(`Znova generiram <b>${open}</b> neopravljenih treningov v tem tednu? Opravljeni ostanejo.`, 'Generiraj', run); else run();
  },
  regenOne(b) { regenSession(b.dataset.id); render(); toast('Nov trening ✓'); },
  toggleDone(b) { const s = S.sessions.find(x => x.id === b.dataset.id); s.done = !s.done; save.sessions(); render(); },
  shareSession(b) {
    const s = S.sessions.find(x => x.id === b.dataset.id), txt = sessionText(s);
    if (navigator.share) navigator.share({ text: txt }).catch(() => { }); else copyText(txt);
  },
  copyDay() {
    const date = addDays(S.week, S.wday);
    const txt = weekSessions(S.week).filter(s => s.date === date).sort((a, b) => timeOf(clientById(a.clientId), date).localeCompare(timeOf(clientById(b.clientId), date))).map(sessionText).join('\n――――――――\n\n');
    if (navigator.share) navigator.share({ text: txt }).catch(() => { }); else copyText(txt);
  },
  nav(b) { S.view = b.dataset.view; if (S.view !== 'gen') S.q = ''; render(); window.scrollTo(0, 0); },
  closeModal,
  confirmYes() { const f = S.modalCtx && S.modalCtx.onYes; closeModal(); f && f(); },
  pickClient(b) {
    S.clientId = b.dataset.id; S.q = ''; store.set('lastClient', S.clientId);
    if (S.draft && S.draft.clientId !== S.clientId) S.draft = null;
    S.view = 'gen'; render(); window.scrollTo(0, 0);
  },
  setPlan(b) { const c = clientById(S.clientId); const i = +b.dataset.i; Object.assign(S.draft, { planIdx: i, tpl: c.plan[i] }); generate(false); render(); },
  setFmt(b) { S.draft.fmt = b.dataset.f; save.draft(); render(); },
  nMinus() { if (S.draft.n > 2) { S.draft.n--; if (S.draft.items.length > S.draft.n) S.draft.items = S.draft.items.slice(0, S.draft.n); save.draft(); render(); } },
  nPlus() { if (S.draft.n < 12) { S.draft.n++; if (S.draft.items.length) { const c = clientById(S.clientId); const roles = slotsFor(S.draft.tpl, S.draft.n)[S.draft.n - 1]; const used = new Set(S.draft.items.map(i => i.ex)); const e = pick(candidates(roles, c, S.draft.tpl, used, avoidFor(c.id, S.draft.date, S.draft.sid)), weekUsage(S.draft.date, S.draft.sid)); if (e) S.draft.items.push(mkItem(e, roles, c)); } save.draft(); render(); } },
  generate() { generate(true); render(); },
  lock(b) { const it = S.draft.items[+b.dataset.i]; it.lock = !it.lock; save.draft(); render(); },
  swap(b) { swapItem(+b.dataset.i); render(); },
  up(b) { const i = +b.dataset.i, a = S.draft.items; if (i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; save.draft(); render(); } },
  removeItem(b) { S.draft.items.splice(+b.dataset.i, 1); S.draft.n = Math.max(2, S.draft.items.length); save.draft(); render(); },
  replaceEx(b) { pickerModal('replace', +b.dataset.i); },
  addEx() { pickerModal('add'); },
  pickRole(b) { S.pickRole = b.dataset.r; renderPick(); },
  pickEx(b) {
    const e = exById(b.dataset.id), c = clientById(S.draft.clientId), ctx = S.modalCtx;
    if (ctx.mode === 'replace') { const old = S.draft.items[ctx.idx]; S.draft.items[ctx.idx] = Object.assign(mkItem(e, [e.r], c), { sets: old.sets, lock: true }); }
    else { S.draft.items.push(mkItem(e, [e.r], c)); S.draft.n = S.draft.items.length; }
    save.draft(); closeModal(); render();
  },
  exInfo(b) { exInfoModal(b.dataset.id); },
  copy() {
    const txt = sessionText(S.draft);
    if (navigator.share) { navigator.share({ text: txt }).catch(() => { }); } else copyText(txt);
  },
  saveSession() {
    const d = S.draft; if (!d.items.length) return;
    const rec = { id: d.sid || uid(), ts: d.ts || new Date().toISOString(), clientId: d.clientId, date: d.date, planIdx: d.planIdx, tpl: d.tpl, fmt: d.fmt, note: d.note || '',
      items: d.items.map(stripItem) };
    const k = S.sessions.findIndex(s => s.id === rec.id);
    if (k >= 0) { rec.planned = S.sessions[k].planned; rec.done = S.sessions[k].done; }
    if (k >= 0) S.sessions[k] = rec; else S.sessions.push(rec);
    save.sessions();
    d.sid = rec.id; d.ts = rec.ts; save.draft();
    toast('Trening shranjen ✓'); render();
  },
  discardDraft() { const c = clientById(S.clientId); newDraft(c); render(); },
  openClient(b) { S.editClient = JSON.parse(JSON.stringify(clientById(b.dataset.id))); S.view = 'client'; render(); window.scrollTo(0, 0); },
  newClient() { S.editClient = { id: 'c' + uid(), name: '', tel: '', pos: '', tags: [], maxL: 3, sets: '3×10', sistem: '', plan: ['FB', 'FB'], fmt: 'kl', n: 6, termin: '', days: [], note: '', active: true }; S.view = 'client'; render(); },
  toggleActive() { S.onlyActive = !S.onlyActive; render(); },
  toggleTag(b) { const c = S.editClient, t = b.dataset.t; c.tags = c.tags || []; c.tags = c.tags.includes(t) ? c.tags.filter(x => x !== t) : c.tags.concat(t); b.classList.toggle('on'); },
  suggestTags() { const c = S.editClient; const sug = parseClientTags(c.pos); c.tags = [...new Set((c.tags || []).concat(sug))]; render(); toast(sug.length ? 'Predlagano: ' + sug.map(t => TAGS[t]).join(', ') : 'Ni predlogov'); },
  planAdd() { S.editClient.plan.push('FB'); render(); },
  planDel(b) { if (S.editClient.plan.length > 1) { S.editClient.plan.splice(+b.dataset.i, 1); render(); } },
  saveClient() {
    const c = S.editClient; c.name = (c.name || '').trim();
    if (!c.name) { toast('Vpiši ime'); return; }
    c.n = Math.max(2, Math.min(12, parseInt(c.n, 10) || 6)); c.maxL = +c.maxL || 3;
    c.days = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob'].filter(d => norm(c.termin).includes(norm(d)));
    const k = S.clients.findIndex(x => x.id === c.id);
    if (k >= 0) S.clients[k] = c; else S.clients.push(c);
    save.clients();
    if (S.draft && S.draft.clientId === c.id && !S.draft.items.length) S.draft = null;
    toast('Shranjeno ✓'); S.editClient = JSON.parse(JSON.stringify(c)); render();
  },
  delClient() {
    const c = S.editClient;
    confirmModal(`Izbrišem stranko <b>${esc(c.name)}</b> in vse njene treninge?`, 'Izbriši', () => {
      S.clients = S.clients.filter(x => x.id !== c.id); S.sessions = S.sessions.filter(s => s.clientId !== c.id);
      save.clients(); save.sessions(); if (S.clientId === c.id) { S.clientId = null; S.draft = null; save.draft(); }
      S.view = 'clients'; render();
    });
  },
  trainClient() { ACT.pickClient({ dataset: { id: S.editClient.id } }); },
  openSession(b) {
    const s = S.sessions.find(x => x.id === b.dataset.id); const c = clientById(s.clientId);
    S.clientId = s.clientId;
    S.draft = { sid: s.id, ts: s.ts, clientId: s.clientId, date: s.date, planIdx: s.planIdx, tpl: s.tpl, fmt: s.fmt, n: s.items.length, note: s.note || '',
      items: s.items.map(i => Object.assign({ uid: uid(), lock: true }, i)) };
    save.draft(); S.view = 'gen'; render(); window.scrollTo(0, 0);
  },
  repeatSession(b) {
    ACT.openSession(b);
    Object.assign(S.draft, { sid: null, ts: null, date: todayISO(), note: '' });
    S.draft.items.forEach(i => { i.load = ''; });
    save.draft(); render(); toast('Kopija treninga za danes');
  },
  delSession(b) {
    confirmModal('Izbrišem ta trening?', 'Izbriši', () => {
      S.sessions = S.sessions.filter(s => s.id !== b.dataset.id); save.sessions();
      if (S.draft && S.draft.sid === b.dataset.id) S.draft.sid = null;
      render();
    });
  },
  toggleHidden() { S.showHidden = !S.showHidden; render(); },
  newEx() { exEditModal(null); },
  editEx(b) { exEditModal(b.dataset.id); },
  exTag(b) { const e = S.modalCtx.ex, t = b.dataset.t; e.t = (e.t || []).includes(t) ? e.t.filter(x => x !== t) : (e.t || []).concat(t); b.classList.toggle('on'); },
  saveEx() {
    const e = S.modalCtx.ex; e.n = (e.n || '').trim(); if (!e.n) { toast('Vpiši ime vaje'); return; }
    e.l = +e.l;
    if (e.custom) { const k = S.exCustom.findIndex(x => x.id === e.id); if (k >= 0) S.exCustom[k] = e; else S.exCustom.push(e); }
    else {
      const orig = (window.VAJE || []).find(x => x.id === e.id), diff = {};
      ['n', 'd', 'r', 'ch', 'l', 'eq', 't', 'off'].forEach(k => { if (JSON.stringify(orig[k]) !== JSON.stringify(e[k])) diff[k] = e[k]; });
      if (Object.keys(diff).length) S.exEdits[e.id] = diff; else delete S.exEdits[e.id];
    }
    save.ex(); closeModal(); toast('Vaja shranjena ✓'); render();
  },
  resetEx() { delete S.exEdits[S.modalCtx.ex.id]; save.ex(); closeModal(); render(); },
  delEx() { const id = S.modalCtx.ex.id; S.exCustom = S.exCustom.filter(x => x.id !== id); save.ex(); closeModal(); render(); },
  export() {
    const data = { app: 'dnevnik-treningov', version: 1, exported: new Date().toISOString(), clients: S.clients, sessions: S.sessions, exEdits: S.exEdits, exCustom: S.exCustom };
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'dnevnik-treningov-' + todayISO() + '.json'; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    S.meta.lastExport = new Date().toISOString(); save.meta(); toast('Datoteka prenesena'); render();
  },
  install() { const ev = window.__installEvt; if (ev) { ev.prompt(); window.__installEvt = null; } },
  wipe() {
    confirmModal('Res izbrišem <b>vse</b> podatke na tej napravi? Tega ni mogoče razveljaviti.', 'Izbriši vse', () => {
      ['clients', 'sessions', 'exEdits', 'exCustom', 'draft', 'lastClient'].forEach(k => { try { localStorage.removeItem('dt_' + k); } catch (e) { } });
      Object.assign(S, { clients: [], sessions: [], exEdits: {}, exCustom: [], draft: null, clientId: null }); EXC = null; render();
    });
  }
};

function importData(obj) {
  if (!obj || obj.app !== 'dnevnik-treningov' || !Array.isArray(obj.clients)) { toast('To ni datoteka Dnevnika treningov'); return; }
  const apply = () => {
    S.clients = obj.clients; S.sessions = obj.sessions || []; S.exEdits = obj.exEdits || {}; S.exCustom = obj.exCustom || [];
    save.clients(); save.sessions(); save.ex(); S.draft = null; save.draft(); S.clientId = null;
    toast('Uvoženo: ' + S.clients.length + ' strank, ' + S.sessions.length + ' treningov'); S.view = 'week'; render();
  };
  if (S.clients.length || S.sessions.length) {
    confirmModal(`Uvoz bo <b>zamenjal</b> trenutne podatke na tej napravi (${S.clients.length} strank, ${S.sessions.length} treningov) s podatki iz datoteke (${obj.clients.length} strank, ${(obj.sessions || []).length} treningov). Nadaljujem?`, 'Zamenjaj', apply);
  } else apply();
}

// ---------- dogodki ----------
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  if (b.tagName === 'A') ev.preventDefault();
  const f = ACT[b.dataset.act]; if (f) f(b, ev);
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'clientQ') { S.q = t.value; const pos = t.selectionStart; render(); const i = $('#clientQ'); i.focus(); i.setSelectionRange(pos, pos); return; }
  if (t.id === 'clientsQ') { S.q2 = t.value; const pos = t.selectionStart; render(); const i = $('#clientsQ'); i.focus(); i.setSelectionRange(pos, pos); return; }
  if (t.id === 'exQ') { S.exQ = t.value; const pos = t.selectionStart; render(); const i = $('#exQ'); i.focus(); i.setSelectionRange(pos, pos); return; }
  if (t.id === 'pickQ') { S.pickQ = t.value; renderPick(); return; }
  if (t.id === 'dNote') { S.draft.note = t.value; save.draft(); return; }
  if (t.dataset.item != null) { S.draft.items[+t.dataset.item][t.dataset.field] = t.value; save.draft(); return; }
  if (t.dataset.c) { S.editClient[t.dataset.c] = t.type === 'checkbox' ? t.checked : t.value; return; }
  if (t.dataset.e) { S.modalCtx.ex[t.dataset.e] = t.type === 'checkbox' ? t.checked : t.value; return; }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'tplOther' && t.value) { Object.assign(S.draft, { planIdx: -1, tpl: t.value }); generate(false); render(); return; }
  if (t.id === 'dDate') { S.draft.date = t.value || todayISO(); save.draft(); return; }
  if (t.id === 'exRole') { S.exRole = t.value; render(); return; }
  if (t.id === 'exCh') { S.exCh = t.value; render(); return; }
  if (t.dataset.plan != null) { S.editClient.plan[+t.dataset.plan] = t.value; return; }
  if (t.dataset.c) { S.editClient[t.dataset.c] = t.type === 'checkbox' ? t.checked : t.value; return; }
  if (t.dataset.e) { S.modalCtx.ex[t.dataset.e] = t.type === 'checkbox' ? t.checked : t.value; return; }
  if (t.id === 'importFile' && t.files[0]) {
    const r = new FileReader();
    r.onload = () => { try { importData(JSON.parse(r.result)); } catch (e) { toast('Datoteke ni mogoče prebrati'); } };
    r.readAsText(t.files[0]); t.value = '';
  }
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !$('#modal').hidden) closeModal(); });
window.addEventListener('beforeinstallprompt', ev => { ev.preventDefault(); window.__installEvt = ev; if (S.view === 'more') render(); });
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
render();
