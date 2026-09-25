// The control API of the stub scanner (see e2e/src/stubs/scanner/server.ts of repsyio/repsy).
export class ScannerStub {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /** Makes scans of `artifactName` report exactly these severities (`[]` = clean). */
  async script(artifactName, script) {
    const res = await fetch(`${this.baseUrl}/control/scripts`, {
      method: 'PUT',
      headers: { 'x-scanner-api-key': this.apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ artifactName, script }),
    });
    if (!res.ok) throw new Error(`stub scanner PUT /control/scripts answered ${res.status}: ${await res.text()}`);
  }
}
