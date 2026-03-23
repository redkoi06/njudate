import { PublicShell } from "@/components/site-shell";
import { SectionHeader, SurfaceCard } from "@/components/site-ui";
import { PRIVACY_PAGE_CONTENT } from "@/features/legal/content";
import { getOptionalSessionUser } from "@/lib/auth/session";

export default async function PrivacyPage() {
  const user = await getOptionalSessionUser();

  return (
    <PublicShell signedIn={Boolean(user)} activePublicNavHref="/privacy">
      <section className="mx-auto max-w-5xl px-5 pt-14 pb-10 md:px-8 md:pb-12">
        <SurfaceCard className="space-y-8">
          <SectionHeader
            eyebrow={PRIVACY_PAGE_CONTENT.eyebrow}
            title={PRIVACY_PAGE_CONTENT.title}
            description={PRIVACY_PAGE_CONTENT.description}
          />
          <div className="grid gap-4">
            {PRIVACY_PAGE_CONTENT.points.map((item) => (
              <div
                key={item}
                className="border-border rounded-2xl border p-4 text-sm leading-7"
              >
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </PublicShell>
  );
}
