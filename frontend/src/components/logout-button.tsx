"use client";

import { browserApiFetch } from "@/lib/api";
import { useAppLoading } from "@/components/loading-provider";

export function LogoutButton() {
  const { startLoading, stopLoading } = useAppLoading();

  async function handleLogout() {
    startLoading("Saindo...");

    try {
      await browserApiFetch("/auth/logout", {
        method: "POST"
      });
      window.location.assign("/");
    } catch {
      stopLoading();
    }
  }

  return (
    <button className="ghost-button" onClick={handleLogout} type="button">
      Sair
    </button>
  );
}
