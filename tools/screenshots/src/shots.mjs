// The screenshots, one function per shot. `manifest.json` lists them (name, page, route, state, viewport); this
// file holds how each one is made. `run.mjs` refuses to run when the two disagree, so a shot cannot be added
// or renamed in only one of them.
//
// A step gets a helper `h` and returns the raw PNG. The panel is addressed through its `data-testid`
// attributes, the same stable selectors the UI suite of repsyio/repsy uses.
import { REPOS } from './lib/seed.mjs';
import { settle } from './lib/browser.mjs';

const OPTS = { animations: 'disabled', caret: 'hide' };

/**
 * Takes the screenshot again until two consecutive frames are byte-identical: an avatar, a chart or a fade
 * that is still settling would otherwise put a few different pixels into an image on every run.
 */
async function stable(take) {
  let previous = await take();
  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const next = await take();
    if (next.equals(previous)) return next;
    previous = next;
  }
  throw new Error('the page never settled: two consecutive screenshots keep differing');
}

/** Screenshot helpers bound to one page. */
export function helpers(page, panelUrl) {
  const tid = (id) => page.getByTestId(id);
  const h = {
    page,
    tid,
    /** Navigates to a panel route and waits until the element `ready` (a test id) is visible. */
    async open(route, ready) {
      await page.goto(new URL(route, panelUrl).toString());
      if (ready) await tid(ready).first().waitFor({ state: 'visible', timeout: 20_000 });
      await settle(page);
    },
    /** The whole viewport. */
    viewport: () => stable(() => page.screenshot(OPTS)),
    /** The whole page, top to bottom (the width stays the viewport's). */
    full: () => stable(() => page.screenshot({ ...OPTS, fullPage: true })),
    /** One or more elements, cropped together with `pad` px around them. */
    async around(locators, pad = 16) {
      const list = Array.isArray(locators) ? locators : [locators];
      await list[0].scrollIntoViewIfNeeded();
      await settle(page);
      const boxes = [];
      for (const l of list) boxes.push(await l.boundingBox());
      const vp = page.viewportSize();
      const x1 = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
      const y1 = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
      const x2 = Math.min(vp.width, Math.max(...boxes.map((b) => b.x + b.width)) + pad);
      const y2 = Math.min(vp.height, Math.max(...boxes.map((b) => b.y + b.height)) + pad);
      return stable(() => page.screenshot({ ...OPTS, clip: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } }));
    },
  };
  return h;
}

const R = REPOS;
const CONFIGURE = async (h, route) => {
  await h.open(route, 'pkg-configure');
  await h.tid('pkg-configure').click();
  await h.tid('config-modal').waitFor({ state: 'visible' });
  await settle(h.page);
  return h.around(h.tid('config-modal'), 24);
};

/**
 * id (`<page-slug>/<name>`) -> { stack: 'fresh' | 'base' | 'scanner', auth: boolean, run(h) }
 * `fresh` shots run on the untouched instance (its nine default repositories), `base` after the demo data was
 * seeded, `scanner` on the second stack that has the stub scanner.
 */
export const steps = {
  // ---- getting-started/web-ui-tour ----------------------------------------------------------------------------
  'getting-started/web-ui-tour/login': {
    stack: 'fresh',
    auth: false,
    async run(h) {
      await h.open('/login', 'login-form');
      await h.tid('login-username').fill('admin');
      await h.tid('login-password').fill('example-password');
      return h.viewport();
    },
  },
  'getting-started/web-ui-tour/dashboard': {
    stack: 'base',
    async run(h) {
      await h.open('/', 'dashboard-cards');
      return h.full();
    },
  },
  'getting-started/web-ui-tour/repository-list': {
    stack: 'base',
    async run(h) {
      await h.open('/repositories', 'repo-table');
      return h.viewport();
    },
  },
  'getting-started/web-ui-tour/user-menu': {
    stack: 'base',
    async run(h) {
      await h.open('/repositories', 'repo-table');
      await h.tid('header-avatar').click();
      await h.tid('header-menu').waitFor({ state: 'visible' });
      return h.around([h.tid('header-avatar'), h.tid('header-menu')], 24);
    },
  },
  'getting-started/web-ui-tour/dashboard-mobile': {
    stack: 'base',
    mobile: true,
    async run(h) {
      await h.open('/', 'dashboard-cards');
      return h.viewport();
    },
  },
  'getting-started/web-ui-tour/repository-list-mobile': {
    stack: 'base',
    mobile: true,
    async run(h) {
      await h.open('/repositories', 'repo-cards');
      return h.viewport();
    },
  },

  // ---- getting-started/creating-your-first-repository ---------------------------------------------------------
  'getting-started/creating-your-first-repository/repository-list-fresh': {
    stack: 'fresh',
    async run(h) {
      await h.open('/repositories', 'repo-table');
      return h.viewport();
    },
  },
  'getting-started/creating-your-first-repository/create-repository-dialog': {
    stack: 'base',
    async run(h) {
      await h.open('/repositories', 'repo-table');
      await h.tid('repo-create').click();
      await h.tid('repo-create-modal').waitFor({ state: 'visible' });
      return h.around(h.tid('repo-create-modal'), 24);
    },
  },
  'getting-started/creating-your-first-repository/create-repository-filled': {
    stack: 'base',
    async run(h) {
      await h.open('/repositories', 'repo-table');
      await h.tid('repo-create').click();
      const modal = h.tid('repo-create-modal');
      await modal.waitFor({ state: 'visible' });
      await h.tid('repo-create-type').getByTestId('selector-toggle').click();
      await h.tid('repo-create-type').getByTestId('selector-option-maven').click();
      await h.tid('repo-create-name').fill('my-first-repo');
      await h.tid('repo-create-description').fill('My first Repsy repository');
      return h.around(modal, 24);
    },
  },

  // ---- repositories/repository-settings -----------------------------------------------------------------------
  'repositories/repository-settings/settings-overview': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}/settings`, 'settings-page');
      return h.viewport();
    },
  },
  'repositories/repository-settings/settings-maven-signing': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}/settings`, 'settings-page');
      return h.around(h.tid('settings-pgp'), 16);
    },
  },
  'repositories/repository-settings/settings-docker-maintenance': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.docker.name}/settings`, 'settings-page');
      return h.around([h.tid('settings-untagged-manifests'), h.tid('settings-orphan-layers')], 16);
    },
  },
  'repositories/repository-settings/settings-rename-and-description': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}/settings`, 'settings-page');
      return h.around(h.tid('settings-info'), 16);
    },
  },

  // ---- repositories/browsing-and-deleting-packages ------------------------------------------------------------
  'repositories/browsing-and-deleting-packages/artifact-list': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}/com.example.shop`, 'pkg-sublist-table');
      return h.viewport();
    },
  },
  'repositories/browsing-and-deleting-packages/version-list': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}/com.example.shop/shop-core`, 'pkg-versions-table');
      return h.viewport();
    },
  },
  'repositories/browsing-and-deleting-packages/delete-version-confirmation': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}/com.example.shop/shop-core`, 'pkg-versions-table');
      const row = h.tid('pkg-versions-table').getByTestId('pkg-versions-row-1.0.0');
      await row.getByTestId('dropdown-toggle').click();
      await row.getByTestId('row-delete').click();
      await h.tid('danger-modal').waitFor({ state: 'visible' });
      return h.around(h.tid('danger-modal'), 24);
    },
  },

  // ---- getting-started/creating-a-deploy-token ----------------------------------------------------------------
  'getting-started/creating-a-deploy-token/deploy-tokens-table': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}/settings`, 'token-section');
      return h.around(h.tid('token-section'), 16);
    },
  },
  'getting-started/creating-a-deploy-token/create-token-dialog': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}/settings`, 'token-section');
      await h.tid('token-create').click();
      const modal = h.tid('token-create-modal');
      await modal.waitFor({ state: 'visible' });
      await h.tid('token-create-name').fill('ci-publish-2');
      await h.tid('token-create-description').fill('Publishes releases from the second pipeline');
      await h.tid('token-create-username').fill('ci-publisher-2');
      return h.around(modal, 24);
    },
  },
  'getting-started/creating-a-deploy-token/token-created-dialog': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}/settings`, 'token-section');
      await h.tid('token-create').click();
      await h.tid('token-create-modal').waitFor({ state: 'visible' });
      await h.tid('token-create-name').fill('ci-publish-2');
      await h.tid('token-create-description').fill('Publishes releases from the second pipeline');
      await h.tid('token-create-username').fill('ci-publisher-2');
      await h.tid('token-create-submit').click();
      const modal = h.tid('token-info-modal');
      await modal.waitFor({ state: 'visible' });
      await h.tid('token-info-token-toggle').click(); // the value shown is a fake one, see lib/browser.mjs
      return h.around(modal, 24);
    },
  },

  // ---- administration/managing-users --------------------------------------------------------------------------
  'administration/managing-users/users-list': {
    stack: 'base',
    async run(h) {
      await h.open('/users', 'user-table');
      return h.viewport();
    },
  },
  'administration/managing-users/create-user-dialog': {
    stack: 'base',
    async run(h) {
      await h.open('/users', 'user-table');
      await h.tid('user-create').click();
      const modal = h.tid('user-create-modal');
      await modal.waitFor({ state: 'visible' });
      await h.tid('user-create-username').fill('new_teammate');
      await h.tid('user-create-password').fill('Example-Password-1');
      await h.tid('user-create-confirm-password').fill('Example-Password-1');
      return h.around(modal, 24);
    },
  },
  'administration/managing-users/edit-user-dialog': {
    stack: 'base',
    async run(h) {
      await h.open('/users', 'user-table');
      const row = h.tid('user-table').getByTestId('user-row-john_roe');
      await row.getByTestId('dropdown-toggle').click();
      await row.getByTestId('row-edit').click();
      const modal = h.tid('user-edit-modal');
      await modal.waitFor({ state: 'visible' });
      return h.around(modal, 24);
    },
  },

  // ---- administration/managing-your-account -------------------------------------------------------------------
  'administration/managing-your-account/account-page': {
    stack: 'base',
    async run(h) {
      await h.open('/profile', 'profile-title');
      return h.full();
    },
  },

  // ---- maven/publishing-a-maven-package -----------------------------------------------------------------------
  'maven/publishing-a-maven-package/package-list': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}`, 'pkg-list-table');
      return h.viewport();
    },
  },
  'maven/publishing-a-maven-package/version-detail': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.maven.name}/com.example.shop/shop-core/1.2.0`, 'pkg-detail');
      return h.viewport();
    },
  },
  'maven/publishing-a-maven-package/configure-dialog': {
    stack: 'base',
    run: (h) => CONFIGURE(h, `/${R.maven.name}`),
  },

  // ---- npm/publishing-an-npm-package --------------------------------------------------------------------------
  'npm/publishing-an-npm-package/package-list': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.npm.name}`, 'pkg-list-table');
      return h.viewport();
    },
  },
  'npm/publishing-an-npm-package/version-detail': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.npm.name}/example/ui-kit/1.5.0`, 'pkg-detail');
      return h.viewport();
    },
  },
  'npm/publishing-an-npm-package/configure-dialog': {
    stack: 'base',
    run: (h) => CONFIGURE(h, `/${R.npm.name}`),
  },

  // ---- docker/pushing-a-docker-image --------------------------------------------------------------------------
  'docker/pushing-a-docker-image/image-list': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.docker.name}`, 'pkg-list-table');
      return h.viewport();
    },
  },
  'docker/pushing-a-docker-image/tag-list': {
    stack: 'base',
    async run(h) {
      await h.open(`/${R.docker.name}/api`, 'pkg-versions-table');
      return h.viewport();
    },
  },
  'docker/pushing-a-docker-image/configure-dialog': {
    stack: 'base',
    run: (h) => CONFIGURE(h, `/${R.docker.name}`),
  },

  // ---- pypi/publishing-a-pypi-package -------------------------------------------------------------------------
  'pypi/publishing-a-pypi-package/configure-dialog': {
    stack: 'base',
    run: (h) => CONFIGURE(h, `/${R.pypi.name}`),
  },

  // ---- the other formats: the Configure dialog of an empty repository -----------------------------------------
  'cargo/publishing-a-cargo-crate/configure-dialog': {
    stack: 'base',
    run: (h) => CONFIGURE(h, `/${R.cargo.name}`),
  },
  'nuget/publishing-a-nuget-package/configure-dialog': {
    stack: 'base',
    run: (h) => CONFIGURE(h, `/${R.nuget.name}`),
  },
  'go/publishing-a-go-module/configure-dialog': {
    stack: 'base',
    run: (h) => CONFIGURE(h, `/${R.golang.name}`),
  },
  'helm/publishing-a-helm-chart/configure-dialog': {
    stack: 'base',
    run: (h) => CONFIGURE(h, `/${R.helm.name}`),
  },
  'ruby/publishing-a-ruby-gem/configure-dialog': {
    stack: 'base',
    run: (h) => CONFIGURE(h, `/${R.ruby.name}`),
  },

  // ---- vulnerability-scanning/reviewing-scan-results (stack with the stub scanner) ---------------------------
  'vulnerability-scanning/reviewing-scan-results/security-overview': {
    stack: 'scanner',
    async run(h) {
      await h.open('/security', 'security-title');
      await h.tid('security-scan-list').waitFor({ state: 'visible' });
      return h.viewport();
    },
  },
  'vulnerability-scanning/reviewing-scan-results/repository-list-badges': {
    stack: 'scanner',
    async run(h) {
      await h.open('/repositories', 'repo-table');
      await h.tid('security-badge').first().waitFor({ state: 'visible', timeout: 20_000 });
      return h.viewport();
    },
  },
  'vulnerability-scanning/reviewing-scan-results/version-scan-section': {
    stack: 'scanner',
    async run(h) {
      await h.open(`/${R.maven.name}/com.example.shop/shop-core/1.2.0`, 'pkg-detail');
      const section = h.tid('scan-section');
      await section.waitFor({ state: 'visible', timeout: 20_000 });
      await h.tid('scan-section-toggle').click();
      await h.tid('scan-findings-table').waitFor({ state: 'visible', timeout: 20_000 });
      return h.around(section, 16);
    },
  },
  'vulnerability-scanning/reviewing-scan-results/settings-scanning-toggle': {
    stack: 'scanner',
    async run(h) {
      await h.open(`/${R.maven.name}/settings`, 'settings-page');
      return h.around(h.tid('settings-scanning'), 16);
    },
  },
};
