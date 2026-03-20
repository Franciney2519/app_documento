import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const backendApiUrl = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstreamUrl = new URL(`${path.join("/")}${request.nextUrl.search}`, `${backendApiUrl.replace(/\/$/, "")}/`);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.delete("host");
  requestHeaders.delete("content-length");

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers: requestHeaders,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    redirect: "manual"
  });

  const responseHeaders = new Headers();

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      responseHeaders.set(key, value);
    }
  });

  for (const cookie of response.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

export { proxyRequest as GET };
export { proxyRequest as POST };
export { proxyRequest as PUT };
export { proxyRequest as PATCH };
export { proxyRequest as DELETE };
export { proxyRequest as OPTIONS };
