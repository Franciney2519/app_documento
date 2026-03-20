import { redirect } from "next/navigation";
import { ApiError } from "./api";
import { apiFetch } from "./server-api";
import type { UserSession } from "./types";

export async function getSession(required = true): Promise<UserSession | null> {
  try {
    const response = await apiFetch<{ user: UserSession }>("/auth/me");
    return response.user;
  } catch (error) {
    if (required && error instanceof ApiError && error.status === 401) {
      redirect("/");
    }

    if (required) {
      redirect("/");
    }

    return null;
  }
}
