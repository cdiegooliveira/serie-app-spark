import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import googleLogo from "@/assets/google-logo.png.asset.json";
import { LoaderCircle, LogIn, UserRoundPlus } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Spark Gym" },
      { name: "description", content: "Entre para registrar seus treinos." },
      { property: "og:title", content: "Entrar — Spark Gym" },
      { property: "og:description", content: "Entre para registrar seus treinos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <div key={mode} className="auth-mode-transition" aria-live="polite">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground" aria-hidden="true">
        {mode === "in" ? <LogIn className="h-6 w-6" /> : <UserRoundPlus className="h-6 w-6" />}
      </div>
      <h1 className="text-3xl font-extrabold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
      <p className="mt-2 text-muted-foreground">Seu histórico fica salvo com segurança.</p>

      <Button type="button" variant="secondary" onClick={google} className="mt-8 h-12 w-full rounded-xl gap-3 font-semibold motion-safe:transition-transform motion-safe:active:scale-[0.98]">
        <img src={googleLogo.url} alt="" aria-hidden="true" width={20} height={20} className="h-5 w-5 shrink-0" />
        Continuar com Google
      </Button>
      <div className="my-6 text-center text-xs uppercase tracking-widest text-muted-foreground">ou</div>

      <form onSubmit={submit} className="space-y-3">
        <Input type="email" aria-label="E-mail" autoComplete="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-card" />
        <Input type="password" aria-label="Senha" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={6} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-card" />
        <Button type="submit" disabled={loading} aria-busy={loading} className="h-12 w-full rounded-xl font-bold shadow-glow disabled:opacity-60 motion-safe:transition-transform motion-safe:active:scale-[0.98]">
          {loading && <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />}
          {loading ? (mode === "in" ? "Entrando…" : "Criando conta…") : (mode === "in" ? "Entrar" : "Criar conta")}
        </Button>
      </form>
      <Button type="button" variant="ghost" disabled={loading} onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 w-full text-sm text-muted-foreground motion-safe:transition-transform motion-safe:active:scale-[0.98]">
        {mode === "in" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
      </Button>
      </div>
    </main>
  );
}
