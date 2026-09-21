// Bridge ships as static assets and nothing else. The board talks to whichever
// `maw herdr serve` the operator points it at, so this Worker never sees fleet
// data, never holds a token, and has no reason to proxy anything.
//
// Its one job beyond serving files is to hand every unknown path back to the
// SPA, so a deep link survives a reload.

interface Env {
  ASSETS: Fetcher;
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  // The board reaches arbitrary operator-chosen origins, so connect-src cannot
  // be pinned. Everything that can be locked down is.
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "connect-src *",
  ].join("; "),
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);

    if (response.status === 404 && request.method === "GET" && !url.pathname.includes(".")) {
      response = await env.ASSETS.fetch(new Request(new URL("/", url), request));
    }

    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
    return new Response(response.body, { status: response.status, headers });
  },
};
