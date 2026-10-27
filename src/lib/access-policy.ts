import type { AccessPolicy } from "@/types";

export interface Principal { authenticated: boolean; roles: readonly string[] }
export const anonymousPrincipal: Principal = { authenticated: false, roles: [] };

/** UI policy only. ASP.NET Core must independently enforce every protected endpoint. */
export function canAccess(principal: Principal, policy: AccessPolicy) {
  if (policy === "public") return true;
  if (!principal.authenticated) return false;
  if (principal.roles.includes("admin")) return true;
  return policy === "student" ? principal.roles.includes("student") : principal.roles.includes("union_staff");
}

export function loginPreviewUrl(returnTo: string) {
  const safePath = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/journey";
  return `/login?returnTo=${encodeURIComponent(safePath)}`;
}
