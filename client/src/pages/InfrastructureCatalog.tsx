import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, ArrowLeft, Boxes, MapPin, Network, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

type Section = "interfaces" | "software" | "installations" | "locations";
const labels: Record<Section, string> = { interfaces: "Interfaces", software: "Logiciels", installations: "Installations", locations: "Localisations" };
const icons: Record<Section, typeof Network> = { interfaces: Network, software: Package, installations: Boxes, locations: MapPin };

export default function InfrastructureCatalog() {
  const { user, loading } = useAuth();
  const [section, setSection] = useState<Section>("interfaces");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const canWrite = ["admin", "it_manager", "systems_network_admin"].includes(user?.role ?? "");
  const utils = trpc.useUtils();
  const assets = trpc.infrastructure.assets.list.useQuery({ page: 1, pageSize: 100 });
  const interfaces = trpc.infrastructure.networkInterfaces.list.useQuery();
  const software = trpc.infrastructure.software.list.useQuery();
  const installations = trpc.infrastructure.installations.list.useQuery();
  const locations = trpc.infrastructure.locations.list.useQuery();
  const invalidateAll = () => { void utils.infrastructure.networkInterfaces.list.invalidate(); void utils.infrastructure.software.list.invalidate(); void utils.infrastructure.installations.list.invalidate(); void utils.infrastructure.locations.list.invalidate(); void utils.infrastructure.assets.get.invalidate(); };
  const reset = () => { setEditingId(null); setForm({}); invalidateAll(); };
  const createInterface = trpc.infrastructure.networkInterfaces.create.useMutation({ onSuccess: reset });
  const updateInterface = trpc.infrastructure.networkInterfaces.update.useMutation({ onSuccess: reset });
  const removeInterface = trpc.infrastructure.networkInterfaces.remove.useMutation({ onSuccess: reset });
  const createSoftware = trpc.infrastructure.software.create.useMutation({ onSuccess: reset });
  const updateSoftware = trpc.infrastructure.software.update.useMutation({ onSuccess: reset });
  const removeSoftware = trpc.infrastructure.software.remove.useMutation({ onSuccess: reset });
  const createInstallation = trpc.infrastructure.installations.create.useMutation({ onSuccess: reset });
  const updateInstallation = trpc.infrastructure.installations.update.useMutation({ onSuccess: reset });
  const removeInstallation = trpc.infrastructure.installations.remove.useMutation({ onSuccess: reset });
  const createLocation = trpc.infrastructure.locations.create.useMutation({ onSuccess: reset });
  const updateLocation = trpc.infrastructure.locations.update.useMutation({ onSuccess: reset });
  const removeLocation = trpc.infrastructure.locations.remove.useMutation({ onSuccess: reset });
  const activeMutation = useMemo(() => ({ createInterface, updateInterface, removeInterface, createSoftware, updateSoftware, removeSoftware, createInstallation, updateInstallation, removeInstallation, createLocation, updateLocation, removeLocation }), [createInterface, updateInterface, removeInterface, createSoftware, updateSoftware, removeSoftware, createInstallation, updateInstallation, removeInstallation, createLocation, updateLocation, removeLocation]);

  if (loading) return <div className="grid min-h-[50vh] place-items-center text-sm text-slate-400">Chargement de la session…</div>;
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const begin = (item: any) => { setEditingId(item.id); setForm(Object.fromEntries(Object.entries(item).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)]))); };
  const error = Object.values(activeMutation).find(mutation => mutation.error)?.error?.message;
  const pending = Object.values(activeMutation).some(mutation => mutation.isPending);
  const submit = () => {
    if (section === "interfaces") { const data = { assetId: Number(form.assetId), name: form.name, interfaceType: form.interfaceType || null, macAddress: form.macAddress || null, ipAddress: form.ipAddress || null, prefix: form.prefix || null, vlan: form.vlan ? Number(form.vlan) : null, speedMbps: form.speedMbps ? Number(form.speedMbps) : null, administrativeState: form.administrativeState || null, operationalState: form.operationalState || null, description: form.description || null }; editingId ? updateInterface.mutate({ id: editingId, data }) : createInterface.mutate(data); }
    if (section === "software") { const data = { name: form.name, vendor: form.vendor || null, version: form.version || null, category: form.category || null, license: form.license || null, status: form.status || "ACTIVE", description: form.description || null }; editingId ? updateSoftware.mutate({ id: editingId, data }) : createSoftware.mutate(data); }
    if (section === "installations") { const data = { assetId: Number(form.assetId), softwareId: Number(form.softwareId), installedVersion: form.installedVersion || null, installedAt: form.installedAt ? new Date(form.installedAt) : null, updatedAt: form.updatedAt ? new Date(form.updatedAt) : null, status: form.status || "ACTIVE" }; editingId ? updateInstallation.mutate({ id: editingId, data }) : createInstallation.mutate(data); }
    if (section === "locations") { const data = { name: form.name, kind: form.kind || "site", address: form.address || null, description: form.description || null }; editingId ? updateLocation.mutate({ id: editingId, data }) : createLocation.mutate(data); }
  };
  const remove = (id = editingId) => { if (!id) return; if (section === "interfaces") removeInterface.mutate({ id }); if (section === "software") removeSoftware.mutate({ id }); if (section === "installations") removeInstallation.mutate({ id }); if (section === "locations") removeLocation.mutate({ id }); };
  const items = section === "interfaces" ? interfaces.data ?? [] : section === "software" ? software.data ?? [] : section === "installations" ? installations.data ?? [] : locations.data ?? [];
  const ActiveIcon = icons[section];
  const fields: Record<Section, Array<[string, string]>> = { interfaces: [["assetId", "Asset parent *"], ["name", "Nom *"], ["interfaceType", "Type"], ["macAddress", "MAC"], ["ipAddress", "IP"], ["prefix", "Préfixe"], ["vlan", "VLAN"], ["speedMbps", "Vitesse Mbps"], ["administrativeState", "État administratif"], ["operationalState", "État opérationnel"], ["description", "Description"]], software: [["name", "Nom *"], ["vendor", "Éditeur"], ["version", "Version"], ["category", "Catégorie"], ["license", "Licence"], ["status", "Statut"], ["description", "Description"]], installations: [["assetId", "Asset *"], ["softwareId", "Logiciel *"], ["installedVersion", "Version installée"], ["installedAt", "Date d’installation"], ["updatedAt", "Date de mise à jour"], ["status", "Statut"]], locations: [["name", "Nom *"], ["kind", "Type de lieu"], ["address", "Adresse"], ["description", "Description"]] };
  const renderValue = (item: any) => section === "interfaces" ? `${item.name} · ${item.ipAddress || item.macAddress || "sans adresse"}` : section === "software" ? `${item.name} · ${item.version || "version non renseignée"}` : section === "installations" ? `Asset #${item.assetId} · Software #${item.softwareId}` : `${item.name} · ${item.kind}`;
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="eyebrow">INVENTAIRE / CATALOGUES</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Catalogues d’infrastructure</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Gestion détaillée des interfaces, logiciels, installations et localisations. Les états sont administratifs ; aucun monitoring n’est activé.</p></div><Link href="/infrastructure"><Button variant="outline" className="bg-white"><ArrowLeft className="mr-2 h-4 w-4" />Retour à l’inventaire</Button></Link></div>
    <div className="grid gap-2 md:grid-cols-4">{(Object.keys(labels) as Section[]).map(key => { const Icon = icons[key]; return <button key={key} onClick={() => { setSection(key); reset(); }} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${section === key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}><Icon className="h-4 w-4" /><span className="text-sm font-semibold">{labels[key]}</span></button>; })}</div>
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><p className="eyebrow">REGISTRE</p><h2 className="mt-2 text-xl font-semibold text-slate-950">{labels[section]}</h2></div><Badge variant="outline">{items.length} entrée{items.length > 1 ? "s" : ""}</Badge></div>{[interfaces, software, installations, locations][["interfaces", "software", "installations", "locations"].indexOf(section)]?.isError ? <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mr-2 inline h-4 w-4" />Impossible de charger le registre.</div> : items.length ? <div className="divide-y divide-slate-100">{items.map((item: any) => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-semibold text-slate-800">{renderValue(item)}</p><p className="mt-1 text-xs text-slate-400">ID #{item.id} · mis à jour dans le registre</p></div>{canWrite && <div className="flex gap-2"><Button variant="outline" size="sm" className="bg-white" onClick={() => begin(item)}><Pencil className="mr-1 h-3 w-3" />Modifier</Button><Button variant="outline" size="sm" className="bg-white text-red-600" onClick={() => remove(item.id)}><Trash2 className="mr-1 h-3 w-3" />Supprimer</Button></div>}</div>)}</div> : <div className="p-12 text-center"><ActiveIcon className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-medium text-slate-700">Aucun enregistrement</p><p className="mt-1 text-sm text-slate-400">Les entrées sont lues depuis la base ; aucun exemple n’est injecté.</p></div>}</section>
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="eyebrow">{editingId ? "MODIFICATION" : "NOUVELLE ENTRÉE"}</p><h2 className="mt-2 text-xl font-semibold text-slate-950">{labels[section]}</h2></div>{editingId && <Button variant="ghost" size="sm" onClick={reset}>Annuler</Button>}</div>{canWrite ? <div className="mt-5 space-y-3">{fields[section].map(([key, label]) => key === "assetId" && (section === "interfaces" || section === "installations") ? <select key={key} value={form[key] || ""} onChange={event => set(key, event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">{label}</option>{(assets.data?.items ?? []).map(asset => <option key={asset.id} value={asset.id}>{asset.assetTag} · {asset.displayName}</option>)}</select> : key === "softwareId" ? <select key={key} value={form[key] || ""} onChange={event => set(key, event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">{label}</option>{(software.data ?? []).map(item => <option key={item.id} value={item.id}>{item.name} · {item.version || "—"}</option>)}</select> : <Input key={key} type={key.endsWith("At") ? "datetime-local" : "text"} value={form[key] || ""} onChange={event => set(key, event.target.value)} placeholder={label} />)}{error && <p className="text-sm text-red-600">{error}</p>}<Button disabled={pending} onClick={submit} className="w-full bg-slate-950 text-white"><Plus className="mr-2 h-4 w-4" />{pending ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Créer"}</Button></div> : <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">Votre rôle est en lecture seule pour ce catalogue. Les contrôles d’autorisation sont exécutés côté serveur.</div>}</aside>
    </div>
  </div>;
}
