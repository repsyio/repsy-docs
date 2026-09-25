# Repsy Docs

Documentation content for [docs.repsy.io](https://docs.repsy.io), built with [Hugo](https://gohugo.io/)
and the upstream `hugo-theme-learn` 2.5.0 theme.

## Layout

- `content/` — the Repsy Cloud documentation pages (Markdown), one directory per protocol or topic:
  `getting-started`, `maven`, `npm`, `pypi`, `docker`, `cargo`, `go`, `helm`, `nuget`, `ruby`,
  `api-integration`. Cloud only: nothing here is published under `/os/`.
- `content-os/` — the Repsy OS documentation pages, and the OS variants of pages that differ from Cloud.
  OS only, published under `/os/`.
- `shared/` — pages that are identical for both products; mounted into both sites, so a page here appears
  in Cloud and in OS. The directory does not exist yet; create it when the first shared page is needed.
- `config/production/hugo.toml` — the production environment: `disableLanguages = ["os"]`, so the Repsy OS
  site is not built or published until it launches.
- `layouts/` — site-level layout, partial and shortcode overrides.
- `static/` — images, CSS, JS and mermaid assets.
- `files/` — files served as-is alongside the docs (e.g. webhook samples).
- `archetypes/` — templates for `hugo new` (`chapter.md` for a section index, `default.md` for a page).
- `themes/hugo-theme-learn` — **not committed** (git-ignored). Never edit or commit it; site customisation
  goes in `layouts/`, `static/` or `config.toml`.

The two products are Hugo languages (`config.toml`): `en` is Repsy Cloud, served at the root, and `os` is
Repsy OS, served under `/os/`. The `[module]` mounts in `config.toml` map `content/` and `shared/` into `en`,
and `content-os/` and `shared/` into `os`. Never mount the same files from `content/` into `os`. Sidebar,
breadcrumbs, previous/next links, `index.json` and the sitemap only contain the pages of the current product.
Link between pages with relative links (`../../maven/`), as in `content/`, so that pages in `shared/` work under
both `/` and `/os/`; Hugo's default link render hooks are disabled in `config.toml` to keep them as written. `layouts/index.html` redirects the Cloud root to its first page;
`layouts/index.os.html` renders `content-os/_index.md` as the Repsy OS home page.

## Setup and build

Hugo v0.135.0 is used by CI. Download the theme once (see `README.md` for the exact commands; CI does it via
`.github/actions/setup-hugo-site`).

- `hugo -w server` — local development server. It uses the `development` environment, which includes
  both Repsy Cloud and Repsy OS (`http://localhost:1313/os/`).
- `hugo --minify` — production build into `public/`, Repsy Cloud only. The pull request check
  (`build-docs.yml`) and the production deploy run this, so run it before pushing and make sure it succeeds.
  The output must not change unless you meant to change Cloud content.
- `hugo --minify --environment staging` — build that also includes Repsy OS under `public/os/`; this is what the
  dev deploy (`deploy-docs-dev.yml`) runs. Preview the OS site locally with
  `hugo server --environment staging`.

## Content conventions

- Each section has an `_index.md` with TOML front matter (`title`, `chapter = true`, `weight`) and a `# Title` heading.
  Use the `weight` value to order sections and pages.
- Follow the structure and tone of neighbouring pages; look at an existing page in the same section before writing a new one.
- Use the theme's shortcodes and the ones in `layouts/shortcodes/` instead of raw HTML where possible.
- Keep claims about the hosted service (pricing, limits, permissions) out of the docs pages; point to the
  pricing page instead.
- Follow `.editorconfig`: UTF-8, 2-space indentation, final newline. Line length is unrestricted in Markdown.

## Git workflow

- Branches and PRs are tied to a Jira story; commit and PR titles are prefixed with the story key, e.g.
  `RPS-1149: State that deploy-token authentication is password-only`.
- Pull requests target `main`. Pushing to `main` deploys to production (`deploy-docs-prod.yml`); the dev deploy is manual
  (`deploy-docs-dev.yml`). Keep `main` buildable.
