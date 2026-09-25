+++
title = "Signing Maven Artifacts"
weight = 380
+++

A Maven artifact can travel with OpenPGP signatures: for every file, a detached signature file with the extension `.asc`. Repsy Open Source checks these signatures when they are uploaded, stores the ones that verify, and shows a **Signed** lock on a version whose signatures verified. This page explains what Repsy verifies, how to set it up and how to sign with Maven and with Gradle.

Signing is optional. Repsy has no setting that refuses unsigned uploads: an unsigned deploy is accepted, and its version is shown as not signed.

### How Repsy Verifies Signatures

When a client uploads a signature, Repsy looks up the public key of the signer by the key ID inside the signature and checks the signature against the file it belongs to. A signature that does not verify is refused and not stored. Repsy looks for the public key in this order:

1. The public keys **registered on the repository**, see [Registering a Public Key](#registering-a-public-key).
2. The **additional key servers** you added to the repository.
3. The two built-in key servers, `keyserver.ubuntu.com` and then `keys.openpgp.org`.

Repsy asks a key server over HTTPS with a short timeout (3 seconds to connect and 5 seconds for the answer) and remembers a key it found for ten minutes, so a deploy with many signatures by one key asks the server once. A key that is revoked, or that had expired when the signature was made, is refused.

Two settings of the repository change what is verified and where keys are looked up. Both are in the **PGP Signature Key Stores** section of the repository settings, which only administrators can open and which exists for Maven repositories only: open the more options menu (⋮) of the repository in the **Repositories** tab and click **Settings**.

| Setting | Default | What it does |
| --- | --- | --- |
| **Verify every signature** | Off | **Off:** only the `.pom.asc` (the signature of the POM) is verified. Every other signature (`.jar.asc`, `-sources.jar.asc`, `.module.asc`, ...) is stored as it is sent, and a version is **Signed** when its POM signature verified. **On:** every signature is verified against its file before it is stored, and a version is **Signed** only when every file that a signing tool signs (the POM, the jar, every classifier jar, the `.module` file) has a verified signature. A partly signed release stays not signed. |
| **Look up keys on key servers** | On | **On:** keys that are not registered are looked up on the key servers. **Off** (air-gapped): only the keys registered on the repository are used, and no key server is contacted. |

The same section lists the built-in key servers and lets you add **additional key servers**: pick one from the list your instance offers (PGP Global Directory `keyserver.pgp.com`, CIRCL OpenPGP Keyserver `pgp.circl.lu` and PGP Keys EU `pgpkeys.eu`) and click the add button. Additional key servers are asked before the built-in ones.

Changing **Verify every signature** recalculates the **Signed** state of the existing versions of the repository in the background, so the web UI shows the new state within moments. Turning it on also verifies the signatures that were stored while it was off: a version whose stored signatures verify stays **Signed**, and a version with a signature that does not verify, or whose key cannot be found, is shown as not signed until its file and signature are uploaded again.

### Use Verify Every Signature for Signed Deploys

Maven uploads the files of a deploy in parallel, so a signature can reach Repsy before the file it signs, or before the POM that registers the version. With **Verify every signature** on, Repsy accepts the files and the signatures in any order: a signature that arrives first is answered with `200`, held (it is not served and `GET` answers `404`), and verified when its file arrives, then stored. A held signature that no file claims is deleted after 24 hours (an operator can change this).

With **Verify every signature** off, Repsy holds nothing, and a `.pom.asc` that reaches Repsy before its POM is refused with `404`. Switch the setting on for repositories that receive signed deploys.

### Registering a Public Key

Repsy can verify signatures made with a key that is on no key server (a company key, a CI key, a new key), and it must do so on an air-gapped instance. Register the public key on the repository. Registered keys are tried first and need no network access.

{{% notice note %}}
There is no form for this in the web UI at the moment: public keys can be registered only with a request to the panel API, which is in beta. The requests need an administrator account.
{{% /notice %}}

Export the public key of the key pair you sign with, as one ASCII-armored block:

```bash
gpg --armor --export <key-id> > public-key.asc
```

The block must contain exactly one key with its subkeys, and it can have 65,536 characters at most. A private key is refused. Sign in to get a token, then register the key (`<panel-url>` is the address of the web UI of your instance):

```bash
TOKEN=$(curl -s -X POST <panel-url>/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username": "MY REPSY USERNAME", "password": "MY REPSY PASSWORD"}' \
  | jq -r .data.token)

curl -X POST <panel-url>/api/mvn/key-stores/<repo-name>/public-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --rawfile key public-key.asc '{armoredKey: $key}')"
```

The answer contains the `keyId` and the `fingerprint` of the key. Registering the same key twice on one repository is refused with `409` (`This public key is already registered for the repository.`), and a value that is not one armored public key is refused with `400`. The same key can be registered on several repositories, and a key registered on one repository is not used by another. `GET <panel-url>/api/mvn/key-stores/<repo-name>/public-keys` lists the registered keys, and `DELETE <panel-url>/api/mvn/key-stores/<repo-name>/public-keys/<key-uuid>` removes one; a signature by a removed key is verified against the key servers again, or refused when the lookup is off.

### Signing with Maven

Add `maven-gpg-plugin` to `pom.xml` and bind its `sign` goal to the `verify` phase, which runs before `deploy`. The sources jar is optional; it is signed as well:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-source-plugin</artifactId>
      <version>3.3.1</version>
      <executions>
        <execution>
          <id>attach-sources</id>
          <goals>
            <goal>jar-no-fork</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-gpg-plugin</artifactId>
      <version>3.2.8</version>
      <executions>
        <execution>
          <id>sign-artifacts</id>
          <phase>verify</phase>
          <goals>
            <goal>sign</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

The plugin calls the `gpg` program. Give it the passphrase of the key through the environment, as a CI job does, and name the key if you have several:

```bash
export MAVEN_GPG_PASSPHRASE="MY KEY PASSPHRASE"
mvn deploy -Dgpg.keyname=<key-id>
```

The repository and the credentials are configured as in [Publishing and Consuming with Maven](../publishing-and-consuming-with-maven/). To deploy the same project without signatures, add `-Dgpg.skip=true`.

### Signing with Gradle

Apply the `signing` plugin next to `maven-publish`, let it use the `gpg` program and sign the publication:

```kotlin
plugins {
    `java-library`
    `maven-publish`
    signing
}

signing {
    useGpgCmd()
    sign(publishing.publications["mavenJava"])
}
```

In the Groovy DSL the plugin is `id 'signing'` and the block is `signing { useGpgCmd(); sign publishing.publications.mavenJava }`. Put the key settings into the user-level `gradle.properties` (`~/.gradle/gradle.properties`), not into the build file:

```properties
signing.gnupg.executable=gpg
signing.gnupg.keyName=<key-id>
signing.gnupg.passphrase=MY KEY PASSPHRASE
```

`signing.gnupg.homeDir` selects another GnuPG home. Then run `./gradlew publish`. Gradle signs and uploads the jar, the POM and the Gradle module metadata, and the sources jar when the build has one, so with **Verify every signature** on, every one of them has to verify for the version to be **Signed**. The publication `mavenJava` is the one defined in [Publishing and Consuming with Gradle (Kotlin DSL)](../publishing-and-consuming-with-gradle-kotlin-dsl/).

### What Your Build Tool Sees

Repsy answers a refused signature with a JSON body that carries the identifier and the text below. The build tool prints the HTTP status.

| Status | Identifier and message | When |
| --- | --- | --- |
| `422` | `artifactSignatureNotVerified`: `Artifact signature isn't verified!` | The `.asc` is not an OpenPGP signature, it does not match the file it belongs to, or the signing key is revoked or had expired when the signature was made. Nothing is stored and nothing that is already there is changed. |
| `404` | `artifactSigningKeyNotFound`: `No public key was found for the key that signed this artifact.` | The key is not registered and no key server has it. |
| `404` | `artifactSigningKeyNotRegistered`: `The key that signed this artifact is not registered, and key-server lookup is off.` | Air-gapped repository: the key is not registered. Repsy answers at once and asks no key server. |
| `422` | `pendingSignatureNotVerified`: `The signature uploaded earlier for this file does not verify; upload both again.` | **Verify every signature** is on, the signature arrived before its file and does not verify. The file is refused and taken back out of the repository, and the held signature is dropped. |

With **Verify every signature** on, a signature can arrive before its file and is held without being checked against a key. In that case the `404` for a key that is not found appears when the file arrives: the build tool reports it on the file, not on the `.asc`. Maven prints `Could not find artifact ...` and Gradle prints `Could not PUT '...'. Received status code 404`. Files that were uploaded before the refusal stay in the repository, because a deploy is not one transaction; fix the key and deploy again.

### Troubleshooting

- **The deploy fails with `404` although the files exist.** The key that signed is not registered and not on a key server (or the lookup is off). Register the public key, see above.
- **`422 artifactSignatureNotVerified` after you changed a file.** The signature belongs to the old bytes of the file. Sign again: run `mvn clean deploy` or `./gradlew clean publish`.
- **A version is not Signed although you signed everything.** With **Verify every signature** on, every file needs a verified signature, and uploading a file again (with **Package Override** on **Allow**) makes the version not signed until the signature of the new file is uploaded and verified. Check the list of files with **Browse Files**: every file should have an `.asc`.
- **A key on a key server is not found.** Repsy asks over HTTPS and gives up after a few seconds. Register the key on the repository, or switch **Look up keys on key servers** off and register all keys.
