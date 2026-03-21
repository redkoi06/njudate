import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/site-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  return <AppShell email={user.email}>{children}</AppShell>;
}
