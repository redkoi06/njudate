import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/site-shell";
import { requireAdminUser } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireAdminUser();

  if (!user.email) {
    redirect("/login");
  }

  return <AdminShell email={user.email}>{children}</AdminShell>;
}
