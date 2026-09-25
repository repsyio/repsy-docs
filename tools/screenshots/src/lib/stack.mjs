// Builds (or reuses) the Repsy Open Source image and runs the Docker stacks of the screenshot run.
//
// Safety rules of this file:
//  - every stack has its own unique compose project name (`docs-shots-<random>`), and every compose command
//    is run with `-p <that name>`, so it can only ever touch the containers, network and volumes of that project;
//  - host ports are never fixed: compose publishes them on random free ports of 127.0.0.1 and we read them back;
//  - teardown is `docker compose -p <name> down -v --remove-orphans` and nothing else. No prune, no other names.
import { execFile, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const TOOL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OS_REPO_URL = process.env.REPSY_REPO_URL ?? 'https://github.com/repsyio/repsy.git';

export function log(message) {
  console.log(`[shots] ${message}`);
}

async function sh(cmd, args, options = {}) {
  const { stdout } = await run(cmd, args, { maxBuffer: 64 * 1024 * 1024, ...options });
  return stdout.trim();
}

/** A fresh scratch directory outside the checkout; removed by `cleanup()` of the caller. */
const tempDirs = [];
export function makeTempDir(prefix = 'docs-shots-') {
  const dir = fs.mkdtempSync(path.join(process.env.SHOTS_TMP_DIR ?? os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

/** Removes every scratch directory made by `makeTempDir`. */
export function removeTempDirs() {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Puts a copy of origin/main of repsyio/repsy (with its `core` submodule) into `destDir` and returns
 * the short commit. With REPSY_REPO_DIR (a local clone) the clone is only READ: `git fetch` and `git archive`,
 * never a checkout or a build inside it. Without it, the repository is cloned from GitHub into `destDir`.
 */
async function copyOsSource(destDir) {
  const local = process.env.REPSY_REPO_DIR;
  fs.mkdirSync(destDir, { recursive: true });
  if (local) {
    if (!process.env.SHOTS_NO_FETCH) {
      await sh('git', ['-C', local, 'fetch', '--quiet', 'origin']);
    }
    const sha = await sh('git', ['-C', local, 'rev-parse', 'origin/main']);
    await pipeArchive(['-C', local, 'archive', sha], destDir);
    const link = await sh('git', ['-C', local, 'ls-tree', sha, 'core']);
    const coreSha = link.split(/\s+/)[2];
    const coreDir = path.join(destDir, 'core');
    fs.mkdirSync(coreDir, { recursive: true });
    try {
      await pipeArchive(['-C', path.join(local, 'core'), 'archive', coreSha], coreDir);
    } catch {
      // The submodule of the local clone does not have that commit yet: fetch it from the submodule's remote.
      await sh('git', ['-C', path.join(local, 'core'), 'fetch', '--quiet', 'origin']);
      await pipeArchive(['-C', path.join(local, 'core'), 'archive', coreSha], coreDir);
    }
    return sha;
  }
  await sh('git', ['clone', '--quiet', '--depth', '1', '--recurse-submodules', OS_REPO_URL, destDir]);
  return sh('git', ['-C', destDir, 'rev-parse', 'HEAD']);
}

function pipeArchive(gitArgs, destDir) {
  return new Promise((resolve, reject) => {
    const git = spawn('git', gitArgs, { stdio: ['ignore', 'pipe', 'inherit'] });
    const tar = spawn('tar', ['-x', '-C', destDir], { stdio: ['pipe', 'inherit', 'inherit'] });
    git.stdout.pipe(tar.stdin);
    let pending = 2;
    let failed = false;
    const done = (code, who) => {
      if (code !== 0 && !failed) {
        failed = true;
        reject(new Error(`${who} exited with ${code}`));
      }
      if (--pending === 0 && !failed) resolve();
    };
    git.on('exit', (code) => done(code, 'git archive'));
    tar.on('exit', (code) => done(code, 'tar'));
  });
}

async function imageExists(tag) {
  try {
    await sh('docker', ['image', 'inspect', tag]);
    return true;
  } catch {
    return false;
  }
}

/**
 * The Repsy image to run. REPSY_IMAGE (a local image or a registry image such as
 * repo.repsy.io/repsy/os/repsy:latest) wins; otherwise the image is built from a copy of origin/main of the
 * OS repository and tagged `repsy-os-docs-shots:<sha>`, so a second run on the same commit reuses it.
 * Returns { image, source } where `source` is a short description for the run log.
 */
export async function resolveImage() {
  if (process.env.REPSY_IMAGE) {
    const image = process.env.REPSY_IMAGE;
    if (!(await imageExists(image))) {
      log(`pulling ${image}`);
      await sh('docker', ['pull', image]);
    }
    return { image, source: `REPSY_IMAGE=${image}` };
  }
  const tmp = makeTempDir('docs-shots-src-');
  try {
    const sha = await copyOsSource(tmp);
    const image = `repsy-os-docs-shots:${sha.slice(0, 8)}`;
    if (!process.env.SHOTS_REBUILD && (await imageExists(image))) {
      log(`reusing image ${image}`);
    } else {
      log(`building image ${image} from origin/main (${sha.slice(0, 8)}); this takes several minutes the first time`);
      await new Promise((resolve, reject) => {
        const build = spawn('docker', ['build', '-t', image, '.'], {
          cwd: tmp,
          stdio: ['ignore', 'ignore', process.env.SHOTS_VERBOSE ? 'inherit' : 'ignore'],
          env: { ...process.env, DOCKER_BUILDKIT: '1' },
        });
        build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`docker build failed (${code})`))));
      });
    }
    return { image, source: `origin/main ${sha.slice(0, 8)}` };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** Copies the stub scanner (e2e/src/stubs/scanner of origin/main) into a scratch directory and returns it. */
export async function resolveStubDir() {
  const tmp = makeTempDir('docs-shots-stub-src-');
  try {
    const local = process.env.REPSY_REPO_DIR;
    const stubDir = path.join(makeTempDir('docs-shots-stub-'), 'scanner');
    fs.mkdirSync(stubDir, { recursive: true });
    if (local) {
      const sha = await sh('git', ['-C', local, 'rev-parse', 'origin/main']);
      await pipeArchive(['-C', local, 'archive', sha, 'e2e/src/stubs/scanner'], tmp);
    } else {
      await sh('git', ['clone', '--quiet', '--depth', '1', OS_REPO_URL, tmp]);
    }
    fs.cpSync(path.join(tmp, 'e2e', 'src', 'stubs', 'scanner'), stubDir, { recursive: true });
    return stubDir;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** One running compose project. */
export class Stack {
  /**
   * @param {{ image: string, adminPassword: string, scanner?: { stubDir: string, key: string } }} opts
   */
  constructor(opts) {
    this.opts = opts;
    this.project = `docs-shots-${randomBytes(4).toString('hex')}${opts.scanner ? '-scan' : ''}`;
    this.started = false;
  }

  get env() {
    return {
      ...process.env,
      REPSY_IMAGE: this.opts.image,
      SHOTS_ADMIN_PASSWORD: this.opts.adminPassword,
      SHOTS_REPO_BASE_URL: process.env.SHOTS_REPO_BASE_URL ?? 'https://repsy.example.com',
      ...(this.opts.scanner
        ? { SHOTS_STUB_DIR: this.opts.scanner.stubDir, SHOTS_SCANNER_KEY: this.opts.scanner.key }
        : {}),
    };
  }

  get files() {
    const files = ['-f', path.join(TOOL_DIR, 'docker-compose.yml')];
    if (this.opts.scanner) files.push('-f', path.join(TOOL_DIR, 'docker-compose.scanner.yml'));
    return files;
  }

  compose(args, options = {}) {
    return sh('docker', ['compose', '-p', this.project, ...this.files, ...args], { env: this.env, ...options });
  }

  async up() {
    this.started = true; // even a failed `up` may have created a network, so always tear down
    log(`starting stack ${this.project}`);
    await this.compose(['up', '-d', '--wait', '--wait-timeout', '240']);
    const port = async (service, containerPort) => {
      const out = await this.compose(['port', service, String(containerPort)]);
      return Number(out.split(':').pop());
    };
    this.panelPort = await port('repsy', 8080);
    this.repoPort = await port('repsy', 9090);
    if (this.opts.scanner) this.stubUrl = `http://127.0.0.1:${await port('scanner-stub', 8090)}`;
    this.panelUrl = `http://127.0.0.1:${this.panelPort}`;
    this.repoUrl = `http://127.0.0.1:${this.repoPort}`;
    log(`stack ${this.project} is up: panel ${this.panelUrl}, repositories ${this.repoUrl}`);
  }

  /** Removes containers, the network and the volumes of this project only. Safe to call twice. */
  async down() {
    if (!this.started) return;
    this.started = false;
    try {
      await this.compose(['down', '--volumes', '--remove-orphans', '--timeout', '10']);
      log(`stack ${this.project} removed`);
    } catch (error) {
      console.error(`[shots] could not remove stack ${this.project}: ${error.message}`);
      console.error(`[shots] remove it by hand with: docker compose -p ${this.project} down -v`);
    }
  }
}
