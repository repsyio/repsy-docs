+++
title = "Managing npm Packages"
weight = 590
description = "Move dist-tags, deprecate or unpublish versions, search a registry and audit an installation with npm commands."
+++

# Managing npm Packages

This page shows what you can do with a package after you have published it: move dist-tags, deprecate a version, unpublish it, search a registry, audit an installation and log out. The commands are npm's. The last section says which of them the other package managers have.

The examples assume that npm is configured for your registry as described in [Authenticating with npm](../authenticating-with-npm/), with `@foo` routed to it. `<registry-url>` stands for `{{% repo-url %}}/<repo-name>/`. Every command that changes a registry needs a credential with write access: a user account or a **Read/Write** deploy token. A **Read Only** token is refused with `E401`. The exception is [unpublishing](#unpublishing-a-version): it removes stored files, so it needs the `ADMIN` role, and no deploy token can do it. Dist-tags and deprecations only change what the registry advertises, so they need write access only.

## Dist-tags

A dist-tag is a name for a version. `npm install @foo/<package-name>` installs the version that `latest` points to, and `npm install @foo/<package-name>@beta` the version that `beta` points to.

```bash
npm dist-tag ls @foo/<package-name>
npm dist-tag add @foo/<package-name>@1.1.0 next
npm dist-tag rm @foo/<package-name> next
```

`npm publish --tag beta` publishes a version and sets the tag `beta` to it instead of `latest`. How Repsy sets the tags:

- The first version of a package always gets `latest`, also when you publish it with `--tag beta`. Both `beta` and `latest` then point to it.
- A later publish without `--tag` moves `latest` to the new version and leaves the other tags where they are.
- `latest` cannot be removed: Repsy answers `400 Bad Request` to `npm dist-tag rm @foo/<package-name> latest`. Move it to another version with `dist-tag add` instead.
- Repsy refuses a tag for a version that does not exist (`400 Bad Request`).
- npm itself refuses a tag name that is a valid version range, such as `x`.

The web UI shows the tags of a package on the page of its versions.

## Deprecating a Version

A deprecated version stays installable, but package managers warn about it. Deprecating needs write access, so a **Read/Write** deploy token can do it. Give a message, and a version or a version range:

```bash
npm deprecate @foo/<package-name>@1.0.0 "use 1.1.0 instead"
```

Deprecate again with an empty message to clear the deprecation:

```bash
npm deprecate @foo/<package-name>@1.0.0 ""
```

Repsy keeps the message on the version and serves it to every client. What a client does with it differs:

- npm prints a warning with the message when it installs the version.
- Yarn classic prints a warning with the message.
- pnpm prints `deprecated <package-name>@<version>` without the message. pnpm 12 also chooses the newest version that is not deprecated when it resolves a version range. An exact version is still installed.
- Yarn Berry and Bun print nothing when they install a deprecated version. `yarn npm info <package-name>@<version> -f deprecated` and `bun info <package-name>@<version> deprecated` show the message.

## Unpublishing a Version

```bash
npm unpublish @foo/<package-name>@1.1.0
```

Repsy deletes the version and its tarball. If it was the version `latest` pointed to, `latest` moves to a remaining version. To delete a whole package with all its versions, or its only version, npm asks for `--force`:

```bash
npm unpublish @foo/<package-name> --force
```

When the last version of a package goes, the package is gone from the registry. npm warns that a version cannot be published again for 24 hours after that. That is a rule of npmjs.org, and Repsy does not enforce it.

Unpublishing needs the `ADMIN` role, the same as deleting a package or a version in the web UI: it removes the stored files. Log in with the username and password of an administrator. A deploy token never unpublishes, not even a **Read/Write** one, and neither does the account of a user without the `ADMIN` role. Repsy refuses them with `401` and all three requests of `npm unpublish` (it sends more than one) are refused, so nothing is removed. Publishing, `npm deprecate` and `npm dist-tag` need only write access, so a CI job with a Read/Write deploy token keeps running them. To take a version out of use without removing it, [deprecate it](#deprecating-a-version).

## Searching a Registry

```bash
npm search --registry {{% repo-url %}}/<repo-name>/ <text>
```

The search looks only at the packages of that registry, never at other repositories or npmjs.org, and it works on the latest version of each package. On a private registry it needs a credential. You can use these qualifiers in the text:

| Qualifier | Finds |
| --- | --- |
| `scope:foo` | Packages of the scope `@foo` |
| `keywords:pad,string` | Packages that have the keywords |
| `author:<name>` and `maintainer:<name>` | Packages by author or maintainer |
| `is:deprecated`, `is:unstable` and `is:insecure` | Packages whose latest version is deprecated, is below `1.0.0`, or has vulnerabilities found by a scan (see the next section). `not:` turns each filter around, for example `not:deprecated`. |
| `boost-exact:false` | Takes the bonus for an exact name match off the ranking |

A search text that consists of qualifiers Repsy cannot filter on finds no package.

## Auditing an Installation

`npm audit`, `pnpm audit`, `yarn npm audit` (Yarn Berry) and `bun audit` ask the registry for the vulnerabilities of the versions in your dependency tree:

```bash
npm audit --registry {{% repo-url %}}/<repo-name>/
```

This works only when vulnerability scanning is enabled on your instance and for the repository, see
[Setting Up Vulnerability Scanning](../../administration/setting-up-vulnerability-scanning/). Repsy reports the vulnerabilities of the package versions the audit asks about, from two sources that it merges:

- **A lookup** in the vulnerability database of the scanner, for the exact name and version pairs that the client sends. It is made when the audit runs, whether or not Repsy ever stored or scanned that version, so it also covers the packages of your dependency tree that are not in this repository. A private package whose name equals a public one gets the advisories of the public package, as it would on npmjs.org.
- **The stored findings** of the scans of **this repository**, from the latest completed scan of each version. A scan reports the vulnerabilities of a package's own metadata (its `package.json`) and of the packages bundled in `node_modules`. It does not resolve the `dependencies` that `package.json` declares (see [What a Scan Covers](../../installation/configuration-reference/#what-a-scan-covers)).

A vulnerability that both sources report is listed once, as the stored finding. The date that an advisory carries as its last update is the time its scan finished for a stored finding, and the date of the scanner's database for a finding of the lookup. Repsy reports as vulnerable only the versions the audit names, one by one, never a range such as `<1.2.3`, so it never flags a version the audit did not ask about.

Repsy reports nothing, with the exit code `0`, and does not ask the scanner, when scanning is off: when the scanner is disabled, or scanning is turned off for the repository, even if an earlier scan found something.

The lookup is best-effort and never fails an audit. When it gets no answer, the audit is answered from the stored findings only, and Repsy logs the reason as a warning. That happens when:

- the scanner is running a scan. It holds its database for the run and answers `503`, so a scan of a large Docker image can keep the lookup away for a while,
- the scanner swaps its database after a refresh, which takes a few seconds, or has not downloaded a database yet,
- the scanner is slow, longer than `TRIVY_REQUEST_TIMEOUT_SECONDS`, or unreachable, or answers with any error,
- `TRIVY_ADVISORY_LOOKUP_MAX_CONCURRENCY` lookups of other audits are already running, and no place becomes free within `TRIVY_ADVISORY_LOOKUP_MAX_WAIT_MILLIS`.

An empty audit therefore does not always mean that a dependency is safe, and two audits a moment apart can report different findings when the second finds the scanner busy. `found 0 vulnerabilities` never means that a package is free of vulnerabilities. Stored findings are frozen at the time of the scan, and a re-scan refreshes them. The lookup reads the current database of the scanner, which the scanner refreshes on a schedule, see [The Vulnerability Databases](../../administration/setting-up-vulnerability-scanning/#the-vulnerability-databases).

An audit request may hold up to 20,000 packages and 8 MiB (after decompression). Repsy sends the pairs to the scanner in requests of at most 20,000 pairs, and at most five requests for one audit. Pairs beyond that are answered from the stored findings only, and so are pairs the scanner would refuse, such as a name that is not an npm package name. Yarn classic (`yarn audit`) always asks `registry.yarnpkg.com` and never reaches Repsy.

## Logging Out

`npm logout --registry {{% repo-url %}}/<repo-name>/` revokes the login token that `npm login` saved and removes it from `.npmrc`, see [Authenticating with npm](../authenticating-with-npm/#log-out). It does not work for a deploy token.

## What the Other Package Managers Have

| | npm | Yarn classic | Yarn Berry | pnpm | Bun |
| --- | --- | --- | --- | --- | --- |
| Publish | `npm publish` | `yarn publish` | `yarn npm publish` | `pnpm publish` | `bun publish` |
| Dist-tags | `npm dist-tag` | `yarn tag` | `yarn npm tag` | `pnpm dist-tag` | Publish `--tag`, no command |
| Deprecate | `npm deprecate` | No command | No command | `pnpm deprecate` and `pnpm undeprecate` | No command |
| Unpublish | `npm unpublish` | No command | No command | `pnpm unpublish` | No command |
| `whoami` | `npm whoami` | No command | `yarn npm whoami` | `pnpm whoami` | `bun pm whoami` |
| Search | `npm search` | No command | No command | `pnpm search` | No command |
| Audit | `npm audit` | Never reaches Repsy | `yarn npm audit` | `pnpm audit` | `bun audit` |
| Log out | `npm logout` | `yarn logout`, not tested | `yarn npm logout`, not tested | `pnpm logout` | No command |

Where a package manager has no command, use npm for the task with the same `.npmrc`.
