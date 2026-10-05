+++
title = "Reviewing Scan Results"
weight = 178
description = "Read the vulnerability badges, findings and scan history of your packages, start a scan by hand and understand a failed scan."
+++

# Reviewing Scan Results

When vulnerability scanning is set up, Repsy Open Source scans the versions you push and shows what the scans found in the
web UI. This page explains where to find the results, how to read them, who can see and start scans, and what a failed scan
means. To set scanning up, see [Setting Up Vulnerability Scanning](../../administration/setting-up-vulnerability-scanning/).
Scanning covers Maven, npm, PyPI and Docker repositories. The other formats show no results.

## Who Can See What

| | Signed-in user (`USER` or `ADMIN`) | Only `ADMIN` |
| --- | --- | --- |
| Badges of repositories, packages and versions | Yes | |
| The **Security** section of a version: findings and scan history | Yes | |
| Start a scan with **Scan Now** or **Re-scan** | Yes | |
| The **Security Overview** card of the dashboard | Yes | |
| The **Security** page with the scans of all repositories | | Yes |

Every signed-in user can read and write every repository (see [Managing Users](../../administration/managing-users/)), which
includes starting a scan. Only the **Security** page in the sidebar is for administrators.

## Where the Results Appear

- **The repository list.** A badge next to the name of a repository shows the worst severity among its scanned versions.
  Click it to open a window with the number of findings per severity and the versions that were scanned recently. Each of
  them links to its page.
- **The package list and the version list.** The same badge shows for each package (an artifact, a package, an image) and for
  each version (a version, or a tag of a Docker image). Its window has the counts per severity, and **View all versions** or
  **View all details** to go further.
- **A version page.** **See Security Details** jumps to the **Security** section of the page, which holds the findings, the
  history of scans and the buttons to start a scan. See [The Security Section](#the-security-section).
- **The dashboard.** The **Security Overview** card counts the repositories that have critical or high findings, out of all
  repositories.
- **The Security page.** Administrators find it in the sidebar. See [The Security Page](#the-security-page).

{{< figure src="os/vulnerability-scanning/reviewing-scan-results/repository-list-badges.png" alt="The repository list with a vulnerability summary badge on each scanned repository." caption="The repository list. Each scanned repository shows the worst severity of its versions, or **Clean**." >}}

A badge appears only for a repository, package or version that a scan has been started for, and only for the package formats
the scanner supports. A version that was never scanned has no badge.

## Reading a Badge

| Badge | Meaning |
| --- | --- |
| **Critical**, **High**, **Medium**, **Low**, **Unknown** | The worst severity among the findings of the last completed scan. For a package or a repository it is the worst over the last completed scan of each of its versions. |
| **Clean** | The scan completed and found no known vulnerability. |
| **Scanning...** | A first scan is still running, so there is no result to show yet. |
| **Scan failed** | The first scan failed and no scan has completed. |
| A small icon next to the severity | A newer scan is running or failed, and the badge still shows the last completed one. Hover over it for the numbers. |

**Unknown** is a finding whose severity the vulnerability database does not know. **Clean** is only as good as the scan behind
it: see [What a Scan Covers](../../installation/configuration-reference/#what-a-scan-covers).

## The Security Section

The **Security** section of a version shows the newest scan.

- **Status** is **Waiting...** while Repsy has not handed the scan to the scanner, **Queued...** while it waits there,
  **Scanning...** while it runs, then **Completed** or **Failed**. The page polls while a scan is unfinished, so you do not need to reload it.
  Below it are the counts per severity, or **No known vulnerabilities found.**
- **The findings** are a table, ten to a page. It has the columns **CVE ID** (a link to the advisory), **Severity** (with the
  CVSS score in brackets when the database has one), **Package**, **Installed Version**, **Fixed Version** and **Status**,
  which is how the vulnerability database sees the fix: `FIXED`, `AFFECTED`, `WILL_NOT_FIX` and so on. Click **Severity**
  to reverse the order, which starts with the worst.
- **Package** is the vulnerable package that the scan found, which can be a package bundled inside the one you pushed, not
  only the package itself.
- **Scan History** lists the earlier scans of the version, five to a page. Select one to see its own findings.

{{< figure src="os/vulnerability-scanning/reviewing-scan-results/version-scan-section.png" alt="The vulnerability scan section of a package version." caption="The **Security** section of a version, with the counts per severity, the findings and the scan history. The data is made up." >}}

The counts and the findings are frozen at the time of the scan. When the vulnerability database learns of a new advisory
later, an old result does not change until you scan again.

## Starting a Scan Yourself

Every scan you did not get from a push is started by hand, in the **Security** section of the version:

- **Scan Now** for a version that was never scanned, for example one that was pushed before scanning was set up.
- **Re-scan** for a version that was scanned. Use it to see a fresh result after the vulnerability database has been
  updated, or to repeat a scan that failed.

The button is disabled while a scan of the version is waiting, queued or running, and Repsy refuses a second scan of it
with a conflict. A re-scan keeps showing the last completed result, marked with the small icon, until the new scan completes.

A scan by hand ignores the **Vulnerability Scanning** switch of the repository, which decides only whether a **push** starts a
scan, see [Configuring Repository Settings](../configuring-repository-settings/#vulnerability-scanning). There is no button
that scans a whole repository: you scan version by version.

The web UI calls `POST /api/repos/<repo-name>/artifacts/<artifact-name>/versions/<version>/scan` with the access token of
a signed-in user. Repsy answers `202` with no body and a `Location` header that points to the scan, `GET /api/repos/<repo-name>/scans/<scan-id>`; poll that address for the status. A refused scan is an error document, see [Panel API Errors](../../administration/panel-api-errors/). The panel API is in beta and can change.

For Docker, the version is the tag. A Docker image that is pushed by its digest, with no tag, is not scanned on a push. A
scan of a Maven SNAPSHOT scans the newest jar that is stored for it.

## Failed Scans

A scan that failed shows **Failed**, and in the **Security** section **Reason:** and one line of text. The line is cut to 200
characters, and addresses and paths in it show as `[redacted]`. A failed scan keeps no findings. If the version had a completed
scan before, its badge keeps showing that one, with the small icon, and the **Security** section of the version notes
that the last re-scan failed.

Press **Re-scan** to try again. The causes, and what to do about each of them, are in
[When a Scan Fails](../../administration/setting-up-vulnerability-scanning/#when-a-scan-fails).

## The Security Page

The **Security** page is for administrators. It has:

- A chart of the **Severity Distribution**, with the counts over the last completed scan of every version.
- The list of scans of all repositories, newest first. Each row names the repository, the package and the version, its
  format, the worst severity or **Clean** or **Scan Failed**, the status and the time.
- Filters for the name of the repository (a part of it, in any case), the severity and the format, and a **Refresh** button that
  clears them. Click a row to open the **Security** section of that version.

{{< figure src="os/vulnerability-scanning/reviewing-scan-results/security-overview.png" alt="The Security page with a summary of findings and a list of recent scans." caption="The **Security** page, with the severity distribution and the scans of all repositories. The data is made up." >}}

The page is in the sidebar also while no scanner is configured. It is then empty.

## When Scanning Is Turned Off

The badges and the **Security** section belong to the formats the scanner supports. When the administrator sets
`SECURITY_SCANNER` back to `disabled`, they disappear from every page, and so do the buttons. The findings that earlier scans
stored stay in the database, and show again when scanning is switched on. `npm audit` reports nothing while scanning is off, see
[Auditing an Installation](../../npm/managing-npm-packages/#auditing-an-installation).

Deleting a version deletes its scans and findings with it.
