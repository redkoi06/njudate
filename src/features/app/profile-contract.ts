export const PROFILE_GENDER_OPTIONS = ["男", "女"] as const;

export const PROFILE_GRADE_OPTIONS = [
  "大一",
  "大二",
  "大三",
  "大四",
  "研一",
  "研二",
  "研三",
  "博一",
  "博二",
  "博三",
  "博四",
  "博五及以上",
] as const;

export const PROFILE_CAMPUS_OPTIONS = [
  "鼓楼校区",
  "仙林校区",
  "苏州校区",
  "浦口校区",
] as const;

export const PROFILE_DEPARTMENT_OPTIONS = [
  "新生学院",
  "文学院",
  "历史学院",
  "哲学学院",
  "新闻传播学院",
  "法学院",
  "商学院",
  "外国语学院",
  "政府管理学院",
  "国际关系学院",
  "信息管理学院",
  "社会学院",
  "数学学院",
  "物理学院",
  "天文与空间科学学院",
  "化学学院",
  "化工学院",
  "计算机学院",
  "软件学院",
  "人工智能学院",
  "电子科学与工程学院",
  "现代工程与应用科学学院",
  "环境学院",
  "地球科学与工程学院",
  "地理与海洋科学学院",
  "大气科学学院",
  "南京赫尔辛基大气与地球系统科学学院（南赫学院）",
  "生命科学学院",
  "医学院",
  "工程管理学院",
  "匡亚明学院",
  "海外教育学院",
  "建筑与城市规划学院",
  "马克思主义学院",
  "艺术学院",
  "智能科学与技术学院",
  "智能软件与工程学院",
  "集成电路学院",
  "数字经济与管理学院",
  "能源与资源学院",
  "国家卓越工程师学院",
  "机器人与自动化学院",
  "未来技术学院",
  "前沿科学学院",
  "先进制造学院",
  "生物医学工程学院",
] as const;

const PROFILE_NON_FIRST_YEAR_DEPARTMENT_OPTIONS =
  PROFILE_DEPARTMENT_OPTIONS.filter((option) => option !== "新生学院");

export const PROFILE_SUMMARY_FIELDS = [
  { key: "nickname", label: "昵称" },
  { key: "gender", label: "性别" },
  { key: "grade", label: "年级" },
  { key: "department", label: "院系" },
  { key: "campus", label: "所在校区" },
  { key: "birthYear", label: "出生年份" },
] as const;

export type ProfileGender = (typeof PROFILE_GENDER_OPTIONS)[number];
export type ProfileGrade = (typeof PROFILE_GRADE_OPTIONS)[number];
export type ProfileCampus = (typeof PROFILE_CAMPUS_OPTIONS)[number];
export type ProfileDepartment = (typeof PROFILE_DEPARTMENT_OPTIONS)[number];
export type ProfileSummaryFieldKey = (typeof PROFILE_SUMMARY_FIELDS)[number]["key"];
export type AppEntryPath = "/app/profile" | "/app/questionnaire" | "/app/dashboard";

export type ProfileRecord = {
  nickname: string;
  gender: string;
  grade: string;
  department: string;
  campus: string;
  birthYear: number | null;
};

export type CounterpartSnapshot = {
  nickname: string | null;
  gender: ProfileGender | null;
  grade: ProfileGrade | null;
  department: ProfileDepartment | null;
  campus: ProfileCampus | null;
  birthYear: number | null;
};

function includesOption<T extends string>(
  options: readonly T[],
  value: string,
): value is T {
  return options.includes(value as T);
}

export function getBirthYearRange(currentYear = new Date().getFullYear()) {
  return {
    minBirthYear: currentYear - 30,
    maxBirthYear: currentYear - 18,
  };
}

export function normalizeDepartmentForGrade(
  grade: string,
  department: string,
) {
  return grade === "大一" ? "新生学院" : department;
}

export function getDepartmentOptionsForGrade(grade: string) {
  return grade === "大一"
    ? PROFILE_DEPARTMENT_OPTIONS
    : PROFILE_NON_FIRST_YEAR_DEPARTMENT_OPTIONS;
}

export function sanitizeDepartmentForGrade(
  grade: string,
  department: string,
) {
  const normalizedDepartment = normalizeDepartmentForGrade(grade, department);

  return getDepartmentOptionsForGrade(grade).some(
    (option) => option === normalizedDepartment,
  )
    ? normalizedDepartment
    : "";
}

export function isProfileCompleted(
  profile: ProfileRecord,
  currentYear = new Date().getFullYear(),
) {
  const normalizedDepartment = normalizeDepartmentForGrade(
    profile.grade,
    profile.department,
  );
  const { minBirthYear, maxBirthYear } = getBirthYearRange(currentYear);

  return Boolean(
    profile.nickname.trim() &&
      includesOption(PROFILE_GENDER_OPTIONS, profile.gender) &&
      includesOption(PROFILE_GRADE_OPTIONS, profile.grade) &&
      includesOption(PROFILE_DEPARTMENT_OPTIONS, normalizedDepartment) &&
      includesOption(PROFILE_CAMPUS_OPTIONS, profile.campus) &&
      typeof profile.birthYear === "number" &&
      Number.isInteger(profile.birthYear) &&
      profile.birthYear >= minBirthYear &&
      profile.birthYear <= maxBirthYear,
  );
}

export function isQuestionnaireCompletedStatus(
  status: "not_started" | "draft" | "submitted" | "updated",
) {
  return status === "submitted" || status === "updated";
}

export function getAppEntryPath(input: {
  profileCompleted: boolean;
  questionnaireCompleted: boolean;
}): AppEntryPath {
  if (!input.profileCompleted) {
    return "/app/profile";
  }

  if (!input.questionnaireCompleted) {
    return "/app/questionnaire";
  }

  return "/app/dashboard";
}

export function canAccessAppPath(pathname: string, input: {
  profileCompleted: boolean;
  questionnaireCompleted: boolean;
}) {
  if (!input.profileCompleted) {
    return pathname === "/app/profile";
  }

  if (!input.questionnaireCompleted) {
    return pathname === "/app/questionnaire";
  }

  return true;
}

export function parseCounterpartSnapshot(
  raw: unknown,
): CounterpartSnapshot | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const snapshot = {
    nickname: typeof record.nickname === "string" ? record.nickname : null,
    gender:
      typeof record.gender === "string" &&
      includesOption(PROFILE_GENDER_OPTIONS, record.gender)
        ? record.gender
        : null,
    grade:
      typeof record.grade === "string" &&
      includesOption(PROFILE_GRADE_OPTIONS, record.grade)
        ? record.grade
        : null,
    department:
      typeof record.department === "string" &&
      includesOption(PROFILE_DEPARTMENT_OPTIONS, record.department)
        ? record.department
        : null,
    campus:
      typeof record.campus === "string" &&
      includesOption(PROFILE_CAMPUS_OPTIONS, record.campus)
        ? record.campus
        : null,
    birthYear:
      typeof record.birth_year === "number" && Number.isInteger(record.birth_year)
        ? record.birth_year
        : typeof record.birthYear === "number" && Number.isInteger(record.birthYear)
          ? record.birthYear
          : null,
  } satisfies CounterpartSnapshot;

  return Object.values(snapshot).some((value) => value !== null) ? snapshot : null;
}
