// The demo data of the screenshots. Everything here is made up: RFC 2606 example names, obviously fake users,
// placeholder artifacts. Names are stable, so the manifest and the docs pages can refer to them.
import { randomBytes } from 'node:crypto';
import { log } from './stack.mjs';

/** The demo repositories: one per format, named like a team would name them. */
export const REPOS = {
  maven: { type: 'MAVEN', name: 'releases', description: 'Release builds of the example shop services', privateRepo: false },
  npm: { type: 'NPM', name: 'internal-tools', description: 'Internal command line tools and the UI kit', privateRepo: true },
  docker: { type: 'DOCKER', name: 'containers', description: 'Container images of the example shop', privateRepo: true },
  pypi: { type: 'PYPI', name: 'python-libs', description: 'Shared Python libraries', privateRepo: true },
  cargo: { type: 'CARGO', name: 'crates', description: 'Internal Rust crates', privateRepo: true },
  nuget: { type: 'NUGET', name: 'dotnet-libs', description: 'Shared .NET libraries', privateRepo: true },
  golang: { type: 'GOLANG', name: 'go-modules', description: 'Internal Go modules', privateRepo: true },
  helm: { type: 'HELM', name: 'charts', description: 'Helm charts of the example shop', privateRepo: true },
  ruby: { type: 'RUBY', name: 'gems', description: 'Internal Ruby gems', privateRepo: true },
};

/** Two extra users. Their passwords are random and never shown. */
export const USERS = [
  { username: 'jane_doe', role: 'ADMIN' },
  { username: 'john_roe', role: 'USER' },
];

export function randomPassword() {
  return `Demo-${randomBytes(9).toString('base64url')}-1a`;
}

/** Deploy tokens are given a fixed username and a fixed far-away expiry so the table never changes. */
export const EXPIRES = '2027-03-01T00:00:00Z';

async function each(items, fn) {
  for (const item of items) await fn(item);
}

/** Removes the repositories a fresh instance starts with (after the "fresh install" shots were taken). */
export async function removeDefaultRepos(api) {
  const repos = await api.listRepos();
  await each(repos, (repo) => api.deleteRepo(repo.name));
  log(`removed the ${repos.length} default repositories`);
}

/** Creates the repositories, users, packages and deploy tokens of the base stack. */
export async function seedBase(api, publisher) {
  // Newest first in the panel's lists: the repositories with packages are created last, so they are listed first.
  const order = ['cargo', 'nuget', 'golang', 'helm', 'ruby', 'pypi', 'docker', 'npm', 'maven'];
  await each(order.map((key) => REPOS[key]), (r) => api.createRepo(r.type, r.name, r.description, r.privateRepo));
  await each(USERS, (u) => api.createUser(u.username, randomPassword(), u.role));

  const maven = REPOS.maven.name;
  const mavenPackages = {
    'com.example.shop:shop-core': ['1.0.0', '1.1.0', '1.2.0'],
    'com.example.shop:shop-api': ['2.0.0'],
    'com.example.tools:build-utils': ['0.9.0'],
  };
  for (const [coordinates, versions] of Object.entries(mavenPackages)) {
    for (const version of versions) await publisher.maven(maven, coordinates, version);
    await publisher.mavenMetadata(maven, coordinates, versions);
  }

  const npm = REPOS.npm.name;
  await publisher.npm(npm, '@example/ui-kit', '1.4.0', 'Shared UI components of the example shop');
  await publisher.npm(npm, '@example/ui-kit', '1.5.0', 'Shared UI components of the example shop');
  await publisher.npm(npm, '@example/date-utils', '0.2.1', 'Small date helpers');
  await publisher.npm(npm, 'deploy-cli', '3.0.0', 'Command line helper for deployments');

  const docker = REPOS.docker.name;
  await publisher.docker(docker, 'api', '1.0.0', 'example/api 1.0.0');
  await publisher.docker(docker, 'api', '1.1.0', 'example/api 1.1.0');
  await publisher.docker(docker, 'api', 'latest', 'example/api 1.1.0'); // same content as 1.1.0: one manifest, two tags
  await publisher.docker(docker, 'worker', '1.0.0', 'example/worker 1.0.0');

  const pypi = REPOS.pypi.name;
  await publisher.pypi(pypi, 'example-toolkit', '0.3.0', 'Toolkit used by the example shop');
  await publisher.pypi(pypi, 'example-toolkit', '0.4.0', 'Toolkit used by the example shop');
  await publisher.pypi(pypi, 'demo-parser', '1.0.0', 'A demo parser');

  await api.createDeployToken(maven, { name: 'ci-publish', description: 'Publishes releases from CI', username: 'ci-publisher', readOnly: false, expirationDate: EXPIRES });
  await api.createDeployToken(maven, { name: 'build-server-readonly', description: 'Read-only access for the build server', username: 'build-server', readOnly: true, expirationDate: EXPIRES });
  await api.createDeployToken(maven, { name: 'local-dev', description: 'Personal token for local builds', username: 'local-dev', readOnly: false });
  await api.createDeployToken(REPOS.npm.name, { name: 'ci-publish', description: 'Publishes packages from CI', username: 'ci-publisher', readOnly: false, expirationDate: EXPIRES });
  await api.createDeployToken(docker, { name: 'ci-push', description: 'Pushes images from CI', username: 'ci-pusher', readOnly: false, expirationDate: EXPIRES });
  log('base demo data seeded');
}

/**
 * The scanner stack: a few packages whose (stub) scans report findings. The stub decides by artifact name; a
 * script per artifact name gives every package the outcome the docs page needs, without odd package names.
 */
export async function seedScanner(api, publisher, stub) {
  const maven = REPOS.maven.name;
  const npm = REPOS.npm.name;
  const docker = REPOS.docker.name;
  await each(
    [REPOS.maven, REPOS.npm, REPOS.docker, REPOS.pypi],
    (r) => api.createRepo(r.type, r.name, r.description, r.privateRepo),
  );
  // Scan every new version automatically (the toggle only exists when a scanner is configured).
  await each([maven, npm, docker, REPOS.pypi.name], (name) => api.updateSettings(name, { securityScanEnabled: true }));

  await stub.script('com.example.shop:shop-core', { findings: ['CRITICAL', 'HIGH', 'HIGH', 'MEDIUM', 'MEDIUM', 'LOW'] });
  await stub.script('com.example.shop:shop-api', { findings: [] });
  await stub.script('@example/ui-kit', { findings: ['HIGH', 'MEDIUM', 'LOW', 'LOW'] });
  await stub.script('deploy-cli', { findings: [] });
  await stub.script('api', { findings: ['CRITICAL', 'CRITICAL', 'HIGH', 'MEDIUM'] });

  for (const version of ['1.1.0', '1.2.0']) await publisher.maven(maven, 'com.example.shop:shop-core', version);
  await publisher.mavenMetadata(maven, 'com.example.shop:shop-core', ['1.1.0', '1.2.0']);
  await publisher.maven(maven, 'com.example.shop:shop-api', '2.0.0');
  await publisher.mavenMetadata(maven, 'com.example.shop:shop-api', ['2.0.0']);
  await publisher.npm(npm, '@example/ui-kit', '1.5.0', 'Shared UI components of the example shop');
  await publisher.npm(npm, 'deploy-cli', '3.0.0', 'Command line helper for deployments');
  await publisher.docker(docker, 'api', '1.1.0', 'example/api 1.1.0');
  await publisher.pypi(REPOS.pypi.name, 'example-toolkit', '0.4.0', 'Toolkit used by the example shop');
  log('scanner demo data seeded; waiting for the scans');
}
