import { createAuditLog, getRoles, listAuditLogs } from "../db";
import { ROLE_SLUGS } from "../_core/trpc";

export const MONITORING_PERMISSION_CATALOG = [
  { slug: "monitoring.read", label: "Lire le monitoring" },
  { slug: "monitoring.create", label: "Créer une target" },
  { slug: "monitoring.update", label: "Modifier une target" },
  { slug: "monitoring.delete", label: "Supprimer une target" },
  { slug: "monitoring.metrics", label: "Lire les métriques" },
] as const;

export const ROLE_CATALOG = [
  { slug: ROLE_SLUGS.ADMIN, label: "Administrateur", description: "Accès complet à la console." },
  { slug: ROLE_SLUGS.SYSTEMS_NETWORK_ADMIN, label: "Administrateur systèmes/réseaux", description: "Gestion de l’infrastructure et du monitoring." },
  { slug: ROLE_SLUGS.TECHNICIAN, label: "Technicien", description: "Gestion opérationnelle des équipements et tickets." },
  { slug: ROLE_SLUGS.IT_MANAGER, label: "Responsable informatique", description: "Supervision globale et reporting." },
  { slug: ROLE_SLUGS.USER, label: "Utilisateur", description: "Accès limité à ses équipements et tickets." },
] as const;

export async function getRoleCatalog() {
  const persisted = await getRoles();
  return persisted.length ? persisted : ROLE_CATALOG;
}
export async function recordAuthEvent(actorUserId: number, action: "AUTH_SESSION_CHECK" | "AUTH_LOGOUT", req?: { ip?: string; get?: (name: string) => string | undefined }) {
  return createAuditLog({ actorUserId, action, targetType: "user", targetId: String(actorUserId), ipAddress: req?.ip, userAgent: req?.get?.("user-agent") });
}
export async function getRecentAudit(limit: number) { return listAuditLogs(limit); }
