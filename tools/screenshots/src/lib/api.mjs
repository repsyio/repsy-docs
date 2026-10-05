// A small client of the panel REST API (`/api/...` on the panel port); see
// repsy-backend/src/main/resources/openapi/openapi-spec.yaml of repsyio/repsy. A success body is the bare resource
// (`PagedModel` for a list, 201 with `Location` on create, 204 when empty) on every route. `request` returns
// `{ status, body }` with the bare resource. A failure is an `application/problem+json` document
// (`code`, `detail`, `errors[]`, `traceId`).

export class PanelApi {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = undefined;
  }

  async request(method, path, body, { allow = [] } = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok && !allow.includes(res.status)) {
      throw new Error(`${method} ${path} answered ${res.status}: ${text.slice(0, 300)}`);
    }
    let json;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }
    return { status: res.status, body: json };
  }

  /** A fresh login = a new refresh-token family (refresh tokens are single use, so never share one). */
  async login(username, password) {
    const { body } = await this.request('POST', '/api/auth/login', { username, password });
    this.token = body.token;
    return body; // { username, token, refreshToken }
  }

  async createUser(username, password, role) {
    return (await this.request('POST', '/api/users', { username, password, role })).body;
  }

  async listUsers() {
    return (await this.request('GET', '/api/users?size=100')).body.content ?? [];
  }

  async createRepo(type, name, description, privateRepo) {
    return (await this.request('POST', '/api/repos', { type, name, description, privateRepo })).body;
  }

  async listRepos() {
    return (await this.request('GET', '/api/repos?size=100&sort=name,asc')).body.content ?? [];
  }

  async deleteRepo(name) {
    await this.request('DELETE', `/api/repos/${encodeURIComponent(name)}`);
  }

  async updateSettings(repoName, form) {
    await this.request('PUT', `/api/repos/${encodeURIComponent(repoName)}/settings`, form);
  }

  async createDeployToken(repoName, form) {
    return (await this.request('POST', `/api/repos/${encodeURIComponent(repoName)}/deploy-tokens`, form)).body;
  }

  /** One page (up to 100) of the vulnerability scans of all repositories. */
  async listScans() {
    return (await this.request('GET', '/api/security/scans?size=100')).body.content ?? [];
  }
}
