// Silmun site behaviour. Plain JS, no framework.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
// Only touch the DOM when markup changes, so entry animations don't replay every tick.
const setHTML = (el, html) => { if (el._h !== html) { el._h = html; el.innerHTML = html; } };

function track(event, props) {
  try { window.plausible?.(event, props ? { props } : undefined); } catch { /* never break the page */ }
}

const TICK = '<span class="tick" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2 L4.2 7.2 L8 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

/* One pause state for everything that moves (WCAG 2.2.2). */
const motion = { paused: false, subs: [] };

/* Run a ticking demo only while it is on screen and motion isn't paused. */
function whileVisible(el, start, stop) {
  let vis = !('IntersectionObserver' in window);
  const sync = () => (vis && !motion.paused ? start() : stop());
  motion.subs.push(sync);
  if (vis) return sync();
  new IntersectionObserver((es) => es.forEach((e) => { vis = e.isIntersecting; sync(); }), { threshold: 0.2 }).observe(el);
}

function initMotionToggle() {
  if (reduced) { document.documentElement.classList.add('reduced'); return; }
  const btns = $$('[data-motion-toggle]');
  const render = () => btns.forEach((b) => {
    b.setAttribute('aria-pressed', String(motion.paused));
    b.setAttribute('aria-label', motion.paused ? 'Play animations' : 'Pause animations');
    const l = $('[data-motion-label]', b); if (l) l.textContent = motion.paused ? 'Play' : 'Pause';
  });
  btns.forEach((b) => b.addEventListener('click', () => {
    motion.paused = !motion.paused;
    document.documentElement.classList.toggle('paused', motion.paused);
    motion.subs.forEach((f) => f());
    render();
  }));
  render();
}

/* ---------- Island nav (desktop): sliding blob + Modules panel ---------- */
function initIsland() {
  document.querySelectorAll('[data-island]').forEach((isl) => {
    const btn = isl.querySelector('[data-island-toggle]');
    const panel = isl.querySelector('.isl-panel');
    const links = isl.querySelector('.isl-links');
    const blob = isl.querySelector('.isl-blob');
    const isOpen = () => isl.hasAttribute('data-open');

    // The blob slides to the link you point at. On first show it jumps there, no slide.
    const move = (el) => {
      if (!blob) return;
      if (!el) return blob.removeAttribute('data-on');
      const jump = !blob.hasAttribute('data-on');
      if (jump) blob.style.transition = 'none';
      blob.style.setProperty('--x', `${el.offsetLeft}px`);
      blob.style.setProperty('--w', `${el.offsetWidth}px`);
      if (jump) {
        void blob.offsetWidth;
        blob.style.transition = '';
      }
      blob.setAttribute('data-on', '');
    };

    if (links) {
      links.querySelectorAll('.isl-link').forEach((el) => {
        el.addEventListener('mouseenter', () => move(el));
        el.addEventListener('focus', () => move(el));
      });
      links.addEventListener('mouseleave', () => move(isOpen() ? btn : null));
      links.addEventListener('focusout', (e) => {
        if (!links.contains(e.relatedTarget)) move(isOpen() ? btn : null);
      });
    }

    if (!btn || !panel) return;
    const set = (open) => {
      isl.toggleAttribute('data-open', open);
      btn.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
      if (open) move(btn);
      else if (!links?.matches(':hover') && !links?.contains(document.activeElement)) move(null);
    };
    set(false);

    btn.addEventListener('click', () => set(!isOpen()));
    document.addEventListener('click', (e) => {
      if (isOpen() && !isl.contains(e.target)) set(false);
    });
    isl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) {
        set(false);
        btn.focus();
      }
    });
    isl.addEventListener('focusout', (e) => {
      if (isOpen() && !isl.contains(e.relatedTarget)) set(false);
    });
  });
}

/* ---------- Full-screen menu (mobile) ---------- */
function initMenu() {
  const menu = document.querySelector('[data-menu]');
  const openBtn = document.querySelector('[data-menu-open]');
  if (!menu || !openBtn) return;

  const focusables = () =>
    Array.from(menu.querySelectorAll('a[href], button:not([disabled])'));

  // Closing plays a short shrink-back-into-the-pill animation first (only when motion is on).
  let closeTimer = 0;
  const set = (open) => {
    window.clearTimeout(closeTimer);
    openBtn.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);
    if (open) {
      menu.removeAttribute('data-closing');
      menu.hidden = false;
      (menu.querySelector('[data-menu-close]') || focusables()[0])?.focus();
      return;
    }
    if (menu.hidden) return;
    const done = () => {
      menu.hidden = true;
      menu.removeAttribute('data-closing');
    };
    if (document.documentElement.classList.contains('mo')) {
      menu.setAttribute('data-closing', '');
      closeTimer = window.setTimeout(done, 300);
    } else done();
    openBtn.focus();
  };

  openBtn.addEventListener('click', () => set(true));
  menu.querySelectorAll('[data-menu-close]').forEach((el) => el.addEventListener('click', () => set(false)));
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false);
    if (e.key !== 'Tab') return;
    const f = focusables();
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  // Close if the viewport grows past the mobile breakpoint while open.
  window.matchMedia('(min-width: 861px)').addEventListener('change', (mq) => {
    if (mq.matches && !menu.hidden) set(false);
  });
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const els = $$('[data-reveal]');
  if (!document.documentElement.classList.contains('mo') || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
}

/* ---------- Hero record demo (Home, Catalog) ---------- */
const SCENS = {
  sec: {
    crumb: 'Vulnerability Response / Vulnerable Items / VIT0041187', agent: 'Vulnerability agent', table: 'sn_vul_vulnerable_item · VIT0041187', title: 'OpenSSH CVE-2024-6387 on lnx-pay-app-07',
    intro: 'No assignment rule matched this VI, so it has no assignment group. I traced ownership through the CMDB.',
    steps: ['Walked cmdb_rel_ci: lnx-pay-app-07 → Payments API (application service)', 'Resolved the support group on the application service: Linux Ops', 'Confirmed Linux Ops is active, with members and a manager to approve'],
    sum: '3 steps · 18s · evidence written to work notes',
    ask: 'Set assignment group to Linux Ops?', why: 'The CI has no support group. The application service it runs is supported by Linux Ops. Remediation target is in 7 days.',
    go: 'Approve', alt: 'Change group', after: 'Assignment group set to Linux Ops. The agent will verify closure against the next scan import.',
    f: [['Assignment group', '(empty)', 'Linux Ops'], ['Remediation target', 'Nov 14, 2026'], ['Risk rating', '1 · Critical'], ['State', 'Open', 'Under Investigation']],
  },
  cat: {
    crumb: 'Service Catalog / Requests / REQ0010442', agent: 'Catalog agent', table: 'sc_request · REQ0010442', title: 'Laptop for a new hire, MacBook or Dell',
    intro: 'No catalog item covers this request. I drafted one from the description.',
    steps: ['Parsed the description into 2 hardware options', 'Drafted 4 variables with types, help text and mandatory flags', 'Checked sc_cat_item in Hardware for an existing match'],
    sum: '3 steps · 12s · draft only, nothing written to sc_cat_item',
    ask: 'Create catalog item “New Hire Laptop” in Hardware?', why: '4 variables: 1 Select Box (2 choices), 1 mandatory Multi Line Text. No duplicate found.',
    go: 'Build Item', alt: 'Edit draft', after: 'Catalog item created with its variables. The request is linked to it.',
    f: [['Catalog item', '(none)', 'New Hire Laptop'], ['Category', 'Hardware'], ['Requested for', 'J. Rivera'], ['State', 'Open', 'Closed Complete']],
  },
};

function initHeroDemo() {
  $$('[data-hero-demo]').forEach((root) => {
    const keys = root.dataset.heroDemo.split(',');
    const st = { i: 0, tick: reduced ? 6 : 0, ap: false };
    let timer = 0;
    const el = (n) => $(`[data-h="${n}"]`, root);
    const render = () => {
      const s = SCENS[keys[st.i]], t = st.tick, ap = st.ap;
      el('crumb').textContent = s.crumb;
      el('agent').textContent = s.agent;
      el('agent2').textContent = s.agent;
      el('table').textContent = s.table;
      el('title').textContent = s.title;
      el('intro').textContent = s.intro;
      const sc = el('state');
      sc.textContent = ap ? s.f[3][2] : s.f[3][1];
      sc.className = 'chip ' + (ap ? 'c-green' : 'c-grey');
      setHTML(el('fields'), s.f.map((f) => {
        let v = f[1], cls = '';
        if (f.length === 3) { if (ap) { v = f[2]; cls = 'set'; } else if (f[1][0] === '(') cls = 'empty'; }
        return `<div class="fld"><span class="k">${f[0]}</span><span class="v ${cls}">${v}</span></div>`;
      }).join(''));
      const nDone = Math.max(0, Math.min(3, t - 1));
      let steps = '';
      for (let k = 0; k < 3; k++) {
        if (k < nDone) steps += `<div class="step">${TICK}<span>${s.steps[k]}</span></div>`;
        else if (k === nDone && t >= 1 && nDone < 3) steps += `<div class="step"><span class="spin" aria-hidden="true"></span><span>${s.steps[k]}…</span></div>`;
      }
      setHTML(el('steps'), steps);
      el('sum').hidden = t < 5;
      el('sum').textContent = s.sum;
      const prop = el('prop');
      prop.hidden = t < 6;
      if (t >= 6) {
        el('ask').textContent = s.ask;
        el('why').textContent = s.why;
        const pc = el('pchip');
        pc.textContent = ap ? 'Approved' : 'Awaiting approval';
        pc.className = 'chip ' + (ap ? 'c-green' : 'c-amber');
        el('btns').hidden = ap;
        el('done').hidden = !ap;
        el('go').textContent = s.go;
        el('alt').textContent = s.alt;
        el('after').textContent = s.after;
      }
      $$('[data-pick]', root).forEach((b) => {
        const on = Number(b.dataset.pick) === st.i;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });
    };
    const advance = () => {
      const t = st.tick + 1;
      if (t === 10 && !st.ap) { st.tick = t; st.ap = true; }
      else if (t >= 16) { st.tick = 0; st.ap = false; st.i = (st.i + 1) % keys.length; }
      else st.tick = t;
      render();
    };
    const start = () => { if (!reduced && !timer) timer = setInterval(advance, 800); };
    const stop = () => { clearInterval(timer); timer = 0; };
    $$('[data-pick]', root).forEach((b) => b.addEventListener('click', () => {
      st.i = Number(b.dataset.pick); st.tick = reduced ? 6 : 0; st.ap = false; render();
    }));
    $$('[data-approve]', root).forEach((b) => b.addEventListener('click', () => {
      st.ap = true; st.tick = Math.max(st.tick, 10); render();
      const live = el('live'); if (live) live.textContent = 'Approved. ' + SCENS[keys[st.i]].after;
    }));
    render();
    whileVisible(root, start, stop);
  });
}

/* ---------- Home use-case tabs ---------- */
const HOME_UCS = [
  { tab: 'Find an owner', mod: 'Security Operations', title: 'Route orphaned VIs to the right group.', desc: 'When no assignment rule matches, it walks the CMDB relationship path from the CI to its application service and proposes the assignment group for approval.', agent: 'Vulnerability agent', rec: 'VIT0041187', steps: ['Walked cmdb_rel_ci from the CI to its application service', 'Resolved the service’s support group', 'Checked the group is active'], ask: 'Set assignment group to Linux Ops?', link: 'See all 8 Security Operations use cases', href: 'security-operations.html#usecases' },
  { tab: 'Explain a stuck fix', mod: 'Security Operations', title: 'Name the blocker, not just the breach.', desc: 'It reads the linked change requests and remediation task history and reports why the fix is stuck, not just that the target was missed.', agent: 'Vulnerability agent', rec: 'VIT0039822', steps: ['Found CHG0032144 closed as Unsuccessful', 'Read the change’s close notes and work notes', 'Pulled the vendor workaround from the preferred solution'], ask: 'Apply the mitigation and reschedule the change?', link: 'See the Security Operations agent', href: 'security-operations.html' },
  { tab: 'Verify a patch', mod: 'Security Operations', title: 'Patched, but still detected?', desc: 'The remediation task is Resolved, yet the scanner keeps reporting the detection, so the VI never auto-closes. It works out whether the fix failed or the scan is stale.', agent: 'Vulnerability agent', rec: 'VIT0039915', steps: ['Compared the detection’s last-found date with the change’s actual end', 'Found the last scan ran before the patch window', 'Confirmed the installed package is the fixed version'], ask: 'Request a targeted rescan of lnx-pay-app-07?', link: 'See the Security Operations agent', href: 'security-operations.html' },
  { tab: 'Unclassed hardware', mod: 'Security Operations', title: 'Resolve Unclassed Hardware CIs.', desc: 'When a scanner asset fails every CI lookup rule, the IRE files it under Unclassed Hardware with no owner. It finds the real CI, or proposes the right class and support group.', agent: 'Vulnerability agent', rec: 'CI 10.4.18.22', steps: ['Searched for an existing CI by MAC and hostname: none', 'Fingerprinted ports and SNMP banner as a Cisco switch', 'Proposed class IP Switch, support group Network Ops'], ask: 'Reclassify to IP Switch, support group Network Ops?', link: 'See the Security Operations agent', href: 'security-operations.html' },
  { tab: 'Build a catalog item', mod: 'ITSM', title: 'Description in, catalog item out.', desc: 'Describe the item in a sentence. It drafts the catalog item and its variables, with types, choices, help text and mandatory flags, for you to review.', agent: 'Catalog agent', rec: 'REQ0010442', steps: ['Parsed the options into a Select Box', 'Added help text and mandatory flags', 'Checked sc_cat_item for duplicates'], ask: 'Create “New Hire Laptop” in Hardware?', link: 'See the ITSM agent', href: 'catalog-automation.html' },
  { tab: 'Catch duplicates', mod: 'ITSM', title: 'Stop catalog sprawl.', desc: 'Before it creates anything, it searches existing catalog items in the category for one that already covers the request.', agent: 'Catalog agent', rec: 'REQ0010471', steps: ['Searched active catalog items in Hardware', 'Matched “Office Chair · Standard”', 'Pointed the request at the existing item'], ask: 'Use the existing catalog item instead?', link: 'See the ITSM agent', href: 'catalog-automation.html' },
];

function initTabs() {
  $$('[data-uc-tabs]').forEach((root) => {
    const tabs = $$('[role="tab"]', root);
    const panel = $('[role="tabpanel"]', root);
    const pick = (i, focus) => {
      const u = HOME_UCS[i];
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      if (focus) tabs[i].focus();
      panel.setAttribute('aria-labelledby', tabs[i].id);
      panel.innerHTML = `
        <div class="l fade"><span class="chip c-mint" style="align-self:flex-start">${u.mod}</span><h3 class="h3">${u.title}</h3><p>${u.desc}</p><a href="${u.href}">${u.link} →</a></div>
        <div class="r fade"><div class="msg"><span class="av av-agent" aria-hidden="true">AI</span><div class="msg-body">
          <span style="font-size:14px"><b>${u.agent}</b> <span style="color:var(--dim)">· work note on ${u.rec}</span></span>
          <div class="steps">${u.steps.map((s) => `<div class="step">${TICK}<span>${s}</span></div>`).join('')}</div>
          <div class="prop" style="padding:12px 14px"><div class="prop-h"><b style="font-size:14px">${u.ask}</b><span class="chip c-amber">Awaiting approval</span></div></div>
        </div></div></div>`;
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => pick(i));
      t.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (d) { e.preventDefault(); pick((i + d + tabs.length) % tabs.length, true); }
        if (e.key === 'Home') { e.preventDefault(); pick(0, true); }
        if (e.key === 'End') { e.preventDefault(); pick(tabs.length - 1, true); }
      });
    });
  });
}

/* ---------- SecOps hero trace demo ---------- */
function initTrace() {
  $$('[data-trace-demo]').forEach((root) => {
    const st = { tick: reduced ? 4 : 0, ap: false };
    let timer = 0;
    const el = (n) => $(`[data-t="${n}"]`, root);
    const TR = [
      { ic: 'CI', k: 'cmdb_ci_linux_server', v: 'lnx-pay-app-07 · support group empty' },
      { ic: 'SVC', k: 'Depends on::Used by · application service', v: 'Payments API' },
      { ic: 'GRP', k: 'Application service · support group', v: 'Linux Ops' },
    ];
    const render = () => {
      const t = st.tick, ap = st.ap;
      const shown = Math.max(0, Math.min(3, t));
      setHTML(el('trace'), TR.slice(0, shown).map((x, i) =>
        `${i ? '<span class="wire" aria-hidden="true"></span>' : ''}<div class="node ${i === shown - 1 && !ap ? 'hit' : ''}"><span class="ic">${x.ic}</span><span class="kv"><small>${x.k}</small><span>${x.v}</span></span></div>`).join(''));
      const notes = [['SYS', 'Qualys scan import · VI created · no assignment rule matched']];
      if (t >= 3) notes.push(['AI', 'Vulnerability agent · ownership traced via cmdb_rel_ci (2 hops)']);
      if (ap) notes.push(['YOU', 'Approved · assignment group set to Linux Ops']);
      setHTML(el('notes'), notes.map((n) => `<div class="node"><span class="ic">${n[0]}</span><span>${n[1]}</span></div>`).join(''));
      const tile = (n, val) => { const e = el(n); e.className = 'tile ' + (ap ? 'set' : (val ? '' : 'empty')); };
      tile('group'); tile('fix', true); tile('stfld', true);
      el('groupv').textContent = ap ? 'Linux Ops' : '(empty)';
      el('fixv').textContent = 'Nov 14, 2026';
      $$('[data-t="state"]', root).forEach((e) => { e.textContent = ap ? 'Under Investigation' : 'Open'; });
      el('statechip').className = 'chip ' + (ap ? 'c-green' : 'c-grey');
      const pc = el('pchip');
      pc.textContent = ap ? 'Approved' : (t >= 4 ? 'Awaiting approval' : 'Investigating');
      pc.className = 'chip ' + (ap ? 'c-green' : (t >= 4 ? 'c-amber' : 'c-mint'));
      el('ask').hidden = t < 4;
      el('btns').hidden = ap;
      el('done').hidden = !ap;
    };
    const advance = () => {
      const t = st.tick + 1;
      if (t === 9 && !st.ap) { st.tick = t; st.ap = true; }
      else if (t >= 15) { st.tick = 0; st.ap = false; }
      else st.tick = t;
      render();
    };
    const start = () => { if (!reduced && !timer) timer = setInterval(advance, 850); };
    const stop = () => { clearInterval(timer); timer = 0; };
    $$('[data-approve]', root).forEach((b) => b.addEventListener('click', () => {
      st.ap = true; st.tick = Math.max(st.tick, 9); render();
      el('live').textContent = 'Approved. Assignment group set to Linux Ops.';
    }));
    el('replay').addEventListener('click', () => { st.tick = 0; st.ap = false; render(); stop(); start(); });
    render();
    whileVisible(root, start, stop);
  });
}

/* ---------- Use-case grid + detail (agent pages) ---------- */
const GRIDS = {
  secops: [
    { name: 'No owner', short: 'No assignment rule matched. Resolves the assignment group from the CMDB.', plan: 'Essential', long: 'The VI came in from a scan import, no assignment rule matched, and the CI has no support group, so the item sits unassigned and the remediation target clock is already running. The agent walks the CMDB relationship path from the CI to the application service it supports and takes ownership from there.', steps: ['Walks cmdb_rel_ci from the CI to its application service', 'Resolves the support group on the service (or its service offering)', 'Checks the group is active and flags how much of the remediation target is left'], approve: 'the assignment group.', recs: ['sn_vul_vulnerable_item', 'cmdb_ci', 'cmdb_rel_ci', 'sys_user_group'] },
    { name: 'Many teams', short: 'Sequences cross-team remediation tasks by CI dependency.', plan: 'Enterprise', long: 'Your remediation task rules already split one vulnerability into a task per assignment group: database, app tier, load balancer. Nothing orders them, so the app team patches before the database is ready and both changes fail. The agent reads the CI relationships between the tasks and proposes the order and the linked change requests.', steps: ['Reads the remediation tasks your task rules created for the vulnerability', 'Maps upstream/downstream dependencies between their CIs in cmdb_rel_ci', 'Proposes the sequence and a linked change request per task'], approve: 'the sequence and the change requests before any are raised.', recs: ['sn_vul_remediation_task', 'cmdb_rel_ci', 'change_request'] },
    { name: 'Patch blocked', short: 'Finds a vendor mitigation when the change can’t go in.', plan: 'Pro', long: 'The linked change request was closed Unsuccessful, or it is stuck behind a change freeze or blackout window. The agent reads the change record and the vulnerability’s preferred solution to find an interim mitigation.', steps: ['Reads the linked change: state, close code, close notes, schedule conflicts', 'Pulls the preferred solution and its vendor workaround from Vulnerability Solution Management', 'Drafts the mitigation steps and a rescheduled change'], approve: 'the mitigation and the rescheduled change.', recs: ['change_request', 'sn_vul_vulnerable_item', 'Solution'] },
    { name: 'No patch yet', short: 'Builds the exception request with the evidence attached.', plan: 'Enterprise', long: 'The vendor has not shipped a fix. The agent prepares a deferral through Exception Management, with reason “Fix unavailable”, the exposure analysis and the compensating controls an approver needs. It never approves its own request.', steps: ['Confirms no solution record fixes the affected version', 'Gathers exposure, exploitability and compensating controls', 'Drafts the exception request with an expiry date; the VI moves to In Review while it is pending'], approve: 'the exception request, through your two-level approval. Never auto-approved.', recs: ['Exception request', 'sn_vul_vulnerable_item', 'sysapproval_approver'] },
    { name: 'Wrong CI match', short: 'Catches VIs a lookup rule attached to the wrong CI.', plan: 'Pro', long: 'A CI lookup rule matched the scanner’s discovered item on IP address, but that address was reassigned by DHCP. Now the VIs sit on the wrong CI and route to the wrong team. The agent compares the discovered item’s hostname, FQDN and MAC with the matched CI and finds the right one.', steps: ['Compares the discovered item’s hostname, FQDN and MAC with the matched CI', 'Finds the CI that actually matches, and when it was last discovered', 'Proposes re-pointing the discovered item, and flags the lookup rule order'], approve: 'the re-match before the VIs move.', recs: ['Discovered item', 'cmdb_ci', 'CI lookup rules'] },
    { name: 'Stalled task', short: 'Finds why a remediation task breached its target.', plan: 'Pro', long: 'The remediation task is past its remediation target. Instead of another overdue notification, the agent reads the task history and its linked records to name the actual blocker.', steps: ['Reads the task’s work notes, state history and linked changes', 'Names the blocker: freeze, failed change, missing owner, dependency', 'Proposes the next step and who should take it'], approve: 'the next step and any reassignment.', recs: ['sn_vul_remediation_task', 'change_request', 'Work notes'] },
    { name: 'Patched, still open', short: 'Finds why a Resolved fix is still detected.', plan: 'Essential', long: 'VIs close as Fixed on their own once a scan stops detecting them. This one hasn’t: the remediation task is Resolved, but the detection keeps coming back. Usually the scan predates the patch, ran unauthenticated, or the host is waiting on a reboot. The agent works out which.', steps: ['Compares the detection’s last-found date with the change’s actual end', 'Checks installed vs. fixed version and whether the scan was authenticated', 'Flags a stale scan or pending reboot, with the evidence attached'], approve: 'a targeted rescan, or reopening the remediation task.', recs: ['sn_vul_vulnerable_item', 'Detection', 'sn_vul_remediation_task'] },
    { name: 'Unclassed hardware', short: 'Resolves CIs the IRE filed under Unclassed Hardware.', plan: 'Essential', long: 'The scanner asset failed every CI lookup rule (host ID, FQDN, NetBIOS, IP), so the IRE created a new CI in the Unclassed Hardware class. It has no support group, so its VIs have no owner, and it is often a duplicate of a CI you already have. The agent finds the real CI, or works out what the device is.', steps: ['Searches for an existing CI by MAC address, serial number and hostname', 'If none, fingerprints OS, open ports and banners to a CI class', 'Proposes merging into the existing CI, or reclassifying with a support group'], approve: 're-pointing the VIs to the existing CI, or the reclassification and support group.', recs: ['cmdb_ci_unclassed_hardware', 'Discovered item', 'cmdb_ci'] },
  ],
};

function initGrid() {
  $$('[data-uc-grid]').forEach((root) => {
    const data = GRIDS[root.dataset.ucGrid];
    const btns = $$('.uc', root);
    const d = $('[data-detail]', root);
    const pick = (i) => {
      const u = data[i], n = String(i + 1).padStart(2, '0');
      btns.forEach((b, k) => { b.setAttribute('aria-pressed', String(k === i)); $('.more', b).textContent = k === i ? 'Showing below ↓' : 'See how it works →'; });
      d.innerHTML = `
        <div class="vid fade"><div class="video" role="img" aria-label="Video placeholder: how the agent handles ${u.name}"><span class="play" aria-hidden="true"><svg width="22" height="24" viewBox="0 0 22 24"><path d="M3 2 L20 12 L3 22 Z" fill="#0E2A31"/></svg></span><span class="lab">[VIDEO] ${n} · ${u.name} · how it works</span></div></div>
        <div class="txt fade">
          <div class="chips"><span class="chip c-mint">Use case ${n}</span><span class="chip c-grey">${u.plan} plan</span></div>
          <h3 class="h3">${u.name}</h3><p>${u.long}</p>
          <div>${u.steps.map((s, k) => `<div class="dstep"><span class="k">0${k + 1}</span><span>${s}</span></div>`).join('')}</div>
          <div class="youok"><b>You approve:</b> ${u.approve}</div>
          <div class="recs"><span>Tables it touches</span>${u.recs.map((r) => `<span class="chip c-grey">${r}</span>`).join('')}</div>
        </div>`;
    };
    btns.forEach((b, i) => b.addEventListener('click', () => {
      pick(i);
      if (innerWidth < 1000) d.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    }));
  });
}

/* ---------- Forms (Netlify Forms) ---------- */
function initForms() {
  $$('form[data-site-form]').forEach((form) => {
    const btn = $('button[type="submit"]', form);
    const label = $('[data-label]', btn);
    const status = $('[data-form-status]', form);
    const sentLabel = form.dataset.sentLabel || 'Sent. Thanks';
    const sentNote = form.dataset.sentNote || '';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      if (status) { status.textContent = ''; status.classList.remove('err'); }
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(String(res.status));
        if (label) label.textContent = sentLabel;
        form.classList.add('sent');
        if (status) status.textContent = sentNote || sentLabel;
        track('Form submit', { form: form.getAttribute('name') || '' });
      } catch {
        btn.disabled = false;
        if (status) { status.classList.add('err'); status.textContent = 'That did not send. Please try again, or email us instead.'; }
      }
    });
  });
}

/* ---------- Analytics on CTA buttons (data-event, data-event-agent, data-event-plan) ---------- */
function initEvents() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-event]');
    if (el) track(el.dataset.event, { agent: el.dataset.eventAgent || '', plan: el.dataset.eventPlan || '', page: location.pathname });
  });
}

$$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
initMotionToggle();
initIsland();
initMenu();
initReveal();
initHeroDemo();
initTabs();
initTrace();
initGrid();
initForms();
initEvents();
