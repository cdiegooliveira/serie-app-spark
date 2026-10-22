import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Dumbbell, Lock, LogOut, Lightbulb, Trash2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const WHATSAPP_URL =
  "https://wa.me/5551999672503?text=Ol%C3%A1!%20Quero%20assinar%20o%20plano%20Premium%20do%20app%20de%20treinos.";
const EXERCISES: string[] = ["Supino", "Agachamento", "Terra", "Puxada", "Cárdio - Esteira"];
const CARDIO = "Cárdio - Esteira";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Treino de hoje — Série" },
      { name: "description", content: "Registre suas séries do dia." },
      { property: "og:title", content: "Treino de hoje — Série" },
      { property: "og:description", content: "Registre suas séries do dia." },
    ],
  }),
  component: Dashboard,
});

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<string>("Supino");
  const [f, setF] = useState({ weight: "", reps: "", speed: "", incline: "", minutes: "" });
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const isCardio = exercise === CARDIO;

  const today = useQuery({
    queryKey: ["sets", "today", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sets").select("*").eq("user_id", user.id)
        .gte("created_at", startOfToday()).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const isAdmin = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return !!data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const n = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));
      const row = isCardio
        ? { exercise, speed: n(f.speed), incline: n(f.incline), duration_min: n(f.minutes), weight_kg: null, reps: null }
        : { exercise, weight_kg: n(f.weight), reps: n(f.reps), speed: null, incline: null, duration_min: null };
      const { error } = await supabase.from("workout_sets").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Série salva!");
      setF((p) => ({ ...p, reps: "" }));
      qc.invalidateQueries({ queryKey: ["sets"] });
    },
    onError: () => toast.error("Não foi possível salvar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_sets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sets"] }),
  });

  async function openPremium() {
    setPremiumOpen(true);
  }
  async function unlockPremium() {
    await supabase.from("premium_leads").insert({ email: user.email ?? null });
  }
  async function sendSuggestion() {
    const s = suggestion.trim();
    if (!s) return;
    const { error } = await supabase.from("exercise_suggestions").insert({ suggestion: s.slice(0, 200), email: user.email ?? null });
    if (error) { toast.error("Não foi possível enviar"); return; }
    toast.success("Obrigado pela sugestão!");
    setSuggestion("");
    setSuggestOpen(false);
  }
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const valid = isCardio ? f.speed && f.minutes : f.weight && f.reps;
  const field = (k: keyof typeof f, label: string) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input
        inputMode="decimal" value={f[k]}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
        className="h-14 border-0 bg-secondary text-xl font-semibold"
      />
    </label>
  );

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Dumbbell className="h-4 w-4" /></span>
          Série
        </Link>
        <div className="flex items-center gap-1">
          {isAdmin.data && <Link to="/admin" className="rounded-lg px-3 py-2 text-sm text-muted-foreground">Admin</Link>}
          <button onClick={signOut} aria-label="Sair" className="rounded-lg p-2 text-muted-foreground"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>

      <button onClick={openPremium} className="mt-6 flex w-full items-center justify-between rounded-2xl bg-card p-4 shadow-card">
        <span className="flex items-center gap-3 font-semibold"><TrendingUp className="h-5 w-5 text-primary" /> Histórico de Evolução</span>
        <Lock className="h-4 w-4 text-muted-foreground" />
      </button>

      <section className="mt-6 rounded-2xl bg-card p-5 shadow-card">
        <h1 className="text-xl font-bold">Nova série</h1>
        <div className="mt-4 space-y-4">
          <Select value={exercise} onValueChange={setExercise}>
            <SelectTrigger className="h-14 border-0 bg-secondary text-base font-semibold"><SelectValue /></SelectTrigger>
            <SelectContent>{EXERCISES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
          {isCardio ? (
            <div className="grid grid-cols-3 gap-3">
              {field("speed", "Veloc.")}{field("incline", "Incl. %")}{field("minutes", "Min")}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">{field("weight", "Carga (kg)")}{field("reps", "Repetições")}</div>
          )}
          <button
            disabled={!valid || save.isPending} onClick={() => save.mutate()}
            className="h-14 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            Salvar Série
          </button>
          <button onClick={() => setSuggestOpen(true)} className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lightbulb className="h-4 w-4" /> Sugerir exercício
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Hoje · {today.data?.length ?? 0} séries</h2>
        <div className="space-y-2">
          {today.data?.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-card">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">{s.exercise}</p>
                <p className="text-sm text-muted-foreground">
                  {s.exercise === CARDIO
                    ? `${s.speed ?? "-"} km/h · ${s.incline ?? 0}% · ${s.duration_min ?? "-"} min`
                    : `${s.weight_kg} kg × ${s.reps}`}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              <button onClick={() => remove.mutate(s.id)} aria-label="Remover" className="p-1 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {today.data?.length === 0 && <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">Nenhuma série hoje. Bora!</p>}
        </div>
      </section>

      <Dialog open={premiumOpen} onOpenChange={setPremiumOpen}>
        <DialogContent className="border-0 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Função Premium</DialogTitle>
            <DialogDescription>O Histórico de Evolução mostra gráficos da sua progressão de carga e cárdio. Disponível no plano Premium.</DialogDescription>
          </DialogHeader>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={unlockPremium}
            className="flex h-14 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-glow">
            Liberar Premium
          </a>
        </DialogContent>
      </Dialog>

      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="border-0 bg-card">
          <DialogHeader>
            <DialogTitle>Sugerir exercício</DialogTitle>
            <DialogDescription>Qual exercício você quer ver na lista?</DialogDescription>
          </DialogHeader>
          <Input value={suggestion} maxLength={200} onChange={(e) => setSuggestion(e.target.value)} placeholder="Ex: Leg press" className="h-12 border-0 bg-secondary" />
          <button onClick={sendSuggestion} className="h-12 rounded-xl bg-primary font-bold text-primary-foreground">Enviar</button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
