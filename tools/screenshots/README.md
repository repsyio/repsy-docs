# Panel screenshots

Generates the screenshots of the Repsy Open Source web panel that the docs show (RPS-1419). It is a
standalone Node tool: it is not part of the Hugo build, and `hugo --minify` never looks at this directory.

What one run does:

1. Takes the image of Repsy Open Source (a local one, or built from a copy of `origin/main` of
   [repsyio/repsy](https://github.com/repsyio/repsy)).
2. Starts the H2 stack (Repsy alone) with its own Docker Compose project `docs-shots-<random>` on free
   ports, and a second one with the stub scanner for the vulnerability scanning shots.
3. Seeds demo data through the panel API and the protocol port: one repository per format (`releases`,
   `internal-tools`, `containers`, ...), a few Maven, npm, Docker and PyPI packages, deploy tokens, and two
   users (`jane_doe`, `john_roe`).
4. Drives Chrome with Playwright at a fixed viewport, takes the shots listed in `manifest.json`, and writes
   optimised PNGs to `static/images/os/<page-slug>/<name>.png`.
5. Removes its own Compose projects (containers, network, volumes) at the end and after a failure. It never
   runs `docker system prune` and never touches anything else.

## Run it

Needs Docker (with Compose v2), Node 22 or newer, and a Chrome or Chromium (`CHROME_PATH`, or one of the usual
locations; a Playwright browser cache in `/opt/pw-browsers` is used when present).

```sh
cd tools/screenshots
npm ci
npm run shots                    # all shots, written to ../../static/images/os
node src/run.mjs --only maven/   # only the shots whose id contains "maven/"
node src/run.mjs --out /tmp/try  # write somewhere else, to look before you overwrite
npm run check                    # only checks that manifest.json and src/shots.mjs agree (no Docker, no Chrome)
```

The first run builds the image from source, which takes about ten minutes (Maven, Angular); later runs reuse
the image `repsy-os-docs-shots:<commit>`. Environment variables:

| Variable | Meaning |
| --- | --- |
| `REPSY_IMAGE` | Use this image (local, or pulled, e.g. `repo.repsy.io/repsy/os/repsy:latest`) instead of building one. |
| `REPSY_REPO_DIR` | A local clone of repsyio/repsy. It is only read (`git fetch`, `git archive` of `origin/main` and of its `core` submodule), never checked out or built in. Without it the repository is cloned from `REPSY_REPO_URL` (default GitHub). |
| `SHOTS_NO_FETCH` | Skip the `git fetch` in `REPSY_REPO_DIR`. |
| `SHOTS_REBUILD` | Build the image even when the tag exists. |
| `SHOTS_VERBOSE` | Show the output of `docker build`. |
| `SHOTS_TMP_DIR` | Where scratch copies go (default: the system temp directory). |
| `SHOTS_RAW_DIR` | Also save the raw Chrome screenshots there (debugging aid). |
| `SHOTS_REPO_BASE_URL` | The public URL the client snippets print (default `https://repsy.example.com`). |
| `CHROME_PATH` | Chrome/Chromium executable. |

If a run is killed hard, remove its stack by hand: `docker compose -p docs-shots-<id> down -v` (the name is
printed at the start; it needs `REPSY_IMAGE` and `SHOTS_ADMIN_PASSWORD` set to any value to interpolate the
compose file).

## Files

| File | What it is |
| --- | --- |
| `manifest.json` | Every shot: `name`, `page` (the docs page slug), `path`, `figure` (the `src` for the figure shortcode), `route`, `state`, `viewport`, `stack`, a suggested `alt`, and `status` (`generated` or `pending`). Written by hand. |
| `src/shots.mjs` | How each shot is made (one function per shot, using the panel's `data-testid` selectors). |
| `src/run.mjs` | The orchestration. Fails when the manifest and `shots.mjs` disagree. |
| `src/lib/` | `stack.mjs` (image, Compose), `seed.mjs` (the demo data), `packages.mjs` (publishing over the wire formats), `browser.mjs` (Chrome, stable dates), `optimize.mjs`. |
| `docker-compose.yml`, `docker-compose.scanner.yml` | The stack and the scanner overlay. |

## Adding or changing a shot

1. Add the entry to `manifest.json` (`name` and `page` are permanent once a docs page uses them; the file name
   is `static/images/os/<page>/<name>.png`) and the function to `src/shots.mjs` under the same id.
2. `npm run check`, then `node src/run.mjs --only <id> --out /tmp/try` and look at the image.
3. Run without `--out` and commit the image together with the manifest change.

## What keeps the images stable

- Fixed viewport 1440x900 (phone shots 390x844 at 2x), dark theme (the panel is always dark), animations off.
- Time starts at 2026-06-15 10:00 UTC, and the timestamps of the API answers are moved to "3 hours ago",
  "a day ago", ... (see `fakeDates` in `src/lib/browser.mjs`), so the images never show today's date. Deploy
  token usernames and expiry dates are set by the seed; a newly created token's value is replaced by a
  placeholder (`rdt-EXAMPLE-...`) before the panel shows it.
- A shot is written as lossless PNG (a palette PNG for the login page, whose photo is too big otherwise). Chrome
  sometimes anti-aliases a logo or icon edge by a few pixels differently from one start to the next, so a committed
  file is kept when the new one differs in only a handful of pixels (`nearlyEqual` in `src/lib/optimize.mjs`): a
  re-run on an unchanged UI changes no file. Two screenshots in a row must also be identical before one is taken.
- Package bytes (jars, wheels, image layers) are fixed, so sizes, digests and checksums do not change.
- The browser cannot reach anything except the panel: analytics, avatars and CDNs are blocked, and Font
  Awesome is served from `node_modules` (the same 6.7.2 files the panel loads from cdnjs).

## Rules for the images

- Fake data only. Names are RFC 2606 style (`example.com`), users are `jane_doe` and `john_roe`, and nothing
  comes from a real instance. Passwords and tokens in the panel are random per run and never shown; a typed
  password in the login shot is masked.
- Each image must stay under 200 KB (the script fails otherwise).
- The vulnerability findings come from the stub scanner and are synthetic (`CVE-2099-...`, `stub-lib-...`).

## CI

The script is not run in CI. It needs a full image build (about ten minutes), a browser and a review of the
result, and a screenshot changes only when the panel does. Regenerate when a release changes the UI; a
manual `workflow_dispatch` job that runs it against the release image (`REPSY_IMAGE`) and opens a pull request
with the changed images is the natural next step.
