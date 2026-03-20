"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { browserApiFetch } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);

    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    };

    startTransition(async () => {
      try {
        await browserApiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        router.push("/setores");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Nao foi possivel entrar.");
      }
    });
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
