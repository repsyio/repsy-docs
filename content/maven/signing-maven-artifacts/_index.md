+++
title = "Signing Maven Artifacts"
weight = 370
description = "Verify OpenPGP signatures on uploaded Maven artifacts and configure key server lookups."
+++

Repsy Cloud verifies OpenPGP signatures when Maven artifacts are uploaded. A version shows a **Signed** lock when its signatures verify against registered or discovered public keys. This page explains what Repsy verifies and how to configure key lookup and signature verification settings.

Uploading unsigned artifacts is always allowed. Repsy has no setting that refuses unsigned uploads: an unsigned deploy is accepted, and its version is shown as not signed.

### How Repsy Verifies Signatures

Repsy verifies detached signatures (files with the extension `.asc`). When a client uploads a `.pom.asc` or another `.asc` file, Repsy looks up the public key of the signer by the key ID inside the signature and checks the signature against the file it belongs to. A signature that does not verify is refused and not stored.

For each signature, Repsy looks for the public key in this order:

1. The public keys **registered on the repository**.
2. **Additional key servers** you have added to the repository (selected from your instance's allow-list).
3. The two built-in key servers: `keyserver.ubuntu.com` and `keys.openpgp.org`.

{{% notice note %}}
**What Signed means**

With keyserver lookup on, a version shows **Signed** when anyone published a key matching the signature's key ID to a public keyserver. There is no identity binding to the deployer. Only a registered key (or keyserver lookup off) makes **Signed** meaningful — registered keys prove you control the repository and accept signatures by that key.

Signature verification is performed on upload only. Proxied and downloaded artifacts are not verified.
{{% /notice %}}

Repsy asks a key server over HTTPS with a short timeout (3 seconds to connect and 5 seconds for the answer). A key that is revoked or had expired when the signature was made is refused.

### Configuration

Two settings in the **PGP Signature Key Stores** section control what is verified and where keys are looked up. Only repository administrators can change these settings. Open the repository, click the more options menu (⋮) and select **Settings**.

| Setting | Default | What it does |
| --- | --- | --- |
| **Verify every signature** | Off | **Off:** only the `.pom.asc` (the signature of the POM) is verified. Every other signature (`.jar.asc`, `-sources.jar.asc`, `.module.asc`, ...) is accepted as-is, and a version is **Signed** when its POM signature verified. **On:** every signature is verified against its file before it is stored, and a version is **Signed** only when every file that needs a signature (the POM, the jar, every classifier jar, the `.module` file) has a verified signature. A partly signed release stays not signed. |
| **Look up keys on key servers** | On | **On:** keys that are not registered are looked up on key servers. **Off** (air-gapped): only the keys registered on the repository are used, and no key server is contacted. |

The same section lists the built-in key servers and lets you add **additional key servers**: select one from the list your instance offers and click the add button. Additional key servers are asked before the built-in ones.

### Registering a Public Key

Repsy can verify signatures made with a key that is on no key server (a company key, a CI key, a new key), and it must do so on an air-gapped instance. Register the public key on the repository. Registered keys are tried first and need no network access.

{{% notice note %}}
There is no form for this in the web UI at the moment: public keys can be registered only with a request to the panel API, which is in beta. The requests need an administrator account.
{{% /notice %}}

Export the public key of the key pair you sign with, as one ASCII-armored block:

```bash
gpg --armor --export <key-id> > public-key.asc
```

The block must contain exactly one key with its subkeys, and it can have 65,536 characters at most. A private key is refused. Sign in to get a token, then register the key (`<panel-url>` is the address of your Repsy instance, and `<owner>` is the repository owner shown in the panel URL):

```bash
TOKEN=$(curl -s -X POST <panel-url>/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username": "MY REPSY USERNAME", "password": "MY REPSY PASSWORD"}' \
  | jq -r .data.token)

curl -X POST <panel-url>/api/mvn/key-stores/<owner>/<repo-name>/public-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --rawfile key public-key.asc '{armoredKey: $key}')"
```

The answer contains the `keyId` and the `fingerprint` of the key. Registering the same key twice on one repository is refused with `409` (`This public key is already registered for the repository.`), and a value that is not one armored public key is refused with `400`. The same key can be registered on several repositories, and a key registered on one repository is not used by another. `GET <panel-url>/api/mvn/key-stores/<owner>/<repo-name>/public-keys` lists the registered keys, and `DELETE <panel-url>/api/mvn/key-stores/<owner>/<repo-name>/public-keys/<key-uuid>` removes one; a signature by a removed key is verified against the key servers again, or refused when the lookup is off.

### What Your Build Tool Sees

Repsy answers a refused signature with a JSON body that carries the identifier and the text below. The build tool prints the HTTP status.

| Status | Identifier and message | When |
| --- | --- | --- |
| `422` | `artifactSignatureNotVerified`: `Artifact signature isn't verified!` | The `.asc` is not an OpenPGP signature, it does not match the file it belongs to, or the signing key is revoked or had expired when the signature was made. Nothing is stored and nothing that is already there is changed. |
| `404` | `artifactSigningKeyNotFound`: `No public key was found for the key that signed this artifact.` | The key is not registered and no key server has it. |
| `404` | `artifactSigningKeyNotRegistered`: `The key that signed this artifact is not registered, and key-server lookup is off.` | Air-gapped repository: the key is not registered. Repsy answers at once and asks no key server. |
| `422` | `pendingSignatureNotVerified`: `The signature uploaded earlier for this file does not verify; upload both again.` | **Verify every signature** is on, the signature arrived before its file and does not verify. The file is refused and taken back out of the repository, and the held signature is dropped. |

With **Verify every signature** on, a signature can arrive before its file and is held without being checked against a key. In that case the `404` for a key that is not found appears when the file arrives: the build tool reports it on the file, not on the `.asc`. Files that were uploaded before the refusal stay in the repository, because a deploy is not one transaction; fix the key and deploy again.

### Troubleshooting

- **The deploy fails with `404` although the files exist.** The key that signed is not registered and not on a key server (or the lookup is off). Register the public key on the repository or turn on keyserver lookup.
- **A version is not Signed although you signed everything.** With **Verify every signature** on, every file needs a verified signature. Check the list of files: every file should have an `.asc`. Upload the missing signatures.
