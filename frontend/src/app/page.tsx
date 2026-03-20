import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getSession(false);

  if (session) {
    redirect("/setores");
  }

  return (
    <main className="auth-page">
      <section className="auth-copy">
        <span className="eyebrow">Portal interno corporativo</span>
        <h2>Governança, operação e apoio em um único ambiente.</h2>
        <p>
          Consulte políticas, normas, procedimentos, checklists e abra canais com RH, DP e SSMA
          de forma organizada por setor e permissão.
        </p>
      </section>
      <LoginForm />
    </main>
  );
}
