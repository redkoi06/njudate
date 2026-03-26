import { PublicShell } from "@/components/site-shell";
import { SectionHeader, SurfaceCard } from "@/components/site-ui";
import { getOptionalSessionUser } from "@/lib/auth/session";

export default async function AboutPage() {
  const user = await getOptionalSessionUser();

  return (
    <PublicShell signedIn={Boolean(user)} activePublicNavHref="/about">
      <section className="mx-auto max-w-5xl px-5 pt-14 pb-10 md:px-8 md:pb-12">
        <SurfaceCard className="space-y-10">
          <SectionHeader
            eyebrow="关于平台"
            title="Where it comes?"
            description="TO BE CONTINUE..."
          />
        </SurfaceCard>
      </section>
    </PublicShell>
  );
}
