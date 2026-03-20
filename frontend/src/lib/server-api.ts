import "server-only";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { ApiError, publicApiUrl } from "./api";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const baseUrl = publicApiUrl.startsWith("http") ? publicApiUrl : new URL(publicApiUrl, `${protocol}://${host}`).toString();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookieStore.size ? { cookie: cookieStore.toString() } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(data?.message ?? "Falha ao consultar a API.", response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
