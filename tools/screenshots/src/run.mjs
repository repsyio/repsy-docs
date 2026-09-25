#!/usr/bin/env node
// Generates the Repsy Open Source panel screenshots of the docs (RPS-1419). See ../README.md.
//
//   node src/run.mjs                 build/reuse the image, start the stacks, seed, capture, tear down
//   node src/run.mjs --check         only check that manifest.json and src/shots.mjs agree (no Docker, no browser)
//   node src/run.mjs --only maven/   only the shots whose id contains the text
//   node src/run.mjs --out <dir>     write below <dir> instead of static/images/os (for experiments)
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { PanelApi } from './lib/api.mjs';
import { launch, newPage, settle } from './lib/browser.mjs';
import { MAX_BYTES, nearlyEqual, optimize } from './lib/optimize.mjs';
import { Publisher } from './lib/packages.mjs';
import { removeDefaultRepos, seedBase, seedScanner } from './lib/seed.mjs';
import { log, removeTempDirs, resolveImage, resolveStubDir, Stack } from './lib/stack.mjs';
import { ScannerStub } from './lib/stub.mjs';
import { helpers, steps } from './shots.mjs';

const TOOL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_DIR = path.resolve(TOOL_DIR, '..', '..');
const IMAGES_ROOT = 'static/images/os';
const { values: args } = parseArgs({
  options: {
    check: { type: 'boolean', default: false },
    only: { type: 'string' },
    out: { type: 'string' },
  },
});

const manifest = JSON.parse(fs.readFileSync(path.join(TOOL_DIR, 'manifest.json'), 'utf8'));
const VIEWPORTS = manifest.viewports;

/** Every manifest entry must be consistent, and the generated ones must have exactly one step. */
function validate() {
  const problems = [];
  const seen = new Set();
  for (const shot of manifest.shots) {
    const id = `${shot.page}/${shot.name}`;
    if (seen.has(id)) problems.push(`duplicate shot ${id}`);
    seen.add(id);
    const expectedPath = `${IMAGES_ROOT}/${id}.${shot.format}`;
    if (shot.path !== expectedPath) problems.push(`${id}: path should be ${expectedPath}`);
    if (shot.figure !== `os/${id}.${shot.format}`) problems.push(`${id}: figure should be os/${id}.${shot.format}`);
    if (!VIEWPORTS[shot.viewport]) problems.push(`${id}: unknown viewport ${shot.viewport}`);
    for (const field of ['route', 'state', 'alt', 'status', 'stack']) if (!shot[field]) problems.push(`${id}: missing ${field}`);
    if (shot.status === 'generated' && !steps[id]) problems.push(`${id}: status is generated but src/shots.mjs has no step`);
    if (shot.status === 'pending' && !shot.reason) problems.push(`${id}: pending shots need a reason`);
    if (shot.status === 'pending' && steps[id]) problems.push(`${id}: has a step but is marked pending`);
    if (steps[id] && shot.stack !== steps[id].stack) problems.push(`${id}: stack differs from src/shots.mjs`);
    if (steps[id] && Boolean(steps[id].mobile) !== (shot.viewport === 'mobile')) problems.push(`${id}: viewport differs from src/shots.mjs`);
  }
  for (const id of Object.keys(steps)) if (!seen.has(id)) problems.push(`${id}: step without a manifest entry`);
  return problems;
}

const problems = validate();
if (problems.length > 0) {
  console.error(`manifest.json and src/shots.mjs disagree:\n - ${problems.join('\n - ')}`);
  process.exit(1);
}
if (args.check) {
  const generated = manifest.shots.filter((s) => s.status === 'generated').length;
  console.log(`manifest ok: ${manifest.shots.length} shots, ${generated} generated, ${manifest.shots.length - generated} pending`);
  process.exit(0);
}

const selected = manifest.shots.filter((s) => s.status === 'generated' && (!args.only || `${s.page}/${s.name}`.includes(args.only)));
if (selected.length === 0) {
  console.error('no shot selected');
  process.exit(1);
}
const outRoot = args.out ? path.resolve(args.out) : path.join(DOCS_DIR, IMAGES_ROOT);
const fileFor = (shot) => path.join(outRoot, `${shot.page}/${shot.name}.${shot.format}`);

const stacks = [];
let cleaning = false;
async function cleanup() {
  if (cleaning) return;
  cleaning = true;
  for (const stack of stacks.reverse()) await stack.down();
  removeTempDirs();
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => cleanup().finally(() => process.exit(130)));
}

const results = [];

async function capture(browser, stack, api, admin, shot) {
  const id = `${shot.page}/${shot.name}`;
  const step = steps[id];
  const viewport = VIEWPORTS[shot.viewport];
  const session = step.auth === false ? undefined : await new PanelApi(stack.panelUrl).login(admin.username, admin.password);
  const page = await newPage(browser, { panelUrl: stack.panelUrl, session, viewport, mobile: Boolean(step.mobile), clusterMs: step.stack === 'fresh' ? 1000 : 0 });
  try {
    const raw = await step.run(helpers(page, stack.panelUrl));
    if (process.env.SHOTS_RAW_DIR) {
      fs.mkdirSync(process.env.SHOTS_RAW_DIR, { recursive: true });
      fs.writeFileSync(path.join(process.env.SHOTS_RAW_DIR, `${shot.page.replaceAll('/', '_')}_${shot.name}.png`), raw); // debugging aid
    }
    const { bytes, width, height } = await optimize(raw, shot.format);
    if (bytes.length > MAX_BYTES) throw new Error(`${id} is ${bytes.length} bytes, over the ${MAX_BYTES} byte limit`);
    const file = fileFor(shot);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // Keep the committed file when the new one only differs by rendering jitter (see nearlyEqual).
    const unchanged = fs.existsSync(file) && (await nearlyEqual(fs.readFileSync(file), bytes));
    if (!unchanged) fs.writeFileSync(file, bytes);
    results.push({ id, bytes: unchanged ? fs.statSync(file).size : bytes.length, width, height, unchanged });
    log(`${id}: ${width}x${height}, ${(bytes.length / 1024).toFixed(1)} KB${unchanged ? ' (unchanged)' : ''}`);
  } catch (error) {
    fs.mkdirSync(outRoot, { recursive: true });
    await page.screenshot({ path: path.join(outRoot, `_failed-${shot.name}.png`) }).catch(() => undefined);
    throw new Error(`${id} failed: ${error.message}`);
  } finally {
    await page.context().close();
  }
}

async function waitForScans(api, expected) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const scans = await api.listScans();
    const open = scans.filter((s) => ['PENDING', 'QUEUED', 'RUNNING'].includes(s.status));
    if (scans.length >= expected && open.length === 0) return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`the scans did not finish in 2 minutes`);
}

let browser;
try {
  const { image, source } = await resolveImage();
  log(`image ${image} (${source})`);
  const adminPassword = `Docs-${randomBytes(9).toString('base64url')}-1a`;
  const admin = { username: 'admin', password: adminPassword };
  browser = await launch();

  const base = selected.filter((s) => s.stack !== 'scanner');
  if (base.length > 0) {
    const stack = new Stack({ image, adminPassword });
    stacks.push(stack);
    await stack.up();
    const api = new PanelApi(stack.panelUrl);
    await api.login(admin.username, admin.password);
    for (const shot of base.filter((s) => s.stack === 'fresh')) await capture(browser, stack, api, admin, shot);
    await removeDefaultRepos(api);
    await seedBase(api, new Publisher(stack.repoUrl, admin));
    for (const shot of base.filter((s) => s.stack === 'base')) await capture(browser, stack, api, admin, shot);
    await stack.down();
  }

  const scanner = selected.filter((s) => s.stack === 'scanner');
  if (scanner.length > 0) {
    const key = randomBytes(12).toString('hex');
    const stack = new Stack({ image, adminPassword, scanner: { stubDir: await resolveStubDir(), key } });
    stacks.push(stack);
    await stack.up();
    const api = new PanelApi(stack.panelUrl);
    await api.login(admin.username, admin.password);
    await removeDefaultRepos(api);
    await seedScanner(api, new Publisher(stack.repoUrl, admin), new ScannerStub(stack.stubUrl, key));
    await waitForScans(api, 6);
    for (const shot of scanner) await capture(browser, stack, api, admin, shot);
    await stack.down();
  }
  const total = results.reduce((n, r) => n + r.bytes, 0);
  const kept = results.filter((r) => r.unchanged).length;
  log(`done: ${results.length} images (${results.length - kept} written, ${kept} unchanged), ${(total / 1024).toFixed(0)} KB in total, below ${outRoot}`);
} catch (error) {
  console.error(`[shots] FAILED: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => undefined);
  await cleanup();
}
