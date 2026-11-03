// Checks the built site against the copy rules in CLAUDE.md.
// Run after `npm run build`: npm run check:copy
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) files.push(p);
  }
})(root);

const rules = [
  { name: 'em dash in copy', re: /—/g },
  { name: 'unrendered [YEAR]', re: /\[YEAR\]/g },
  { name: 'design-tool link (.dc.html)', re: /\.dc\.html/g },
];
let problems = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  for (const r of rules) {
    const n = (html.match(r.re) || []).length;
    if (n) { problems += n; console.log(`${f.replace(root, '')}: ${n} × ${r.name}`); }
  }
}
// Placeholders that still need a decision before launch (HANDOFF.md section 8).
const ph = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/class="ph">([^<]+)</g)].map((m) => `${f.replace(root, '')}: ${m[1]}`));
if (ph.length) console.log(`\nOpen placeholders (${ph.length}):\n  ` + ph.join('\n  '));
console.log(problems ? `\n${problems} copy problem(s).` : `\nCopy rules OK across ${files.length} pages.`);
process.exit(problems ? 1 : 0);
