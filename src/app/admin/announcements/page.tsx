import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  FlashToast,
  Field,
  SectionHeader,
  SelectField,
  SurfaceCard,
  TextArea,
} from "@/components/site-ui";
import {
  archiveAnnouncementAction,
  publishAnnouncementAction,
  saveAnnouncementDraftAction,
} from "@/features/admin/announcements/actions";
import {
  getAnnouncementForEdit,
  listAnnouncements,
} from "@/features/admin/announcements/data";
import { formatDateTime, formatDateTimeInputValue } from "@/lib/site";
import { isUuid } from "@/lib/uuid";

function getAnnouncementStatusBadgeTone(status: "draft" | "published" | "archived") {
  return status === "published" ? "success" : "soft";
}

function getAudienceLabel(audience: "public" | "user" | "admin" | "all") {
  switch (audience) {
    case "public":
      return "公开";
    case "user":
      return "用户";
    case "admin":
      return "管理员";
    case "all":
      return "全体";
  }
}

const NON_DRAFT_EDIT_ERROR_MESSAGE = "只有 draft 公告允许进入编辑状态。";

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const editId =
    typeof resolvedSearchParams?.edit === "string" ? resolvedSearchParams.edit : "";
  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";
  const hasValidEditId = !editId || isUuid(editId);

  const [announcements, editingAnnouncement] = await Promise.all([
    listAnnouncements(),
    hasValidEditId && editId
      ? getAnnouncementForEdit(editId)
      : Promise.resolve(null),
  ]);
  const canEditAnnouncement = editingAnnouncement?.status === "draft";
  const pageError =
    (hasValidEditId ? error : "公告编辑链接无效。") ||
    (editId && editingAnnouncement && !canEditAnnouncement
      ? NON_DRAFT_EDIT_ERROR_MESSAGE
      : "");

  return (
    <div className="grid gap-6">
      <FlashToast message={pageError} />
      <SurfaceCard>
        <SectionHeader
          eyebrow="公告后台"
          title="维护平台公告"
          description="公告采用单页维护：先保存为 draft，再按需要发布；已发布公告只能归档。"
          action={
            canEditAnnouncement ? (
              <ButtonLink href="/admin/announcements" tone="ghost">
                取消编辑
              </ButtonLink>
            ) : null
          }
        />
        <form action={saveAnnouncementDraftAction} className="mt-8 grid gap-5">
          {canEditAnnouncement ? (
            <input
              type="hidden"
              name="announcementId"
              value={editingAnnouncement.id}
            />
          ) : null}
          <div className="grid gap-5 lg:grid-cols-2">
            <Field
              name="title"
              label="公告标题"
              defaultValue={canEditAnnouncement ? editingAnnouncement.title : ""}
              required
            />
            <Field
              name="eyebrow"
              label="公告眉题"
              defaultValue={canEditAnnouncement ? editingAnnouncement.eyebrow : ""}
              required
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <SelectField
              name="audience"
              label="公告受众"
              defaultValue={canEditAnnouncement ? editingAnnouncement.audience : "all"}
              required
            >
              <option value="all">全体</option>
              <option value="public">公开访客</option>
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </SelectField>
            <Field
              name="startsAt"
              label="开始时间"
              type="datetime-local"
              defaultValue={formatDateTimeInputValue(
                canEditAnnouncement ? editingAnnouncement.startsAt : null,
              )}
              required
            />
            <Field
              name="endsAt"
              label="结束时间"
              type="datetime-local"
              defaultValue={formatDateTimeInputValue(
                canEditAnnouncement ? editingAnnouncement.endsAt : null,
              )}
              required
            />
          </div>
          <TextArea
            name="body"
            label="公告正文"
            defaultValue={canEditAnnouncement ? editingAnnouncement.body : ""}
          />
          <div className="flex justify-end">
            <Button type="submit" tone="soft">
              {canEditAnnouncement ? "保存未发布公告" : "新建 draft 公告"}
            </Button>
          </div>
        </form>
      </SurfaceCard>

      {announcements.length > 0 ? (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <SurfaceCard key={announcement.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-muted-foreground text-xs tracking-[0.2em]">
                      {announcement.eyebrow}
                    </p>
                    <Badge tone={getAnnouncementStatusBadgeTone(announcement.status)}>
                      {announcement.status}
                    </Badge>
                    <Badge>{getAudienceLabel(announcement.audience)}</Badge>
                  </div>
                  <h2 className="mt-3 text-2xl">{announcement.title}</h2>
                  <p className="text-secondary-foreground/80 mt-3 whitespace-pre-line text-sm leading-7">
                    {announcement.body}
                  </p>
                  <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
                    生效时间：{formatDateTime(announcement.startsAt)} -{" "}
                    {formatDateTime(announcement.endsAt)}。
                  </p>
                  <p className="text-secondary-foreground/80 mt-2 text-sm leading-7">
                    最近更新时间：{formatDateTime(announcement.updatedAt)}。
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  {announcement.status === "draft" ? (
                    <>
                      <ButtonLink
                        href={`/admin/announcements?edit=${announcement.id}`}
                        tone="soft"
                      >
                        编辑
                      </ButtonLink>
                      <form action={publishAnnouncementAction}>
                        <input
                          type="hidden"
                          name="announcementId"
                          value={announcement.id}
                        />
                        <Button type="submit">发布</Button>
                      </form>
                    </>
                  ) : null}
                  {announcement.status === "published" ? (
                    <form action={archiveAnnouncementAction}>
                      <input
                        type="hidden"
                        name="announcementId"
                        value={announcement.id}
                      />
                      <Button tone="soft" type="submit">
                        归档
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="还没有公告"
          description="先新建一个 draft 公告，再决定何时发布。"
        />
      )}
    </div>
  );
}
