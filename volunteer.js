/* Volunteer Portal */
NAV.vol = [['home', 'My Dashboard', 'layout-dashboard'], ['duties', 'Duty Sign-up', 'calendar'], ['hours', 'My Hours & Check-in', 'clock'], ['certs', 'My Certifications', 'award'], ['profile', 'My Profile', 'user-cog']];
const VV = VIEWS.vol = {};
const me = () => vol(session.id);

LOGIN.vol = () => {
  const list = S.volunteers.filter(v => v.status !== 'Inactive').sort((a, b) => a.name.localeCompare(b.name));
  return `<div class="${C.card} p-6 space-y-4"><div><h2 class="text-lg font-bold text-white">Volunteer Portal</h2><p class="text-sm text-slate-400 mt-1">Choose your name to open your portal.</p></div>
    <form data-form="volLogin" class="space-y-3">${fld('Your name', sel('id', [['', 'Select your name'], ...list.map(v => [v.id, v.name + (v.status === 'Pending' ? ' (application pending)' : '')])], '', 'required'))}<button class="${btnP} w-full">Open my portal</button></form>
    <div class="border-t border-slate-800 pt-4"><p class="text-sm text-slate-400 mb-2">New to the ERT?</p><button data-act="apply" class="${btnS} w-full">${ic('user-plus')}Apply to volunteer</button></div></div>`;
};

VV.home = () => {
  const v = me(), first = v.name.split(' ')[0];
  const mine = S.duties.filter(d => d.signups[v.id] && d.status !== 'Closed' && d.date >= today()).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const gear = S.gear.filter(g => g.holderId === v.id);
  const L = unit(v.unitId) && vol(unit(v.unitId).leadId);
  return `${v.status === 'Pending' ? `<div class="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100"><b>Your application is being reviewed.</b> The ERT director will contact you. You can complete your profile while you wait.</div>` : ''}
  <div class="bg-gradient-to-r from-slate-900 via-slate-900/90 to-red-950/40 p-6 rounded-2xl border border-cardBorder relative overflow-hidden shadow-xl">
    <div class="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px]"></div>
    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
      <div class="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-1">${ic('badge-check')}<span>${esc(v.callSign || 'ERT volunteer')}</span></div>
      <h2 class="text-2xl font-bold tracking-tight text-white">Hi, ${esc(first)}</h2>
      <p class="text-slate-400 text-sm mt-1">${esc(roleTitle(v))}${v.unitId ? ' • ' + esc(unitName(v.unitId)) : ''}${v.areaId ? ' • ' + esc(areaName(v.areaId)) : ''}${L && L.id !== v.id ? ` • Lead: ${esc(L.name)}` : ''}</p></div>
      ${v.status !== 'Pending' ? `<div class="flex items-center gap-3 bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-3"><span class="text-sm text-slate-300">My status</span>
        <select data-act="setStatus" data-status class="${C.input} !w-auto !py-1.5" aria-label="My availability">${['Ready', 'Standby', 'Deployed'].map(s => `<option${v.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></div>` : ''}</div></div>
  ${rcSelfPanel(v)}
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <div class="xl:col-span-2 space-y-6">
      <div class="${C.card} p-5">${panelHead('calendar-check', 'My upcoming duties', 'emerald', `<button data-act="nav" data-v="duties" class="${btnS + SM}">Find duties</button>`)}
        <div class="space-y-3">${mine.map(d => dutyCard(d, d.date === today() ? `<button data-act="nav" data-v="hours" class="${btnP + SM}">Check in</button>` : '', `<div class="text-xs text-slate-300 bg-slate-800/60 rounded-lg px-3 py-2">${ic('flag', 'w-3.5 h-3.5 inline text-amber-400')} Your post: <b>${esc(d.posts[v.id] || v.position || 'To be assigned by your lead')}</b>${d.notes ? `<div class="text-slate-400 mt-1">${esc(d.notes)}</div>` : ''}</div>`)).join('') || emptyBox('You are not on any duty roster yet.')}</div></div>
      <div class="${C.card} p-5">${panelHead('radio-tower', 'Dispatch feed', 'red')}<div class="space-y-3">${visibleDispatches(v).slice(0, 6).map(d => dispatchItem(d, false)).join('') || emptyBox('No broadcasts yet.')}</div></div>
    </div>
    <div class="space-y-6">
      <div class="${C.card} p-5">${panelHead('package', 'Gear I am holding', 'amber')}${gear.length ? `<div class="space-y-2">${gear.map(g => `<div class="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-sm"><span class="text-white">${esc(g.name)}</span><span class="text-[10px] font-mono text-red-400">${esc(g.code)}</span></div>`).join('')}</div><p class="text-[11px] text-slate-500 mt-2">Return gear to your lead or the ERT cabinet after duty.</p>` : emptyBox('No equipment checked out to you.')}</div>
      <div class="${C.card} p-5">${panelHead('map-pin', 'Stations', 'blue')}<div class="space-y-2 text-sm">${[['Command Station', S.org.commandStation], ['First Aid Station', S.org.firstAidStation], ['Ambulance', S.org.ambulancePoint]].map(([k, val]) => `<div><span class="text-slate-500">${k}:</span> <span class="text-slate-200">${val ? esc(val) : 'Ask your lead'}</span></div>`).join('')}</div>
        ${S.org.viber ? `<a href="${esc(S.org.viber)}" target="_blank" rel="noopener" class="${btnS} w-full mt-4">${ic('message-circle')}Open ERT Viber GC</a>` : ''}</div>
    </div></div>`;
};

VV.duties = () => {
  const v = me();
  const list = S.duties.filter(d => d.status !== 'Closed' && d.date >= today()).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  return `${pageHead('Duty Sign-up', 'Sign up for Sunday duty, drills and deployments. Your lead assigns your post.')}
  ${v.status === 'Pending' ? `<div class="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">You can sign up once your application is approved.</div>` : ''}
  <div class="space-y-3">${list.map(d => { const inn = !!d.signups[v.id], full = signed(d).length >= d.slots;
    const btn = inn ? `${badge('emerald', 'Signed up')}<button data-act="withdraw" data-id="${d.id}" class="${btnD + SM}">Withdraw</button>` : `<button data-act="signup" data-id="${d.id}" class="${btnP + SM}" ${full || v.status === 'Pending' ? 'disabled' : ''}>${full ? 'Full' : 'Sign up'}</button>`;
    return dutyCard(d, btn, d.notes || (inn && d.posts[v.id]) ? `<div class="text-xs text-slate-400">${inn && d.posts[v.id] ? `Your post: <b class="text-slate-200">${esc(d.posts[v.id])}</b>. ` : ''}${esc(d.notes || '')}</div>` : ''); }).join('') || emptyBox('No open duties right now. Watch the dispatch feed for new schedules.')}</div>`;
};

VV.hours = () => {
  const v = me();
  const list = S.duties.filter(d => d.signups[v.id] && d.date <= today()).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
  const stat = (n, l, i, c) => `<div class="${C.card} p-5"><div class="flex items-center justify-between"><span class="text-slate-400 text-xs font-semibold uppercase tracking-wider">${l}</span><div class="p-2.5 bg-${c}-500/10 text-${c}-400 rounded-xl border border-${c}-500/20">${ic(i, 'w-5 h-5')}</div></div><h3 class="text-3xl font-bold text-white mt-4">${n}</h3></div>`;
  return `${pageHead('My Hours & Check-in', 'Check in when you arrive at your post and check out when you leave.')}
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">${stat(r1(volHours(v)), 'Total hours served', 'clock', 'emerald')}${stat(list.filter(d => d.attendance[v.id]?.in).length, 'Duties attended', 'calendar-check', 'blue')}${stat(volCerts(v.id).filter(c => certState(c) === 'Valid').length, 'Valid certifications', 'award', 'amber')}</div>
  <div class="${C.card} overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-900/60 border-b border-slate-800"><tr><th class="${C.th}">Duty</th><th class="${C.th}">Date</th><th class="${C.th}">Post</th><th class="${C.th}">In</th><th class="${C.th}">Out</th><th class="${C.th}">Hours</th><th class="${C.th}"></th></tr></thead>
  <tbody class="divide-y divide-slate-800">${list.map(d => { const a = d.attendance[v.id] || {}, live = d.date === today() && d.status !== 'Closed';
    return `<tr><td class="${C.td}"><div class="font-semibold text-white">${esc(d.title)}</div><div class="text-[11px] text-slate-500">${esc(d.location)}</div></td><td class="${C.td} text-slate-300 whitespace-nowrap">${fmtD(d.date)}</td><td class="${C.td} text-slate-300 text-xs">${esc(d.posts[v.id] || '')}</td>
      <td class="${C.td} text-slate-300">${fmtT(a.in) || '<span class="text-slate-500">Not recorded</span>'}</td><td class="${C.td} text-slate-300">${fmtT(a.out)}</td><td class="${C.td} text-slate-300">${r1(hrs(a.in, a.out)) || ''}</td>
      <td class="${C.td} text-right">${live && !a.in ? `<button data-act="selfStamp" data-d="${d.id}" data-f="in" class="${btnP + SM}">Check in</button>` : live && !a.out ? `<button data-act="selfStamp" data-d="${d.id}" data-f="out" class="${btnP + SM}">Check out</button>` : ''}</td></tr>`; }).join('') || `<tr><td colspan="7" class="p-6 text-center text-slate-400">Duties you attend will show here.</td></tr>`}</tbody></table></div>
  ${+v.baseHours ? `<p class="text-xs text-slate-500">Includes ${v.baseHours} hours from earlier records.</p>` : ''}`;
};

VV.certs = () => {
  const list = volCerts(session.id).sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999'));
  return `${pageHead('My Certifications', 'Keep your first aid, BLS, fire safety and other credentials current so leads know where to post you.', `<button data-act="myCertEdit" class="${btnP}">${ic('plus')}Add certification</button>`)}
  <div class="${C.card} overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-900/60 border-b border-slate-800"><tr><th class="${C.th}">Certification</th><th class="${C.th}">Issuing agency</th><th class="${C.th}">Expiration</th><th class="${C.th}">Status</th><th class="${C.th}"></th></tr></thead>
  <tbody class="divide-y divide-slate-800">${list.map(c => { const st = certState(c); return `<tr><td class="${C.td} font-semibold text-white">${esc(c.title)}</td><td class="${C.td} text-slate-400">${esc(c.issuer)}</td><td class="${C.td} text-slate-300">${c.expiry ? fmtD(c.expiry) : 'No expiry'}</td><td class="${C.td}">${badge(st === 'Valid' ? 'emerald' : st === 'Expired' ? 'red' : 'amber', st)}</td><td class="${C.td} text-right"><button data-act="myCertEdit" data-id="${c.id}" class="${btnS + SM}">${st === 'Valid' ? 'Edit' : 'Renew'}</button></td></tr>`; }).join('') || `<tr><td colspan="5" class="p-6 text-center text-slate-400">Add your first certification.</td></tr>`}</tbody></table></div>`;
};

VV.profile = () => {
  const v = me();
  return `${pageHead('My Profile', 'Your contact and emergency details. Your unit, area and position are assigned by the ERT director.')}
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6"><div class="${C.card} p-5 xl:col-span-2"><form data-form="profile" class="space-y-4">${volFields(v, false)}<button class="${btnP}">Save profile</button></form></div>
  <div class="${C.card} p-5 h-fit">${panelHead('id-card', 'My ERT assignment', 'blue')}<div class="space-y-2 text-sm">${[['Role', roleTitle(v)], ['Unit', unitName(v.unitId)], ['Position', v.position || 'Not assigned'], ['Area team', areaName(v.areaId) || 'Not assigned'], ['Status', v.status], ['Member since', fmtD(v.joined)]].map(([k, val]) => `<div class="flex justify-between gap-3"><span class="text-slate-500">${k}</span><span class="text-slate-200 text-right">${esc(val)}</span></div>`).join('')}</div></div></div>`;
};

Object.assign(ACT, {
  apply: () => modal({ title: 'Apply to volunteer', sub: S.org.ministry + ' ' + S.org.title, icon: 'user-plus', form: 'apply', submit: 'Send application',
    body: `${volFields({}, false)}${fld('Unit you would like to join', sel('unitId', [['', 'No preference'], ...S.units.map(u => [u.id, u.name])], ''))}
      ${fld('Experience or questions', ta('why', '', 'placeholder="First aid training, medical background, schedule…"'))}
      <label class="flex items-start gap-2 text-xs text-slate-300"><input type="checkbox" name="consent" required class="mt-0.5 accent-red-600"> I agree to follow the ERT code of conduct and allow CCF Commonwealth to use my information for ERT coordination, in line with the Data Privacy Act of 2012.</label>` }),
  setStatus: (d, el) => { me().status = el.value; save(); render(); toast('Status updated', 'You are now ' + el.value + '.'); },
  signup: d => { const x = duty(d.id); if (signed(x).length >= x.slots) return toast('This duty is full', '', 'err'); x.signups[session.id] = true; save(); render(); toast('Signed up', x.title); },
  withdraw: d => { if (!confirm('Withdraw from this duty?')) return; const x = duty(d.id); delete x.signups[session.id]; delete x.attendance[session.id]; delete x.posts[session.id]; save(); render(); toast('You withdrew', x.title); },
  selfStamp: d => { const x = duty(d.d); x.attendance[session.id] = x.attendance[session.id] || { in: '', out: '' }; x.attendance[session.id][d.f] = nowHM(); if (x.status === 'Open') x.status = 'Ongoing'; save(); render(); toast(d.f === 'in' ? 'Checked in' : 'Checked out', d.f === 'in' ? 'At ' + fmtT(nowHM()) : 'Thank you for serving!'); },
  myCertEdit: d => { const c = d.id ? S.certs.find(x => x.id === d.id) : { expiry: '' };
    modal({ title: d.id ? 'Edit certification' : 'Add certification', icon: 'award', form: 'myCert', left: d.id ? `<button type="button" data-act="myCertDelete" data-id="${c.id}" class="${btnD}">${ic('trash-2')}Delete</button>` : '',
      body: `<input type="hidden" name="id" value="${esc(c.id || '')}">${fld('Certification title', inp('title', c.title, 'required placeholder="e.g. Standard First Aid & BLS"'))}${grid2(fld('Issuing agency', inp('issuer', c.issuer, 'placeholder="e.g. Philippine Red Cross"')), fld('Expiration date', inp('expiry', c.expiry, '', 'date'), 'Leave blank if it does not expire'))}` }); },
  myCertDelete: d => { if (!confirm('Delete this certification?')) return; S.certs = S.certs.filter(c => c.id !== d.id); save(); closeModal(); render(); toast('Certification deleted'); }
});
Object.assign(FORMS, {
  volLogin: f => { if (!f.get('id')) return; lsSet('ert-vol', f.get('id')); curView = 'home'; render(); },
  apply: f => { const v = volFromForm(f, { id: 'v' + uid(), status: 'Pending', joined: today(), unitId: f.get('unitId'), areaId: '', position: '', baseHours: 0, why: f.get('why').trim() }); S.volunteers.push(v); save(); closeModal(); lsSet('ert-vol', v.id); render(); toast('Application sent', 'The ERT director will review it.'); },
  profile: f => { volFromForm(f, me()); save(); render(); toast('Profile saved'); },
  myCert: f => { const id = f.get('id'); let c = id ? S.certs.find(x => x.id === id) : null; if (!c) { c = { id: 'c' + uid(), volId: session.id }; S.certs.push(c); } Object.assign(c, { title: f.get('title').trim(), issuer: f.get('issuer').trim(), expiry: f.get('expiry') }); save(); closeModal(); render(); toast('Certification saved'); }
});
