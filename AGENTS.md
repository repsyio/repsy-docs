# Repsy Docs

Documentation content for [docs.repsy.io](https://docs.repsy.io), built with [Hugo](https://gohugo.io/)
and the upstream `hugo-theme-learn` 2.5.0 theme.

## Layout

- `content/` — the documentation pages (Markdown), one directory per protocol or topic: `getting-started`,
  `maven`, `npm`, `pypi`, `docker`, `cargo`, `go`, `helm`, `nuget`, `ruby`, `api-integration`.
- `layouts/` — site-level layout, partial and shortcode overrides.
- `static/` — images, CSS, JS and mermaid assets.
- `files/` — files served as-is alongside the docs (e.g. webhook samples).
- `archetypes/` — templates for `hugo new` (`chapter.md` for a section index, `default.md` for a page).
- `themes/hugo-theme-learn` — **not committed** (git-ignored). Never edit or commit it; site customisation
  goes in `layouts/`, `static/` or `config.toml`.

## Setup and build

Hugo v0.135.0 is used by CI. Download the theme once (see `README.md` for the exact commands; CI does it via
`.github/actions/setup-hugo-site`).

- `hugo -w server` — local development server.
- `hugo --minify` — production build into `public/`. The pull request check (`build-docs.yml`) runs this, so
  run it before pushing and make sure it succeeds.

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
