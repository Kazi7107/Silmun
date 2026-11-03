// Small client-side behaviour for the whole site. No framework needed.

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  }
}

function track(event: string, props?: Record<string, string>) {
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    /* analytics must never break the page */
  }
}

/* ---------- Modules dropdown (desktop) ---------- */
function initDropdown() {
  document.querySelectorAll<HTMLElement>('[data-dropdown]').forEach((root) => {
    const btn = root.querySelector<HTMLButtonElement>('[data-dropdown-toggle]');
    const panel = root.querySelector<HTMLElement>('.dropdown');
    if (!btn || !panel) return;

    const set = (open: boolean) => {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.classList.toggle('open', open);
    };

    btn.addEventListener('click', () => set(panel.hidden));
    document.addEventListener('click', (e) => {
      if (!panel.hidden && !root.contains(e.target as Node)) set(false);
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) {
        set(false);
        btn.focus();
      }
    });
    root.addEventListener('focusout', (e) => {
      if (!root.contains(e.relatedTarget as Node | null)) set(false);
    });
  });
}

/* ---------- Full-screen menu (mobile) ---------- */
function initMenu() {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  if (!menu || !openBtn) return;

  const focusables = () =>
    Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));

  const set = (open: boolean) => {
    menu.hidden = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);
    if (open) focusables()[0]?.focus();
    else openBtn.focus();
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
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
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
  const navs = Array.from(document.querySelectorAll<HTMLElement>('[data-spy]'));
  if (!navs.length || !('IntersectionObserver' in window)) return;
  const ids = Array.from(navs[0].querySelectorAll('a'))
    .map((a) => a.getAttribute('href') || '')
    .filter((h) => h.startsWith('#'))
    .map((h) => h.slice(1));
  const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

  const mark = (id: string) => {
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

  const visible = new Map<string, number>();
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
  document.querySelectorAll<HTMLElement>('[data-callouts]').forEach((root) => {
    const bar = root.querySelector<HTMLElement>('[data-cap]');
    if (!bar) return;
    const n = bar.querySelector<HTMLElement>('[data-cap-n]')!;
    const t = bar.querySelector<HTMLElement>('[data-cap-t]')!;
    const x = bar.querySelector<HTMLElement>('[data-cap-x]')!;
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-co]'));

    const pick = (i: string) => {
      const src = root.querySelector<HTMLTemplateElement>(`template[data-co-text="${i}"]`);
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
      b.addEventListener('click', () => pick(b.dataset.co!));
      b.addEventListener('mouseenter', () => pick(b.dataset.co!));
      b.addEventListener('focus', () => pick(b.dataset.co!));
    });
  });
}

/* ---------- Security Operations demo: Confirm / Override / Reset ---------- */
function initDecisionDemo() {
  document.querySelectorAll<HTMLElement>('[data-decision]').forEach((root) => {
    const live = root.querySelector<HTMLElement>('[data-decision-live]');
    const messages: Record<string, string> = {
      pending: 'Recommendation reset. Needs confirmation.',
      approved: 'Confirmed. Team set to Payments Platform Ops.',
      overridden: 'Overridden. Team stays unassigned.',
    };
    root.querySelectorAll<HTMLButtonElement>('[data-decide]').forEach((b) =>
      b.addEventListener('click', () => {
        const d = b.dataset.decide!;
        root.dataset.decision = d;
        if (live) live.textContent = messages[d] || '';
      }),
    );
  });
}

/* ---------- Forms (Netlify Forms) ---------- */
function initForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-site-form]').forEach((form) => {
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const label = btn?.querySelector<HTMLElement>('[data-label]');
    const status = form.querySelector<HTMLElement>('[data-form-status]');
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
        const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
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
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-event]');
    if (!el) return;
    track(el.dataset.event!, { agent: el.dataset.eventAgent || '', page: location.pathname });
  });
}

initDropdown();
initMenu();
initReveal();
initScrollSpy();
initCallouts();
initDecisionDemo();
initForms();
initEvents();

export {};
