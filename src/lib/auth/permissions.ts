export type AppRole = "user" | "admin";

export function canAccessAdminConsole(role: AppRole) {
  return role === "admin";
}
