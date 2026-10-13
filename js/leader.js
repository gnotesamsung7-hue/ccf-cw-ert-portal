/* Team Leader's Portal (unit leads and area team leads) */
NAV.lead = [['team', 'My Team', 'users'], ['roll', 'Roll Call', 'hand'], ['duties', 'Duty Posts & Attendance', 'clipboard-check'], ['gear', 'Team Gear', 'package'], ['log', 'Dispatch & Field Reports', 'radio-tower']];
const VL = VIEWS.lead = {};
const scope = () => session.scopes.find(s => s.kind + s.id === ui.scope);
const scopeObj = () => { const s = scope(); return s.kind === 'unit' ? unit(s.id) : area(s.id); };

LOGIN.lead = () => {
  const leads = S.volunteers.filter(v => v.status !== 'Inactive' && leadScopes(v.id).length).sort((a, b) => a.name.localeCompare(b.name));
  if (!S.meta.leaderPinHash) return `<div class="${C.card} p-6"><h2 class="text-lg font-bold text-white">Team Leader's Portal</h2><p class="text-sm text-slate-400 mt-1">The ERT director has not set a team lead PIN yet. Ask them to open Volunteer Management first.</p></div>`;
  return `<div class="${C.card} p-6 space-y-4"><div><h2 class="text-lg font-bold text-white">Team Leader's Portal</h2><p class="text-sm text-slate-400 mt-1">For unit leads and area team leads.</p></div>
    ${leads.length ? `<form data-form="leadLogin" class="space-y-4">${fld('Team lead', sel('id', [['', 'Select your name'], ...leads.map(v => [v.id, v.name + ', ' + leadScopes(v.id).map(s => s.name).join(' & ')])], '', 'required'))}
      ${fld('Team lead PIN', inp('pin', '', 'required inputmode="numeric" autocomplete="current-password"', 'password'))}<button class="${btnP} w-full">Open team portal</button></form>`
      : emptyBox('No leads are assigned yet. The ERT director assigns leads in the Org Chart.')}</div>`;
};

function scopeSwitcher() {
  if (session.scopes.length < 2) return '';
  return `<select data-scope class="${C.input} !w-auto" aria-label="Team">${session.scopes.map(s => `<option value="${s.kind + s.id}"${s.kind + s.id === ui.scope ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select>`;
}

VL.team = () => {
  const sc = scope(), o = scopeObj(), m = scopeMembers(sc).sort((a, b) => a.name.localeCompare(b.name)), R = S.rollcall.responses;
  const ready = m.filter(v => v.status === 'Ready').length;
  const upcoming = S.duties.filter(d => d.status !== 'Closed' && m.some(v => d.signups[v.id])).length;
  const stat = (n, l, i, c) => `<div class="${C.card} p-5"><div class="flex items-center justify-between"><span class="text-slate-400 text-xs font-semibold uppercase tracking-wider">${l}</span><div class="p-2.5 bg-${c}-500/10 text-${c}-400 rounded-xl border border-${c}-500/20">${ic(i, 'w-5 h-5')}</div></div><h3 class="text-3xl font-bold text-white mt-4">${n}</h3></div>`;
  return `${pageHead(esc(sc.name), sc.kind === 'unit' ? 'Positions: ' + esc((o.positions || []).join(', ') || 'none set') : esc(o.notes || 'Area search, rescue & evacuation team'), scopeSwitcher())}
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">${stat(m.length, 'Members', 'users', 'blue')}${stat(ready, 'Ready now', 'user-check', 'emerald')}${stat(upcoming, 'Duties with my team', 'calendar', 'amber')}${stat(Math.round(m.reduce((s, v) => s + volHours(v), 0)), 'Team hours', 'clock', 'red')}</div>
  ${m.length ? `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${m.map(v => { const r = R[v.id]; return `<div class="${C.card} p-5 space-y-3"><div class="flex items-start justify-between gap-2"><div class="flex items-center gap-3 min-w-0"><div class="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-sm text-white">${esc(initials(v.name))}</div><div class="min-w-0"><div class="font-semibold text-white truncate">${esc(v.name)}</div><div class="text-xs text-red-400 font-mono">${esc(v.callSign || '')}</div></div></div>${volStatusBadge(v)}</div>
      <div class="text-xs space-y-1"><div><span class="text-slate-500">Position:</span> <span class="text-slate-200">${esc(v.position || 'Not assigned')}</span></div><div><span class="text-slate-500">${sc.kind === 'unit' ? 'Area' : 'Unit'}:</span> <span class="text-slate-300">${esc(sc.kind === 'unit' ? (areaName(v.areaId) || 'None') : unitName(v.unitId))}</span></div>
        <div><span class="text-slate-500">Contact:</span> ${v.phone ? `<a href="tel:${esc(v.phone)}" class="text-blue-400">${esc(v.phone)}</a>` : '<span class="text-slate-500">Not set</span>'}</div><div><span class="text-slate-500">Emergency:</span> <span class="text-slate-300">${esc(v.emergency || 'Not set')}</span>${v.blood ? ` <span class="text-slate-500">• Blood</span> <span class="text-slate-300">${esc(v.blood)}</span>` : ''}</div>
        ${S.alert.level !== 'normal' ? `<div class="pt-1">${r ? badge(RC[r.s].c, RC[r.s].t) : badge('slate', 'No roll call response')}</div>` : ''}</div>
      <div class="flex flex-wrap gap-1.5">${volCerts(v.id).map(c => badge(certState(c) === 'Valid' ? 'slate' : certState(c) === 'Expired' ? 'red' : 'amber', c.title)).join('')}</div>
      <div class="pt-3 border-t border-slate-800"><button data-act="memberEdit" data-id="${v.id}" class="${btnS} w-full">Edit assignment</button></div></div>`; }).join('')}</div>` : emptyBox('No members in this team yet. The ERT director assigns volunteers in the Volunteer Directory.')}`;
};

VL.roll = () => {
  const sc = scope(), m = scopeMembers(sc), rc = rcSummary(m.map(v => v.id));
  return `${pageHead('Roll Call', S.alert.level === 'normal' ? 'Normal operations. This shows the responses from the last roll call.' : 'Call members who have not responded, then record their status.', scopeSwitcher())}
  ${rcSelfPanel(vol(session.id))}
  <div class="${C.card} p-5">${panelHead('hand', esc(sc.name) + ', since ' + fmtStamp(S.rollcall.startedAt), 'red')}${rc.html}</div>${rcTable(m, true)}`;
};

VL.duties = () => {
  const sc = scope(), m = scopeMembers(sc), mIds = new Set(m.map(v => v.id));
  const relevant = d => (sc.kind === 'area' && d.areaIds[sc.id]) || signed(d).some(id => mIds.has(id)) || d.leadId === session.id;
  const sorted = [...S.duties].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const open = sorted.filter(d => d.status !== 'Closed');
  const recent = sorted.filter(d => d.status === 'Closed' && relevant(d)).reverse().slice(0, 3);
  const block = d => { const ids = signed(d).filter(id => mIds.has(id)), others = signed(d).length - ids.length;
    return dutyCard(d, '', `<div class="space-y-3 pt-1"><div class="text-xs font-semibold text-slate-300">My team on this duty ${others ? `<span class="text-slate-500 font-normal">(+${others} from other teams)</span>` : ''}</div>${attTable(d, ids, d.status !== 'Closed')}${addToRoster(d, m.filter(v => !d.signups[v.id]))}</div>`); };
  return `${pageHead('Duty Posts & Attendance', 'Assign posts, add team members to rosters, and record time in and out.', scopeSwitcher())}
  <div class="space-y-4">${open.map(block).join('') || emptyBox('No upcoming duties. The ERT director schedules duties in Volunteer Management.')}</div>
  ${recent.length ? `<h3 class="font-semibold text-white pt-2">Recently closed</h3><div class="space-y-4">${recent.map(block).join('')}</div>` : ''}`;
};

VL.gear = () => {
  const m = scopeMembers(scope()), ids = new Set(m.map(v => v.id));
  const held = S.gear.filter(g => ids.has(g.holderId)), store = S.gear.filter(g => !g.holderId);
  return `${pageHead('Team Gear', 'Hand out radios, flags and kits to your members, and return them to storage after duty.', scopeSwitcher())}
  <div class="${C.card} p-5">${panelHead('user-check', 'Held by my team', 'blue')}<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">${held.map(g => gearCard(g, false)).join('') || emptyBox('Your team is not holding any equipment.')}</div></div>
  <div class="${C.card} p-5">${panelHead('archive', 'Available in storage', 'emerald')}<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">${store.map(g => gearCard(g, false)).join('') || emptyBox('Nothing in storage right now.')}</div></div>`;
};

VL.log = () => {
  const sc = scope(), list = S.dispatches.filter(d => d.audience === 'all' || session.scopes.some(s => s.id === d.audience) || d.senderId === session.id).sort((a, b) => b.time - a.time);
  return `${pageHead('Dispatch & Field Reports', 'File field reports after duty and post updates to your team. You can edit your own entries.', `<button data-act="broadcast" class="${btnP}">${ic('clipboard-list')}File report or update</button>`)}
  <div class="${C.card} p-5 space-y-3">${list.map(d => dispatchItem(d, d.senderId === session.id)).join('') || emptyBox('No log entries yet.')}</div>`;
};

Object.assign(ACT, {
  memberEdit: d => { const v = vol(d.id), sc = scope();
    const pos = sc.kind === 'unit' ? (unit(sc.id).positions || []) : allPositions();
    modal({ title: 'Edit assignment', sub: v.name, icon: 'user-cog', form: 'member',
      body: `<input type="hidden" name="id" value="${v.id}">${fld('Position', `<input name="position" list="pos-l" value="${esc(v.position || '')}" class="${C.input}" placeholder="Pick or type a position"><datalist id="pos-l">${pos.map(p => `<option value="${esc(p)}">`).join('')}</datalist>`)}
        ${sc.kind === 'unit' ? fld('Area team', sel('areaId', [['', 'No area team'], ...S.areas.map(a => [a.id, a.name])], v.areaId || '')) : ''}
        ${grid2(fld('Status', sel('status', ['Ready', 'Standby', 'Deployed', 'Inactive'], v.status)), fld('Call sign', inp('callSign', v.callSign)))}
        ${grid2(fld('Contact number', inp('phone', v.phone, '', 'tel')), fld('Emergency contact', inp('emergency', v.emergency)))}
        <p class="text-[11px] text-slate-500">Moving someone to another unit is done by the ERT director.</p>` }); },
  gearTransfer: d => gearTransferModal(d.id, scopeMembers(scope()))
});
Object.assign(FORMS, {
  leadLogin: async f => { const h = await hash(f.get('pin')); if (h !== S.meta.leaderPinHash) return toast('Wrong PIN', 'Ask the ERT director for the team lead PIN.', 'err'); lsSet('ert-lead', JSON.stringify({ id: f.get('id'), h })); ui.scope = null; render(); },
  member: f => { const v = vol(f.get('id')); v.position = f.get('position').trim(); if (f.has('areaId')) v.areaId = f.get('areaId'); v.status = f.get('status'); v.callSign = f.get('callSign').trim(); v.phone = f.get('phone').trim(); v.emergency = f.get('emergency').trim(); save(); closeModal(); render(); toast('Assignment saved', v.name); }
});
