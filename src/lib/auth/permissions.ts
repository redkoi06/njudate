export type AppRole = "user" | "admin";

export function canAccessAdminConsole(role: AppRole) {
  return role === "admin";
}

export function getDefaultHomePathForRole(role: AppRole) {
  return role === "admin" ? "/admin" : "/app";
}
