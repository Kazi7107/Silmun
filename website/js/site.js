// Small client-side behaviour for the whole site. No framework needed.

                
                    
                                                                                   
   
 

function track(event        , props                         ) {
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    /* analytics must never break the page */
  }
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

/* ---------- Pricing: plan ladder ---------- */
// Tick what you need and the cheapest plan that covers it is picked. Picking a plan by hand
// keeps the ticks and flags any that plan doesn't cover.
function initPlans() {
  document.querySelectorAll('[data-plan-picker]').forEach((root) => {
    const rows = Array.from(root.querySelectorAll('.plan-row'));
    const radios = Array.from(root.querySelectorAll('.plan-seg input'));
    const why = root.querySelector('[data-plan-why]');
    const nameOf = (n) => radios.find((r) => r.value === String(n))?.nextElementSibling?.textContent || '';
    const stepOf = (row) => Number(row.dataset.step);
    const label = (row) => row.querySelector('.plan-row-t')?.textContent || '';
    const list = (xs) => (xs.length < 2 ? xs[0] : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
    const picked = () => rows.filter((r) => r.querySelector('input')?.checked);

    const show = (n) => {
      root.dataset.plan = String(n);
      radios.forEach((r) => (r.checked = r.value === String(n)));
      const out = picked().filter((r) => stepOf(r) > n);
      rows.forEach((r) => r.classList.toggle('is-out', out.includes(r)));
      if (!why) return;
      why.classList.toggle('is-warn', out.length > 0);
      if (out.length) why.textContent = `${nameOf(n)} doesn't include ${list(out.map(label))}.`;
      else if (picked().length) why.textContent = `${nameOf(n)} covers everything you ticked.`;
      else why.textContent = '';
    };

    rows.forEach((row) =>
      row.querySelector('input')?.addEventListener('change', () => {
        const p = picked();
        if (!p.length) return show(Number(root.dataset.plan));
        const need = Math.max(...p.map(stepOf));
        show(need);
        const drivers = p.filter((r) => stepOf(r) === need).map(label);
        if (why && need > 1) why.textContent = `${nameOf(need)} covers everything you ticked. You need it for ${list(drivers)}.`;
      }),
    );
    radios.forEach((r) => r.addEventListener('change', () => show(Number(r.value))));
  });
}

/* ---------- Full-screen menu (mobile) ---------- */
function initMenu() {
  const menu = document.querySelector             ('[data-menu]');
  const openBtn = document.querySelector                   ('[data-menu-open]');
  if (!menu || !openBtn) return;

  const focusables = () =>
    Array.from(menu.querySelectorAll             ('a[href], button:not([disabled])'));

  // Closing plays a short shrink-back-into-the-pill animation first (only when motion is on).
  let closeTimer = 0;
  const set = (open         ) => {
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

/* ---------- Reveal on scroll (once) ---------- */
function initReveal() {
  const els = Array.from(document.querySelectorAll             ('[data-reveal]'));
  if (!els.length) return;
  const showAll = () => els.forEach((el) => el.classList.add('is-in'));

  if (!('IntersectionObserver' in window)) return showAll();

  let seen = 0;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
          seen++;
        }
      });
    },
    { threshold: 0.2 },
  );
  els.forEach((el) => io.observe(el));
  // Safety net from the design: if nothing has revealed after 3s, show everything.
  window.setTimeout(() => {
    if (!seen) {
      showAll();
      io.disconnect();
    }
  }, 3000);
}

/* ---------- Scrollspy for the "on this page" nav ---------- */
function initScrollSpy() {
  const navs = Array.from(document.querySelectorAll             ('[data-spy]'));
  if (!navs.length || !('IntersectionObserver' in window)) return;
  const ids = Array.from(navs[0].querySelectorAll('a'))
    .map((a) => a.getAttribute('href') || '')
    .filter((h) => h.startsWith('#'))
    .map((h) => h.slice(1));
  const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)                 ;

  const mark = (id        ) => {
    navs.forEach((nav) =>
      nav.querySelectorAll('a').forEach((a) => {
        const on = a.getAttribute('href') === `#${id}`;
        a.classList.toggle('on', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
        // Keep the active chip visible in the horizontal strip.
        if (on && nav.classList.contains('m-chips')) {
          const left = a.offsetLeft - (nav.clientWidth - a.clientWidth) / 2;
          nav.scrollTo({ left, behavior: 'smooth' });
        }
      }),
    );
  };

  const visible = new Map                ();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      const best = ids.find((id) => (visible.get(id) || 0) > 0);
      if (best) mark(best);
    },
    { rootMargin: '-120px 0px -55% 0px', threshold: [0, 0.01] },
  );
  sections.forEach((s) => io.observe(s));
}

/* ---------- Catalog hero mock: numbered callouts update the caption ---------- */
function initCallouts() {
  document.querySelectorAll             ('[data-callouts]').forEach((root) => {
    const bar = root.querySelector             ('[data-cap]');
    if (!bar) return;
    const n = bar.querySelector             ('[data-cap-n]') ;
    const t = bar.querySelector             ('[data-cap-t]') ;
    const x = bar.querySelector             ('[data-cap-x]') ;
    const buttons = Array.from(root.querySelectorAll                   ('button[data-co]'));

    const pick = (i        ) => {
      const src = root.querySelector                     (`template[data-co-text="${i}"]`);
      if (!src) return;
      n.textContent = i;
      t.textContent = src.dataset.title || '';
      x.textContent = src.content.textContent?.trim() || '';
      buttons.forEach((b) => {
        const on = b.dataset.co === i;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });
    };

    buttons.forEach((b) => {
      b.addEventListener('click', () => pick(b.dataset.co ));
      b.addEventListener('mouseenter', () => pick(b.dataset.co ));
      b.addEventListener('focus', () => pick(b.dataset.co ));
    });
  });
}

/* ---------- Security Operations demo: Confirm / Override / Reset ---------- */
function initDecisionDemo() {
  document.querySelectorAll             ('[data-decision]').forEach((root) => {
    const live = root.querySelector             ('[data-decision-live]');
    const messages                         = {
      pending: 'Recommendation reset. Needs confirmation.',
      approved: 'Confirmed. Team set to Payments Platform Ops.',
      overridden: 'Overridden. Team stays unassigned.',
    };
    root.querySelectorAll                   ('[data-decide]').forEach((b) =>
      b.addEventListener('click', () => {
        const d = b.dataset.decide ;
        root.dataset.decision = d;
        if (live) live.textContent = messages[d] || '';
      }),
    );
  });
}

/* ---------- Forms (Netlify Forms) ---------- */
function initForms() {
  document.querySelectorAll                 ('form[data-site-form]').forEach((form) => {
    const btn = form.querySelector                   ('button[type="submit"]');
    const label = btn?.querySelector             ('[data-label]');
    const status = form.querySelector             ('[data-form-status]');
    const sentLabel = form.dataset.sentLabel || 'Sent. Thanks';
    const sentNote = form.dataset.sentNote || '';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!btn) return;
      btn.disabled = true;
      if (status) {
        status.textContent = '';
        status.classList.remove('is-error');
      }
      try {
        const body = new URLSearchParams(new FormData(form)                                     );
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });
        if (!res.ok) throw new Error(String(res.status));
        if (label) label.textContent = sentLabel;
        form.classList.add('is-sent');
        if (status) status.textContent = sentNote || sentLabel;
        track('Form submit', { form: form.getAttribute('name') || '' });
      } catch {
        btn.disabled = false;
        if (status) {
          status.classList.add('is-error');
          status.textContent = 'That did not send. Please try again, or email us instead.';
        }
      }
    });
  });
}

/* ---------- Analytics events on Store buttons ---------- */
function initEvents() {
  document.addEventListener('click', (e) => {
    const el = (e.target               ).closest             ('[data-event]');
    if (!el) return;
    track(el.dataset.event , { agent: el.dataset.eventAgent || '', page: location.pathname });
  });
}

initIsland();
initPlans();
initMenu();
initReveal();
initScrollSpy();
initCallouts();
initDecisionDemo();
initForms();
initEvents();

export {};
