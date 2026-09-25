// Browser plumbing: starts Chrome/Chromium through playwright-core, logs a page in, and keeps the run
// hermetic and stable: no third-party requests (analytics, avatars, CDNs), a frozen clock, and fake but
// plausible dates and one-time secrets, so a re-run on the same UI gives the same pixels.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const TOOL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FONT_AWESOME_DIR = path.join(TOOL_DIR, 'node_modules', '@fortawesome', 'fontawesome-free');

/** The instant the browser believes it is: server timestamps are moved to before it (see `fakeDates`). */
export const FIXED_NOW = new Date('2026-06-15T10:00:00Z');
export const FAKE_TOKEN = 'rdt-EXAMPLE-0123456789abcdefghijklmnopqrstuvwxyz';

/** Where Chrome is: CHROME_PATH, a Playwright browser cache, or a system Chrome/Chromium. */
export function findChrome() {
  const candidates = [process.env.CHROME_PATH];
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  if (fs.existsSync(cache)) {
    for (const dir of fs.readdirSync(cache).filter((d) => d.startsWith('chromium')).sort().reverse()) {
      candidates.push(path.join(cache, dir, 'chrome-linux', 'chrome'), path.join(cache, dir, 'chrome-linux64', 'chrome'));
    }
  }
  candidates.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser');
  const found = candidates.find((c) => c && fs.existsSync(c));
  if (!found) {
    throw new Error('No Chrome or Chromium found. Set CHROME_PATH to a Chrome/Chromium executable.');
  }
  return found;
}

export function launch() {
  return chromium.launch({
    executablePath: findChrome(),
    args: ['--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars'],
  });
}

const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:?\d\d)?$/;
const KEEP_KEYS = /expir|until|notafter|validto/i;

/**
 * Moves every server timestamp of one API answer to a fixed, plausible time before FIXED_NOW: the newest
 * distinct timestamp of the answer becomes "3 hours ago", the next "a day ago" and so on, so lists keep their
 * order and the UI never shows "a few seconds ago". Expiry dates (set by the seed to fixed absolute dates)
 * are left alone. Returns true when something changed.
 */
export function fakeDates(root, clusterMs = 0) {
  const found = new Set();
  const visit = (node, fn, key = '') => {
    if (Array.isArray(node)) node.forEach((item, i) => visit(item, fn, `${key}[${i}]`));
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'string' && ISO.test(v) && !KEEP_KEYS.test(k)) fn(node, k, v);
        else visit(v, fn, k);
      }
    }
  };
  visit(root, (_n, _k, v) => found.add(v));
  if (found.size === 0) return false;
  const ranked = [...found].sort((a, b) => Date.parse(b) - Date.parse(a));
  // Timestamps closer than `clusterMs` count as one moment (the default repositories of a new instance are
  // created within milliseconds of each other, in an order that is not the same on every start).
  const mapping = new Map();
  let slot = -1;
  let last = Infinity;
  for (const v of ranked) {
    const t = Date.parse(v);
    if (last - t > clusterMs || slot < 0) slot += 1;
    last = t;
    mapping.set(v, new Date(FIXED_NOW.getTime() - (3 + slot * 26) * 3600 * 1000).toISOString());
  }
  visit(root, (n, k, v) => {
    n[k] = mapping.get(v);
  });
  return true;
}

/**
 * A list the server sorted by `createdAt` (newest first) has no defined order among rows created at the same
 * instant. Break those ties by name, so the same data is always listed in the same order.
 */
export function sortListStably(json, clusterMs = 0) {
  const rows = json?.data?.content;
  if (!Array.isArray(rows) || rows.length < 2 || !rows.every((r) => r && typeof r.createdAt === 'string')) return;
  const times = rows.map((r) => Date.parse(r.createdAt));
  for (let i = 1; i < rows.length; i++) if (times[i] > times[i - 1]) return;
  const cluster = new Map();
  let id = 0;
  rows.forEach((row, i) => {
    if (i > 0 && times[i - 1] - times[i] > clusterMs) id += 1;
    cluster.set(row, id);
  });
  const key = (r) => String(r.name ?? r.username ?? '');
  rows.sort((a, b) => cluster.get(a) - cluster.get(b) || key(a).localeCompare(key(b)));
}

/** Replaces what the browser must never really load or show. Idempotent per context. */
async function hermetic(context, origins) {
  await context.route(
    (url) => !origins.includes(url.origin) && !url.protocol.startsWith('data') && !url.protocol.startsWith('blob'),
    async (route) => {
      const url = new URL(route.request().url());
      // Font Awesome is the one CDN file the panel needs; serve the identical 6.7.2 files from node_modules.
      const prefix = '/ajax/libs/font-awesome/6.7.2/';
      if (url.host === 'cdnjs.cloudflare.com' && url.pathname.startsWith(prefix)) {
        const file = path.join(FONT_AWESOME_DIR, url.pathname.slice(prefix.length));
        if (file.startsWith(FONT_AWESOME_DIR) && fs.existsSync(file)) {
          const type = file.endsWith('.css') ? 'text/css' : file.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
          return route.fulfill({ body: fs.readFileSync(file), contentType: type, headers: { 'access-control-allow-origin': '*' } });
        }
      }
      return route.abort();
    },
  );
}

/**
 * A page of a new context. `session` is { username, token, refreshToken } of a fresh API login (or undefined
 * for a logged-out page). The API answers are rewritten by `fakeDates`, and the token of a newly created deploy
 * token is replaced by FAKE_TOKEN, before the panel sees them.
 */
export async function newPage(browser, { panelUrl, session, viewport, mobile = false, clusterMs = 0 }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: 'dark',
    locale: 'en-US',
    timezoneId: 'UTC',
    serviceWorkers: 'block',
  });
  // Time starts at FIXED_NOW and then flows: a frozen Date.now() stops canvas charts from animating in.
  await context.clock.install({ time: FIXED_NOW });
  await hermetic(context, [new URL(panelUrl).origin]);
  // No animations or transitions. A constructed stylesheet, because the panel's Content-Security-Policy may
  // refuse an inline <style>.
  await context.addInitScript(() => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; scroll-behavior: auto !important; }',
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  });
  if (session) {
    await context.addInitScript((s) => {
      window.localStorage.setItem('username', s.username);
      window.localStorage.setItem('token', s.token);
      window.localStorage.setItem('refresh-token', s.refreshToken);
    }, session);
  }
  await context.route(`${panelUrl}/api/**`, async (route) => {
    const request = route.request();
    const response = await route.fetch();
    const type = response.headers()['content-type'] ?? '';
    if (!type.includes('json') || request.url().includes('/api/auth/')) return route.fulfill({ response });
    let json;
    try {
      json = await response.json();
    } catch {
      return route.fulfill({ response });
    }
    sortListStably(json, clusterMs);
    let changed = fakeDates(json, clusterMs);
    if (request.method() === 'POST' && /\/deploy-tokens(\?|$)/.test(request.url()) && typeof json?.data?.token === 'string') {
      json.data.token = FAKE_TOKEN;
      changed = true;
    }
    return changed ? route.fulfill({ response, json }) : route.fulfill({ response });
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => console.warn(`[shots] page error: ${error.message}`));
  return page;
}

/** Waits until the panel has rendered what was asked: spinners gone, fonts loaded, animations off. */
export async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.getByTestId('spinner').first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}
