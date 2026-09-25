+++
title = "Managing Chart Versions"
weight = 980
+++

This page explains what Repsy checks when you publish a chart, what happens when you publish a version that already exists, and how to delete a version or a whole chart and what your Helm clients see afterwards. It applies to both protocols, classic and OCI.

### What Repsy Checks on Upload

A refused upload changes nothing in the repository. An upload has to pass all of these checks:

1. **Credentials.** A user account can publish to every repository of the instance. A deploy token can publish to its own repository when its access type is **Read/Write**. A **Read Only** token, an expired or revoked token, a token of another repository and missing credentials are all refused with `401`. Nobody can publish anonymously, not even to a public repository.
2. **The chart.** Repsy reads `Chart.yaml` from the archive and stores what is in it:

   | Field | Rule |
   | --- | --- |
   | `name` | Required. Lower case letters, digits and `-`, starting with a letter or a digit, up to 255 characters. |
   | `version` | Required. A [semantic version](https://semver.org/) such as `1.0.0` or `1.0.0-rc.1`, without a `v` in front, up to 64 characters. |
   | `description`, `appVersion`, `type` | Optional, and they have to be strings: quote a value such as `appVersion: "2"`. `appVersion` can have up to 64 characters and `type` up to 32. |

   The name of the chart in the OCI address has to be the name in `Chart.yaml`. `helm push` takes care of that, because it builds the address from `Chart.yaml`.
3. **The size limit.** A classic upload of more than 500 MB is refused with `413`. An administrator can change the limit with the `MULTIPART_MAX_FILE_SIZE` and `MULTIPART_MAX_REQUEST_SIZE` environment variables, see the [Configuration Reference](../../installation/configuration-reference/). The limit is for the multipart upload of the classic protocol.
4. **Package Override.** See [Uploading a Version Again](#uploading-a-version-again).

A chart that fails the second check is answered with `400` and one of these identifiers:

| Identifier | Message |
| --- | --- |
| `chartYamlNotFound` | `Chart.yaml not found in the chart archive.` |
| `chartYamlInvalid` | `Chart.yaml is not a valid YAML mapping.` |
| `chartNameMissing`, `chartNameInvalid`, `chartNameTooLong` | `Chart name is missing.`, `Invalid chart name.`, `The chart name is longer than 255 characters.` |
| `chartVersionMissing`, `chartVersionInvalid`, `chartVersionTooLong` | `Chart version is missing.`, `Invalid chart version.`, `The chart version is longer than 64 characters.` |
| `chartDescriptionInvalid`, `chartAppVersionInvalid`, `chartTypeInvalid` | The value is not a string: `Invalid chart appVersion: it must be a string, quote it (for example "2").` |
| `chartAppVersionTooLong` | `The chart appVersion is longer than 64 characters.` |

### Uploading a Version Again

Whether you can publish a version that already exists is decided by the **Package Override** setting of the repository. An administrator changes it in the repository settings: open **Settings** of the repository and switch **Package Override** between **Allow** and **Deny**. The change applies at once.

| Setting | Behaviour |
| --- | --- |
| **Allow** (the default of a new repository) | The version is replaced with the new chart. |
| **Deny** | The upload is refused with `409`: the identifier is `chartAlreadyExists` and the message is `This chart version already exists in the repository.` Nothing changes. |

The rule is applied to the name and the version of the chart, whichever protocol published it: a version that was published over OCI is refused over the classic protocol too, and the other way round. `helm cm-push --force` does not bypass it. Over OCI, `helm push` reports the refusal as `409 denied: This chart version already exists in the repository.: chartAlreadyExists`.

When you replace a version over OCI, Repsy also updates the digest that `index.yaml` lists for it. Publish a new version instead of replacing an old one whenever you can: a client that has already downloaded or cached the chart does not know that it changed.

A version that you have deleted no longer exists, so you can publish it again, also with **Deny**.

### Deleting Versions and Charts

Deleting needs the `ADMIN` role in the web UI. Other users do not see the delete buttons.

1. Sign in to the web UI and open the **Repositories** tab. Open your repository.
2. To delete a whole chart with all its versions, use the menu (⋮) of its row in the list and click **Delete**.
3. To delete one version, open the chart and use the menu (⋮) of the version row, or open the version and click **Delete Version**.
4. Confirm the dialog.

When you delete the last version of a chart, the chart disappears from the list as well, and the web UI takes you back to the list of charts.

A delete removes the version for both protocols: the chart archive, its OCI tags and manifests, and the OCI blobs that no other manifest of the repository uses any more. The disk usage of the repository drops by the size of what was removed.

You can also delete one version through the classic API, with any credential that can publish, a user account or a **Read/Write** deploy token:

```bash
curl -X DELETE -u <username>:<password-or-token> \
  {{% repo-url path="helm" %}}/<repo-name>/api/charts/<chart-name>/<version>
```

It answers `200` when the version is gone and `404` with `chartNotFound` when the chart or the version does not exist. It removes the version for both protocols, like the web UI does. A **Read Only** token is refused with `401`. Note that this route needs write access only, and not the `ADMIN` role that the web UI asks for.

#### What Your Clients See

| Client | After the delete |
| --- | --- |
| Classic, `index.yaml` | The version is no longer listed. `helm search repo` still shows it until the client runs `helm repo update`, because it searches its local copy of the index. |
| Classic, download | The chart address `charts/<chart-name>-<version>.tgz` answers `404`, also for a chart that was published over OCI. |
| OCI, `helm pull oci://` | The version is `not found`, and it is no longer in the list of tags of the chart. |
| Your cluster | Nothing changes for releases that are already installed. Only new downloads of the deleted version fail. |

When you delete every version, the chart is gone from `index.yaml` and from the OCI list of tags altogether.
