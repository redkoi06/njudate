import { Button, Field, SectionHeader, SurfaceCard, TextArea } from "@/components/site-ui";
import { saveProfileAction } from "@/features/app/actions";
import { getCurrentProfile } from "@/features/app/data";
import { requireSessionUser } from "@/lib/auth/session";

export default async function ProfilePage() {
  const user = await requireSessionUser();
  const profile = await getCurrentProfile(user.id);

  return (
    <SurfaceCard>
      <SectionHeader
        eyebrow="基本资料"
        title="维护当前参与匹配所需的基础信息"
        description="邮箱始终以登录邮箱为准，不在这里编辑。资料更新会影响后续批次报名和结果展示。"
      />
      <form action={saveProfileAction} className="mt-8 grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field name="nickname" label="昵称" defaultValue={profile.nickname} required />
          <Field name="grade" label="年级" defaultValue={profile.grade} required />
          <Field
            name="department"
            label="院系"
            defaultValue={profile.department}
            required
          />
          <Field name="major" label="专业" defaultValue={profile.major} required />
          <Field name="gender" label="性别" defaultValue={profile.gender} required />
          <Field
            name="targetPreference"
            label="匹配期待"
            defaultValue={profile.targetPreference}
            required
          />
        </div>
        <TextArea
          name="bio"
          label="个人简介"
          defaultValue={profile.bio}
          hint="简短说明你的日常气质、边界感或相处方式。"
        />
        <TextArea
          name="interests"
          label="兴趣标签"
          defaultValue={profile.interests.join("，")}
          hint="可用逗号、顿号或换行分隔，最多保留 8 个。"
        />
        <label className="flex items-center gap-3 text-sm">
          <input
            name="showNickname"
            type="checkbox"
            defaultChecked={profile.showNickname}
          />
          匹配结果页可以展示我的昵称
        </label>
        <div className="flex justify-end">
          <Button type="submit">保存资料</Button>
        </div>
      </form>
    </SurfaceCard>
  );
}
