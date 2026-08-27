import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowUpRight, Database, KeyRound, ShieldCheck, Users } from "lucide-react";

const cards = [
  { label: "Utilisateurs", value: "API réelle", icon: Users, tone: "text-[var(--accent)] bg-[var(--accent-soft)]" },
  { label: "RBAC serveur", value: "IMPLEMENTED", icon: KeyRound, tone: "text-[var(--success)] bg-[#e8f4ec]" },
  { label: "Audit des actions", value: "IMPLEMENTED", icon: ShieldCheck, tone: "text-[var(--success)] bg-[#e8f4ec]" },
  { label: "Monitoring", value: "PLANNED", icon: Activity, tone: "text-[var(--warning)] bg-[#fff8e6]" },
];

const foundations = [
  { label: "Session et identité", status: "TESTED", detail: "OAuth, cookie signé, déconnexion" },
  { label: "Contrôle d’accès", status: "IMPLEMENTED", detail: "Vérification côté API par rôle" },
  { label: "Persistance et audit", status: "IMPLEMENTED", detail: "Utilisateurs, rôles, permissions, journaux" },
];

export default function Home() {
  const { user } = useAuth();
  return <div className="space-y-8">
    <section className="console-grid relative overflow-hidden rounded-[var(--radius-lg)] border border-[#243745] bg-[var(--ink)] px-6 py-8 text-white md:px-9 md:py-10">
      <div className="absolute right-8 top-8 hidden font-mono text-[10px] uppercase tracking-[0.16em] text-[#7ca8ad] md:block">SYS / 01</div>
      <div className="relative max-w-2xl"><p className="eyebrow text-[#8bd0d0]">CONTROL PLANE / ÉTAPE 1</p><h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">Bonjour, {user?.name?.split(" ")[0] || "opérateur"}.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-[#c3d0d8] md:text-base">Une base fiable pour administrer les identités aujourd’hui et connecter l’infrastructure demain. Chaque capacité expose son état réel.</p><div className="mt-7 flex flex-wrap gap-2"><Badge className="rounded-[var(--radius-sm)] border border-[#4a7377] bg-transparent px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-[#a8dddd]">IMPLEMENTED · AUTH + RBAC</Badge><Badge className="rounded-[var(--radius-sm)] border border-[#3b4e5c] bg-transparent px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-[#c3d0d8]">MANUS OAUTH</Badge></div></div>
    </section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <Card key={card.label} className="surface-panel shadow-none"><CardContent className="p-5"><div className="flex items-start justify-between"><div className={`grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] ${card.tone}`}><card.icon className="h-4 w-4" /></div><ArrowUpRight className="h-4 w-4 text-[var(--ink-faint)]" /></div><p className="mt-6 text-sm text-[var(--ink-muted)]">{card.label}</p><p className="mt-1 font-mono text-sm font-medium tracking-tight text-[var(--ink)]">{card.value}</p></CardContent></Card>)}</section>
    <section className="grid gap-5 lg:grid-cols-[1.35fr_.85fr]"><Card className="surface-panel shadow-none"><CardHeader className="border-b border-[var(--line)] px-6 py-5"><CardTitle className="text-base text-[var(--ink)]">Fondations opérationnelles</CardTitle></CardHeader><CardContent className="divide-y divide-[var(--line)] px-6 py-0">{foundations.map(item => <div key={item.label} className="flex items-center gap-4 py-5"><div className="h-2 w-2 shrink-0 rounded-full bg-[var(--success)]" /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-[var(--ink)]">{item.label}</p><p className="mt-1 text-xs text-[var(--ink-muted)]">{item.detail}</p></div><span className={`status ${item.status === "TESTED" ? "status-tested" : "status-implemented"}`}>{item.status}</span></div>)}</CardContent></Card><Card className="surface-panel shadow-none"><CardHeader className="border-b border-[var(--line)] px-6 py-5"><CardTitle className="flex items-center gap-2 text-base text-[var(--ink)]"><Database className="h-4 w-4 text-[var(--accent)]" />Périmètre suivant</CardTitle></CardHeader><CardContent className="px-6 py-5"><p className="text-sm leading-6 text-[var(--ink-muted)]">Les modules d’infrastructure restent explicitement planifiés tant qu’aucune collecte réelle n’est branchée.</p><div className="mt-5 border-l-2 border-[var(--accent)] bg-[var(--surface-subtle)] p-4 text-xs leading-5 text-[var(--ink-muted)]">Les exports seront stockés hors base via le stockage objet lorsque le module sera activé.</div></CardContent></Card></section>
  </div>;
}
