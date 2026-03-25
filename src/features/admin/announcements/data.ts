import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AdminAnnouncementAudience = "public" | "user" | "admin" | "all";
export type AdminAnnouncementStatus = "draft" | "published" | "archived";

export type AdminAnnouncementListItem = {
  archivedAt: string | null;
  audience: AdminAnnouncementAudience;
  body: string;
  createdAt: string;
  endsAt: string;
  eyebrow: string;
  id: string;
  publishedAt: string | null;
  startsAt: string;
  status: AdminAnnouncementStatus;
  title: string;
  updatedAt: string;
};

export async function listAnnouncements() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("announcements")
    .select(
      "id, title, body, eyebrow, audience, status, starts_at, ends_at, created_at, updated_at, published_at, archived_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    archivedAt: item.archived_at,
    audience: item.audience,
    body: item.body,
    createdAt: item.created_at,
    endsAt: item.ends_at,
    eyebrow: item.eyebrow,
    id: item.id,
    publishedAt: item.published_at,
    startsAt: item.starts_at,
    status: item.status,
    title: item.title,
    updatedAt: item.updated_at,
  })) satisfies AdminAnnouncementListItem[];
}

export async function getAnnouncementForEdit(announcementId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("announcements")
    .select(
      "id, title, body, eyebrow, audience, status, starts_at, ends_at, created_at, updated_at, published_at, archived_at",
    )
    .eq("id", announcementId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    archivedAt: data.archived_at,
    audience: data.audience,
    body: data.body,
    createdAt: data.created_at,
    endsAt: data.ends_at,
    eyebrow: data.eyebrow,
    id: data.id,
    publishedAt: data.published_at,
    startsAt: data.starts_at,
    status: data.status,
    title: data.title,
    updatedAt: data.updated_at,
  } satisfies AdminAnnouncementListItem;
}
