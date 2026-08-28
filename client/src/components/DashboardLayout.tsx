import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, AlertTriangle, Boxes, ClipboardList, FileKey2, LayoutDashboard, ListTree, LogOut, PanelLeft, ShieldCheck, Siren, Target, Users } from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Vue d’ensemble", path: "/" },
  { icon: Users, label: "Utilisateurs", path: "/users" },
  { icon: ShieldCheck, label: "Rôles & permissions", path: "/roles" },
  { icon: ClipboardList, label: "Journal d’audit", path: "/audit" },
  { icon: Boxes, label: "Infrastructure", path: "/infrastructure" },
  { icon: ListTree, label: "Catalogues", path: "/infrastructure/catalogues" },
  { icon: Activity, label: "Monitoring", path: "/monitoring" },
  { icon: Target, label: "Targets", path: "/monitoring/targets" },
  { icon: AlertTriangle, label: "Alerts", path: "/alerts" },
  { icon: Siren, label: "Incidents", path: "/incidents" },
  { icon: FileKey2, label: "Sauvegardes", path: "/backups", status: "PLANNED" },
];
const ROLE_LABELS: Record<string, string> = { admin: "Administrateur", systems_network_admin: "Administrateur systèmes/réseaux", technician: "Technicien", it_manager: "Responsable informatique", user: "Utilisateur" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(276);
  const { loading, user } = useAuth();
  const [oauthUnavailable, setOAuthUnavailable] = useState(false);
  useEffect(() => { const saved = localStorage.getItem("sidebar-width"); if (saved) setSidebarWidth(Number(saved)); }, []);
  useEffect(() => { localStorage.setItem("sidebar-width", String(sidebarWidth)); }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="console-grid grid min-h-screen place-items-center bg-[var(--canvas)] px-5 py-10"><div className="surface-panel w-full max-w-md px-7 py-9 text-center sm:px-10"><div className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--ink)] text-white"><ShieldCheck className="h-5 w-5" /></div><p className="eyebrow text-[var(--accent)]">IT INFRASTRUCTURE MANAGER</p><h1 className="mt-4 text-3xl font-semibold text-[var(--ink)]">Accès sécurisé</h1><p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[var(--ink-muted)]">Connectez-vous avec l’identité gérée par Manus OAuth pour accéder à la console.</p><Button onClick={() => { if (!startLogin()) setOAuthUnavailable(true); }} className="mt-8 h-11 w-full rounded-[var(--radius-md)] bg-[var(--ink)] text-white hover:bg-[#263746]">Ouvrir la session</Button>{oauthUnavailable && <p role="alert" className="mt-4 text-sm leading-5 text-[var(--danger)]">La connexion OAuth n’est pas configurée pour cette installation locale. L’interface est disponible, mais une configuration Manus est nécessaire pour ouvrir une session.</p>}</div></div>;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardContent user={user} setSidebarWidth={setSidebarWidth}>{children}</DashboardContent></SidebarProvider>;
}

function DashboardContent({ children, user }: { children: React.ReactNode; user: any; setSidebarWidth: (value: number) => void }) {
  const [location, setLocation] = useLocation();
  const { toggleSidebar } = useSidebar();
  const { logout } = useAuth();
  const canManageIdentity = ["admin", "it_manager"].includes(user.role);
  const initials = (user.name || user.email || "U").slice(0, 2).toUpperCase();

  return <><Sidebar className="border-r border-[var(--line)] bg-[var(--surface)]"><SidebarHeader className="border-b border-[var(--line)] px-5 py-5"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--ink)] text-white"><ShieldCheck className="h-4 w-4" /></div><div className="min-w-0"><p className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">Infrastructure</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">Control plane</p></div></div></SidebarHeader><SidebarContent className="px-3 py-5"><p className="mb-3 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--ink-faint)]">Console</p><SidebarMenu>{menuItems.map(item => { const disabled = item.path === "/users" && !canManageIdentity; return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} disabled={disabled} onClick={() => item.status ? undefined : setLocation(item.path)} className="h-10 rounded-[var(--radius-sm)] px-3 text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] data-[active=true]:bg-[var(--ink)] data-[active=true]:text-white"><item.icon className="h-4 w-4" /><span className="flex-1 text-left text-sm">{item.label}</span>{item.status && <span className="rounded-[4px] bg-[var(--surface-subtle)] px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wide text-[var(--ink-faint)]">{item.status}</span>}</SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu></SidebarContent><SidebarFooter className="border-t border-[var(--line)] p-4"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] p-2 text-left hover:bg-[var(--surface-subtle)]"><Avatar className="h-9 w-9"><AvatarFallback className="bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">{initials}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[var(--ink)]">{user.name || "Compte utilisateur"}</span><span className="block truncate text-xs text-[var(--ink-muted)]">{ROLE_LABELS[user.role] || user.role}</span></span></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuItem onClick={() => void logout()} className="text-[var(--danger)]"><LogOut className="mr-2 h-4 w-4" />Déconnexion</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><SidebarInset className="bg-[var(--canvas)]"><header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-[var(--line)] bg-[var(--canvas)]/95 px-5 backdrop-blur md:px-8"><SidebarTrigger className="md:hidden" /><button aria-label="Réduire la navigation" onClick={toggleSidebar} className="hidden rounded-[var(--radius-sm)] p-2 text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] md:block"><PanelLeft className="h-4 w-4" /></button><div className="ml-auto flex items-center gap-3"><span className="hidden font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)] sm:block">Session protégée</span><span aria-label="Session active" className="h-2 w-2 rounded-full bg-[var(--success)]" /></div></header><main className="mx-auto w-full max-w-[1440px] p-5 md:p-8">{children}</main></SidebarInset></>;
}
