import { PublicShell } from "@/components/site-shell";
import { SectionHeader, SurfaceCard } from "@/components/site-ui";
import { getOptionalSessionUser } from "@/lib/auth/session";

const PRIVACY_POINTS = [
  "注册邮箱仅用于校内身份验证，不作为公开资料展示。",
  "问卷答案用于匹配和匹配理由生成，普通用户不会看到你的原始问卷全文。",
  "基础资料只会在匹配结果和联系流程中按规则显示必要字段。",
  "如果你发起“联系 TA”，平台会开放昵称与校内邮箱，并同步记录这次动作。",
  "你可以在设置页提交数据导出申请或删除账号申请。",
];

export default async function PrivacyPage() {
  const user = await getOptionalSessionUser();

  return (
    <PublicShell signedIn={Boolean(user)}>
      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8">
        <SurfaceCard className="space-y-8">
          <SectionHeader
            eyebrow="隐私说明"
            title="问卷、资料和联系信息都只在必要范围内被使用。"
            description="平台不会把你的问卷原样公开给其他用户，也不会提供公开搜索。所有信息都围绕校内准入、匹配生成、结果展示和必要的服务请求处理展开。"
          />
          <div className="grid gap-4">
            {PRIVACY_POINTS.map((item) => (
              <div key={item} className="border-border rounded-2xl border p-4 text-sm leading-7">
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </PublicShell>
  );
}
