import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuditPage from "./pages/Audit";
import Home from "./pages/Home";
import Infrastructure from "./pages/Infrastructure";
import InfrastructureCatalog from "./pages/InfrastructureCatalog";
import RolesPage from "./pages/Roles";
import UsersPage from "./pages/Users";

function Router() {
  return <DashboardLayout><Switch><Route path="/" component={Home} /><Route path="/users" component={UsersPage} /><Route path="/roles" component={RolesPage} /><Route path="/audit" component={AuditPage} /><Route path="/infrastructure" component={Infrastructure} />
      <Route path="/infrastructure/catalogues" component={InfrastructureCatalog} /><Route path="/monitoring"><PlannedPage title="Monitoring" description="Les métriques réelles seront connectées avec un agent/exporter et un moteur de collecte." /></Route><Route path="/backups"><PlannedPage title="Sauvegardes" description="Le suivi des jobs de sauvegarde sera ajouté après définition du connecteur de collecte." /></Route><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></DashboardLayout>;
}
function PlannedPage({ title, description }: { title: string; description: string }) { return <section className="py-10"><span className="status status-planned">PLANNED</span><h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1><p className="mt-3 max-w-xl text-slate-500">{description}</p></section>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
