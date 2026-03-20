"use client";

import { useRouter } from "next/navigation";
import { browserApiFetch } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await browserApiFetch("/auth/logout", {
      method: "POST"
    });
    router.push("/");
    router.refresh();
  }

  return (
    <button className="ghost-button" onClick={handleLogout} type="button">
      Sair
    </button>
  );
}
