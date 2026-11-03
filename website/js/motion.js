// Signature motion moments (canvas board "10 Motion"). Each one shows something
// the agents actually do, plays once, and stays quick. The inline head script
// only adds html.mo when the visitor has not asked for reduced motion; without
// it this file does nothing and the page keeps its static design.

const root = document.documentElement;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Run fn once when el is on screen, after its [data-reveal] section has revealed
// (CSS animations inside a section stay paused until then).
const onView = (() => {
  if (!('IntersectionObserver' in window)) return (el, fn) => fn();
  const jobs = new Map();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const fn = jobs.get(e.target);
        jobs.delete(e.target);
        const go = () => {
          const sec = e.target.closest('.reveal');
          if (sec && !sec.classList.contains('is-in')) return setTimeout(go, 120);
          fn();
        };
        go();
      });
    },
    { threshold: 0.6 },
  );
  return (el, fn) => {
    jobs.set(el, fn);
    io.observe(el);
  };
})();

/* ---------- 03 · Record decode ---------- */
const SETS = { up: 'ABCDEFGHJKLMNPQRSTUVWXYZ', lo: 'abcdefghijkmnpqrstuvwxyz', dg: '0123456789' };

function scramble(text, p) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (i < p * text.length || !/[A-Za-z0-9]/.test(c)) {
      out += c;
      continue;
    }
    const set = /[0-9]/.test(c) ? SETS.dg : /[a-z]/.test(c) ? SETS.lo : SETS.up;
    out += set[Math.floor(Math.random() * set.length)];
  }
  return out;
}

// Letters stay letters and digits stay digits, so it reads as data, not noise.
function decode(el, text, { dur = 420, delay = 0 } = {}) {
  const t0 = performance.now() + delay;
  el.textContent = scramble(text, 0);
  const step = (now) => {
    const p = Math.max(0, Math.min(1, (now - t0) / dur));
    el.textContent = p >= 1 ? text : scramble(text, p);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Record numbers and field names inside the product mocks: short mono tokens
// with no spaces that look like data (a digit, underscore, hyphen or dot).
function initDecode() {
  const mocks = document.querySelectorAll('.amock, .mod-vis, .rec, .vrec, .trace, .ci, .stage, [role="img"]');
  const seen = new Set();
  mocks.forEach((mock) => {
    const group = [];
    mock.querySelectorAll('span, b, div, code').forEach((el) => {
      if (seen.has(el) || el.children.length) return;
      if (el.closest('.flipper, .mo-chip, .mo-cursor')) return;
      const text = el.textContent.trim();
      if (!/^[A-Za-z0-9_.\-]{4,32}$/.test(text) || !/[0-9_.\-]/.test(text)) return;
      if (!/JetBrains/i.test(getComputedStyle(el).fontFamily)) return;
      seen.add(el);
      group.push([el, text]);
    });
    if (!group.length) return;
    onView(mock, () => group.forEach(([el, text], i) => decode(el, text, { delay: Math.min(i * 90, 600) })));
  });
}

/* ---------- 02 · Wet-ink highlighter ---------- */
function initInk() {
  document.querySelectorAll('.hlw').forEach((el) => onView(el, () => el.classList.add('mo-in')));
}

/* ---------- 04 · Ruled section heads ---------- */
function initHeads() {
  document.querySelectorAll('.sec-head').forEach((head) => {
    const no = head.querySelector('.sec-no');
    const label = head.querySelector('.sec-label');
    const n = no?.textContent.trim() || '';
    if (no && /^\d{2}$/.test(n)) {
      // Each digit spins through 0-9 and lands on its own value.
      const cols = n
        .split('')
        .map((d) => `<span class="mo-odo"><span style="--n:10">${'0123456789'.split('').join('\n')}\n${d}</span></span>`)
        .join('');
      no.innerHTML = `<span class="sr-only">${n}</span><span class="mo-odos" aria-hidden="true">${cols}</span>`;
    }
    onView(head, () => {
      head.classList.add('mo-in');
      if (label) decode(label, label.textContent, { dur: 380, delay: 160 });
    });
  });
}

/* ---------- 05 · Arrow hand-off ---------- */
const DIRS = { '↗': 'ne', '→': 'e', '↓': 's' };

function initArrows() {
  document.querySelectorAll('.btn .k').forEach((k) => {
    const g = k.textContent.trim();
    if (!DIRS[g]) return;
    k.innerHTML = `<span class="mo-arr mo-${DIRS[g]}"><span>${g}</span><span>${g}</span></span>`;
  });
  // Ghost buttons carry their arrow as plain text ("Open the ITSM page →").
  document.querySelectorAll('a.btn').forEach((a) => {
    if (a.querySelector('.k, .mo-arr')) return;
    const last = a.lastChild;
    if (!last || last.nodeType !== Node.TEXT_NODE) return;
    const m = last.textContent.match(/^(.*?)\s*([↗→↓])\s*$/s);
    if (!m) return;
    last.textContent = m[1] + ' ';
    const span = document.createElement('span');
    span.className = `mo-arr mo-${DIRS[m[2]]}`;
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = `<span>${m[2]}</span><span>${m[2]}</span>`;
    a.append(span);
  });
}

/* ---------- 06 · Trace and resolve ---------- */
function initTrace() {
  document.querySelectorAll('.trace').forEach((trace) => {
    const wires = Array.from(trace.querySelectorAll('.wire'));
    const nodes = Array.from(trace.querySelectorAll('.node'));
    const owner = nodes[nodes.length - 1];
    const ownerV = owner?.querySelector('.v');
    if (wires.length < 2 || !owner?.classList.contains('ghost') || !ownerV) return;
    onView(trace, async () => {
      await sleep(700); // let the wires finish drawing
      for (let i = 0; i < wires.length; i++) {
        const pk = document.createElement('span');
        pk.className = 'mo-pk';
        wires[i].append(pk);
        await pk.animate(
          [
            { left: '0px', opacity: 0 },
            { opacity: 1, offset: 0.15 },
            { opacity: 1, offset: 0.85 },
            { left: 'calc(100% - 8px)', opacity: 0 },
          ],
          { duration: 300, easing: 'cubic-bezier(.5,0,.5,1)' },
        ).finished;
        pk.remove();
        const next = nodes[i + 1];
        if (next === owner) {
          owner.classList.remove('ghost');
          ownerV.classList.remove('dim');
          decode(ownerV, 'Payments Platform Ops', { dur: 420 });
        }
        next?.classList.add('mo-hit');
      }
    });
  });
}

// Security Operations demo: the team name decodes when a recommendation is confirmed.
function initDecisionDecode() {
  document.querySelectorAll('[data-decision]').forEach((demo) => {
    demo.querySelectorAll('[data-decide="approved"]').forEach((b) =>
      b.addEventListener('click', () =>
        demo.querySelectorAll('[data-when~="approved"]').forEach((el) => {
          if (!el.children.length && el.offsetParent) decode(el, el.textContent, { dur: 420 });
        }),
      ),
    );
  });
}

/* ---------- 01 · Agent cursor (home hero, desktop) ---------- */
const CURSOR_SVG =
  '<svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true"><path d="M1.5 1.5 L1.5 18 L6 13.8 L9 20.5 L12 19.2 L9 12.6 L15.5 12.6 Z" fill="#1A2B30" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round"></path></svg>';

// Rect of text[from, to) inside a text node.
function textRect(node, from, to) {
  const r = document.createRange();
  r.setStart(node, from);
  r.setEnd(node, to);
  return r.getBoundingClientRect();
}

async function initHeroCursor() {
  const stage = document.querySelector('.amock-desk');
  if (!stage || !window.matchMedia('(min-width: 1001px)').matches) return;
  const rec = stage.querySelector('.vrec');
  const mark = stage.querySelector('.req-note mark.hi');
  const valRow = rec?.querySelector('.vrow.hl');
  const valFlip = valRow?.querySelector('.flipper');
  const valTo = valFlip?.querySelector('.to');
  const justC = Array.from(rec?.querySelectorAll('.vrow') || []).find((r) => /Justification/.test(r.textContent))?.querySelector('.c');
  const foot = rec?.querySelector('.vrec-f');
  const footData = foot?.querySelector('.data');
  const statusFlip = foot?.querySelector('.flipper');
  const markText = mark?.firstChild;
  const toText = valTo?.firstChild;
  if (!valFlip || !statusFlip || !markText || !toText || markText.nodeType !== 3 || toText.nodeType !== 3) return;

  // The two choices as they read in the request and in the form.
  const src = markText.textContent;
  const dst = toText.textContent;
  const parts = src.split(' or ');
  const dParts = dst.split(' · ');
  if (parts.length !== 2 || dParts.length !== 2) return;

  stage.classList.add('mo-hero');
  await document.fonts?.ready;
  // Start once the hero has faded in, so the whole run is seen.
  const sec = stage.closest('.reveal');
  while (sec && !sec.classList.contains('is-in')) await sleep(100);
  await sleep(sec ? 650 : 200);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mo-build';
  btn.textContent = 'Build Item';
  btn.tabIndex = -1; // decoration inside role="img"; the mock's label already says it
  btn.setAttribute('aria-hidden', 'true');
  foot.insertBefore(btn, statusFlip);

  const set = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  set.setAttribute('class', 'mo-set');
  set.setAttribute('aria-hidden', 'true');
  rec.append(set);

  const cur = document.createElement('div');
  cur.className = 'mo-cursor';
  cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = `${CURSOR_SVG}<span class="mo-cur-tag"><span>agent</span><span>waiting for you</span></span>`;
  stage.append(cur);
  const tag = cur.querySelector('.mo-cur-tag');
  const [tag1, tag2] = tag.children;

  const S = () => stage.getBoundingClientRect();
  const local = (r, fx = 0.5, fy = 0.5) => {
    const s = S();
    return [r.left - s.left + r.width * fx, r.top - s.top + r.height * fy];
  };
  const at = (el, fx, fy) => local(el.getBoundingClientRect(), fx, fy);

  let pos = [stage.clientWidth * 0.42, stage.clientHeight * 0.95];
  const move = (to, duration, easing = 'cubic-bezier(.6,0,.2,1)') => {
    const a = cur.animate(
      [{ transform: `translate(${pos[0]}px,${pos[1]}px)` }, { transform: `translate(${to[0]}px,${to[1]}px)` }],
      { duration, easing, fill: 'forwards' },
    );
    pos = to;
    return a.finished;
  };

  tag.style.width = `${tag1.offsetWidth}px`;
  tag.style.transition = 'width .22s cubic-bezier(.7,0,.3,1)';
  cur.style.opacity = '1';
  cur.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });

  // 1. Find the choices in the request and select them.
  const fromR = [textRect(markText, 0, parts[0].length), textRect(markText, src.length - parts[1].length, src.length)];
  await move(local(fromR[0], 0.4, 0.8), 460);
  mark.classList.add('mo-sel');
  await sleep(300);

  // 2. Carry them into the form: two chips arc from the request to the field.
  const toR = [textRect(toText, 0, dParts[0].length), textRect(toText, dst.length - dParts[1].length, dst.length)];
  mark.classList.add('mo-ghost');
  const flights = parts.map((p, i) => {
    const chip = document.createElement('span');
    chip.className = 'mo-chip';
    chip.setAttribute('aria-hidden', 'true');
    chip.textContent = dParts[i];
    stage.append(chip);
    const a = local(fromR[i], 0, 0);
    const b = local(toR[i], 0, 0);
    const pad = [9, 7];
    const ax = a[0] - pad[0], ay = a[1] - pad[1], bx = b[0] - pad[0], by = b[1] - pad[1];
    const mx = (ax + bx) / 2, my = Math.min(ay, by) - 70 + i * 14;
    return chip
      .animate(
        [
          { transform: `translate(${ax}px,${ay}px)`, opacity: 0 },
          { opacity: 1, offset: 0.12 },
          { transform: `translate(${mx}px,${my}px) rotate(${i ? 3 : -3}deg)`, offset: 0.5 },
          { transform: `translate(${bx}px,${by}px)`, opacity: 1 },
        ],
        { duration: 500, delay: i * 80, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'both' },
      )
      .finished.then(() => chip);
  });
  move(local(toR[0], 0.3, 0.9), 520, 'cubic-bezier(.5,0,.2,1)');
  const chips = await Promise.all(flights);

  // 3. Land: the field fills in.
  valFlip.classList.add('mo-flip');
  valRow.querySelector('.v')?.classList.add('mo-land');
  chips.forEach((c) => c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).finished.then(() => c.remove()));
  await sleep(60);

  // 4. Mark the justification field required.
  if (justC) {
    await move(at(justC, 0.5, 0.6), 300);
    justC.classList.add('mo-stamp');
    await sleep(80);
  }

  // 5. Flip the status.
  await move(at(statusFlip, 0.4, 0.6), 330);
  statusFlip.classList.add('mo-flip');
  await sleep(70);

  // 6. Stop on Build Item. Building is the visitor's call.
  await move(at(btn, 0.7, 0.62), 300);
  cur.classList.add('mo-waiting');
  tag.style.width = `${tag2.offsetWidth}px`;
  btn.classList.add('mo-wait');

  const park = () => {
    if (stage.classList.contains('mo-built')) return;
    pos = at(btn, 0.7, 0.62);
    cur.getAnimations().forEach((a) => a.cancel());
    cur.style.transform = `translate(${pos[0]}px,${pos[1]}px)`;
  };
  window.addEventListener('resize', park);

  btn.addEventListener(
    'click',
    () => {
      const w = rec.clientWidth, h = rec.clientHeight;
      set.setAttribute('viewBox', `0 0 ${w} ${h}`);
      set.innerHTML = `<rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="11" pathLength="1"></rect>`;
      stage.classList.add('mo-built');
      btn.textContent = 'Built';
      cur.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      if (footData) decode(footData, 'Built and logged on the record', { dur: 520, delay: 380 });
      window.removeEventListener('resize', park);
    },
    { once: true },
  );
}

if (root.classList.contains('mo')) {
  root.classList.add('mo-ready');
  initArrows();
  initHeads();
  initInk();
  initDecode();
  initTrace();
  initDecisionDecode();
  initHeroCursor();
}
