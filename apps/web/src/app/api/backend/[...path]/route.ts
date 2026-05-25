import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIES } from '@/constants/cookies';
import { getServerApiUrl } from '@/lib/env';

async function proxy(request: Request, path: string[]) {
  const store = await cookies();
  const accessToken = store.get(COOKIES.ACCESS)?.value;
  const target = `${getServerApiUrl()}/${path.join('/')}${new URL(request.url).search}`;
  const headers = new Headers(request.headers);
  headers.delete('host');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const init: RequestInit = {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
  };
  const res = await fetch(target, init);
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}

export async function GET(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await ctx.params).path);
}
export async function POST(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await ctx.params).path);
}
export async function PATCH(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await ctx.params).path);
}
export async function PUT(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await ctx.params).path);
}
export async function DELETE(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await ctx.params).path);
}
