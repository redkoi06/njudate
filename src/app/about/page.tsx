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
            title="平台缘起与开源"
            description="我们的平台灵感来源于 sjtudate.com，在此真诚感谢 SJTU Date 团队带来的启发。我们相信，技术的价值不仅在于实现产品，也在于分享与传递，因此项目代码将保持开源，也期待与更多有相似想法的同学交流合作。若有外校同学希望在本校搭建类似平台，欢迎点击“联系我们”，通过邮箱与我们取得联系，我们将无偿提供代码分享与技术支持。"
          />
        </SurfaceCard>
      </section>
    </PublicShell>
  );
}
