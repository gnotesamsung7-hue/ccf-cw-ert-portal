/* Volunteer Management portal (Emergency Director, Deputy, coordinators) */
NAV.admin = [
  ['dashboard', 'Dashboard Overview', 'layout-dashboard'], ['org', 'Org Chart & Roles', 'network'], ['directory', 'Volunteer Directory', 'users'],
  ['duties', 'Duties & Deployments', 'calendar'], ['roll', 'Roll Call', 'hand'], ['training', 'Training & Certs', 'award'],
  ['inventory', 'Gear & Inventory', 'package'], ['log', 'Dispatch & Incident Log', 'radio-tower'], ['settings', 'Settings & Backup', 'settings']
];
const V = VIEWS.admin = {};

/* ---------- login ---------- */
LOGIN.admin = () => {
  if (!S.meta.adminPinHash) return `<div class="${C.card} p-6 space-y-4"><div><h2 class="text-lg font-bold text-white">Set up Volunteer Management</h2><p class="text-sm text-slate-400 mt-1">Create two PINs. The command PIN opens this portal. The team lead PIN opens the Team Leader's Portal.</p></div>
    <form data-form="adminSetup" class="space-y-4">${pinFields()}<button class="${btnP} w-full">Save PINs and open</button></form></div>`;
  const people = activeVols().sort((a, b) => (a.id === S.org.directorId ? -1 : b.id === S.org.directorId ? 1 : a.id === S.org.deputyId ? -1 : b.id === S.org.deputyId ? 1 : a.name.localeCompare(b.name)));
  return `<div class="${C.card} p-6 space-y-4"><div><h2 class="text-lg font-bold text-white">Volunteer Management</h2><p class="text-sm text-slate-400 mt-1">For the Emergency Director, Deputy and ERT coordinators.</p></div>
    <form data-form="adminLogin" class="space-y-4">${fld('Signing in as', sel('id', [['', 'ERT Command'], ...people.map(v => [v.id, v.name + ' (' + roleTitle(v) + ')'])], S.org.directorId))}
    ${fld('Command PIN', inp('pin', '', 'required inputmode="numeric" autocomplete="current-password"', 'password'))}<button class="${btnP} w-full">Open command portal</button></form></div>`;
};
const pinFields = () => grid2(fld('Command PIN', inp('adminPin', '', 'required minlength="4" inputmode="numeric" autocomplete="new-password"', 'password'), 'At least 4 digits'), fld('Team lead PIN', inp('leaderPin', '', 'required minlength="4" inputmode="numeric" autocomplete="new-password"', 'password'), 'Share with unit and area leads'));
function createSpaceForm() {
  return `<form data-form="createSpace" class="space-y-4 border-t border-slate-800 pt-4"><p class="text-sm text-slate-300 font-semibold">Create the ERT records for this code</p>${pinFields()}
    <label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="sample" checked class="accent-red-600"> Include sample volunteers to try things out (you can remove them later)</label>
    <button class="${btnP} w-full">Create team records</button></form>`;
}

/* ---------- dashboard ---------- */
V.dashboard = () => {
  const act = activeVols(), ready = act.filter(v => v.status === 'Ready').length, deployed = act.filter(v => v.status === 'Deployed').length;
  const pend = S.volunteers.filter(v => v.status === 'Pending').length;
  const upcoming = S.duties.filter(d => d.status !== 'Closed').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const drills = upcoming.filter(d => d.type === 'Emergency Drill').length;
  const gearAvail = S.gear.filter(g => !g.holderId).length, gearRepair = S.gear.filter(g => g.condition !== 'Good').length;
  const certAlerts = S.certs.filter(c => certState(c) !== 'Valid' && vol(c.volId));
  const first = (vol(session.id)?.name || 'Command').split(' ')[0];
  const metric = (label, value, icon, c, foot, act) => `<div ${act ? `data-act="${act}" role="button" tabindex="0"` : ''} class="${C.card} p-5 hover:border-slate-700 transition ${act ? 'cursor-pointer' : ''}"><div class="flex items-center justify-between"><span class="text-slate-400 text-xs font-semibold uppercase tracking-wider">${label}</span><div class="p-2.5 bg-${c}-500/10 text-${c}-400 rounded-xl border border-${c}-500/20">${ic(icon, 'w-5 h-5')}</div></div><div class="mt-4 flex items-baseline justify-between gap-2"><h3 class="text-3xl font-bold text-white">${value}</h3><span class="text-xs text-slate-400 text-right">${foot}</span></div></div>`;
  const rc = rcSummary(act.map(v => v.id));
  return `<div class="bg-gradient-to-r from-slate-900 via-slate-900/90 to-red-950/40 p-6 rounded-2xl border border-cardBorder relative overflow-hidden shadow-xl">
      <div class="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
        <div class="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-1">${ic('shield-check')}<span>${esc(S.org.ministry)} ERT Command</span></div>
        <h2 class="text-2xl font-bold tracking-tight text-white">Welcome back, ${esc(first)}</h2>
        <p class="text-slate-400 text-sm mt-1">${LEVELS[S.alert.level].name}. ${upcoming.length} upcoming dut${upcoming.length === 1 ? 'y' : 'ies'}, ${drills} drill${drills === 1 ? '' : 's'} scheduled, ${deployed} volunteer${deployed === 1 ? '' : 's'} deployed.</p></div>
        <div class="flex flex-wrap gap-3"><button data-act="volEdit" class="${btnS}">${ic('user-plus', 'w-4 h-4 text-red-400')}Register Volunteer</button><button data-act="dutyEdit" class="${btnP}">${ic('calendar-plus')}Schedule Duty</button></div></div></div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${metric('Active volunteers', act.length, 'users', 'blue', pend ? `<span class="text-blue-400 font-semibold">${pend} application${pend > 1 ? 's' : ''} to review</span>` : 'All applications reviewed', pend ? 'reviewPending' : '')}
      ${metric('Ready now', ready, 'user-check', 'emerald', `${deployed} deployed`)}
      ${metric('Upcoming duties', upcoming.length, 'calendar', 'amber', upcoming[0] ? 'Next: ' + fmtD(upcoming[0].date) : 'None scheduled')}
      ${metric('Gear items', S.gear.length, 'package', 'red', `${gearAvail} in storage${gearRepair ? `, <span class="text-amber-400">${gearRepair} need attention</span>` : ''}`)}
    </div>
    ${S.alert.level !== 'normal' ? `<div class="${C.card} p-5">${panelHead('hand', 'Roll call since ' + fmtStamp(S.rollcall.startedAt), LEVELS[S.alert.level].c, `<button data-act="nav" data-v="roll" class="${btnS + SM}">Open roll call</button>`)}${rc.html}${rc.c.help ? `<p class="text-sm text-red-400 font-semibold mt-3">${rc.c.help} volunteer${rc.c.help > 1 ? 's' : ''} asked for help. Call them first.</p>` : ''}</div>` : ''}
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="${C.card} p-5 xl:col-span-2">${panelHead('radio-tower', 'Live Dispatch & Broadcast Feed', 'red', `<button data-act="nav" data-v="log" class="text-xs text-red-400 hover:text-red-300 font-semibold">View all logs</button>`)}
        <div class="space-y-3">${visibleDispatches().slice(0, 4).map(d => dispatchItem(d, false)).join('') || emptyBox('No broadcasts yet.')}</div></div>
      <div class="space-y-6">
        <div class="${C.card} p-5">${panelHead('shield', 'Unit Breakdown', 'blue')}<div class="space-y-4 text-xs">${S.units.map(u => { const m = act.filter(v => v.unitId === u.id), r = m.filter(v => v.status === 'Ready').length; return `<div><div class="flex justify-between font-semibold text-slate-300 mb-1"><span>${esc(u.name)}</span><span class="text-slate-400">${r} ready / ${m.length}</span></div><div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div class="bg-gradient-to-r from-red-500 to-amber-500 h-full rounded-full" style="width:${m.length ? Math.max(6, r / m.length * 100) : 0}%"></div></div><div class="text-slate-500 mt-1">Lead: ${esc(volName(u.leadId))}</div></div>`; }).join('') || emptyBox('No units yet.')}</div></div>
        <div class="${C.card} p-5">${panelHead('award', 'Certifications needing renewal', 'amber')}${certAlerts.length ? `<div class="space-y-2">${certAlerts.map(c => `<div class="flex items-center justify-between gap-2 text-sm"><div><div class="text-white font-semibold">${esc(volName(c.volId))}</div><div class="text-xs text-slate-400">${esc(c.title)}, ${fmtD(c.expiry)}</div></div>${badge(certState(c) === 'Expired' ? 'red' : 'amber', certState(c))}</div>`).join('')}</div>` : emptyBox('All certifications are current.')}</div>
      </div></div>`;
};

/* ---------- org chart ---------- */
V.org = () => {
  const box = (cls, act, id, top, bottom, extra = '') => `<button data-act="${act}" ${id ? `data-id="${id}"` : ''} class="w-full text-center rounded-xl border px-3 py-3 transition hover:brightness-125 ${cls}"><div class="font-bold text-sm leading-tight">${top}</div><div class="text-xs mt-0.5 opacity-90">${bottom}</div>${extra}</button>`;
  const blue = 'bg-blue-600/20 border-blue-500/50 text-blue-100';
  const line = '<div class="mx-auto w-px h-5 bg-slate-600"></div>';
  const lead = id => id ? esc(volName(id)) : '<span class="opacity-60">Lead not assigned</span>';
  const units = S.units.map(u => { const m = activeVols().filter(v => v.unitId === u.id);
    return `<div class="space-y-2">${box(blue, 'unitEdit', u.id, esc(u.name), lead(u.leadId) + ' • Lead')}
      <ul class="text-xs text-slate-300 space-y-1 px-1">${(u.positions || []).map(p => { const n = m.filter(v => v.position === p).length; return `<li class="flex justify-between gap-2"><span>${esc(p)}</span><span class="text-slate-500 shrink-0">${n}</span></li>`; }).join('')}</ul>
      <div class="text-[11px] text-slate-500 px-1">${m.length} member${m.length === 1 ? '' : 's'}</div></div>`; }).join('');
  const areas = S.areas.map(a => { const m = activeVols().filter(v => v.areaId === a.id); return box('bg-amber-400/15 border-amber-400/50 text-amber-100', 'areaEdit', a.id, esc(a.name), lead(a.leadId) + ` • ${m.length} member${m.length === 1 ? '' : 's'}`); }).join('');
  return `${pageHead('Org Chart & Roles', 'Click any box to edit the role, lead, or positions. Changes apply to every portal.', `<button data-act="unitEdit" class="${btnS}">${ic('plus')}Add unit</button><button data-act="areaEdit" class="${btnS}">${ic('plus')}Add area team</button>`)}
  <div class="${C.card} p-5 lg:p-8 space-y-0 overflow-x-auto"><div class="min-w-[720px]">
    <div class="text-center mb-6"><div class="text-2xl font-bold text-white">${esc(S.org.ministry)}</div><div class="text-xl font-bold text-white">${esc(S.org.title)}</div></div>
    <div class="grid grid-cols-[1fr_minmax(220px,260px)_1fr] gap-6 items-start"><div></div>
      <div>${box(blue, 'orgEdit', '', S.org.directorId ? esc(volName(S.org.directorId)) : 'Not assigned', 'Emergency Director')}${line}${box(blue, 'orgEdit', '', S.org.deputyId ? esc(volName(S.org.deputyId)) : 'Not assigned', 'Deputy Emergency Director')}</div>
      <button data-act="orgEdit" class="text-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/40 px-3 py-3 text-slate-300 hover:border-slate-400"><div class="font-bold text-sm mb-1">Advisers / Consultants</div>${S.org.advisers.map(a => `<div class="text-xs">${esc(a.name ? a.name : a.role)}${a.name && a.role ? `<span class="text-slate-500">, ${esc(a.role)}</span>` : ''}</div>`).join('') || '<div class="text-xs opacity-60">None listed</div>'}</button>
    </div>${line}<div class="h-px bg-slate-600 mx-[8%]"></div>
    <div class="grid gap-4 pt-5" style="grid-template-columns:repeat(${Math.max(1, S.units.length)},minmax(0,1fr))">${units}</div>
    <div class="mt-8"><div class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Area search, rescue & evacuation teams</div><div class="grid gap-4" style="grid-template-columns:repeat(${Math.max(1, S.areas.length)},minmax(0,1fr))">${areas}</div></div>
  </div></div>
  <div class="${C.card} p-5 text-sm text-slate-400">${panelHead('info', 'Stations and channels', 'blue', `<button data-act="nav" data-v="settings" class="${btnS + SM}">Edit</button>`)}
    <div class="grid sm:grid-cols-2 gap-x-6 gap-y-2">${[['Command Station', S.org.commandStation], ['First Aid Station', S.org.firstAidStation], ['Ambulance point', S.org.ambulancePoint], ['ERT Viber GC', S.org.viber]].map(([k, v]) => `<div><span class="text-slate-500">${k}:</span> <span class="text-slate-200">${v ? esc(v) : 'Not set'}</span></div>`).join('')}</div></div>`;
};

/* ---------- directory ---------- */
V.directory = () => `${pageHead('Volunteer Directory & Profiles', 'Manage ERT members, their unit, post and availability.', `<button data-act="exportCSV" class="${btnS}">${ic('download')}Export CSV</button><button data-act="volEdit" class="${btnP}">${ic('user-plus')}Add New Volunteer</button>`)}
  <div class="${C.card} p-4 flex flex-col md:flex-row gap-3"><div class="relative flex-1"><span class="absolute left-3 top-2.5 text-slate-500">${ic('search')}</span><input type="search" data-filter="q" value="${esc(ui.q)}" placeholder="Search name, call sign, position…" class="${C.input} !pl-9" aria-label="Search volunteers"></div>
    <select data-filter="unit" class="${C.input} md:!w-56" aria-label="Filter by unit">${[['ALL', 'All units'], ...S.units.map(u => [u.id, u.name]), ['', 'Unassigned']].map(([v, t]) => `<option value="${v}"${ui.unit === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>
    <select data-filter="status" class="${C.input} md:!w-44" aria-label="Filter by status">${[['ALL', 'All statuses'], ...Object.keys(VSTATUS).map(s => [s, s])].map(([v, t]) => `<option value="${v}"${ui.status === v ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
  <div id="vol-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${volGrid()}</div>`;
function volGrid() {
  const q = ui.q.toLowerCase().trim();
  const list = S.volunteers.filter(v => (ui.unit === 'ALL' || (v.unitId || '') === ui.unit) && (ui.status === 'ALL' || v.status === ui.status) &&
    (!q || [v.name, v.callSign, v.position, unitName(v.unitId), areaName(v.areaId)].join(' ').toLowerCase().includes(q)))
    .sort((a, b) => (a.status === 'Pending') - (b.status === 'Pending') || a.name.localeCompare(b.name));
  if (!list.length) return `<div class="md:col-span-2 xl:col-span-3">${emptyBox('No volunteers match. Clear the search or change the filters.')}</div>`;
  return list.map(v => `<div class="${C.card} p-5 hover:border-slate-700 transition flex flex-col justify-between gap-4">
    <div><div class="flex items-start justify-between gap-2"><div class="flex items-center gap-3 min-w-0"><div class="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-sm text-white">${esc(initials(v.name))}</div>
      <div class="min-w-0"><h3 class="font-semibold text-white truncate">${esc(v.name)}</h3><span class="text-xs text-red-400 font-mono">${esc(v.callSign || 'No call sign')}</span></div></div>${volStatusBadge(v)}</div>
    <div class="mt-4 space-y-1.5 text-xs">
      <div class="flex gap-2"><span class="text-slate-500 w-16 shrink-0">Role:</span><span class="text-slate-200">${esc(roleTitle(v))}</span></div>
      <div class="flex gap-2"><span class="text-slate-500 w-16 shrink-0">Unit:</span><span class="text-slate-300">${esc(unitName(v.unitId))}${v.position && roleTitle(v) !== v.position ? ', ' + esc(v.position) : ''}</span></div>
      ${v.areaId ? `<div class="flex gap-2"><span class="text-slate-500 w-16 shrink-0">Area:</span><span class="text-slate-300">${esc(areaName(v.areaId))}</span></div>` : ''}
      <div class="flex gap-2"><span class="text-slate-500 w-16 shrink-0">Contact:</span>${v.phone ? `<a class="text-blue-400" href="tel:${esc(v.phone)}">${esc(v.phone)}</a>` : '<span class="text-slate-500">Not set</span>'}</div>
      <div class="flex gap-2"><span class="text-slate-500 w-16 shrink-0">Email:</span><span class="text-slate-300 truncate">${esc(v.email || 'Not set')}</span></div>
      <div class="flex gap-2"><span class="text-slate-500 w-16 shrink-0">Hours:</span><span class="text-slate-300">${r1(volHours(v))}</span>${v.sample ? badge('slate', 'Sample') : ''}</div></div>
    <div class="flex flex-wrap gap-1.5 mt-3">${volCerts(v.id).map(c => badge(certState(c) === 'Valid' ? 'slate' : certState(c) === 'Expired' ? 'red' : 'amber', c.title)).join('')}</div></div>
    <div class="flex gap-2 pt-3 border-t border-slate-800">${v.status === 'Pending' ? `<button data-act="volApprove" data-id="${v.id}" class="${btnP} flex-1">Approve</button>` : ''}<button data-act="volEdit" data-id="${v.id}" class="${btnS} flex-1">Edit Profile</button><button data-act="volDelete" data-id="${v.id}" class="${btnD}" aria-label="Delete ${esc(v.name)}">${ic('trash-2')}</button></div></div>`).join('');
}
FILTER.q = FILTER.unit = FILTER.status = () => { $('#vol-grid').innerHTML = volGrid(); icons(); };

/* ---------- duties ---------- */
V.duties = () => {
  const sorted = [...S.duties].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const open = sorted.filter(d => d.status !== 'Closed'), closed = sorted.filter(d => d.status === 'Closed').reverse();
  const next = open[0];
  const acts = d => `<button data-act="rosterView" data-id="${d.id}" class="${btnS + SM}">${ic('clipboard-check', 'w-3.5 h-3.5')}Roster</button><button data-act="dutyEdit" data-id="${d.id}" class="${btnS + SM}">Edit</button>${d.status !== 'Closed' ? `<button data-act="dutyStatus" data-id="${d.id}" data-s="Closed" class="${btnS + SM}">Close</button>` : `<button data-act="dutyStatus" data-id="${d.id}" data-s="Open" class="${btnS + SM}">Reopen</button>`}`;
  return `${pageHead('Duties & Deployments', 'Sunday worship duty rosters, drills, major event standby and disaster deployments.', `<button data-act="dutyEdit" class="${btnP}">${ic('plus')}Schedule New Duty</button>`)}
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6"><div class="xl:col-span-2 space-y-6">
    <div class="${C.card} p-5">${panelHead('calendar', 'Upcoming & ongoing', 'red', `<div class="hidden sm:flex gap-1.5">${Object.entries(DUTY_TYPES).slice(0, 3).map(([t, c]) => badge(c, t)).join('')}</div>`)}<div class="space-y-3">${open.map(d => dutyCard(d, acts(d))).join('') || emptyBox('Nothing scheduled. Schedule a duty so volunteers can sign up.')}</div></div>
    <div class="${C.card} p-5">${panelHead('archive', 'Closed', 'slate')}<div class="space-y-3">${closed.map(d => dutyCard(d, acts(d))).join('') || emptyBox('No closed duties yet.')}</div></div></div>
  <div class="${C.card} p-5 h-fit">${panelHead('user-check', 'Next duty roster', 'emerald')}${next ? `<p class="text-xs text-slate-400 -mt-2 mb-3">${esc(next.title)}, ${fmtD(next.date)}</p>
    <div class="space-y-2">${signed(next).map(id => { const v = vol(id); if (!v) return ''; const a = next.attendance[id]; return `<div class="flex items-center justify-between gap-2 bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2"><div class="flex items-center gap-2 min-w-0"><span class="w-2 h-2 rounded-full shrink-0 ${a?.in && !a.out ? 'bg-emerald-500' : 'bg-slate-600'}"></span><span class="text-sm text-white truncate">${esc(v.name)}</span></div><span class="text-[11px] text-slate-400 text-right">${esc(next.posts[id] || v.position || '')}</span></div>`; }).join('') || emptyBox('No sign-ups yet.')}</div>
    <div class="mt-4 pt-4 border-t border-slate-800 text-xs"><div class="flex justify-between text-slate-400"><span>Coverage target</span><span class="font-bold ${signed(next).length >= next.slots ? 'text-emerald-400' : 'text-amber-400'}">${signed(next).length} / ${next.slots}</span></div></div>
    <button data-act="rosterView" data-id="${next.id}" class="${btnS} w-full mt-3">Manage posts & attendance</button>` : emptyBox('No upcoming duty.')}</div></div>`;
};

/* ---------- roll call ---------- */
V.roll = () => {
  const act = activeVols(), rc = rcSummary(act.map(v => v.id));
  const row = (name, ids) => { const c = rcSummary(ids).c; return `<tr><td class="${C.td} text-white font-semibold">${esc(name)}</td><td class="${C.td}">${c.help ? `<b class="text-red-400">${c.help}</b>` : 0}</td><td class="${C.td}">${c.available}</td><td class="${C.td}">${c.safe}</td><td class="${C.td}">${c.none}</td></tr>`; };
  return `${pageHead('Roll Call', S.alert.level === 'normal' ? 'The ERT is in normal operations. Set the status to Standby or Activated to ask volunteers to report.' : 'Volunteers report from their portal. Call anyone with no response and record their status.', `<button data-act="alertEdit" class="${btnS}">${ic('siren')}Change ERT status</button><button data-act="rcReset" class="${btnS}">${ic('rotate-ccw')}Start new roll call</button>`)}
  <div class="${C.card} p-5">${panelHead('hand', 'All units, since ' + fmtStamp(S.rollcall.startedAt), 'red')}${rc.html}</div>
  <div class="${C.card} overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-900/60 border-b border-slate-800"><tr><th class="${C.th}">Unit / Area team</th><th class="${C.th}">Needs help</th><th class="${C.th}">Ready</th><th class="${C.th}">Safe, not available</th><th class="${C.th}">No response</th></tr></thead>
    <tbody class="divide-y divide-slate-800 text-slate-300">${S.units.map(u => row(u.name, act.filter(v => v.unitId === u.id).map(v => v.id))).join('')}${S.areas.map(a => row(a.name, act.filter(v => v.areaId === a.id).map(v => v.id))).join('')}</tbody></table></div>
  ${rcTable(act, true)}`;
};

/* ---------- training & certs ---------- */
V.training = () => `${pageHead('Training & Certifications Tracker', 'First aid, BLS, fire safety, radio and other credentials. Expiring within 60 days is flagged.', `<button data-act="certEdit" class="${btnP}">${ic('award')}Add Certification Record</button>`)}
  <div class="${C.card} overflow-hidden"><div class="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><h3 class="font-semibold text-white">Volunteer certifications</h3>
    <input type="search" data-filter="cq" value="${esc(ui.cq)}" placeholder="Search certification or volunteer…" class="${C.input} sm:!w-72" aria-label="Search certifications"></div>
  <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-900/60 border-b border-slate-800"><tr><th class="${C.th}">Volunteer</th><th class="${C.th}">Certification</th><th class="${C.th}">Issuing agency</th><th class="${C.th}">Expiration</th><th class="${C.th}">Status</th><th class="${C.th} text-right">Actions</th></tr></thead>
  <tbody id="cert-body" class="divide-y divide-slate-800">${certRows()}</tbody></table></div></div>`;
function certRows() {
  const q = ui.cq.toLowerCase().trim();
  const list = S.certs.filter(c => vol(c.volId) && (!q || (c.title + ' ' + c.issuer + ' ' + volName(c.volId)).toLowerCase().includes(q))).sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999'));
  if (!list.length) return `<tr><td colspan="6" class="p-6 text-center text-slate-400">No certification records${q ? ' match your search' : ' yet'}.</td></tr>`;
  return list.map(c => { const st = certState(c); return `<tr class="hover:bg-slate-900/40"><td class="${C.td} font-semibold text-white">${esc(volName(c.volId))}</td><td class="${C.td} text-slate-300">${esc(c.title)}</td><td class="${C.td} text-slate-400">${esc(c.issuer)}</td><td class="${C.td} text-slate-300 whitespace-nowrap">${c.expiry ? fmtD(c.expiry) : 'No expiry'}</td>
    <td class="${C.td}">${badge(st === 'Valid' ? 'emerald' : st === 'Expired' ? 'red' : 'amber', st)}</td><td class="${C.td} text-right whitespace-nowrap"><button data-act="certEdit" data-id="${c.id}" class="${btnS + SM}">${st === 'Valid' ? 'Edit' : 'Renew'}</button></td></tr>`; }).join('');
}
FILTER.cq = () => { $('#cert-body').innerHTML = certRows(); icons(); };

/* ---------- inventory ---------- */
V.inventory = () => `${pageHead('Equipment & Gear Inventory', 'Radios, flags, PA, extinguishers and medical gear, and who is holding them.', `<button data-act="gearEdit" class="${btnP}">${ic('package-plus')}Add New Equipment</button>`)}
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">${S.gear.sort((a, b) => a.code.localeCompare(b.code)).map(g => gearCard(g, true)).join('') || emptyBox('No equipment listed yet.')}</div>`;

/* ---------- dispatch log ---------- */
V.log = () => `${pageHead('Dispatch & Incident Log', 'Broadcasts, standby warnings and field reports from team leads. Every entry can be edited or deleted.', `<button data-act="broadcast" class="${btnP}">${ic('radio')}New Emergency Broadcast</button>`)}
  <div class="${C.card} p-5 space-y-3">${visibleDispatches().map(d => dispatchItem(d, true)).join('') || emptyBox('No log entries yet.')}</div>`;

/* ---------- settings ---------- */
V.settings = () => {
  const code = lsGet('ert-code');
  const link = location.href.replace(/[^/]*$/, '') + 'index.html?code=' + encodeURIComponent(code || '');
  const samples = S.volunteers.filter(v => v.sample).length + S.duties.filter(d => d.sample).length;
  return `${pageHead('Settings & Backup', 'Ministry details, stations, access PINs and data backup.')}
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <div class="${C.card} p-5">${panelHead('building-2', 'Ministry & stations', 'blue')}<form data-form="orgInfo" class="space-y-4">
      ${grid2(fld('Ministry', inp('ministry', S.org.ministry, 'required')), fld('Team name', inp('title', S.org.title, 'required')))}
      ${fld('Church / site', inp('church', S.org.church))}
      ${grid2(fld('Command Station location', inp('commandStation', S.org.commandStation, 'placeholder="e.g. Evacuation ground, main parking"')), fld('First Aid Station location', inp('firstAidStation', S.org.firstAidStation)))}
      ${grid2(fld('Ambulance standby point', inp('ambulancePoint', S.org.ambulancePoint)), fld('ERT Viber group link', inp('viber', S.org.viber, 'placeholder="https://invite.viber.com/…"', 'url')))}
      <p class="text-[11px] text-slate-500">Stations show on every portal when the ERT is on Standby or Activated.</p><button class="${btnP}">Save details</button></form></div>
    <div class="space-y-6">
      ${ONLINE ? `<div class="${C.card} p-5">${panelHead('wifi', 'Share with your team', 'emerald')}<p class="text-sm text-slate-300">Team access code: <b class="text-white font-mono">${esc(code)}</b></p><p class="text-xs text-slate-400 mt-1 mb-3">Anyone with this code can open the portals and see volunteer contact details. Share it only with ERT members, for example in the ERT Viber GC.</p>
        <div class="flex gap-2"><input id="shareLink" readonly value="${esc(link)}" class="${C.input} !text-xs"><button data-act="copyLink" class="${btnS}">${ic('copy')}Copy link</button></div></div>`
      : `<div class="${C.card} p-5">${panelHead('wifi-off', 'Offline mode', 'amber')}<p class="text-sm text-slate-400">Records are saved in this browser only. To let volunteers use their phones over Wi-Fi or mobile data, follow README.md to connect Firebase and host the files on GitHub Pages.</p></div>`}
      <div class="${C.card} p-5">${panelHead('key-round', 'Change PINs', 'amber')}<form data-form="pins" class="space-y-4">${grid2(fld('New command PIN', inp('adminPin', '', 'minlength="4" inputmode="numeric" autocomplete="new-password"', 'password'), 'Leave blank to keep'), fld('New team lead PIN', inp('leaderPin', '', 'minlength="4" inputmode="numeric" autocomplete="new-password"', 'password'), 'Leave blank to keep'))}<button class="${btnS}">Update PINs</button></form></div>
      <div class="${C.card} p-5">${panelHead('database', 'Backup & data', 'red')}<div class="flex flex-wrap gap-2"><button data-act="exportJSON" class="${btnP}">${ic('download')}Export backup</button><button data-act="importClick" class="${btnS}">${ic('upload')}Import backup</button><button data-act="exportCSV" class="${btnS}">${ic('sheet')}Volunteers CSV</button><input type="file" id="importFile" accept=".json,application/json" hidden data-import></div>
        <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">${samples ? `<button data-act="removeSamples" class="${btnS}">${ic('eraser')}Remove ${samples} sample records</button>` : ''}<button data-act="loadSamples" class="${btnS}">Reset to org chart + samples</button><button data-act="clearAll" class="${btnD}">${ic('trash-2')}Clear all records</button></div></div>
    </div></div>`;
};

/* ---------- admin actions ---------- */
Object.assign(ACT, {
  reviewPending: () => { ui.status = 'Pending'; ui.unit = 'ALL'; ui.q = ''; curView = 'directory'; render(); },
  alertEdit: () => modal({ title: 'Change ERT status', sub: 'Shown at the top of every portal', icon: 'siren', form: 'alert', submit: 'Update status',
    body: `<div class="space-y-2">${Object.entries(LEVELS).map(([k, L]) => `<label class="flex items-start gap-3 p-3 rounded-xl border border-slate-700 hover:border-slate-500 cursor-pointer"><input type="radio" name="level" value="${k}" ${S.alert.level === k ? 'checked' : ''} class="mt-1 accent-red-600"><span><span class="font-semibold text-${L.c}-400">${L.name}</span><span class="block text-xs text-slate-400">${L.desc}</span></span></label>`).join('')}</div>
      ${fld('Message to all volunteers', ta('note', S.alert.note, 'placeholder="What is happening and what volunteers should do"'))}
      <label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="fresh" ${S.alert.level === 'normal' ? 'checked' : ''} class="accent-red-600"> Start a new roll call (clears previous responses)</label>
      <label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="log" checked class="accent-red-600"> Also post this to the dispatch log</label>` }),
  rcReset: () => { if (!confirm('Start a new roll call? Previous responses will be cleared.')) return; S.rollcall = { startedAt: Date.now(), responses: {} }; save(); render(); toast('New roll call started'); },
  orgEdit: () => { const people = [['', 'Not assigned'], ...activeVols().map(v => [v.id, v.name])];
    modal({ title: 'Command & advisers', sub: 'Emergency Director, Deputy and advisers', icon: 'network', form: 'orgRoles',
      body: `${grid2(fld('Emergency Director', sel('directorId', people, S.org.directorId)), fld('Deputy Emergency Director', sel('deputyId', people, S.org.deputyId)))}
        ${fld('Advisers / consultants', `<textarea name="advisers" rows="5" class="${C.input} font-mono !text-xs">${esc(S.org.advisers.map(a => (a.name || '') + ' | ' + (a.role || '')).join('\n'))}</textarea>`, 'One per line, as Name | Role. Leave the name empty for a role still to be filled, for example " | COS Overseer".')}
        <p class="text-[11px] text-slate-500">To add someone who is not listed, register them in the Volunteer Directory first.</p>` }); },
  unitEdit: d => { const u = d.id ? unit(d.id) : { positions: [] }; const people = [['', 'Not assigned'], ...activeVols().map(v => [v.id, v.name + (v.unitId && v.unitId !== u.id ? ' (' + unitName(v.unitId) + ')' : '')])];
    modal({ title: d.id ? 'Edit unit' : 'Add unit', sub: 'Unit name, lead and positions', icon: 'shield', form: 'unit', left: d.id ? `<button type="button" data-act="unitDelete" data-id="${u.id}" class="${btnD}">${ic('trash-2')}Delete unit</button>` : '',
      body: `<input type="hidden" name="id" value="${esc(u.id || '')}">${fld('Unit name', inp('name', u.name, 'required placeholder="e.g. Medical Team"'))}${fld('Unit lead', sel('leadId', people, u.leadId || ''), 'The lead is moved into this unit and can open the Team Leader\'s Portal.')}
        ${fld('Positions', `<textarea name="positions" rows="5" class="${C.input}">${esc((u.positions || []).join('\n'))}</textarea>`, 'One position per line, for example Exit Doorman.')}` }); },
  unitDelete: d => { if (!confirm('Delete this unit? Its members become unassigned.')) return; S.units = S.units.filter(u => u.id !== d.id); S.volunteers.forEach(v => { if (v.unitId === d.id) v.unitId = ''; }); save(); closeModal(); render(); toast('Unit deleted'); },
  areaEdit: d => { const a = d.id ? area(d.id) : {}; const people = [['', 'Not assigned'], ...activeVols().map(v => [v.id, v.name])];
    modal({ title: d.id ? 'Edit area team' : 'Add area team', sub: 'Search, rescue & evacuation team for one area', icon: 'map', form: 'area', left: d.id ? `<button type="button" data-act="areaDelete" data-id="${a.id}" class="${btnD}">${ic('trash-2')}Delete</button>` : '',
      body: `<input type="hidden" name="id" value="${esc(a.id || '')}">${fld('Area team name', inp('name', a.name, 'required placeholder="e.g. Worship Hall Search & Rescue & Evacuation Team"'))}${fld('Area lead', sel('leadId', people, a.leadId || ''), 'The lead is placed in this area team and can open the Team Leader\'s Portal.')}${fld('Notes', ta('notes', a.notes, 'placeholder="Exits, assembly route, hazards"'))}` }); },
  areaDelete: d => { if (!confirm('Delete this area team?')) return; S.areas = S.areas.filter(a => a.id !== d.id); S.volunteers.forEach(v => { if (v.areaId === d.id) v.areaId = ''; }); S.duties.forEach(x => delete x.areaIds[d.id]); save(); closeModal(); render(); toast('Area team deleted'); },
  volEdit: d => { const v = d.id ? vol(d.id) : { status: 'Ready' };
    modal({ title: d.id ? 'Edit volunteer profile' : 'Register volunteer', sub: 'ERT member record', icon: 'user-cog', form: 'vol', submit: 'Save record', wide: false,
      body: volFields(v, true) + (v.why ? `<div class="text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl p-3"><b class="text-slate-300">Application note:</b> ${esc(v.why)}</div>` : '') }); },
  volApprove: d => { vol(d.id).status = 'Ready'; save(); render(); toast('Application approved', volName(d.id) + ' is now an active volunteer.'); },
  volDelete: d => { const v = vol(d.id); if (!confirm(`Delete ${v.name}? Their roster, certification and roll call records are removed too.`)) return;
    S.volunteers = S.volunteers.filter(x => x.id !== d.id); S.certs = S.certs.filter(c => c.volId !== d.id);
    S.duties.forEach(x => { delete x.signups[d.id]; delete x.attendance[d.id]; delete x.posts[d.id]; if (x.leadId === d.id) x.leadId = ''; });
    S.units.forEach(u => { if (u.leadId === d.id) u.leadId = ''; }); S.areas.forEach(a => { if (a.leadId === d.id) a.leadId = ''; });
    S.gear.forEach(g => { if (g.holderId === d.id) { g.holderId = ''; g.location = g.location || 'ERT cabinet'; } });
    if (S.org.directorId === d.id) S.org.directorId = ''; if (S.org.deputyId === d.id) S.org.deputyId = '';
    delete S.rollcall.responses[d.id]; save(); render(); toast('Volunteer deleted'); },
  dutyEdit: d => { const x = d.id ? duty(d.id) : { date: nextSunday(), start: '07:00', end: '13:00', slots: 12, status: 'Open', type: 'Sunday Worship Duty', areaIds: {}, leadId: S.org.directorId };
    modal({ title: d.id ? 'Edit duty' : 'Schedule duty / activation', sub: 'Volunteers can sign up from their portal', icon: 'calendar-plus', form: 'duty', submit: d.id ? 'Save duty' : 'Schedule duty', left: d.id ? `<button type="button" data-act="dutyDelete" data-id="${x.id}" class="${btnD}">${ic('trash-2')}Delete</button>` : '',
      body: `<input type="hidden" name="id" value="${esc(x.id || '')}">${fld('Event / duty title', inp('title', x.title, 'required placeholder="e.g. Sunday Worship Service ERT Duty"'))}
        ${grid2(fld('Category', sel('type', Object.keys(DUTY_TYPES), x.type)), fld('Location', inp('location', x.location, 'required placeholder="e.g. Worship Hall"')))}
        <div class="grid grid-cols-3 gap-4">${fld('Date', inp('date', x.date, 'required', 'date'))}${fld('Start', inp('start', x.start, 'required', 'time'))}${fld('End', inp('end', x.end, 'required', 'time'))}</div>
        <div class="grid grid-cols-3 gap-4">${fld('Volunteers needed', inp('slots', x.slots, 'required min="1"', 'number'))}${fld('Status', sel('status', ['Open', 'Ongoing', 'Closed'], x.status))}${fld('Duty lead', sel('leadId', [['', 'Not set'], ...activeVols().map(v => [v.id, v.name])], x.leadId || ''))}</div>
        <div><label class="${C.label}">Area teams covered</label><div class="space-y-1.5">${S.areas.map(a => `<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="areaIds" value="${a.id}" ${x.areaIds[a.id] ? 'checked' : ''} class="accent-red-600">${esc(a.name)}</label>`).join('')}</div></div>
        ${fld('Notes for volunteers', ta('notes', x.notes, 'placeholder="Call time, attire, what to bring"'))}` }); },
  dutyDelete: d => { if (!confirm('Delete this duty and its roster?')) return; S.duties = S.duties.filter(x => x.id !== d.id); save(); closeModal(); render(); toast('Duty deleted'); },
  dutyStatus: d => { duty(d.id).status = d.s; save(); render(); toast('Duty ' + (d.s === 'Closed' ? 'closed' : 'reopened')); },
  rosterView: d => { const x = duty(d.id); const cands = activeVols().filter(v => !x.signups[v.id]).sort((a, b) => a.name.localeCompare(b.name));
    modal({ title: x.title, sub: `${fmtD(x.date)}, ${fmtT(x.start)} to ${fmtT(x.end)} • ${x.location}`, icon: 'clipboard-check', wide: true,
      body: `<div id="roster-modal" class="space-y-4">${x.notes ? `<p class="text-sm text-slate-400">${esc(x.notes)}</p>` : ''}<div class="text-xs text-slate-400">${signed(x).length} of ${x.slots} volunteers. Type a post for each person, for example "Exit Doorman, Door 3".</div>${attTable(x, signed(x), true)}${addToRoster(x, cands)}</div>` }); },
  certEdit: d => { const c = d.id ? S.certs.find(x => x.id === d.id) : { volId: '', expiry: '' };
    modal({ title: d.id ? 'Edit / renew certification' : 'Add certification record', sub: 'Set a new expiration date to renew', icon: 'award', form: 'cert', left: d.id ? `<button type="button" data-act="certDelete" data-id="${c.id}" class="${btnD}">${ic('trash-2')}Delete</button>` : '',
      body: `<input type="hidden" name="id" value="${esc(c.id || '')}">${fld('Volunteer', sel('volId', S.volunteers.filter(v => v.status !== 'Inactive').map(v => [v.id, v.name]), c.volId, 'required'))}
        ${fld('Certification title', inp('title', c.title, 'required placeholder="e.g. Standard First Aid & BLS"'))}${grid2(fld('Issuing agency', inp('issuer', c.issuer, 'placeholder="e.g. Philippine Red Cross"')), fld('Expiration date', inp('expiry', c.expiry, '', 'date'), 'Leave blank if it does not expire'))}` }); },
  certDelete: d => { if (!confirm('Delete this certification record?')) return; S.certs = S.certs.filter(c => c.id !== d.id); save(); closeModal(); render(); toast('Certification deleted'); },
  gearEdit: d => { const g = d.id ? S.gear.find(x => x.id === d.id) : { category: 'Communications', condition: 'Good', location: 'ERT cabinet' };
    modal({ title: d.id ? 'Edit equipment' : 'Add new equipment', sub: 'Inventory record', icon: 'package', form: 'gear', left: d.id ? `<button type="button" data-act="gearDelete" data-id="${g.id}" class="${btnD}">${ic('trash-2')}Delete</button>` : '',
      body: `<input type="hidden" name="id" value="${esc(g.id || '')}">${grid2(fld('Asset code', inp('code', g.code, 'required placeholder="e.g. RADIO-04"')), fld('Category', sel('category', GEAR_CATS, g.category)))}
        ${fld('Item name', inp('name', g.name, 'required placeholder="e.g. 2-way radio"'))}${grid2(fld('Condition', sel('condition', CONDITIONS, g.condition)), fld('Storage location', inp('location', g.location, 'placeholder="Used when no one holds it"')))}
        ${fld('Notes', ta('notes', g.notes))}` }); },
  gearDelete: d => { if (!confirm('Delete this equipment record?')) return; S.gear = S.gear.filter(g => g.id !== d.id); save(); closeModal(); render(); toast('Equipment deleted'); },
  gearTransfer: d => gearTransferModal(d.id, activeVols()),
  copyLink: () => { const el = $('#shareLink'); (navigator.clipboard ? navigator.clipboard.writeText(el.value) : Promise.reject()).then(() => toast('Link copied', 'Paste it in the ERT Viber GC.')).catch(() => { el.select(); toast('Select and copy the link'); }); },
  exportJSON: () => { const { meta, ...rest } = S; download('ccf-cw-ert-backup-' + today() + '.json', JSON.stringify(rest, null, 2), 'application/json'); toast('Backup downloaded'); },
  exportCSV: () => { const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const rows = [['Name', 'Call sign', 'Role', 'Unit', 'Position', 'Area team', 'Status', 'Mobile', 'Email', 'Emergency contact', 'Blood type', 'Hours', 'Certifications'],
      ...S.volunteers.map(v => [v.name, v.callSign, roleTitle(v), unitName(v.unitId), v.position, areaName(v.areaId), v.status, v.phone, v.email, v.emergency, v.blood, r1(volHours(v)), volCerts(v.id).map(c => c.title + (c.expiry ? ' (' + c.expiry + ')' : '')).join('; ')])];
    download('ccf-cw-ert-volunteers-' + today() + '.csv', rows.map(r => r.map(q).join(',')).join('\n'), 'text/csv'); toast('Volunteer list downloaded'); },
  importClick: () => $('#importFile').click(),
  importFile: file => { const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (!d.volunteers || !d.org) throw 0; if (!confirm('Replace all current records with this backup? PINs stay the same.')) return; const m = S.meta; S = normalize({ ...d, meta: m }); save(); render(); toast('Backup imported'); } catch (e) { toast('Not an ERT backup', 'Choose a .json file exported from Settings.', 'err'); } }; r.readAsText(file); },
  removeSamples: () => { if (!confirm('Remove all sample volunteers, duties, gear and log entries? Your own records stay.')) return;
    const ids = new Set(S.volunteers.filter(v => v.sample).map(v => v.id));
    S.volunteers = S.volunteers.filter(v => !v.sample); S.duties = S.duties.filter(d => !d.sample); S.gear = S.gear.filter(g => !g.sample); S.dispatches = S.dispatches.filter(x => !x.sample); S.certs = S.certs.filter(c => !ids.has(c.volId));
    S.duties.forEach(x => ids.forEach(id => { delete x.signups[id]; delete x.attendance[id]; delete x.posts[id]; }));
    S.units.forEach(u => { if (ids.has(u.leadId)) u.leadId = ''; }); S.areas.forEach(a => { if (ids.has(a.leadId)) a.leadId = ''; });
    S.gear.forEach(g => { if (ids.has(g.holderId)) { g.holderId = ''; g.location = 'ERT cabinet'; } }); ids.forEach(id => delete S.rollcall.responses[id]);
    save(); render(); toast('Sample records removed', 'The org chart structure is kept.'); },
  loadSamples: () => { if (!confirm('Replace everything with the org chart structure and sample records?')) return; const m = S.meta; S = normalize({ ...toDB(seed(true)), meta: m }); save(); render(); toast('Sample data loaded'); },
  clearAll: () => { if (!confirm('Clear every record, including the org chart? Export a backup first if you need one.')) return; const m = S.meta; S = { ...emptyData(), meta: m }; save(); render(); toast('All records cleared'); }
});
Object.assign(FORMS, {
  adminSetup: async f => { const a = f.get('adminPin'), l = f.get('leaderPin'); if (a.length < 4 || l.length < 4) return toast('PINs need at least 4 digits', '', 'err');
    S.meta.adminPinHash = await hash(a); S.meta.leaderPinHash = await hash(l); save(); lsSet('ert-admin', JSON.stringify({ h: S.meta.adminPinHash, id: S.org.directorId })); render(); toast('PINs saved', 'Share the team lead PIN with your unit and area leads.'); },
  adminLogin: async f => { const h = await hash(f.get('pin')); if (h !== S.meta.adminPinHash) return toast('Wrong PIN', 'Check the command PIN and try again.', 'err'); lsSet('ert-admin', JSON.stringify({ h, id: f.get('id') })); render(); },
  createSpace: async f => { const a = f.get('adminPin'), l = f.get('leaderPin'); if (a.length < 4 || l.length < 4) return toast('PINs need at least 4 digits', '', 'err');
    const data = seed(!!f.get('sample')); data.meta = { created: Date.now(), adminPinHash: await hash(a), leaderPinHash: await hash(l) };
    lsSet('ert-admin', JSON.stringify({ h: data.meta.adminPinHash, id: data.org.directorId })); lastDB = null; await dbRef.set(toDB(data)); toast('Team records created', 'Share the link in Settings with your volunteers.'); },
  pins: async f => { const a = f.get('adminPin'), l = f.get('leaderPin'); if (!a && !l) return toast('Enter a new PIN to change it', '', 'err');
    if (a) { S.meta.adminPinHash = await hash(a); const o = lsJSON('ert-admin') || {}; lsSet('ert-admin', JSON.stringify({ ...o, h: S.meta.adminPinHash })); }
    if (l) S.meta.leaderPinHash = await hash(l); save(); render(); toast('PINs updated', l ? 'Team leads need the new PIN to sign in again.' : ''); },
  alert: f => { const lvl = f.get('level') || 'normal', note = f.get('note').trim();
    if (f.get('fresh')) S.rollcall = { startedAt: Date.now(), responses: {} };
    S.alert = { level: lvl, note, updated: Date.now() };
    if (f.get('log')) S.dispatches.push({ id: 'x' + uid(), time: Date.now(), level: lvl === 'activated' ? 'CRITICAL ALERT' : lvl === 'standby' ? 'STANDBY WARNING' : 'DISPATCH ANNOUNCEMENT', msg: LEVELS[lvl].name + (note ? ': ' + note : ''), sender: session.name, senderId: session.id, audience: 'all' });
    save(); closeModal(); render(); toast('Status: ' + LEVELS[lvl].name); },
  orgInfo: f => { ['ministry', 'title', 'church', 'commandStation', 'firstAidStation', 'ambulancePoint', 'viber'].forEach(k => S.org[k] = (f.get(k) || '').trim()); save(); render(); toast('Details saved'); },
  orgRoles: f => { S.org.directorId = f.get('directorId'); S.org.deputyId = f.get('deputyId');
    S.org.advisers = f.get('advisers').split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => { const [n, r] = l.split('|').map(x => (x || '').trim()); return { id: 'ad' + uid(), name: n, role: r || '' }; });
    [S.org.directorId, S.org.deputyId].forEach((id, i) => { const v = vol(id); if (v && !v.position) v.position = i ? 'Deputy Emergency Director' : 'Emergency Director'; });
    save(); closeModal(); render(); toast('Command roles saved'); },
  unit: f => { const id = f.get('id'); let u = id ? unit(id) : null; if (!u) { u = { id: 'u' + uid() }; S.units.push(u); }
    const L = f.get('leadId'); Object.assign(u, { name: f.get('name').trim(), leadId: L, positions: f.get('positions').split('\n').map(x => x.trim()).filter(Boolean) });
    if (L) { S.units.forEach(x => { if (x !== u && x.leadId === L) x.leadId = ''; }); vol(L).unitId = u.id; }
    save(); closeModal(); render(); toast('Unit saved'); },
  area: f => { const id = f.get('id'); let a = id ? area(id) : null; if (!a) { a = { id: 'a' + uid() }; S.areas.push(a); }
    const L = f.get('leadId'); Object.assign(a, { name: f.get('name').trim(), leadId: L, notes: f.get('notes').trim() }); if (L) vol(L).areaId = a.id;
    save(); closeModal(); render(); toast('Area team saved'); },
  vol: f => { const id = f.get('id'); let v = id ? vol(id) : null; if (!v) { v = { id: 'v' + uid(), joined: today() }; S.volunteers.push(v); }
    volFromForm(f, v); Object.assign(v, { unitId: f.get('unitId'), areaId: f.get('areaId'), position: f.get('position').trim(), status: f.get('status'), baseHours: +f.get('baseHours') || 0 });
    S.units.forEach(u => { if (u.leadId === v.id && v.unitId !== u.id) u.leadId = ''; }); S.areas.forEach(a => { if (a.leadId === v.id && v.areaId !== a.id) a.leadId = ''; });
    save(); closeModal(); render(); toast('Record saved', v.name); },
  duty: f => { if (f.get('end') <= f.get('start')) return toast('Check the times', 'End time must be after the start time.', 'err');
    const id = f.get('id'); let x = id ? duty(id) : null; if (!x) { x = { id: 'd' + uid(), signups: {}, posts: {}, attendance: {} }; S.duties.push(x); }
    Object.assign(x, { title: f.get('title').trim(), type: f.get('type'), location: f.get('location').trim(), date: f.get('date'), start: f.get('start'), end: f.get('end'), slots: +f.get('slots'), status: f.get('status'), leadId: f.get('leadId'), notes: f.get('notes').trim(), areaIds: Object.fromEntries(f.getAll('areaIds').map(a => [a, true])) });
    save(); closeModal(); render(); toast(id ? 'Duty saved' : 'Duty scheduled', x.title); },
  cert: f => { const id = f.get('id'); let c = id ? S.certs.find(x => x.id === id) : null; if (!c) { c = { id: 'c' + uid() }; S.certs.push(c); }
    Object.assign(c, { volId: f.get('volId'), title: f.get('title').trim(), issuer: f.get('issuer').trim(), expiry: f.get('expiry') }); save(); closeModal(); render(); toast('Certification saved'); },
  gear: f => { const id = f.get('id'); let g = id ? S.gear.find(x => x.id === id) : null; if (!g) { g = { id: 'g' + uid(), holderId: '' }; S.gear.push(g); }
    Object.assign(g, { code: f.get('code').trim().toUpperCase(), name: f.get('name').trim(), category: f.get('category'), condition: f.get('condition'), location: f.get('location').trim(), notes: f.get('notes').trim() }); save(); closeModal(); render(); toast('Equipment saved', g.code); }
});
