export class NextRequest {
  constructor(input, init = {}) { this.url = String(input); this.method = init.method ?? "GET"; this.headers = new Headers(init.headers); this._body = init.body; }
  async json() { return typeof this._body === "string" ? JSON.parse(this._body) : this._body; }
}
export class NextResponse extends Response {
  static json(data, init = {}) { return new Response(JSON.stringify(data), { ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } }); }
  static redirect(url, init) { return Response.redirect(url, init); }
}
export function after(callback) { return callback?.(); }
export const cookies = () => new Map();
export const headers = () => new Headers();
