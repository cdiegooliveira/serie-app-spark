import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Dumbbell, Lock, LogOut, Lightbulb, Minus, Repeat, Trash2, TrendingDown, TrendingUp, UserRound } from "lucide-react";
import type { TablesInsert } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const WHATSAPP_URL =
  "https://wa.me/5551999672503?text=Ol%C3%A1!%20Quero%20assinar%20o%20plano%20Premium%20do%20app%20de%20treinos.";
const EXERCISES: string[] = [
  "Supino reto", "Supino inclinado", "Crucifixo", "Crossover",
  "Desenvolvimento", "Elevação lateral", "Elevação frontal",
  "Puxada frontal", "Remada curvada", "Remada unilateral", "Barra fixa",
  "Rosca direta", "Rosca martelo", "Tríceps testa", "Tríceps polia",
  "Agachamento", "Leg press", "Cadeira extensora", "Mesa flexora", "Levantamento terra", "Panturrilha",
  "Abdominal", "Prancha",
  "Cárdio - Esteira", "Cárdio - Bicicleta", "Cárdio - Elíptico",
];
const EXERCISE_INFO: Record<string, string> = {
  "Supino reto": "Peito · barra ou halteres",
  "Supino inclinado": "Peito superior",
  "Crucifixo": "Peito · isolamento",
  "Crossover": "Peito · polia",
  "Desenvolvimento": "Ombros · força",
  "Elevação lateral": "Ombros laterais",
  "Elevação frontal": "Ombros frontais",
  "Puxada frontal": "Costas · dorsais",
  "Remada curvada": "Costas · espessura",
  "Remada unilateral": "Costas · um braço",
  "Barra fixa": "Costas · peso corporal",
  "Rosca direta": "Bíceps",
  "Rosca martelo": "Bíceps · antebraço",
  "Tríceps testa": "Tríceps · barra/halters",
  "Tríceps polia": "Tríceps · polia",
  "Agachamento": "Pernas · completo",
  "Leg press": "Pernas · quadríceps",
  "Cadeira extensora": "Quadríceps · isolamento",
  "Mesa flexora": "Posteriores de coxa",
  "Levantamento terra": "Corpo todo · força",
  "Panturrilha": "Panturrilhas",
  "Abdominal": "Core · reto abdominal",
  "Prancha": "Core · isometria",
  "Cárdio - Esteira": "Cárdio · corrida/caminhada",
  "Cárdio - Bicicleta": "Cárdio · baixo impacto",
  "Cárdio - Elíptico": "Cárdio · corpo todo",
};
const isCardioExercise = (e: string) => e.startsWith("Cárdio");

const WEIGHT_OPTIONS: { v: string; d: string }[] = [
  { v: "2.5", d: "aquecimento" }, { v: "5", d: "bem leve" }, { v: "7.5", d: "leve" }, { v: "10", d: "leve" },
  { v: "15", d: "moderada" }, { v: "20", d: "moderada" }, { v: "25", d: "moderada" }, { v: "30", d: "pesada" },
  { v: "35", d: "pesada" }, { v: "40", d: "pesada" }, { v: "45", d: "muito pesada" }, { v: "50", d: "muito pesada" },
  { v: "60", d: "avançada" }, { v: "70", d: "avançada" },
];
const REP_OPTIONS: { v: string; d: string }[] = [
  { v: "5", d: "força" }, { v: "6", d: "força" }, { v: "8", d: "hipertrofia" }, { v: "10", d: "hipertrofia" },
  { v: "12", d: "hipertrofia" }, { v: "15", d: "resistência" }, { v: "20", d: "resistência" }, { v: "25", d: "resistência" },
];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Treino de hoje — Spark Gym" },
      { name: "description", content: "Registre suas séries do dia e acompanhe a evolução das cargas." },
      { property: "og:title", content: "Treino de hoje — Spark Gym" },
      { property: "og:description", content: "Registre suas séries do dia e acompanhe a evolução das cargas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [exercise, setExercise] = useState<string>("Supino reto");
  const [f, setF] = useState({ weight: "", reps: "", speed: "", incline: "", minutes: "" });
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const isCardio = isCardioExercise(exercise);

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

  const evolution = useQuery({
    queryKey: ["sets", "evolution", user.id, exercise],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sets").select("*").eq("user_id", user.id)
        .eq("exercise", exercise).order("created_at", { ascending: false }).limit(8);
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
      const row: TablesInsert<"workout_sets"> = isCardio
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
    onSettled: (_d, _e, id) => {
      setRemoving((prev) => { const next = new Set(prev); next.delete(id); return next; });
      qc.invalidateQueries({ queryKey: ["sets"] });
    },
  });

  function removeWithAnimation(id: string) {
    setRemoving((prev) => new Set(prev).add(id));
    window.setTimeout(() => remove.mutate(id), 220);
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

  const valueGrid = (k: "weight" | "reps", label: string, hint: string, options: { v: string; d: string }[]) => (
    <div>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label} <span className="normal-case tracking-normal">· {hint}</span>
      </span>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {options.map(({ v, d }) => {
          const active = f[k] === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setF((p) => ({ ...p, [k]: active ? "" : v }))}
              className={`rounded-xl px-1 py-2.5 text-center transition-all duration-200 active:scale-95 ${
                active ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="block text-base font-bold leading-tight">
                {v}{k === "weight" ? <span className="text-[11px] font-semibold"> kg</span> : ""}
              </span>
              <span className={`block text-[10px] leading-tight ${active ? "text-primary-foreground/80" : "text-muted-foreground/70"}`}>{d}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const field = (k: "speed" | "incline" | "minutes", label: string) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input
        inputMode="decimal" value={f[k]}
        onChange={(e) => setF((p) => ({ ...p, [k]: e.target.value }))}
        className="h-14 border-0 bg-secondary text-xl font-semibold"
      />
    </label>
  );

  const trendIcon = (current: number | null, previous: number | null) => {
    if (current == null || previous == null || current === previous)
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    return current > previous
      ? <TrendingUp className="h-4 w-4 text-primary" />
      : <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Dumbbell className="h-4 w-4" /></span>
          Spark Gym
        </Link>
        <div className="flex items-center gap-1">
          {isAdmin.data && <Link to="/admin" className="rounded-lg px-3 py-2 text-sm text-muted-foreground">Admin</Link>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Menu do usuário" className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground">
                <UserRound className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-0 bg-card shadow-card">
              <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut} className="gap-2">
                <Repeat className="h-4 w-4" /> Trocar de conta
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={signOut} className="gap-2 text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <button onClick={() => setPremiumOpen(true)} className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-2xl bg-card px-6 py-3 font-semibold shadow-card transition-transform active:scale-[0.98]">
        <Lock className="h-4 w-4 text-primary" /> Adquira o Premium
      </button>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-card p-5 shadow-card">
          <h1 className="text-center text-xl font-bold">Nova Série</h1>
          <div className="mt-4 space-y-4">
            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Exercício <span className="normal-case tracking-normal">· toque para escolher</span>
              </span>
              <Select value={exercise} onValueChange={setExercise}>
                <SelectTrigger className="h-auto min-h-14 border-0 bg-secondary py-3 text-base font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {EXERCISES.map((e) => (
                    <SelectItem key={e} value={e}>
                      <span className="flex flex-col">
                        <span className="font-semibold">{e}</span>
                        <span className="text-xs text-muted-foreground">{EXERCISE_INFO[e]}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">{EXERCISE_INFO[exercise]}</p>
            </div>
            {isCardio ? (
              <div className="grid grid-cols-3 gap-3">
                {field("speed", "Veloc.")}{field("incline", "Incl. %")}{field("minutes", "Min")}
              </div>
            ) : (
              <div className="space-y-3">
                {valueGrid("weight", "Carga", "toque para escolher", WEIGHT_OPTIONS)}
                {valueGrid("reps", "Repetições", "toque para escolher", REP_OPTIONS)}
              </div>
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

        <div className="space-y-6">
          <section className="rounded-2xl bg-card p-5 shadow-card">
            <h2 className="flex items-center justify-center gap-2 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" /> Evolução · {exercise}
            </h2>
            <div className="mt-3 space-y-2">
              {evolution.data?.map((s, i) => {
                const prev = evolution.data[i + 1];
                const cur = isCardioExercise(s.exercise) ? s.speed : s.weight_kg;
                const old = prev ? (isCardioExercise(prev.exercise) ? prev.speed : prev.weight_kg) : null;
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-2.5">
                    {trendIcon(cur, old)}
                    <p className="flex-1 text-sm font-semibold">
                      {isCardioExercise(s.exercise)
                        ? `${s.speed ?? "-"} km/h · ${s.incline ?? 0}% · ${s.duration_min ?? "-"} min`
                        : `${s.weight_kg} kg × ${s.reps} reps`}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                );
              })}
              {evolution.data?.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhum registro ainda. Salve a primeira série!</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Hoje · {today.data?.length ?? 0} séries</h2>
            <div className="space-y-2">
              {today.data?.map((s) => (
                <div key={s.id} className={`flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-card ${removing.has(s.id) ? "set-exit" : ""}`}>
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold">{s.exercise}</p>
                    <p className="text-sm text-muted-foreground">
                      {isCardioExercise(s.exercise)
                        ? `${s.speed ?? "-"} km/h · ${s.incline ?? 0}% · ${s.duration_min ?? "-"} min`
                        : `${s.weight_kg} kg × ${s.reps}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <button onClick={() => removeWithAnimation(s.id)} aria-label="Remover" className="p-1 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {today.data?.length === 0 && <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">Nenhuma série hoje. Bora!</p>}
            </div>
          </section>
        </div>
      </div>

      <Dialog open={premiumOpen} onOpenChange={setPremiumOpen}>
        <DialogContent className="border-0 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Função Premium</DialogTitle>
            <DialogDescription>O Histórico de Evolução completo mostra gráficos da sua progressão de carga e cárdio. Disponível no plano Premium.</DialogDescription>
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
