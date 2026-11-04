// Home hero: the platform map (css/platform-map.css).
// Two agents, one per live module. Each works its own records, then carries the
// finished result to the shared "Waiting for you" queue. Agents never enter
// another module's card. Runs only when html.mo is set (no reduced motion),
// and pauses while the map is off screen or the tab is hidden.

const root = document.documentElement;
const map = document.querySelector('.pmap');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cursorSvg = (fill) =>
  `<svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true"><path d="M1.5 1.5 L1.5 18 L6 13.8 L9 20.5 L12 19.2 L9 12.6 L15.5 12.6 Z" fill="${fill}" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round"></path></svg>`;

const AGENTS = {
  ca: { name: 'Catalog agent', fill: '#1A2B30', dropAt: 0.18, delay: 300 },
  vr: { name: 'Vulnerability agent', fill: '#0C7A6E', dropAt: 0.58, delay: 2600 },
};

if (map && root.classList.contains('mo')) init();

function init() {
  const list = map.querySelector('.pm-list');
  const count = map.querySelector('.pm-count');
  const btn = map.querySelector('.pm-btn');
  let queue = [];
  let approved = false;

  // Only run while visible.
  let visible = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((e) => (visible = e.isIntersecting)), { threshold: 0.1 }).observe(map);
  } else visible = true;
  const ready = async () => {
    while (!visible || document.hidden) await sleep(300);
  };

  function renderQueue(fresh) {
    list.textContent = '';
    if (!queue.length) {
      const e = document.createElement('span');
      e.className = 'pm-empty';
      e.textContent = approved ? 'Approved and logged on the record.' : 'Nothing yet. The agents are working.';
      list.append(e);
    }
    queue.forEach((q, i) => {
      const s = document.createElement('span');
      s.className = 'pm-slip' + (i === 0 && fresh ? ' is-new' : '');
      s.innerHTML = `<i class="pm-sq pm-sq-${q.id}"></i>`;
      s.append(q.text);
      list.append(s);
    });
    count.textContent = queue.length ? `${queue.length} to review` : 'all clear';
    btn.classList.toggle('is-ready', queue.length > 0);
    btn.classList.toggle('is-idle', queue.length === 0);
  }

  btn.addEventListener('click', () => {
    if (!queue.length) return;
    queue = queue.slice(1);
    approved = true;
    renderQueue(false);
  });

  const local = (r) => {
    const m = map.getBoundingClientRect();
    return { left: r.left - m.left, top: r.top - m.top, width: r.width, height: r.height };
  };

  async function agent(id, card) {
    const cfg = AGENTS[id];
    const rows = Array.from(card.querySelectorAll('.pm-row'));
    rows.forEach((r) => (r.dataset.k = r.querySelector('.pm-k').textContent));

    const cur = document.createElement('div');
    cur.className = `pm-cur pm-${id}`;
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = `${cursorSvg(cfg.fill)}<span class="pm-tag"><span>${cfg.name}</span><span class="pm-step"></span></span><span class="pm-cargo" hidden></span>`;
    map.append(cur);
    const step = cur.querySelector('.pm-step');
    const cargo = cur.querySelector('.pm-cargo');

    const rowPt = (row) => {
      const r = local(row.getBoundingClientRect());
      return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 - 6 };
    };
    const exitPt = () => {
      const c = local(card.getBoundingClientRect());
      return { x: c.left + c.width * 0.6, y: c.top + c.height + 6 };
    };
    const dropPt = () => {
      const l = local(list.getBoundingClientRect());
      return { x: l.left + l.width * cfg.dropAt, y: l.top + 8 };
    };

    let pos = rowPt(rows[0]);
    const place = (p, ms) => {
      cur.style.transition = `transform ${ms}ms cubic-bezier(.45,0,.2,1), opacity .3s`;
      cur.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
    };
    const move = async (p) => {
      const ms = Math.max(420, Math.round(Math.hypot(p.x - pos.x, p.y - pos.y) * 1.8));
      pos = p;
      place(p, ms);
      await sleep(ms + 60);
    };
    const below = () => pos.y > exitPt().y - 2;

    place(pos, 0);
    await sleep(cfg.delay);
    await ready();
    cur.classList.add('is-on');

    for (;;) {
      for (const row of rows) {
        await ready();
        if (below()) await move(exitPt());
        await move(rowPt(row));

        // Work the record.
        const acts = row.dataset.acts.split('|');
        const bar = row.querySelector('.pm-bar');
        row.classList.remove('is-done');
        row.classList.add('is-work');
        cur.classList.add('is-busy');
        for (let i = 0; i < acts.length; i++) {
          step.textContent = ` · ${acts[i]}`;
          bar.style.width = `${Math.round(((i + 1) / acts.length) * 100)}%`;
          await sleep(1000);
        }
        row.classList.remove('is-work');
        row.classList.add('is-done');
        bar.style.width = '0';
        row.querySelector('.pm-k').textContent = row.dataset.done;
        cur.classList.remove('is-busy');
        step.textContent = '';

        // Carry the result out to the queue.
        cargo.innerHTML = `<i class="pm-sq pm-sq-${id}"></i>`;
        cargo.append(row.dataset.slip);
        cargo.hidden = false;
        await sleep(350);
        await move(exitPt());
        await move(dropPt());
        queue = [{ id, text: row.dataset.slip }, ...queue].slice(0, 3);
        approved = false;
        renderQueue(true);
        cargo.hidden = true;
        await sleep(450);
      }
      // Next batch: reset this module's records.
      await move(exitPt());
      await sleep(900);
      rows.forEach((r) => {
        r.classList.remove('is-done');
        r.querySelector('.pm-k').textContent = r.dataset.k;
      });
    }
  }

  const start = async () => {
    await document.fonts?.ready;
    const sec = map.closest('.reveal');
    while (sec && !sec.classList.contains('is-in')) await sleep(100);
    await sleep(500);
    queue = [];
    renderQueue(false);
    map.querySelectorAll('[data-pm]').forEach((card) => agent(card.dataset.pm, card));
  };
  start();
}
