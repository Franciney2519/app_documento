"use client";

import { useState } from "react";
import { browserApiFetch } from "@/lib/api";
import { useAppLoading } from "@/components/loading-provider";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { startLoading, stopLoading } = useAppLoading();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsPending(true);
    startLoading("Entrando...");

    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    };

    try {
      await browserApiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      window.location.assign("/setores");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nao foi possivel entrar.");
      setIsPending(false);
      stopLoading();
    }
  }

  return (
    <form action={handleSubmit} className="panel form-panel">
      <div className="brand-mark">NFA</div>
      <h1>Neo Fala Amazônia</h1>
      <p className="subtle">Comunicação interna, consulta operacional e governança documental.</p>

      <label className="field">
        <span>E-mail</span>
        <input name="email" type="email" placeholder="seu@email.com" required />
      </label>

      <label className="field">
        <span>Senha</span>
        <input name="password" type="password" placeholder="••••••••" required />
      </label>

      {error ? <p className="error-banner">{error}</p> : null}

      <button type="submit" className="primary-button" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </button>

      <div className="helper-links">
        <a href="#">Não tem conta? Cadastre-se</a>
        <a href="#">Recuperar senha</a>
      </div>
    </form>
  );
}
