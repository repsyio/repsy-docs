// Publishes small demo packages into a repository over the protocol port (the panel never sees a client, so
// this speaks the wire formats directly, like the UI suite of repsyio/repsy does). Only the shape matters to
// the panel: the bytes are tiny placeholder artifacts with obviously fake content.
import { createHash } from 'node:crypto';
import zlib from 'node:zlib';
import { zipSync } from 'fflate';

const enc = new TextEncoder();
// Zip entries carry a fixed timestamp, so the same package has the same bytes and checksums on every run.
const FIXED_MTIME = Date.UTC(2026, 0, 1);
const sha256 = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

/** A minimal ustar tar archive (regular files only). */
function tar(entries) {
  const blocks = [];
  for (const { name, data } of entries) {
    const header = Buffer.alloc(512);
    header.write(name, 0, 'utf8');
    header.write('0000644\0', 100, 'ascii');
    header.write('0000000\0', 108, 'ascii');
    header.write('0000000\0', 116, 'ascii');
    header.write(`${data.length.toString(8).padStart(11, '0')}\0`, 124, 'ascii');
    header.write('00000000000\0', 136, 'ascii');
    header.write('        ', 148, 'ascii');
    header.write('0', 156, 'ascii');
    header.write('ustar', 257, 'ascii');
    header.write('00', 263, 'ascii');
    let sum = 0;
    for (const byte of header) sum += byte;
    header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 'ascii');
    blocks.push(header);
    const padded = Buffer.alloc(Math.ceil(data.length / 512) * 512);
    data.copy(padded);
    blocks.push(padded);
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

function basic(admin) {
  return `Basic ${Buffer.from(`${admin.username}:${admin.password}`).toString('base64')}`;
}

async function expectOk(res, what) {
  if (![200, 201, 202].includes(res.status)) {
    throw new Error(`publishing ${what} answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/** `repoUrl` is the protocol base (http://127.0.0.1:<port>), `admin` is { username, password }. */
export class Publisher {
  constructor(repoUrl, admin) {
    this.repoUrl = repoUrl;
    this.admin = admin;
  }

  // ---- Maven: `group:artifact`, PUT jar, pom and the artifact metadata --------------------------------------
  async maven(repo, coordinates, version) {
    const [group, artifact] = coordinates.split(':');
    const dir = `${group.replace(/\./g, '/')}/${artifact}`;
    const base = `${dir}/${version}/${artifact}-${version}`;
    const jar = Buffer.from(
      zipSync(
        {
          'META-INF/MANIFEST.MF': enc.encode(`Manifest-Version: 1.0\nImplementation-Title: ${artifact}\nImplementation-Version: ${version}\n`),
          'README.txt': enc.encode('Demo artifact for the Repsy documentation screenshots.\n'),
        },
        { level: 0, mtime: FIXED_MTIME },
      ),
    );
    const pom =
      '<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="http://maven.apache.org/POM/4.0.0">\n' +
      `  <modelVersion>4.0.0</modelVersion>\n  <groupId>${group}</groupId>\n  <artifactId>${artifact}</artifactId>\n` +
      `  <version>${version}</version>\n  <packaging>jar</packaging>\n` +
      `  <name>${artifact}</name>\n  <description>Demo artifact for the Repsy documentation.</description>\n` +
      '  <url>https://example.com/shop</url>\n' +
      '  <organization>\n    <name>Example Shop</name>\n    <url>https://example.com</url>\n  </organization>\n' +
      '  <licenses>\n    <license>\n      <name>Apache-2.0</name>\n      <url>https://www.apache.org/licenses/LICENSE-2.0</url>\n    </license>\n  </licenses>\n' +
      '  <developers>\n    <developer>\n      <name>Example Team</name>\n    </developer>\n  </developers>\n' +
      '  <scm>\n    <url>https://example.com/shop/source</url>\n  </scm>\n' +
      '</project>\n';
    await this.#put(repo, `${base}.jar`, jar, 'application/octet-stream');
    await this.#put(repo, `${base}.pom`, pom, 'application/octet-stream');
    return { group, artifact, dir };
  }

  async mavenMetadata(repo, coordinates, versions) {
    const [group, artifact] = coordinates.split(':');
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<metadata>\n' +
      `  <groupId>${group}</groupId>\n  <artifactId>${artifact}</artifactId>\n  <versioning>\n    <versions>\n` +
      versions.map((v) => `      <version>${v}</version>\n`).join('') +
      '    </versions>\n    <lastUpdated>20260101000000</lastUpdated>\n  </versioning>\n</metadata>\n';
    await this.#put(repo, `${group.replace(/\./g, '/')}/${artifact}/maven-metadata.xml`, xml, 'application/xml');
  }

  async #put(repo, relPath, body, contentType) {
    const res = await fetch(`${this.repoUrl}/${repo}/${relPath}`, {
      method: 'PUT',
      headers: { Authorization: basic(this.admin), 'Content-Type': contentType },
      body: typeof body === 'string' ? body : new Uint8Array(body),
    });
    await expectOk(res, `PUT ${relPath}`);
  }

  // ---- npm: `@scope/name` or `name`, PUT the publish document ----------------------------------------------
  async npm(repo, name, version, description) {
    const bare = name.includes('/') ? name.slice(name.indexOf('/') + 1) : name;
    const manifest = JSON.stringify({ name, version, main: 'index.js' }, null, 2);
    const tarball = zlib.gzipSync(
      tar([
        { name: 'package/package.json', data: Buffer.from(manifest) },
        { name: 'package/index.js', data: Buffer.from(`module.exports = ${JSON.stringify(name)};\n`) },
      ]),
      { level: 6 },
    );
    const file = `${bare}-${version}.tgz`;
    const url = `${this.repoUrl}/${repo}/${name}/-/${file}`;
    const doc = {
      _id: name,
      name,
      description,
      'dist-tags': { latest: version },
      versions: {
        [version]: {
          name,
          version,
          description,
          keywords: ['example', 'demo'],
          license: 'MIT',
          homepage: 'https://example.com/shop',
          repository: { type: 'git', url: 'git+https://example.com/shop/source.git' },
          bugs: { url: 'https://example.com/shop/issues' },
          readme: `# ${name}\n\n${description}\n\nThis package only exists for the Repsy documentation.\n`,
          dist: {
            integrity: `sha512-${createHash('sha512').update(tarball).digest('base64')}`,
            shasum: createHash('sha1').update(tarball).digest('hex'),
            tarball: url,
          },
        },
      },
      _attachments: {
        [file]: { content_type: 'application/octet-stream', data: tarball.toString('base64'), length: tarball.length },
      },
    };
    const res = await fetch(`${this.repoUrl}/${repo}/${encodeURIComponent(name).replace(/^%40/, '@')}`, {
      method: 'PUT',
      headers: { Authorization: basic(this.admin), 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    await expectOk(res, `npm ${name}@${version}`);
  }

  // ---- Docker: push a one-layer image over the registry API (token hop, blobs, manifest) -------------------
  async docker(repo, image, tag, marker) {
    const layerTar = tar([{ name: 'README.txt', data: Buffer.from(`${marker}\n`) }]);
    const layer = zlib.gzipSync(layerTar, { level: 6 });
    const config = Buffer.from(
      JSON.stringify({
        architecture: 'amd64',
        os: 'linux',
        config: {},
        rootfs: { type: 'layers', diff_ids: [sha256(layerTar)] },
        history: [{ created: '2026-01-01T00:00:00Z', created_by: 'docs demo' }],
      }),
    );
    const manifest = Buffer.from(
      JSON.stringify({
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
        config: { mediaType: 'application/vnd.docker.container.image.v1+json', digest: sha256(config), size: config.length },
        layers: [{ mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', digest: sha256(layer), size: layer.length }],
      }),
    );
    const ping = await fetch(`${this.repoUrl}/v2/`);
    const challenge = ping.headers.get('www-authenticate') ?? '';
    const realm = /realm="([^"]*)"/.exec(challenge)?.[1];
    const service = /service="([^"]*)"/.exec(challenge)?.[1];
    if (!realm || !service) throw new Error(`docker: no bearer challenge on /v2/ (status ${ping.status})`);
    const scope = `repository:${repo}/${image}:push,pull`;
    // The realm carries the address the registry thinks it has (REPO_BASE_URL); talk to the real port instead.
    const tokenUrl = new URL(new URL(realm).pathname, this.repoUrl);
    tokenUrl.searchParams.set('service', service);
    tokenUrl.searchParams.set('scope', scope);
    const tokenRes = await fetch(tokenUrl, { headers: { Authorization: basic(this.admin) } });
    if (!tokenRes.ok) throw new Error(`docker token answered ${tokenRes.status}`);
    const bearer = { Authorization: `Bearer ${(await tokenRes.json()).token}` };

    for (const [bytes, digest] of [[config, sha256(config)], [layer, sha256(layer)]]) {
      const start = await fetch(`${this.repoUrl}/v2/${repo}/${image}/blobs/uploads/`, { method: 'POST', headers: bearer });
      if (start.status !== 202) throw new Error(`docker blob start answered ${start.status}`);
      const location = new URL(start.headers.get('location'), this.repoUrl);
      location.searchParams.set('digest', digest);
      const put = await fetch(location, {
        method: 'PUT',
        headers: { ...bearer, 'Content-Type': 'application/octet-stream' },
        body: new Uint8Array(bytes),
      });
      await expectOk(put, `docker blob ${digest.slice(0, 19)}`);
    }
    const put = await fetch(`${this.repoUrl}/v2/${repo}/${image}/manifests/${tag}`, {
      method: 'PUT',
      headers: { ...bearer, 'Content-Type': 'application/vnd.docker.distribution.manifest.v2+json' },
      body: new Uint8Array(manifest),
    });
    await expectOk(put, `docker manifest ${image}:${tag}`);
  }

  // ---- PyPI: twine-style multipart upload of a wheel -------------------------------------------------------
  async pypi(repo, name, version, summary) {
    const dist = name.replace(/-/g, '_');
    const info = `${dist}-${version}.dist-info`;
    const files = {
      [`${dist}/__init__.py`]: '# demo package\n',
      [`${info}/METADATA`]: `Metadata-Version: 2.1\nName: ${name}\nVersion: ${version}\nSummary: ${summary}\nRequires-Python: >=3.9\n`,
      [`${info}/WHEEL`]: 'Wheel-Version: 1.0\nGenerator: docs-demo\nRoot-Is-Purelib: true\nTag: py3-none-any\n',
    };
    const record = `${Object.keys(files).map((p) => `${p},,`).join('\n')}\n${info}/RECORD,,\n`;
    const zipEntries = Object.fromEntries(Object.entries({ ...files, [`${info}/RECORD`]: record }).map(([k, v]) => [k, enc.encode(v)]));
    const wheel = Buffer.from(zipSync(zipEntries, { level: 0, mtime: FIXED_MTIME }));
    const form = new FormData();
    form.append(':action', 'file_upload');
    form.append('protocol_version', '1');
    form.append('metadata_version', '2.1');
    form.append('name', name);
    form.append('version', version);
    form.append('summary', summary);
    form.append('requires_python', '>=3.9');
    form.append('filetype', 'bdist_wheel');
    form.append('pyversion', 'py3');
    form.append('sha256_digest', createHash('sha256').update(wheel).digest('hex'));
    form.append('content', new Blob([new Uint8Array(wheel)]), `${dist}-${version}-py3-none-any.whl`);
    const res = await fetch(`${this.repoUrl}/${repo}/`, { method: 'POST', headers: { Authorization: basic(this.admin) }, body: form });
    await expectOk(res, `pypi ${name} ${version}`);
  }
}
