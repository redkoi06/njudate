import { SectionHeader, SurfaceCard } from "@/components/site-ui";
import { saveProfileAction } from "@/features/app/actions";
import { getCurrentProfile } from "@/features/app/data";
import { requireSessionUser } from "@/lib/auth/session";

import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireSessionUser();
  const profile = await getCurrentProfile(user.id);

  return (
    <SurfaceCard>
      <SectionHeader
        eyebrow="基本资料"
        title="完善你的基本信息"
        description="请严格按规定填写昵称、性别、年级、院系、所在校区和出生年份。资料更新会影响后续轮次报名和结果展示。"
      />
      <ProfileForm
        action={saveProfileAction}
        defaultValues={{
          nickname: profile.nickname,
          gender: profile.gender,
          grade: profile.grade,
          department: profile.department,
          campus: profile.campus,
          birthYear: profile.birthYear ? String(profile.birthYear) : "",
        }}
      />
    </SurfaceCard>
  );
}
