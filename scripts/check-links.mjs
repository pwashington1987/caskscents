#!/usr/bin/env node
/**
 * Checks every internal link and asset in the built site (dist/) and fails
 * if any of them points at a page or file that does not exist.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const base = (process.env.BASE_PATH ?? '/caskscents').replace(/\/$/, '');

if (!existsSync(dist)) {
  console.error('There is no dist/ folder. Run "npm run build" first.');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const pages = walk(dist).filter((file) => file.endsWith('.html'));
const broken = [];
let checked = 0;

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) continue;
    if (!url.startsWith('/')) continue;
    checked++;
    const path = url.split('#')[0].split('?')[0];
    if (base && path !== base && !path.startsWith(`${base}/`)) {
      broken.push(`${page}: "${url}" does not start with the site base "${base}"`);
      continue;
    }
    const relative = decodeURIComponent(path.slice(base.length)) || '/';
    const target = join(dist, relative.endsWith('/') ? `${relative}index.html` : relative);
    if (!existsSync(target)) broken.push(`${page}: "${url}" leads nowhere`);
  }
}

// The share picture is a full address, so it is checked separately.
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const match = html.match(/<meta property="og:image" content="https?:\/\/[^/"]+([^"]*)"/);
  if (!match) continue;
  checked++;
  const relative = decodeURIComponent(match[1].slice(base.length));
  if (!match[1].startsWith(`${base}/`) || !existsSync(join(dist, relative))) {
    broken.push(`${page}: the share picture "${match[1]}" does not exist`);
  }
}

if (broken.length) {
  console.error(`Broken links (${broken.length}):\n  ${broken.join('\n  ')}`);
  process.exit(1);
}
console.log(`Checked ${checked} internal links across ${pages.length} pages. All good.`);
