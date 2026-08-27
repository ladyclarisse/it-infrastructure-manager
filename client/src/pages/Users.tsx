import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, UserRound, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const roles = [
  ["admin", "Administrateur"],
  ["systems_network_admin", "Administrateur systèmes/réseaux"],
  ["technician", "Technicien"],
  ["it_manager", "Responsable informatique"],
  ["user", "Utilisateur"],
] as const;
const roleLabel = Object.fromEntries(roles);
export default function UsersPage() {
  const [search, setSearch] = useState("");
  const users = trpc.users.list.useQuery({ search: search || undefined });
  const update = trpc.users.updateAccess.useMutation({ onSuccess: () => { toast.success("Accès utilisateur mis à jour"); void users.refetch(); }, onError: error => toast.error(error.message) });
  return <div className="space-y-7"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow">IDENTITY / ACCESS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Utilisateurs</h1><p className="mt-2 text-sm text-slate-500">Gérez les accès avec une vérification appliquée côté API.</p></div><div className="flex items-center gap-2 text-xs text-slate-400"><span className="status status-implemented">IMPLEMENTED</span> {users.data?.length ?? 0} comptes visibles</div></div><Card className="border-0 shadow-sm"><CardHeader className="gap-4 border-b border-slate-100 md:flex-row md:items-center md:justify-between"><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4 text-blue-600" />Répertoire d’identité</CardTitle><div className="relative w-full md:w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher nom, email, openId" className="border-slate-200 pl-9 text-sm" /></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-6 py-3 font-medium">Identité</th><th className="px-6 py-3 font-medium">Rôle</th><th className="px-6 py-3 font-medium">Statut</th><th className="px-6 py-3 font-medium">Dernière connexion</th><th className="px-6 py-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{users.isLoading ? <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Chargement depuis l’API…</td></tr> : users.data?.map(user => <tr key={user.id} className="hover:bg-slate-50/70"><td className="px-6 py-4"><p className="font-medium text-slate-800">{user.name || "Sans nom"}</p><p className="mt-1 text-xs text-slate-400">{user.email || user.openId}</p></td><td className="px-6 py-4"><select value={user.role} disabled={update.isPending} onChange={event => update.mutate({ userId: user.id, role: event.target.value as any })} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-200">{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td className="px-6 py-4"><Badge variant="outline" className={user.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>{user.status === "active" ? "ACTIVE" : "DISABLED"}</Badge></td><td className="px-6 py-4 text-xs text-slate-500">{new Date(user.lastSignedIn).toLocaleString("fr-FR")}</td><td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" disabled={update.isPending} onClick={() => update.mutate({ userId: user.id, status: user.status === "active" ? "disabled" : "active" })} className={user.status === "active" ? "text-slate-500 hover:text-red-600" : "text-emerald-600"}><UserX className="mr-2 h-4 w-4" />{user.status === "active" ? "Désactiver" : "Réactiver"}</Button></td></tr>)}{!users.isLoading && !users.data?.length && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Aucun utilisateur correspondant.</td></tr>}</tbody></table></div></CardContent></Card><p className="text-xs text-slate-400">Les rôles sont contrôlés par le serveur. Masquer une action dans l’interface ne constitue pas une mesure de sécurité.</p></div>;
}
