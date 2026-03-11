import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL =
  process.env.BACKEND_INTERNAL_URL || 'http://localhost:9100/api/v1';

function buildTargetUrl(path: string[], search: string, hasTrailingSlash: boolean): string {
  const cleanBase = BACKEND_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.map(encodeURIComponent).join('/');
  const trailing = hasTrailingSlash ? '/' : '';
  return `${cleanBase}/${cleanPath}${trailing}${search}`;
}

async function forward(request: NextRequest, path: string[]) {
  const targetUrl = buildTargetUrl(
    path,
    request.nextUrl.search,
    request.nextUrl.pathname.endsWith('/')
  );
  const headers = new Headers();

  const forwardHeaderNames = ['authorization', 'x-api-key', 'content-type'];
  for (const name of forwardHeaderNames) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
    redirect: 'manual',
  };

  let requestBody: ArrayBuffer | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    requestBody = await request.arrayBuffer();
    init.body = requestBody;
  }

  let response = await fetch(targetUrl, init);
  if ([301, 302, 307, 308].includes(response.status)) {
    const location = response.headers.get('location');
    if (location) {
      const redirectedUrl = new URL(location, targetUrl).toString();
      response = await fetch(redirectedUrl, {
        ...init,
        body: requestBody,
      });
    }
  }
  const responseBody = await response.arrayBuffer();

  const outHeaders = new Headers();
  const responseContentType = response.headers.get('content-type');
  if (responseContentType) outHeaders.set('content-type', responseContentType);

  return new NextResponse(responseBody, {
    status: response.status,
    headers: outHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forward(request, path);
}
