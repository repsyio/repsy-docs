# Repsy Docs

Documentation content for [docs.repsy.io](https://docs.repsy.io), built with [Hugo](https://gohugo.io/)
and the upstream `hugo-theme-learn` 2.5.0 theme.

## Layout

- `content/` — the Repsy Cloud documentation pages (Markdown), one directory per protocol or topic:
  `getting-started`, `maven`, `npm`, `pypi`, `docker`, `cargo`, `go`, `helm`, `nuget`, `ruby`,
  `api-integration`. Cloud only: nothing here is published under `/os/`.
- `content-os/` — the Repsy Open Source documentation pages, and the OS variants of pages that differ from Cloud.
  Open Source only, published under `/os/`.
- `shared/` — pages that are identical for both products; mounted into both sites, so a page here appears
  in Cloud and in Open Source. Where the products differ, the text goes into `{{< product >}}` blocks.
- `config/production/hugo.toml` — the production environment: `disableLanguages = ["os"]`, so the Repsy Open Source
  site is not built or published until it launches.
- `layouts/` — site-level layout, partial and shortcode overrides.
- `static/` — images, CSS, JS and mermaid assets.
- `files/` — files served as-is alongside the docs (e.g. webhook samples).
- `archetypes/` — templates for `hugo new` (`chapter.md` for a section index, `default.md` for a page).
- `themes/hugo-theme-learn` — **not committed** (git-ignored). Never edit or commit it; site customisation
  goes in `layouts/`, `static/` or `config.toml`.

The two products are Hugo languages (`config.toml`): `en` is Repsy Cloud, served at the root, and `os` is
Repsy Open Source, served under `/os/`. The names are decided (RPS-1374): the hosted product is "Repsy Cloud";
the self-hosted product is displayed as "Repsy Open Source" (short form "Open Source", switcher caption
"Self-hosted"), never "Repsy OS", because "OS" reads as "operating system". The internal keys keep the short form:
the language `os`, `product = "os"`, the CSS classes, the `repsy-docs-product` localStorage key and the `/os/` URL
prefix. The `[module]` mounts in `config.toml` map `content/` and `shared/` into `en`,
and `content-os/` and `shared/` into `os`. Never mount the same files from `content/` into `os`. Sidebar,
breadcrumbs, previous/next links, `index.json` and the sitemap only contain the pages of the current product.
Link between pages with relative links (`../../maven/`), as in `content/`, so that pages in `shared/` work under
both `/` and `/os/`; Hugo's default link render hooks are disabled in `config.toml` to keep them as written. `layouts/index.html` redirects the Cloud root to its first page;
`layouts/index.os.html` renders `content-os/_index.md` as the Repsy Open Source home page.

Rules for templates and configuration:

- Key templates and shortcodes on `.Site.Params.product` (`"cloud"` or `"os"`), never on `.Language.Lang`, and
  take product names from `.Site.Language.LanguageName` and the `shortName` / `compactName` params in
  `config.toml` instead of hard-coding them, so that a later change of the language layout does not touch them.
- Do not put product wording in Hugo i18n bundles (`i18n/`). Product-specific text belongs in `config.toml` or, in
  content, in `{{< product >}}` blocks.
- No translations are planned. If they are ever needed, add languages as a matrix or move the product to Hugo's
  `roles` dimension (Hugo 0.153 or later); English URLs are unaffected. That is why the rules above matter.
- Front-end scripts: `layouts/_default/baseof.html` loads jQuery from `code.jquery.com` with a Subresource Integrity
  hash, so when the jQuery version changes, recompute `integrity` for the exact file. `static/js/learn.js` is the site's
  own small tab helper (it shadows the theme's `learn.js`, which needs scripts the site does not load); do not put theme
  behaviour back into it, and keep the browser console free of errors. Link within the site from templates with
  relative links (`.RelPermalink`), so that a build served from another host does not send readers to `baseURL`.
- The sitemap is overridden in `layouts/_default/sitemap.xml` to drop the `xhtml:link` hreflang alternates: with
  products as languages, Hugo's default would list the Cloud and Open Source version of a page as `hreflang="en-us"`
  alternates of each other. If real translations arrive, restore alternates for translations only.
- The `[languages.os.params]` `version` param holds the Repsy Open Source release the docs are written for
  (the next big release, decided in RPS-1374). Keep it empty until the release is known; while it is empty nothing is shown and the
  `{{< os-version >}}` shortcode renders nothing, so pages must not rely on it (an empty value would leave a bare
  `repsy/os:` in an image tag). Once set, it appears in the header badge and on the Open Source home page.

The sidebar starts with the product switcher (`layouts/partials/product-switcher.html`): two real links to the
counterpart of the current page in the other product, else the nearest parent section that exists there, else its
home. The switcher, the "· Open Source" header badge (compact "· OSS" on narrow screens, where the full label does
not fit), the "you were reading the other product" banner and
`static/js/product.js` (remembers the last product in `localStorage`) are only rendered when more than one product
is built, so the production output stays Cloud-only. "Edit This Page" links to the real source file (`content/`,
`content-os/` or `shared/`); `editURL` in `config.toml` is the repository's edit URL without a directory.

## Setup and build

Hugo v0.135.0 is used by CI. Download the theme once (see `README.md` for the exact commands; CI does it via
`.github/actions/setup-hugo-site`).

- `hugo -w server` — local development server. It uses the `development` environment, which includes
  both Repsy Cloud and Repsy Open Source (`http://localhost:1313/os/`).
- `hugo --minify` — production build into `public/`, Repsy Cloud only. The pull request check
  (`build-docs.yml`) and the production deploy run this, so run it before pushing and make sure it succeeds.
  The output must not change unless you meant to change Cloud content.
- `hugo --minify --environment staging` — build that also includes Repsy Open Source under `public/os/`; this is what the
  dev deploy (`deploy-docs-dev.yml`) runs. Preview the Open Source site locally with
  `hugo server --environment staging`.

## Content conventions

- Each section has an `_index.md` with TOML front matter (`title`, `chapter = true`, `weight`) and a `# Title` heading.
  Use the `weight` value to order sections and pages. Every `weight` in `content/` is globally unique, in blocks
  of 100 per section (getting-started 100-140, docker 200+, maven 300+, and so on; 10 x the original numbering).
  Repsy Open Source-only sections use the gap 150-199.
- Placeholders (write them the same way on every page):
  - Use `<lower-kebab-case>` in angle brackets for values the reader replaces: `<username>`, `<password>`,
    `<password-or-token>`, `<repo-name>` (the name of the repository or registry), `<package-name>`, `<image-name>`,
    `<image-tag>`, `<crate-name>`, `<gem-name>`, `<chart-name>`. Never use braces (`{MY_REPOSITORY_NAME}`), upper case
    or snake or camel case (`<registryName>`, `<registry_name>`) for these.
  - Where angle brackets would clash with the surrounding syntax (a bare value in an XML element or attribute, a
    quoted Gradle string, a properties file) use the upper-case values `MY REPSY USERNAME`, `MY REPSY PASSWORD` and
    `MY REPSY PASSWORD OR DEPLOY TOKEN`, with spaces and without braces.
  - In running text put every placeholder in a code span (`` `<repo-name>` ``). A bare `*<repo-name>*` or
    `*<package-name>*` is swallowed as an HTML tag and does not show up in the page.
- Titles and product names: page titles and their `# Title` headings use Title Case (`Handling Webhook Events`,
  `Creating a Private PyPI Registry`); write the products as npm, PyPI, NuGet, Maven, Docker, Cargo, Go, Helm and
  Ruby in titles, headings, link texts and text, never `NPM`, `Npm` or `Pypi`.
- Follow the structure and tone of neighbouring pages; look at an existing page in the same section before writing a new one.
- Use the theme's shortcodes and the ones in `layouts/shortcodes/` instead of raw HTML where possible.
- Write tables as plain Markdown tables. `static/css/theme-repsy.css` styles them (section "Tables in page content"): a wide table
  scrolls sideways inside the content column, so do not wrap tables in raw HTML or shorten cells to make them fit.
- Keep claims about the hosted service (pricing, limits, permissions) out of the docs pages; point to the
  pricing page instead.
- Shortcodes for pages that are shared between Repsy Cloud and Repsy Open Source (see `layouts/shortcodes/` for the details):
  - Write the account part of a repository URL as `<username>` (never `{MY_REPSY_USERNAME}` or similar), and
    build repository URLs with `{{% repo-url %}}` (Cloud `https://repo.repsy.io/<username>`, OS
    `https://<your-repsy-host>`) instead of typing `repo.repsy.io`. It takes the optional named parameters
    `path="helm"`, `scheme="false"` and `account="false"`. Use the `%` notation, and put the shortcode in a code
    span or code block, because `<username>` is only shown literally there.
  - Wrap text that differs per product in `{{< product "cloud" >}}...{{< /product >}}` or
    `{{< product "os" >}}...{{< /product >}}`; the content is Markdown and is only rendered for that product.
    Use it for wording such as registering at repsy.io, which does not apply to Repsy Open Source.
  - The exact URL format of Repsy Open Source is not confirmed per protocol yet; do not invent one in the docs.
- Follow `.editorconfig`: UTF-8, 2-space indentation, final newline. Line length is unrestricted in Markdown.

### Screenshots

The panel screenshots of the Repsy Open Source pages are generated, not taken by hand. They live in
`static/images/os/<page-slug>/<name>.png`, and `tools/screenshots/manifest.json` lists every one (name, docs page,
panel route, suggested alt text). Show one with the `figure` shortcode:
`{{< figure src="os/<page-slug>/<name>.png" alt="..." caption="..." >}}` (`alt` is required; phone shots take
`width="390"`).

- **Stable names.** Pages refer to an image by `<page-slug>/<name>`, so a refresh replaces the pixels and
  changes no page. Never rename a shot that a page uses; add a new one instead. To get a picture that does not exist
  yet, add it to the manifest and `tools/screenshots/src/shots.mjs` (see the README there).
- **When to regenerate.** After a change of the panel that shows in a screenshot, and for every Repsy Open Source release. Run
  `cd tools/screenshots && npm ci && npm run shots` (Docker, Node 22 and Chrome needed; the README has the options,
  e.g. `REPSY_IMAGE=<image>` to use a given release image), and commit the changed images with the change that
  needed them. It is not part of the Hugo build or CI.
- **Fake data only.** The script seeds demo data (`releases`, `internal-tools`, `jane_doe`, `example.com`, ...) and
  hides dates and secrets. Never commit a screenshot of a real instance, and never put a real host name, e-mail address,
  token or password in one. Keep each image under 200 KB.

## Git workflow

- Branches and PRs are tied to a Jira story; commit and PR titles are prefixed with the story key, e.g.
  `RPS-1149: State that deploy-token authentication is password-only`.
- Pull requests target `main`. Pushing to `main` deploys to production (`deploy-docs-prod.yml`); the dev deploy is manual
  (`deploy-docs-dev.yml`). Keep `main` buildable.
