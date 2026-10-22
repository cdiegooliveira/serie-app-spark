import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, Activity, History } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Série — Bata seu recorde diário" },
      { name: "description", content: "O registro de treinos sem distrações. Carga, repetições e cárdio, na academia ou em casa." },
      { property: "og:title", content: "Série — Bata seu recorde diário" },
      { property: "og:description", content: "O registro de treinos sem distrações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
      <header className="flex items-center gap-2 text-lg font-bold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Dumbbell className="h-4 w-4" />
        </span>
        Série
      </header>

      <section className="flex flex-1 flex-col justify-center py-16">
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Bata seu recorde diário.{" "}
          <span className="text-primary">O registro de treinos sem distrações.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Foque na carga, repetições e cárdio. Nós cuidamos do histórico, seja na academia ou em casa.
        </p>
        <Link
          to="/dashboard"
          className="mt-10 inline-flex h-14 w-full items-center justify-center rounded-xl bg-primary px-8 text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] sm:w-auto sm:self-start"
        >
          Começar meu treino
        </Link>

        <div className="mt-16 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Dumbbell, t: "Carga e reps", d: "Registre uma série em segundos." },
            { icon: Activity, t: "Cárdio", d: "Velocidade, inclinação e tempo." },
            { icon: History, t: "Histórico", d: "Veja sua evolução ao longo do tempo." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl bg-card p-5 shadow-card">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-semibold">{t}</p>
              <p className="text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
