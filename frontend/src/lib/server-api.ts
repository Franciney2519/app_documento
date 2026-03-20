import "server-only";
import { cookies } from "next/headers";
import { ApiError, publicApiUrl } from "./api";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const response = await fetch(`${publicApiUrl}${path}`, {
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
