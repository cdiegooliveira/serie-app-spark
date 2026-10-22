import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Série" },
      { name: "description", content: "Painel de administração." },
      { property: "og:title", content: "Admin — Série" },
      { property: "og:description", content: "Painel de administração." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const fmt = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Admin() {
  const { user } = Route.useRouteContext();
  const q = useQuery({
    queryKey: ["admin", user.id],
    queryFn: async () => {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return null;
      const [sets, leads, sugg] = await Promise.all([
        supabase.from("workout_sets").select("id", { count: "exact", head: true }),
        supabase.from("premium_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("exercise_suggestions").select("*").order("created_at", { ascending: false }),
      ]);
      return { total: sets.count ?? 0, leads: leads.data ?? [], sugg: sugg.data ?? [] };
    },
  });

  if (q.isLoading) return <main className="p-8 text-muted-foreground">Carregando…</main>;
  if (!q.data)
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">Acesso restrito</h1>
        <Link to="/dashboard" className="mt-4 inline-block text-primary">Voltar</Link>
      </main>
    );
  const { total, leads, sugg } = q.data;

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Painel Admin</h1>
        <Link to="/dashboard" className="text-sm text-muted-foreground">← Dashboard</Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[["Registros de treino", total], ["Leads Premium", leads.length], ["Sugestões", sugg.length]].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{l}</p>
            <p className="mt-1 text-4xl font-extrabold text-primary">{v}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-10 font-bold">Leads — cliques em "Liberar Premium"</h2>
      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="p-3">E-mail</th><th className="p-3">Data</th></tr></thead>
          <tbody>
            {leads.map((l) => <tr key={l.id} className="border-t"><td className="p-3">{l.email}</td><td className="p-3 text-muted-foreground">{fmt(l.created_at)}</td></tr>)}
            {leads.length === 0 && <tr><td colSpan={2} className="p-3 text-muted-foreground">Nenhum lead ainda.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 mt-10 font-bold">Sugestões de exercícios</h2>
      <div className="space-y-2">
        {sugg.map((s) => (
          <div key={s.id} className="rounded-xl bg-card px-4 py-3 shadow-card">
            <p className="font-semibold">{s.suggestion}</p>
            <p className="text-xs text-muted-foreground">{s.email} · {fmt(s.created_at)}</p>
          </div>
        ))}
        {sugg.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma sugestão ainda.</p>}
      </div>
    </main>
  );
}
