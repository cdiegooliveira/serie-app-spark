import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Série" },
      { name: "description", content: "Entre para registrar seus treinos." },
      { property: "og:title", content: "Entrar — Série" },
      { property: "og:description", content: "Entre para registrar seus treinos." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/dashboard", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("E-mail ou senha inválidos");
    } else {
      const { error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: window.location.origin + "/dashboard" },
      });
      if (error) toast.error(error.message);
      else toast.success("Confira seu e-mail para confirmar a conta.");
    }
    setLoading(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar com Google");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
      <p className="mt-2 text-muted-foreground">Seu histórico fica salvo com segurança.</p>

      <button onClick={google} className="mt-8 h-12 rounded-xl bg-secondary font-semibold text-secondary-foreground">
        Continuar com Google
      </button>
      <div className="my-6 text-center text-xs uppercase tracking-widest text-muted-foreground">ou</div>

      <form onSubmit={submit} className="space-y-3">
        <Input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-card" />
        <Input type="password" required minLength={6} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-card" />
        <button disabled={loading} className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-glow disabled:opacity-60">
          {mode === "in" ? "Entrar" : "Criar conta"}
        </button>
      </form>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 text-sm text-muted-foreground">
        {mode === "in" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
      </button>
    </main>
  );
}
