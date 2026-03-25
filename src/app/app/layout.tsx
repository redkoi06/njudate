import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/site-shell";
import { requireAppUser } from "@/lib/auth/session";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireAppUser();

  if (!user.email) {
    redirect("/login");
  }

  return <AppShell email={user.email}>{children}</AppShell>;
}
