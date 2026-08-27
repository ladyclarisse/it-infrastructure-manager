import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { Activity, Boxes, ClipboardList, FileKey2, LayoutDashboard, ListTree, LogOut, PanelLeft, ShieldCheck, Target, Users } from "lucide-react";
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
  { icon: FileKey2, label: "Sauvegardes", path: "/backups", status: "PLANNED" },
];
const ROLE_LABELS: Record<string, string> = { admin: "Administrateur", systems_network_admin: "Administrateur systèmes/réseaux", technician: "Technicien", it_manager: "Responsable informatique", user: "Utilisateur" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(276);
  const { loading, user } = useAuth();
  useEffect(() => { const saved = localStorage.getItem("sidebar-width"); if (saved) setSidebarWidth(Number(saved)); }, []);
  useEffect(() => { localStorage.setItem("sidebar-width", String(sidebarWidth)); }, [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="min-h-screen grid place-items-center bg-[#f5f7fb]"><div className="max-w-md rounded-3xl border bg-white p-10 text-center shadow-xl"><div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white"><ShieldCheck className="h-7 w-7" /></div><p className="eyebrow">IT INFRASTRUCTURE MANAGER</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Accès sécurisé</h1><p className="mt-3 text-sm leading-6 text-slate-500">Connectez-vous avec l’identité gérée par Manus OAuth pour accéder à la console.</p><Button onClick={() => startLogin()} className="mt-8 w-full bg-[#0f172a] hover:bg-[#1e293b]">Ouvrir la session</Button></div></div>;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardContent user={user} setSidebarWidth={setSidebarWidth}>{children}</DashboardContent></SidebarProvider>;
}

function DashboardContent({ children, user, setSidebarWidth }: { children: React.ReactNode; user: any; setSidebarWidth: (value: number) => void }) {
  const [location, setLocation] = useLocation();
  const { toggleSidebar } = useSidebar();
  const { logout } = useAuth();
  const canManageIdentity = ["admin", "it_manager"].includes(user.role);
  const initials = (user.name || user.email || "U").slice(0, 2).toUpperCase();
  return <><Sidebar className="border-r border-slate-200 bg-white"><SidebarHeader className="border-b border-slate-100 px-5 py-5"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white"><ShieldCheck className="h-5 w-5" /></div><div className="min-w-0"><p className="text-sm font-semibold tracking-tight text-slate-950">Infrastructure</p><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Control plane</p></div></div></SidebarHeader><SidebarContent className="px-3 py-5"><p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Console</p><SidebarMenu>{menuItems.map(item => { const disabled = item.path === "/users" && !canManageIdentity; return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} disabled={disabled} onClick={() => item.status ? undefined : setLocation(item.path)} className="h-11 rounded-xl px-3 text-slate-600 data-[active=true]:bg-slate-950 data-[active=true]:text-white"><item.icon className="h-4 w-4" /><span className="flex-1 text-left">{item.label}</span>{item.status && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-slate-400">{item.status}</span>}</SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu></SidebarContent><SidebarFooter className="border-t border-slate-100 p-4"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50"><Avatar className="h-9 w-9"><AvatarFallback className="bg-slate-200 text-xs font-semibold text-slate-700">{initials}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{user.name || "Compte utilisateur"}</span><span className="block truncate text-xs text-slate-400">{ROLE_LABELS[user.role] || user.role}</span></span></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuItem onClick={() => void logout()} className="text-red-600"><LogOut className="mr-2 h-4 w-4" />Déconnexion</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><SidebarInset className="bg-[#f5f7fb]"><header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-[#f5f7fb]/90 px-6 backdrop-blur"><SidebarTrigger className="md:hidden" /><button onClick={toggleSidebar} className="hidden rounded-lg p-2 text-slate-400 hover:bg-white md:block"><PanelLeft className="h-4 w-4" /></button><div className="ml-auto flex items-center gap-3"><span className="hidden text-xs text-slate-400 sm:block">Session protégée</span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div></header><main className="mx-auto w-full max-w-[1440px] p-5 md:p-8">{children}</main></SidebarInset></>;
}
