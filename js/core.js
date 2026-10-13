/* CCF CW Ushering Ministry ERT portal: shared core (data, sync, layout, shared UI). */
const CONFIG = window.ERT_CONFIG || {};
const ONLINE = !!(CONFIG.firebase && CONFIG.firebase.databaseURL);
const ROLE = document.body.dataset.role; // home | admin | vol | lead
const KEY = 'ccf-cw-ert-v2';
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';

/* ---------- vocabularies ---------- */
const LEVELS = {
  normal:    { name: 'Normal Operations', desc: 'No active emergency. Regular duty schedule.', c: 'emerald' },
  standby:   { name: 'Standby Alert',     desc: 'Possible activation. Report your status.',     c: 'amber' },
  activated: { name: 'ERT Activated',     desc: 'The ERT is responding. Report your status now.', c: 'red' }
};
const VSTATUS = { Ready: 'emerald', Deployed: 'red', Standby: 'amber', Inactive: 'slate', Pending: 'blue' };
const DUTY_TYPES = { 'Sunday Worship Duty': 'blue', 'Emergency Drill': 'amber', 'Major Event Standby': 'emerald', 'Disaster Deployment': 'red', 'Special Ministry Event': 'violet' };
const DLEVELS = { 'CRITICAL ALERT': 'red', 'STANDBY WARNING': 'amber', 'DISPATCH ANNOUNCEMENT': 'blue', 'FIELD REPORT': 'emerald' };
const RC = {
  available: { t: 'Safe and ready', d: 'I can respond if needed', c: 'emerald' },
  safe:      { t: 'Safe, not available', d: 'My family and I are okay', c: 'blue' },
  help:      { t: 'I need help', d: 'Send someone to check on me', c: 'red' }
};
const GEAR_CATS = ['Communications', 'Flags & Marshal', 'Fire Safety', 'Medical', 'Search & Rescue', 'Apparel', 'Other'];
const CONDITIONS = ['Good', 'Needs repair', 'For replacement'];
const BLOOD = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const today = () => iso(new Date());
const dOff = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const nextSunday = () => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7)); return iso(d); };
const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const fmtD = s => s ? new Date(s + 'T00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
const fmtT = t => { if (!t) return ''; let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ' ' + ap; };
const fmtStamp = ms => ms ? new Date(ms).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
const hrs = (a, b) => { if (!a || !b) return 0; const [x, y] = a.split(':').map(Number), [p, q] = b.split(':').map(Number); return Math.max(0, ((p * 60 + q) - (x * 60 + y)) / 60); };
const r1 = n => Math.round(n * 10) / 10;
const initials = n => String(n || '?').replace(/^(Dr|Ptr|Ps|Bro|Sis|Capt|Engr|Atty)\.?\s+/i, '').split(/\s+/).filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase();
const ic = (n, c = 'w-4 h-4') => `<i data-lucide="${n}" class="${c}"></i>`;
const icons = () => { try { window.lucide && window.lucide.createIcons(); } catch (e) {} };

const vol = id => S.volunteers.find(v => v.id === id);
const unit = id => S.units.find(u => u.id === id);
const area = id => S.areas.find(a => a.id === id);
const duty = id => S.duties.find(d => d.id === id);
const unitName = id => unit(id)?.name || 'Unassigned';
const areaName = id => area(id)?.name || '';
const volName = id => vol(id)?.name || 'Not assigned';
const signed = d => Object.keys(d.signups || {});
const activeVols = () => S.volunteers.filter(v => v.status !== 'Inactive' && v.status !== 'Pending');
const volHours = v => (+v.baseHours || 0) + S.duties.reduce((s, d) => { const a = (d.attendance || {})[v.id]; return s + (a ? hrs(a.in, a.out) : 0); }, 0);
const certState = c => !c.expiry ? 'Valid' : c.expiry < today() ? 'Expired' : c.expiry <= dOff(60) ? 'Expiring Soon' : 'Valid';
const volCerts = id => S.certs.filter(c => c.volId === id);
const leadScopes = id => [
  ...S.units.filter(u => u.leadId === id).map(u => ({ kind: 'unit', id: u.id, name: u.name })),
  ...S.areas.filter(a => a.leadId === id).map(a => ({ kind: 'area', id: a.id, name: a.name }))
];
const scopeMembers = sc => activeVols().filter(v => sc.kind === 'unit' ? v.unitId === sc.id : v.areaId === sc.id);
const roleTitle = v => {
  if (!v) return '';
  if (S.org.directorId === v.id) return 'Emergency Director';
  if (S.org.deputyId === v.id) return 'Deputy Emergency Director';
  const u = S.units.find(x => x.leadId === v.id); if (u) return u.name + ' Lead';
  const a = S.areas.find(x => x.leadId === v.id); if (a) return 'Area Lead, ' + a.name;
  return v.position || unitName(v.unitId);
};
const allPositions = () => [...new Set(S.units.flatMap(u => u.positions || []))];

/* ---------- style tokens (Tailwind) ---------- */
const C = {
  card: 'bg-cardBg border border-cardBorder rounded-2xl',
  btn: 'inline-flex items-center justify-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed',
  input: 'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40',
  label: 'block text-xs font-semibold text-slate-400 mb-1.5',
  th: 'p-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider',
  td: 'p-3 align-top'
};
const btnP = C.btn + ' bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20';
const btnS = C.btn + ' bg-slate-800 hover:bg-slate-700 text-white border border-slate-700';
const btnD = C.btn + ' bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20';
const SM = ' !px-2.5 !py-1.5';
const badge = (c, t) => `<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border bg-${c}-500/10 text-${c}-400 border-${c}-500/20 whitespace-nowrap">${esc(t)}</span>`;
const fld = (label, input, hint) => `<div><label class="${C.label}">${label}</label>${input}${hint ? `<p class="text-[11px] text-slate-500 mt-1">${hint}</p>` : ''}</div>`;
const inp = (name, val, attrs = '', type = 'text') => `<input type="${type}" name="${name}" value="${esc(val ?? '')}" class="${C.input}" ${attrs}>`;
const ta = (name, val, attrs = '') => `<textarea name="${name}" rows="3" class="${C.input}" ${attrs}>${esc(val ?? '')}</textarea>`;
const sel = (name, list, val, attrs = '') => `<select name="${name}" class="${C.input}" ${attrs}>${list.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${v === val ? ' selected' : ''}>${esc(t || '—')}</option>`; }).join('')}</select>`;
const grid2 = (...f) => `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${f.join('')}</div>`;
const pageHead = (title, sub, actions = '') => `<div class="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><h2 class="text-xl font-bold tracking-tight text-white">${title}</h2>${sub ? `<p class="text-sm text-slate-400 mt-0.5">${sub}</p>` : ''}</div><div class="flex flex-wrap gap-2">${actions}</div></div>`;
const emptyBox = t => `<div class="border border-dashed border-slate-700 rounded-xl p-6 text-center text-sm text-slate-400">${t}</div>`;
const panelHead = (icon, title, color = 'red', right = '') => `<div class="flex items-center justify-between gap-3 mb-4"><div class="flex items-center gap-2"><span class="text-${color}-400">${ic(icon)}</span><h3 class="font-semibold text-white">${title}</h3></div>${right}</div>`;

/* ---------- local storage helpers ---------- */
const MEM = {};
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return MEM[k] ?? null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { MEM[k] = v; } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { delete MEM[k]; } };
const lsJSON = k => { try { return JSON.parse(lsGet(k) || 'null'); } catch (e) { return null; } };

/* ---------- starting data, tailored to the Ushering Ministry ERT org chart ---------- */
function emptyData() {
  return {
    meta: {},
    org: { ministry: 'Ushering Ministry', title: 'Emergency Response Team (ERT)', church: 'CCF Commonwealth', directorId: '', deputyId: '', advisers: [], viber: '', commandStation: '', firstAidStation: '', ambulancePoint: '' },
    alert: { level: 'normal', note: '', updated: Date.now() },
    rollcall: { startedAt: Date.now(), responses: {} },
    units: [], areas: [], volunteers: [], duties: [], certs: [], gear: [], dispatches: []
  };
}
function orgStructure(D) {
  D.units = [
    { id: 'u-evac', name: 'Evacuation Team / Marshal', leadId: '', positions: ['Exit Doorman', 'Floor/Wing Marshal (Lead Flag)', 'Evacuation Ground Team: Command Station', 'Evacuation Ground Team: Ambulance', 'Evacuation Ground Team: First Aid Station'] },
    { id: 'u-fire', name: 'Fire Fighting', leadId: '', positions: ['Fire Extinguisher Operator'] },
    { id: 'u-sar', name: 'Search & Rescue', leadId: '', positions: ['Sweeper (Tail Flag)'] },
    { id: 'u-med', name: 'Medical Team', leadId: '', positions: ['First Aider (Bandaging, First Aid, Spine Injury Handling)', 'Peacetime Medical Team (Major Events)'] },
    { id: 'u-sec', name: 'Security & Comms', leadId: '', positions: ['Coordinator / Liaison (SAMC)', 'CCF CW Security Guard'] }
  ];
  D.areas = [
    { id: 'a-wh', name: 'Worship Hall Search & Rescue & Evacuation Team', leadId: '', notes: '' },
    { id: 'a-ng', name: 'NextGen Search & Rescue & Evacuation Team', leadId: '', notes: '' },
    { id: 'a-ao', name: 'Admin Office / Welcome Room Search & Rescue & Evacuation Team', leadId: '', notes: '' }
  ];
  D.org.advisers = [
    { id: 'ad1', name: '', role: 'COS Overseer' },
    { id: 'ad2', name: '', role: 'Ushering Ministry Coordinator' },
    { id: 'ad3', name: 'Dr. Bill Lavadia', role: 'Adviser / Consultant' },
    { id: 'ad4', name: 'Noni Manunguit', role: 'Adviser / Consultant' }
  ];
  const base = { phone: '', email: '', emergency: '', blood: '', baseHours: 0, joined: today(), unitId: '', areaId: '', status: 'Ready' };
  D.volunteers = [
    { ...base, id: 'mg', name: 'Mark Gabriel', callSign: 'ERT-Director', position: 'Emergency Director' },
    { ...base, id: 'jg', name: 'Jufil Gamez', callSign: 'ERT-Deputy', position: 'Deputy Emergency Director' }
  ];
  D.org.directorId = 'mg'; D.org.deputyId = 'jg';
  D.gear = [
    ['RADIO-01', '2-way radio', 'Communications'], ['RADIO-02', '2-way radio', 'Communications'], ['RADIO-03', '2-way radio', 'Communications'],
    ['PA-01', 'Ever Annunciator / PA system', 'Communications'], ['FLAG-L01', 'Lead flag', 'Flags & Marshal'], ['FLAG-T01', 'Tail flag', 'Flags & Marshal']
  ].map(([code, name, category]) => ({ id: 'g' + code.toLowerCase(), code, name, category, holderId: '', location: 'ERT cabinet', condition: 'Good', notes: '' }));
  return D;
}
function seed(withSamples = true) {
  const D = orgStructure(emptyData());
  if (!withSamples) return D;
  const rows = [
    ['s1', 'Andrea Santos', 'Medic-01', 'u-med', 'First Aider (Bandaging, First Aid, Spine Injury Handling)', 'a-wh', 'Ready', 'O+'],
    ['s2', 'Paolo Reyes', 'Marshal-01', 'u-evac', 'Floor/Wing Marshal (Lead Flag)', 'a-wh', 'Ready', 'A+'],
    ['s3', 'Jessa Villanueva', 'Door-01', 'u-evac', 'Exit Doorman', 'a-wh', 'Ready', 'B+'],
    ['s4', 'Miguel Cruz', 'Fire-01', 'u-fire', 'Fire Extinguisher Operator', 'a-ng', 'Standby', 'O+'],
    ['s5', 'Karen dela Rosa', 'Sweep-01', 'u-sar', 'Sweeper (Tail Flag)', 'a-ng', 'Ready', 'AB+'],
    ['s6', 'Joshua Bautista', 'Comms-01', 'u-sec', 'Coordinator / Liaison (SAMC)', 'a-ao', 'Ready', 'O-'],
    ['s7', 'Bea Mendoza', 'Medic-02', 'u-med', 'Peacetime Medical Team (Major Events)', 'a-ng', 'Ready', 'A-'],
    ['s8', 'Ramon Aquino', 'Ground-01', 'u-evac', 'Evacuation Ground Team: Command Station', 'a-ao', 'Standby', 'B-'],
    ['s9', 'Liza Navarro', 'Sweep-02', 'u-sar', 'Sweeper (Tail Flag)', 'a-ao', 'Ready', 'O+'],
    ['s10', 'Carlo Gutierrez', 'Sec-01', 'u-sec', 'CCF CW Security Guard', 'a-ao', 'Ready', 'A+'],
    ['s11', 'Trisha Ramos', '', '', '', '', 'Pending', '']
  ];
  rows.forEach(([id, name, callSign, unitId, position, areaId, status, blood], i) => D.volunteers.push({
    id, name, callSign, unitId, position, areaId, status, blood, sample: true,
    phone: '0917 ' + String(300 + i * 41).padStart(3, '0') + ' ' + String(1200 + i * 377).slice(0, 4),
    email: name.split(' ')[0].toLowerCase() + '@example.com', emergency: 'Family contact, 0918 555 ' + String(1000 + i * 91).slice(0, 4),
    baseHours: [24, 30, 12, 8, 16, 20, 10, 6, 4, 18, 0][i], joined: dOff(-300 + i * 20)
  }));
  Object.assign(D.units.find(u => u.id === 'u-evac'), { leadId: 's2' });
  Object.assign(D.units.find(u => u.id === 'u-fire'), { leadId: 's4' });
  Object.assign(D.units.find(u => u.id === 'u-sar'), { leadId: 's5' });
  Object.assign(D.units.find(u => u.id === 'u-med'), { leadId: 's1' });
  Object.assign(D.units.find(u => u.id === 'u-sec'), { leadId: 's6' });
  D.areas[0].leadId = 's3'; D.areas[1].leadId = 's7'; D.areas[2].leadId = 's10';
  const sun = nextSunday();
  D.duties = [
    { id: 'd1', title: 'Sunday Worship Service ERT Duty', type: 'Sunday Worship Duty', date: sun, start: '07:00', end: '13:00', location: 'Worship Hall, NextGen and Admin Office', areaIds: { 'a-wh': true, 'a-ng': true, 'a-ao': true }, slots: 16, leadId: 'jg', status: 'Open', notes: 'Report to the Command Station 30 minutes before the first service. Wear your ERT vest.', sample: true,
      signups: { s1: true, s2: true, s3: true, s5: true, s6: true, s10: true }, posts: { s2: 'Floor/Wing Marshal, Worship Hall', s3: 'Exit Doorman, Door 3', s5: 'Sweeper, NextGen', s6: 'Radio, Command Station' }, attendance: {} },
    { id: 'd2', title: 'Worship Hall Fire & Evacuation Drill', type: 'Emergency Drill', date: dOff(9), start: '14:00', end: '16:00', location: 'Worship Hall', areaIds: { 'a-wh': true }, slots: 20, leadId: 'mg', status: 'Open', notes: 'Full evacuation to the evacuation ground. Marshals bring lead flags, sweepers bring tail flags.', sample: true,
      signups: { s2: true, s3: true, s4: true }, posts: {}, attendance: {} },
    { id: 'd3', title: 'Major Event Peacetime Medical Standby', type: 'Major Event Standby', date: dOff(-6), start: '17:00', end: '21:00', location: 'Worship Hall', areaIds: { 'a-wh': true }, slots: 6, leadId: 's1', status: 'Closed', notes: '', sample: true,
      signups: { s1: true, s7: true }, posts: { s1: 'First Aid Station', s7: 'Roving medic' }, attendance: { s1: { in: '16:45', out: '21:10' }, s7: { in: '17:00', out: '21:00' } } }
  ];
  D.certs = [
    { id: 'c1', volId: 's1', title: 'Standard First Aid & BLS', issuer: 'Philippine Red Cross', expiry: dOff(300) },
    { id: 'c2', volId: 's7', title: 'Basic Life Support (BLS)', issuer: 'Philippine Red Cross', expiry: dOff(40) },
    { id: 'c3', volId: 's4', title: 'Fire Safety & Extinguisher Use', issuer: 'BFP Quezon City', expiry: dOff(-10) },
    { id: 'c4', volId: 's6', title: 'Radio Operator Orientation', issuer: 'CCF ERT', expiry: '' }
  ];
  const holders = { 'RADIO-01': 's6', 'RADIO-02': 's2', 'FLAG-L01': 's2', 'FLAG-T01': 's5' };
  D.gear.forEach(g => { if (holders[g.code]) { g.holderId = holders[g.code]; g.location = ''; } });
  D.gear.find(g => g.code === 'PA-01').location = 'Sound booth, Worship Hall';
  D.gear.push(
    { id: 'gfe01', code: 'FE-01', name: 'Fire extinguisher (dry chemical)', category: 'Fire Safety', holderId: '', location: 'Worship Hall, east exit', condition: 'Good', notes: '', sample: true },
    { id: 'gfak01', code: 'FAK-01', name: 'First aid kit', category: 'Medical', holderId: 's1', location: '', condition: 'Good', notes: '', sample: true },
    { id: 'gspine01', code: 'SPINE-01', name: 'Spine board with head immobilizer', category: 'Medical', holderId: '', location: 'First Aid Station', condition: 'Needs repair', notes: 'One strap torn', sample: true }
  );
  D.dispatches = [
    { id: 'x1', time: Date.now() - 2 * 3600e3, level: 'DISPATCH ANNOUNCEMENT', msg: 'Sunday ERT duty roster is up. Sign up for your post under Duties.', sender: 'Jufil Gamez', senderId: 'jg', audience: 'all', sample: true },
    { id: 'x2', time: Date.now() - 6 * 86400e3, level: 'FIELD REPORT', msg: 'Peacetime medical standby: 3 minor cases handled at the First Aid Station, no referrals. Spine board strap needs replacement.', sender: 'Andrea Santos', senderId: 's1', audience: 'u-med', sample: true }
  ];
  return D;
}

/* ---------- normalising data (Firebase drops empty lists and returns maps) ---------- */
const arr = x => Array.isArray(x) ? x.filter(y => y != null) : Object.values(x || {});
const byId = a => Object.fromEntries((a || []).map(x => [x.id, x]));
function normalize(v) {
  const E = emptyData();
  v = v || {};
  return {
    meta: v.meta || {},
    org: { ...E.org, ...(v.org || {}), advisers: arr(v.org?.advisers) },
    alert: { ...E.alert, ...(v.alert || {}) },
    rollcall: { startedAt: v.rollcall?.startedAt || Date.now(), responses: v.rollcall?.responses || {} },
    units: arr(v.units).map(u => ({ leadId: '', ...u, positions: arr(u.positions) })),
    areas: arr(v.areas).map(a => ({ leadId: '', notes: '', ...a })),
    volunteers: arr(v.volunteers),
    duties: arr(v.duties).map(d => ({ ...d, areaIds: d.areaIds || {}, signups: d.signups || {}, posts: d.posts || {}, attendance: d.attendance || {} })),
    certs: arr(v.certs), gear: arr(v.gear), dispatches: arr(v.dispatches)
  };
}
function toDB(D) {
  const c = JSON.parse(JSON.stringify(D));
  ['units', 'areas', 'volunteers', 'duties', 'certs', 'gear', 'dispatches'].forEach(k => c[k] = byId(c[k]));
  c.org.advisers = byId(c.org.advisers);
  return c;
}
function flat(o, p, out) {
  if (o === null || o === undefined) return out;
  if (typeof o !== 'object') { out[p] = o; return out; }
  for (const k in o) flat(o[k], p ? p + '/' + k : k, out);
  return out;
}
function diff(a, b) {
  const A = flat(a, '', {}), B = flat(b, '', {}), up = {};
  for (const k in B) if (A[k] !== B[k]) up[k] = B[k];
  const sets = Object.keys(up);
  for (const k in A) if (!(k in B) && !sets.some(s => s.startsWith(k + '/') || k.startsWith(s + '/'))) up[k] = null;
  return up;
}

/* ---------- sync ---------- */
let S = null, lastDB = null, dbRef = null, screen = null, errMsg = '', conn = ONLINE ? 'connecting' : 'local';
let pendingRender = false, curView = null, session = null;
const ui = { q: '', unit: 'ALL', status: 'ALL', cq: '', scope: null };

function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src)); document.head.appendChild(s); }); }
async function hash(s) {
  s = 'ccf-cw-ert:' + s;
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return 'f' + (h >>> 0).toString(16); }
}

async function boot() {
  const p = new URLSearchParams(location.search).get('code');
  if (p) { lsSet('ert-code', p.trim()); history.replaceState(null, '', location.pathname); }
  if (!ONLINE) {
    const raw = lsJSON(KEY);
    S = normalize(raw || seed(true));
    if (!raw) save();
    window.addEventListener('storage', e => { if (e.key === KEY && e.newValue) { S = normalize(JSON.parse(e.newValue)); requestRender(); } });
    render(); return;
  }
  screen = 'connecting'; render();
  try {
    await loadScript(FB + 'firebase-app-compat.js');
    await loadScript(FB + 'firebase-database-compat.js');
    firebase.initializeApp(CONFIG.firebase);
  } catch (e) { screen = 'error'; errMsg = 'Could not load the online database. Check the internet connection, then reload the page.'; render(); return; }
  firebase.database().ref('.info/connected').on('value', s => { conn = s.val() ? 'live' : 'offline'; const el = $('#conn'); if (el) el.outerHTML = connPill(); });
  const code = lsGet('ert-code');
  if (!code) { screen = 'code'; render(); return; }
  connect(code);
}
function connect(code) {
  if (dbRef) dbRef.off();
  screen = 'connecting'; render();
  dbRef = firebase.database().ref('ert/' + code);
  dbRef.on('value', snap => {
    const v = snap.val();
    if (!v || !v.meta || !v.meta.created) { S = null; lastDB = null; screen = 'nospace'; render(); return; }
    lastDB = v; S = normalize(v);
    const first = screen !== null; screen = null;
    first ? render() : requestRender();
  }, err => {
    screen = 'error';
    errMsg = err && err.code === 'PERMISSION_DENIED' ? 'The database refused access. Check that the rules from database.rules.json are published in Firebase and that the access code is at least 8 characters.' : (err && err.message) || 'Connection failed.';
    render();
  });
}
function save() {
  if (!S) return;
  if (!ONLINE) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Not saved', 'This browser is blocking storage. Export a backup in Settings.', 'err'); } return; }
  if (!dbRef) return;
  const nd = toDB(S), up = diff(lastDB || {}, nd); lastDB = nd;
  if (Object.keys(up).length) dbRef.update(up).catch(e => toast('Not saved', e.message, 'err'));
}
function editing() {
  const a = document.activeElement;
  return $('#modal').innerHTML !== '' || (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox' && a.type !== 'radio');
}
function requestRender() { if (editing()) { pendingRender = true; return; } render(); }
function flushRender() { if (pendingRender && !editing()) { pendingRender = false; render(); } }
function connPill() {
  const m = { live: ['emerald', 'Live, synced'], offline: ['amber', 'Offline, will sync'], connecting: ['slate', 'Connecting'], local: ['slate', 'Saved on this device'] }[conn];
  return `<span id="conn">${badge(m[0], m[1])}</span>`;
}

/* ---------- sessions ---------- */
function getSession() {
  if (!S) return null;
  if (ROLE === 'vol') { const id = lsGet('ert-vol'); const v = id && vol(id); return v && v.status !== 'Inactive' ? { role: 'vol', id, name: v.name } : null; }
  if (ROLE === 'lead') {
    const o = lsJSON('ert-lead');
    if (!o || !S.meta.leaderPinHash || o.h !== S.meta.leaderPinHash) return null;
    const sc = leadScopes(o.id); if (!sc.length) return null;
    return { role: 'lead', id: o.id, name: vol(o.id).name, scopes: sc };
  }
  if (ROLE === 'admin') {
    const o = lsJSON('ert-admin');
    if (!o || !S.meta.adminPinHash || o.h !== S.meta.adminPinHash) return null;
    return { role: 'admin', id: o.id || '', name: vol(o.id)?.name || 'ERT Command' };
  }
  return null;
}
const SESSION_KEY = { vol: 'ert-vol', lead: 'ert-lead', admin: 'ert-admin' };

/* ---------- layout ---------- */
const NAV = {}, VIEWS = {}, LOGIN = {}, FILTER = {};
const ROLE_LABEL = { admin: 'Volunteer Management', vol: 'Volunteer Portal', lead: "Team Leader's Portal" };

function logo(size = 'w-6 h-6') { return `<div class="bg-gradient-to-br from-red-600 to-amber-600 p-2.5 rounded-xl shadow-lg shadow-red-900/30 flex items-center justify-center">${ic('shield-alert', size + ' text-white')}</div>`; }
function render() {
  const root = $('#app');
  if (screen) { root.innerHTML = SCREENS[screen](); icons(); return; }
  if (!S) { root.innerHTML = SCREENS.connecting(); icons(); return; }
  if (ROLE === 'home') { session = null; root.innerHTML = homeScreen(); icons(); return; }
  session = getSession();
  if (!session) { root.innerHTML = gate(LOGIN[ROLE]()); icons(); return; }
  if (ROLE === 'lead' && (!ui.scope || !session.scopes.find(s => s.kind + s.id === ui.scope))) ui.scope = session.scopes[0].kind + session.scopes[0].id;
  const nav = NAV[ROLE];
  if (!nav.find(n => n[0] === curView)) curView = nav[0][0];
  root.innerHTML = header() + `<div class="flex-1 flex flex-col lg:flex-row">${sidebar(nav)}<main class="flex-1 min-w-0 p-4 lg:p-8 space-y-6">${alertBanner()}${VIEWS[ROLE][curView]()}</main></div>`;
  icons();
}
function header() {
  const L = LEVELS[S.alert.level] || LEVELS.normal;
  const statusEl = `<span class="w-2.5 h-2.5 rounded-full bg-${L.c}-500 ${S.alert.level !== 'normal' ? 'animate-pulse' : ''}"></span><span class="text-slate-300 font-medium">${L.name}</span>`;
  const status = ROLE === 'admin'
    ? `<button data-act="alertEdit" class="hidden md:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs hover:border-slate-600" title="Change ERT status">${statusEl}</button>`
    : `<div class="hidden md:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">${statusEl}</div>`;
  const action = ROLE === 'vol'
    ? (S.org.viber ? `<a href="${esc(S.org.viber)}" target="_blank" rel="noopener" class="${btnS}">${ic('message-circle')}<span class="hidden sm:inline">ERT Viber GC</span></a>` : '')
    : `<button data-act="broadcast" class="${btnP}">${ic('radio')}<span class="hidden sm:inline">${ROLE === 'admin' ? 'Emergency Dispatch' : 'Post to Log'}</span></button>`;
  const who = ROLE === 'admin' ? session.name : session.name;
  const sub = ROLE === 'admin' ? (session.id ? roleTitle(vol(session.id)) : 'Volunteer Management') : roleTitle(vol(session.id));
  return `<header class="bg-cardBg border-b border-cardBorder sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">${logo()}
      <div class="min-w-0"><div class="flex items-center gap-2"><h1 class="font-bold text-lg tracking-tight text-white whitespace-nowrap">CCF CW ERT</h1><span class="hidden sm:inline text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">${ROLE_LABEL[ROLE]}</span></div>
      <p class="text-xs text-slate-400 truncate">${esc(S.org.church)} • ${esc(S.org.ministry)} ${esc(S.org.title)}</p></div></div>
    <div class="flex items-center gap-3">${status}${action}
      <div class="flex items-center gap-2 pl-2 border-l border-slate-800"><div class="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow">${esc(initials(who))}</div>
      <div class="hidden xl:block"><div class="text-xs font-semibold leading-tight">${esc(who)}</div><div class="text-[10px] text-slate-400">${esc(sub)}</div></div></div></div>
  </header>`;
}
function sidebar(nav) {
  const act = activeVols(), ready = act.filter(v => v.status === 'Ready').length, pct = act.length ? Math.round(ready / act.length * 100) : 0;
  const pending = S.volunteers.filter(v => v.status === 'Pending').length;
  return `<aside class="w-full lg:w-64 bg-cardBg border-b lg:border-b-0 lg:border-r border-cardBorder p-4 flex flex-col justify-between shrink-0 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:overflow-y-auto">
    <nav class="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0" aria-label="Sections">
      <div class="hidden lg:block text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-2">${ROLE === 'vol' ? 'My ERT' : ROLE === 'lead' ? 'Team Command' : 'Operations Center'}</div>
      ${nav.map(([k, t, i]) => `<button data-act="nav" data-v="${k}" ${k === curView ? 'aria-current="page"' : ''} class="shrink-0 w-auto lg:w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-left whitespace-nowrap ${k === curView ? 'bg-red-600/10 text-red-400 border border-red-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'}">${ic(i)}<span>${t}</span>${ROLE === 'admin' && k === 'directory' && pending ? `<span class="ml-auto text-[10px] bg-blue-500 text-white rounded-full px-1.5">${pending}</span>` : ''}</button>`).join('')}
    </nav>
    <div class="hidden lg:block mt-6 pt-4 border-t border-slate-800/80 space-y-3">
      <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800"><div class="flex justify-between items-center text-xs mb-1"><span class="text-slate-400">Readiness capacity</span><span class="text-emerald-400 font-bold">${pct}%</span></div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div class="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full" style="width:${pct}%"></div></div>
        <div class="text-[11px] text-slate-500 mt-1">${ready} of ${act.length} volunteers ready</div></div>
      <div class="flex items-center justify-between">${connPill()}</div>
      <div class="flex gap-2"><a href="index.html" class="${btnS + SM} flex-1">${ic('layout-grid', 'w-3.5 h-3.5')}Portals</a><button data-act="logout" class="${btnS + SM} flex-1">${ic('log-out', 'w-3.5 h-3.5')}Sign out</button></div>
    </div>
    <div class="flex lg:hidden gap-2 mt-3 items-center">${connPill()}<a href="index.html" class="${btnS + SM} ml-auto">Portals</a><button data-act="logout" class="${btnS + SM}">Sign out</button></div>
  </aside>`;
}
function alertBanner() {
  const a = S.alert; if (a.level === 'normal') return '';
  const L = LEVELS[a.level];
  let btn = '';
  if (ROLE === 'admin') btn = `<button data-act="alertEdit" class="${btnS}">Change status</button>`;
  else if (ROLE === 'vol' && curView !== 'home') btn = `<button data-act="nav" data-v="home" class="${btnP}">Report my status</button>`;
  else if (ROLE === 'lead' && curView !== 'roll') btn = `<button data-act="nav" data-v="roll" class="${btnP}">Open roll call</button>`;
  const stations = [['Command Station', S.org.commandStation], ['First Aid Station', S.org.firstAidStation], ['Ambulance', S.org.ambulancePoint]].filter(x => x[1]);
  return `<div class="rounded-2xl border p-4 lg:p-5 bg-${L.c}-500/10 border-${L.c}-500/30 ${a.level === 'activated' ? 'bg-[repeating-linear-gradient(-45deg,rgba(239,68,68,.16)_0_18px,rgba(239,68,68,.06)_18px_36px)]' : ''}">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3"><div class="flex items-start gap-3"><div class="p-2 rounded-xl bg-${L.c}-500/20 text-${L.c}-400">${ic(a.level === 'activated' ? 'siren' : 'alert-triangle', 'w-5 h-5')}</div>
    <div><div class="font-bold text-${L.c}-400 uppercase tracking-wide text-sm">${L.name}</div><p class="text-white text-sm mt-0.5">${esc(a.note || L.desc)}</p>
    <p class="text-[11px] text-slate-400 mt-1">Updated ${fmtStamp(a.updated)}${stations.length ? ' • ' + stations.map(s => `${s[0]}: <span class="text-slate-200">${esc(s[1])}</span>`).join(' • ') : ''}</p></div></div>${btn}</div></div>`;
}
function gate(inner) {
  return `<div class="flex-1 flex items-start justify-center p-4 pt-[8vh]"><div class="w-full max-w-md space-y-5">
    <div class="flex items-center gap-3">${logo()}<div><div class="font-bold text-lg text-white leading-tight">CCF CW ERT</div><div class="text-xs text-slate-400">${S ? esc(S.org.ministry + ' ' + S.org.title) : 'Emergency Response Team'}</div></div></div>
    ${inner}<p class="text-center text-xs text-slate-500"><a href="index.html" class="hover:text-slate-300">All portals</a></p></div></div>`;
}
function homeScreen() {
  const L = LEVELS[S.alert.level];
  const door = (href, icon, color, title, desc) => `<a href="${href}" class="group block ${C.card} p-5 hover:border-${color}-500/50 transition"><div class="flex items-start gap-4"><div class="p-3 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20">${ic(icon, 'w-6 h-6')}</div><div class="flex-1"><h3 class="font-bold text-white text-lg">${title}</h3><p class="text-sm text-slate-400 mt-0.5">${desc}</p></div><span class="text-slate-500 group-hover:text-white mt-1">${ic('chevron-right', 'w-5 h-5')}</span></div></a>`;
  return `<div class="max-w-2xl w-full mx-auto p-4 py-10 space-y-6">
    <div class="flex items-center gap-4">${logo('w-8 h-8')}<div><h1 class="text-2xl font-bold text-white tracking-tight">${esc(S.org.ministry)} ${esc(S.org.title)}</h1><p class="text-sm text-slate-400">${esc(S.org.church)}</p></div></div>
    <div class="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 text-sm w-fit"><span class="w-2.5 h-2.5 rounded-full bg-${L.c}-500 ${S.alert.level !== 'normal' ? 'animate-pulse' : ''}"></span><span class="font-semibold text-${L.c}-400">${L.name}</span>${S.alert.note ? `<span class="text-slate-400">${esc(S.alert.note)}</span>` : ''}</div>
    <div class="space-y-3">
      ${door('volunteer.html', 'user-check', 'emerald', 'Volunteer Portal', 'Report your status, sign up for duty, check in, and keep your profile and certifications current.')}
      ${door('leader.html', 'flag', 'amber', "Team Leader's Portal", 'For unit and area leads: run roll call, post members to duty, track attendance and gear, file field reports.')}
      ${door('admin.html', 'shield', 'red', 'Volunteer Management', 'For the Emergency Director and Deputy: org chart, roster, duties, certifications, gear, dispatch log and settings.')}
    </div>
    <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">${connPill()}${ONLINE ? `<span>Team space: <b class="text-slate-300">${esc(lsGet('ert-code'))}</b></span><button data-act="changeCode" class="underline hover:text-slate-300">Use a different code</button>` : '<span>Offline mode: records are saved in this browser only. See README.md to put the portal online.</span>'}</div>
  </div>`;
}
const SCREENS = {
  connecting: () => `<div class="flex-1 flex items-center justify-center p-6 text-slate-400 gap-3">${ic('loader-2', 'w-5 h-5 animate-spin')}Connecting to the ERT database…</div>`,
  code: () => gate(`<div class="${C.card} p-6 space-y-4"><div><h2 class="text-lg font-bold text-white">Enter the team access code</h2><p class="text-sm text-slate-400 mt-1">Your ERT director shares this code, or a link that already includes it.</p></div>
    <form data-form="code" class="space-y-4">${fld('Access code', inp('code', '', 'required minlength="8" autocomplete="off" autocapitalize="off" spellcheck="false"'))}<button class="${btnP} w-full">Continue</button></form></div>`),
  nospace: () => gate(`<div class="${C.card} p-6 space-y-4"><div><h2 class="text-lg font-bold text-white">No ERT records found for this code</h2><p class="text-sm text-slate-400 mt-1">Code: <b class="text-slate-200">${esc(lsGet('ert-code'))}</b>. Check it with your ERT director.</p></div>
    ${ROLE === 'admin' && typeof createSpaceForm === 'function' ? createSpaceForm() : `<p class="text-sm text-slate-400">The Emergency Director creates the team records from Volunteer Management.</p>`}
    <button data-act="changeCode" class="${btnS} w-full">Enter a different code</button></div>`),
  error: () => gate(`<div class="${C.card} p-6 space-y-4"><h2 class="text-lg font-bold text-white">Can't reach the ERT database</h2><p class="text-sm text-slate-400">${esc(errMsg)}</p><div class="flex gap-2"><button data-act="reload" class="${btnP}">Try again</button>${lsGet('ert-code') ? `<button data-act="changeCode" class="${btnS}">Use a different code</button>` : ''}</div></div>`)
};

/* ---------- modal & toast ---------- */
function modal({ title, sub = '', icon = 'pencil', body, form = null, submit = 'Save', wide = false, left = '' }) {
  const tag = form ? 'form' : 'div';
  $('#modal').innerHTML = `<div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" data-act="closeModal" data-self="1">
    <div class="bg-cardBg border border-cardBorder rounded-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} shadow-2xl relative my-6" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <button type="button" data-act="closeModal" class="absolute top-4 right-4 text-slate-400 hover:text-white" aria-label="Close">${ic('x', 'w-5 h-5')}</button>
      <div class="flex items-center gap-3 p-6 pb-4 pr-12"><div class="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">${ic(icon, 'w-6 h-6')}</div><div><h3 class="text-lg font-bold text-white">${esc(title)}</h3>${sub ? `<p class="text-xs text-slate-400">${esc(sub)}</p>` : ''}</div></div>
      <${tag} ${form ? `data-form="${form}"` : ''} class="px-6 pb-6 space-y-4">${body}
        <div class="flex flex-wrap justify-between gap-2 pt-2 border-t border-slate-800/80 mt-2 !pt-4"><div>${left}</div><div class="flex gap-2"><button type="button" data-act="closeModal" class="${btnS}">${form ? 'Cancel' : 'Close'}</button>${form && submit ? `<button class="${btnP}">${submit}</button>` : ''}</div></div>
      </${tag}></div></div>`;
  icons();
  const f = $('#modal [name]:not([type=hidden])'); if (f) f.focus();
}
function closeModal() { $('#modal').innerHTML = ''; flushRender(); }
function toast(title, desc = '', kind = 'ok') {
  const el = $('#toast');
  el.innerHTML = `<div class="p-1.5 rounded-lg ${kind === 'err' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}">${ic(kind === 'err' ? 'alert-triangle' : 'check')}</div><div><div class="font-bold">${esc(title)}</div>${desc ? `<div class="text-slate-400 text-[11px]">${esc(desc)}</div>` : ''}</div>`;
  icons(); el.classList.remove('translate-y-24', 'opacity-0');
  clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.add('translate-y-24', 'opacity-0'), 3200);
}
function download(name, text, type) { const b = new Blob([text], { type }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

/* ---------- shared components ---------- */
function volStatusBadge(v) { return badge(VSTATUS[v.status] || 'slate', v.status); }
function dutyCard(d, actions = '', extra = '') {
  const c = DUTY_TYPES[d.type] || 'slate', n = signed(d).length, pct = Math.min(100, Math.round(n / Math.max(1, d.slots) * 100));
  const areas = Object.keys(d.areaIds || {}).map(areaName).filter(Boolean);
  return `<div class="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      <div class="flex items-start gap-3 min-w-0"><div class="p-2.5 rounded-xl bg-${c}-500/10 text-${c}-400 border border-${c}-500/20 shrink-0">${ic(d.type === 'Emergency Drill' ? 'siren' : d.type === 'Disaster Deployment' ? 'life-buoy' : 'calendar')}</div>
        <div class="min-w-0"><h4 class="font-semibold text-white">${esc(d.title)}</h4>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1"><span class="inline-flex items-center gap-1">${ic('clock', 'w-3.5 h-3.5')}${fmtD(d.date)}, ${fmtT(d.start)} to ${fmtT(d.end)}</span><span class="inline-flex items-center gap-1">${ic('map-pin', 'w-3.5 h-3.5')}${esc(d.location)}</span><span class="inline-flex items-center gap-1">${ic('user', 'w-3.5 h-3.5')}${esc(volName(d.leadId))}</span></div>
          ${areas.length ? `<div class="text-[11px] text-slate-500 mt-1">${areas.map(esc).join(', ')}</div>` : ''}</div></div>
      <div class="flex flex-wrap gap-1.5 sm:justify-end shrink-0">${badge(c, d.type)}${badge(d.status === 'Closed' ? 'slate' : d.status === 'Ongoing' ? 'amber' : 'emerald', d.status)}</div></div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div class="w-full sm:max-w-xs"><div class="flex justify-between text-[11px] text-slate-400 mb-1"><span>Volunteers</span><span>${n} / ${d.slots}</span></div><div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div class="h-full rounded-full ${n >= d.slots ? 'bg-amber-500' : 'bg-emerald-500'}" style="width:${pct}%"></div></div></div>
      <div class="flex flex-wrap gap-2">${actions}</div></div>${extra}</div>`;
}
function dispatchItem(d, canEdit) {
  const c = DLEVELS[d.level] || 'slate';
  const aud = d.audience === 'all' ? 'All ERT' : (unit(d.audience)?.name || area(d.audience)?.name || 'Team');
  return `<div class="flex gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
    <div class="p-2 h-fit rounded-lg bg-${c}-500/10 text-${c}-400 border border-${c}-500/20">${ic(d.level === 'FIELD REPORT' ? 'clipboard-list' : 'radio')}</div>
    <div class="flex-1 min-w-0"><div class="flex flex-wrap items-center justify-between gap-2"><span class="text-[11px] font-bold text-${c}-400 tracking-wide">${esc(d.level)}</span><span class="text-[11px] text-slate-500">${fmtStamp(d.time)}</span></div>
      <p class="text-sm text-slate-200 mt-1 whitespace-pre-wrap break-words">${esc(d.msg)}</p>
      <div class="flex flex-wrap items-center justify-between gap-2 mt-1.5"><div class="text-[11px] text-slate-500">${esc(d.sender)} • ${esc(aud)}</div>
      ${canEdit ? `<div class="flex gap-1.5"><button data-act="dispatchEdit" data-id="${d.id}" class="${btnS + SM}">Edit</button><button data-act="dispatchDel" data-id="${d.id}" class="${btnD + SM}" aria-label="Delete">${ic('trash-2', 'w-3.5 h-3.5')}</button></div>` : ''}</div></div></div>`;
}
function visibleDispatches(v) {
  const scopes = new Set(['all']); if (v) { if (v.unitId) scopes.add(v.unitId); if (v.areaId) scopes.add(v.areaId); }
  return S.dispatches.filter(d => ROLE === 'admin' || scopes.has(d.audience) || (session && d.senderId === session.id)).sort((a, b) => b.time - a.time);
}
function rcSelfPanel(v) {
  if (S.alert.level === 'normal') return '';
  const r = S.rollcall.responses[v.id];
  return `<div class="${C.card} p-5 border-2 !border-${LEVELS[S.alert.level].c}-500/40">${panelHead('hand', 'Are you safe? Report your status', LEVELS[S.alert.level].c)}
    <p class="text-sm text-slate-400 -mt-2 mb-4">${r ? `You reported at ${fmtStamp(r.time)}. Tap again if your situation changes.` : 'Your team lead is waiting for your status.'}</p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">${Object.entries(RC).map(([k, o]) => `<button data-act="rc" data-s="${k}" aria-pressed="${r?.s === k}" class="text-left p-4 rounded-xl border-2 transition ${r?.s === k ? `border-${o.c}-500 bg-${o.c}-500/15` : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'}"><div class="font-bold text-${o.c}-400">${o.t}</div><div class="text-xs text-slate-400">${o.d}</div></button>`).join('')}</div>
    <div class="mt-4">${fld('Note for your team lead (optional)', `<input id="rcnote" type="text" class="${C.input}" placeholder="Example: flooding on our street, can leave after 2 PM" value="${esc(r?.note || '')}">`)}</div></div>`;
}
function rcSummary(ids) {
  const R = S.rollcall.responses, c = { available: 0, safe: 0, help: 0, none: 0 };
  ids.forEach(id => { const r = R[id]; c[r ? r.s : 'none']++; });
  const tot = Math.max(1, ids.length), col = { help: 'bg-red-500', available: 'bg-emerald-500', safe: 'bg-blue-500' };
  return { c, html: `<div class="flex h-3 rounded-full overflow-hidden bg-slate-800 mb-3">${['help', 'available', 'safe'].map(k => `<div class="${col[k]}" style="width:${c[k] / tot * 100}%"></div>`).join('')}</div>
    <div class="flex flex-wrap gap-2">${['help', 'available', 'safe'].map(k => badge(RC[k].c, RC[k].t + ': ' + c[k])).join('')}${badge('slate', 'No response: ' + c.none)}</div>` };
}
function rcTable(list, editable) {
  const R = S.rollcall.responses, order = { help: 0, none: 1, available: 2, safe: 3 };
  list = [...list].sort((a, b) => order[R[a.id]?.s || 'none'] - order[R[b.id]?.s || 'none']);
  if (!list.length) return emptyBox('No volunteers here yet.');
  return `<div class="${C.card} overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-900/60 border-b border-slate-800"><tr><th class="${C.th}">Volunteer</th><th class="${C.th}">Unit / Area</th><th class="${C.th}">Status</th><th class="${C.th}">Note</th><th class="${C.th}">Reported</th>${editable ? `<th class="${C.th}">Set after calling</th>` : ''}</tr></thead>
  <tbody class="divide-y divide-slate-800">${list.map(v => { const r = R[v.id]; return `<tr class="hover:bg-slate-900/40"><td class="${C.td}"><div class="font-semibold text-white">${esc(v.name)}</div><a class="text-xs text-blue-400" href="tel:${esc(v.phone)}">${esc(v.phone)}</a></td>
    <td class="${C.td} text-slate-300 text-xs">${esc(unitName(v.unitId))}<div class="text-slate-500">${esc(areaName(v.areaId))}</div></td><td class="${C.td}">${r ? badge(RC[r.s].c, RC[r.s].t) : badge('slate', 'No response')}</td>
    <td class="${C.td} text-slate-300 text-xs">${esc(r?.note || '')}</td><td class="${C.td} text-slate-500 text-xs whitespace-nowrap">${r ? fmtStamp(r.time) : ''}</td>
    ${editable ? `<td class="${C.td}"><select data-rcset="${v.id}" class="${C.input} !py-1 !text-xs" aria-label="Set status for ${esc(v.name)}"><option value="">Choose</option>${Object.entries(RC).map(([k, o]) => `<option value="${k}">${o.t}</option>`).join('')}</select></td>` : ''}</tr>`; }).join('')}</tbody></table></div>`;
}
function attTable(d, ids, canEdit) {
  if (!ids.length) return emptyBox('No volunteers on this roster yet.');
  return `<div class="overflow-x-auto border border-slate-800 rounded-xl"><table class="w-full text-sm"><thead class="bg-slate-900/60 border-b border-slate-800"><tr><th class="${C.th}">Volunteer</th><th class="${C.th}">Post</th><th class="${C.th}">Time in</th><th class="${C.th}">Time out</th><th class="${C.th}">Hours</th>${canEdit ? `<th class="${C.th}"></th>` : ''}</tr></thead>
  <tbody class="divide-y divide-slate-800">${ids.map(id => { const v = vol(id); if (!v) return ''; const a = d.attendance[id] || {}; const post = d.posts[id] || '';
    return `<tr><td class="${C.td}"><div class="font-semibold text-white">${esc(v.name)}</div><div class="text-[11px] text-slate-500">${esc(v.callSign || '')} ${v.callSign ? '•' : ''} ${esc(unitName(v.unitId))}</div></td>
    <td class="${C.td}">${canEdit ? `<input list="post-list" data-post="${d.id}|${id}" value="${esc(post)}" placeholder="${esc(v.position || 'Assign a post')}" class="${C.input} !py-1 !text-xs min-w-[170px]">` : `<span class="text-slate-300 text-xs">${esc(post || v.position || '')}</span>`}</td>
    <td class="${C.td}">${canEdit ? `<input type="time" value="${a.in || ''}" data-att="${d.id}|${id}|in" class="${C.input} !py-1 !text-xs w-28" aria-label="Time in">` : fmtT(a.in)}</td>
    <td class="${C.td}">${canEdit ? `<input type="time" value="${a.out || ''}" data-att="${d.id}|${id}|out" class="${C.input} !py-1 !text-xs w-28" aria-label="Time out">` : fmtT(a.out)}</td>
    <td class="${C.td} text-slate-300">${r1(hrs(a.in, a.out)) || ''}</td>
    ${canEdit ? `<td class="${C.td} whitespace-nowrap text-right">${!a.in ? `<button data-act="stamp" data-d="${d.id}" data-vid="${id}" data-f="in" class="${btnS + SM}">Check in</button>` : !a.out ? `<button data-act="stamp" data-d="${d.id}" data-vid="${id}" data-f="out" class="${btnS + SM}">Check out</button>` : ''} <button data-act="unsign" data-d="${d.id}" data-vid="${id}" class="${btnD + SM}" aria-label="Remove from roster">${ic('user-minus', 'w-3.5 h-3.5')}</button></td>` : ''}</tr>`; }).join('')}</tbody></table></div>
  <datalist id="post-list">${allPositions().map(p => `<option value="${esc(p)}">`).join('')}</datalist>`;
}
function addToRoster(d, candidates) {
  if (d.status === 'Closed' || !candidates.length) return '';
  return `<div class="flex flex-wrap gap-2 items-center"><select id="add-${d.id}" class="${C.input} !w-auto !py-1.5 !text-xs" aria-label="Add volunteer">${candidates.map(v => `<option value="${v.id}">${esc(v.name)} (${esc(v.status)})</option>`).join('')}</select><button data-act="rosterAdd" data-d="${d.id}" class="${btnS + SM}">${ic('user-plus', 'w-3.5 h-3.5')}Add to roster</button></div>`;
}
function volFields(v, admin) {
  const units = [['', 'Unassigned'], ...S.units.map(u => [u.id, u.name])], areas = [['', 'No area team'], ...S.areas.map(a => [a.id, a.name])];
  return `${admin ? `<input type="hidden" name="id" value="${esc(v.id || '')}">` : ''}
    ${grid2(fld('Full name', inp('name', v.name, 'required')), fld('Call sign', inp('callSign', v.callSign, 'placeholder="e.g. Marshal-02"')))}
    ${grid2(fld('Contact number', inp('phone', v.phone, 'placeholder="0917 000 0000"', 'tel')), fld('Email address', inp('email', v.email, '', 'email')))}
    ${grid2(fld('Emergency contact', inp('emergency', v.emergency, 'placeholder="Name and number"')), fld('Blood type', sel('blood', BLOOD, v.blood || '')))}
    ${admin ? grid2(fld('Unit', sel('unitId', units, v.unitId || '')), fld('Area team', sel('areaId', areas, v.areaId || ''))) +
      grid2(fld('Position', `<input name="position" list="pos-list" value="${esc(v.position || '')}" class="${C.input}" placeholder="Pick or type a position"><datalist id="pos-list">${allPositions().map(p => `<option value="${esc(p)}">`).join('')}</datalist>`),
        fld('Status', sel('status', Object.keys(VSTATUS), v.status || 'Ready'))) +
      fld('Hours from earlier records', inp('baseHours', v.baseHours || 0, 'min="0" step="0.5"', 'number')) : ''}`;
}
function volFromForm(f, v) {
  ['name', 'callSign', 'phone', 'email', 'emergency', 'blood'].forEach(k => v[k] = (f.get(k) || '').trim());
  return v;
}

function gearCard(g, full) {
  return `<div class="${C.card} p-4 space-y-3"><div class="flex items-center justify-between gap-2"><span class="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-mono">${esc(g.code)}</span><div class="flex gap-1">${g.condition !== 'Good' ? badge(g.condition === 'Needs repair' ? 'amber' : 'red', g.condition) : ''}${g.holderId ? badge('blue', 'Assigned') : badge('emerald', 'Available')}</div></div>
    <div><h4 class="font-semibold text-white">${esc(g.name)}</h4><p class="text-xs text-slate-400">Category: ${esc(g.category)}</p>${g.notes ? `<p class="text-xs text-slate-500 mt-1">${esc(g.notes)}</p>` : ''}</div>
    <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs"><span class="text-slate-400 min-w-0 truncate">${g.holderId ? 'Holder' : 'Location'}: <strong class="text-white">${esc(g.holderId ? volName(g.holderId) : (g.location || 'Not set'))}</strong></span>
      <div class="flex gap-1.5 shrink-0"><button data-act="gearTransfer" data-id="${g.id}" class="${btnS + SM}">Transfer</button>${full ? `<button data-act="gearEdit" data-id="${g.id}" class="${btnS + SM}">Edit</button>` : ''}</div></div></div>`;
}
function gearTransferModal(id, people) {
  const g = S.gear.find(x => x.id === id);
  modal({ title: 'Transfer ' + g.code, sub: g.name, icon: 'arrow-left-right', form: 'gearTransfer', submit: 'Save transfer',
    body: `<input type="hidden" name="id" value="${g.id}">${fld('Hand to volunteer', sel('holderId', [['', 'Nobody, return to storage'], ...people.map(v => [v.id, v.name + (v.callSign ? ' (' + v.callSign + ')' : '')])], g.holderId || ''))}
      ${fld('Storage location', inp('location', g.location || 'ERT cabinet'), 'Used when the item is returned to storage')}${fld('Condition', sel('condition', CONDITIONS, g.condition))}` });
}
/* ---------- shared actions ---------- */
const ACT = {
  nav: d => { curView = d.v; render(); window.scrollTo(0, 0); },
  logout: () => { lsDel(SESSION_KEY[ROLE]); render(); },
  reload: () => location.reload(),
  changeCode: () => { lsDel('ert-code'); if (dbRef) dbRef.off(); dbRef = null; S = null; screen = 'code'; render(); },
  closeModal: (d, el, e) => { if (d.self && e.target !== el) return; closeModal(); },
  rc: d => { const note = ($('#rcnote')?.value || '').trim(); S.rollcall.responses[session.id] = { s: d.s, time: Date.now(), note }; save(); render(); toast(d.s === 'help' ? 'Help request sent' : 'Status sent', d.s === 'help' ? 'Your team lead and the ERT director can see it now.' : 'Thank you for reporting.'); },
  stamp: d => { const x = duty(d.d); x.attendance[d.vid] = x.attendance[d.vid] || { in: '', out: '' }; x.attendance[d.vid][d.f] = nowHM(); if (x.status === 'Open' && x.date === today()) x.status = 'Ongoing'; save(); refreshRoster(x); toast(d.f === 'in' ? 'Checked in' : 'Checked out', volName(d.vid) + ' at ' + fmtT(nowHM())); },
  unsign: d => { const x = duty(d.d); if (!confirm(`Remove ${volName(d.vid)} from this roster?`)) return; delete x.signups[d.vid]; delete x.attendance[d.vid]; delete x.posts[d.vid]; save(); refreshRoster(x); toast('Removed from roster'); },
  rosterAdd: d => { const x = duty(d.d), s = $('#add-' + d.d); if (!s || !s.value) return; if (signed(x).length >= x.slots && !confirm('This duty is already full. Add anyway?')) return; x.signups[s.value] = true; save(); refreshRoster(x); toast('Added to roster', volName(s.value)); },
  dispatchDel: d => { if (!confirm('Delete this log entry?')) return; S.dispatches = S.dispatches.filter(x => x.id !== d.id); save(); render(); toast('Log entry deleted'); },
  broadcast: () => broadcastModal(),
  dispatchEdit: d => broadcastModal(S.dispatches.find(x => x.id === d.id))
};
function refreshRoster(x) { if ($('#roster-modal')) ACT.rosterView({ id: x.id }); render(); }
function audienceOptions() {
  if (ROLE === 'admin') return [['all', 'All ERT volunteers'], ...S.units.map(u => [u.id, 'Unit: ' + u.name]), ...S.areas.map(a => [a.id, 'Area: ' + a.name])];
  return [['all', 'All ERT volunteers'], ...session.scopes.map(s => [s.id, s.name])];
}
function broadcastModal(x) {
  const levels = ROLE === 'admin' ? Object.keys(DLEVELS) : ['FIELD REPORT', 'DISPATCH ANNOUNCEMENT', 'STANDBY WARNING'];
  modal({ title: x ? 'Edit log entry' : (ROLE === 'admin' ? 'Emergency Dispatch Broadcast' : 'Post to the dispatch log'), sub: 'Shown in the dispatch log of everyone in the selected audience', icon: 'radio', form: 'dispatch', submit: x ? 'Save changes' : 'Transmit',
    body: `<input type="hidden" name="id" value="${esc(x?.id || '')}">${grid2(fld('Priority / type', sel('level', levels, x?.level || levels[0])), fld('Audience', sel('audience', audienceOptions(), x?.audience || 'all')))}
      ${fld('Message', ta('msg', x?.msg, 'required placeholder="What is happening and what volunteers should do"'))}` });
}
const FORMS = {
  code: f => { const c = (f.get('code') || '').trim(); if (!/^[A-Za-z0-9_-]{8,60}$/.test(c)) return toast('Check the code', 'Use 8 or more letters, numbers, dashes or underscores.', 'err'); lsSet('ert-code', c); connect(c); },
  gearTransfer: f => { const g = S.gear.find(x => x.id === f.get('id')); g.holderId = f.get('holderId'); g.location = f.get('location').trim(); g.condition = f.get('condition'); save(); closeModal(); render(); toast('Transfer saved', g.code + ' → ' + (g.holderId ? volName(g.holderId) : g.location)); },
  dispatch: f => {
    const id = f.get('id'); let x = id ? S.dispatches.find(d => d.id === id) : null;
    if (!x) { x = { id: 'x' + uid(), time: Date.now(), sender: session.name, senderId: session.id || '' }; S.dispatches.push(x); }
    Object.assign(x, { level: f.get('level'), audience: f.get('audience'), msg: f.get('msg').trim() });
    save(); closeModal(); render(); toast(id ? 'Log entry updated' : 'Broadcast transmitted', 'Visible in the dispatch log now.');
  }
};

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  if (a.tagName === 'INPUT' || a.tagName === 'SELECT') return; // form controls use change events
  const fn = ACT[a.dataset.act]; if (fn) fn(a.dataset, a, e);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act && (t.tagName === 'INPUT' || t.tagName === 'SELECT')) { ACT[t.dataset.act]?.(t.dataset, t, e); return; }
  if (t.dataset.att) { const [d, v, k] = t.dataset.att.split('|'); const x = duty(d); x.attendance[v] = x.attendance[v] || { in: '', out: '' }; x.attendance[v][k] = t.value; save(); toast('Time saved'); return; }
  if (t.dataset.post) { const [d, v] = t.dataset.post.split('|'); const x = duty(d); if (t.value.trim()) x.posts[v] = t.value.trim(); else delete x.posts[v]; save(); toast('Post saved', volName(v) + ': ' + (t.value.trim() || 'cleared')); return; }
  if (t.dataset.rcset) { if (!t.value) return; S.rollcall.responses[t.dataset.rcset] = { s: t.value, time: Date.now(), note: 'Confirmed by ' + session.name }; save(); render(); toast('Status recorded', volName(t.dataset.rcset)); return; }
  if (t.dataset.filter && t.tagName === 'SELECT') { ui[t.dataset.filter] = t.value; FILTER[t.dataset.filter]?.(); return; }
  if (t.dataset.scope !== undefined) { ui.scope = t.value; render(); return; }
  if (t.hasAttribute('data-import') && t.files[0]) ACT.importFile?.(t.files[0]);
});
document.addEventListener('input', e => { const t = e.target; if (t.dataset.filter && t.tagName === 'INPUT') { ui[t.dataset.filter] = t.value; FILTER[t.dataset.filter]?.(); } });
document.addEventListener('submit', e => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); Promise.resolve(FORMS[f.dataset.form](new FormData(f), f)).catch(err => toast('Something went wrong', err.message, 'err')); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal').innerHTML) closeModal(); });
document.addEventListener('focusout', () => setTimeout(flushRender, 60));
