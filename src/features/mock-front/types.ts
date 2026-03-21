export type Role = "guest" | "user" | "admin";

export type DemoPresetId =
  | "visitor"
  | "new_user"
  | "draft_questionnaire"
  | "ready_to_join"
  | "waiting_result"
  | "matched"
  | "contacted"
  | "no_match"
  | "admin_full"
  | "admin_empty";

export type QuestionnaireStatus = "not_started" | "draft" | "submitted";
export type WeeklyParticipationStatus = "not_joined" | "joined" | "locked";
export type LatestMatchStatus = "waiting" | "matched" | "no_match";
export type ContactStatus = "idle" | "contacted";
export type AdminDataMode = "filled" | "empty";
export type MatchRecordStatus =
  | "waiting"
  | "matched"
  | "contacted"
  | "no_match"
  | "archived";

export type QuestionKind = "text" | "single" | "multiple" | "scale";
export type AnswerValue = string | string[] | number;
export type QuestionnaireAnswers = Record<string, AnswerValue>;

export interface MockProfile {
  nickname: string;
  email: string;
  department: string;
  major: string;
  grade: string;
  gender: string;
  targetPreference: string;
  bio: string;
  interests: string[];
  showNickname: boolean;
  publicFields: {
    department: boolean;
    grade: boolean;
    bio: boolean;
    interests: boolean;
  };
}

export interface UserSettings {
  notifications: {
    matchResult: boolean;
    contactTrigger: boolean;
    weeklyReminder: boolean;
    platformDigest: boolean;
  };
  privacy: {
    showDepartment: boolean;
    showGrade: boolean;
    allowDirectContact: boolean;
  };
  accountState: "active" | "paused" | "delete_requested";
  exportRequested: boolean;
}

export interface DemoState {
  role: Role;
  pendingEmail: string;
  profileCompleted: boolean;
  questionnaireStatus: QuestionnaireStatus;
  weeklyParticipation: WeeklyParticipationStatus;
  latestMatchStatus: LatestMatchStatus;
  contactStatus: ContactStatus;
  adminDataMode: AdminDataMode;
  profile: MockProfile;
  questionnaireAnswers: QuestionnaireAnswers;
  lastQuestionnaireSavedAt: string | null;
  settings: UserSettings;
}

export interface QuestionDefinition {
  id: string;
  order: number;
  kind: QuestionKind;
  prompt: string;
  helper?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  scaleLeftLabel?: string;
  scaleRightLabel?: string;
}

export interface QuestionSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  questions: QuestionDefinition[];
}

export interface MatchRecord {
  id: string;
  batchLabel: string;
  publishedAt: string;
  status: MatchRecordStatus;
  score?: number;
  counterpartName?: string;
  counterpartDepartment?: string;
  counterpartGrade?: string;
  preview: string;
  tags: string[];
  reasons?: string[];
  sharedSignals?: string[];
  highlights?: Array<{
    label: string;
    value: string;
  }>;
  contactEmail?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "success" | "warning";
  timestamp: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  detail: string;
  eyebrow: string;
}

export interface AdminUser {
  id: string;
  nickname: string;
  emailMask: string;
  department: string;
  grade: string;
  joinedAt: string;
  questionnaireComplete: boolean;
  participatedThisWeek: boolean;
  participationCount: number;
  status: "active" | "restricted" | "paused";
}

export interface QuestionBankItem {
  id: string;
  sectionId: string;
  type: QuestionKind;
  prompt: string;
  state: "published" | "draft";
  responseCount: number;
}

export interface MatchBatch {
  id: string;
  label: string;
  dateRange: string;
  signupDeadline: string;
  publishTime: string;
  participants: number;
  matchedPairs: number | null;
  unmatchedUsers: number | null;
  contactTriggers: number | null;
  status: "open" | "processing" | "completed";
}

export interface Consultation {
  id: string;
  sender: string;
  topic: string;
  message: string;
  createdAt: string;
  status: "pending" | "replied" | "resolved";
  priority: "normal" | "urgent";
  reply?: string;
  replyAt?: string;
}

export interface ContactFormInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}
