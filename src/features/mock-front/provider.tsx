"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  buildPresetState,
  createInitialDemoState,
  getQuestionnairePreset,
  isProfileReady,
} from "@/features/mock-front/data";
import type {
  AdminDataMode,
  ContactStatus,
  DemoPresetId,
  DemoState,
  MockProfile,
  QuestionnaireAnswers,
  QuestionnaireStatus,
  UserSettings,
  WeeklyParticipationStatus,
} from "@/features/mock-front/types";

const STORAGE_KEY = "njudate-demo-state";

type DemoAppContextValue = {
  ready: boolean;
  state: DemoState;
  applyPreset: (preset: DemoPresetId) => void;
  beginEmailVerification: (email: string) => void;
  completeEmailVerification: () => void;
  enterAdmin: () => void;
  logout: () => void;
  updateProfile: (updates: Partial<MockProfile>) => void;
  saveQuestionnaireDraft: (answers: QuestionnaireAnswers) => void;
  submitQuestionnaire: (answers: QuestionnaireAnswers) => void;
  setQuestionnaireStatus: (status: QuestionnaireStatus) => void;
  setWeeklyParticipation: (status: WeeklyParticipationStatus) => void;
  setContactStatus: (status: ContactStatus) => void;
  setLatestMatchStatus: (status: DemoState["latestMatchStatus"]) => void;
  updateSettings: (
    section: keyof UserSettings,
    key: string,
    value: boolean | UserSettings["accountState"],
  ) => void;
  setAdminDataMode: (mode: AdminDataMode) => void;
};

const DemoAppContext = createContext<DemoAppContextValue | null>(null);

function cloneState(state: DemoState): DemoState {
  return {
    ...state,
    profile: {
      ...state.profile,
      interests: [...state.profile.interests],
      publicFields: { ...state.profile.publicFields },
    },
    questionnaireAnswers: { ...state.questionnaireAnswers },
    settings: {
      ...state.settings,
      notifications: { ...state.settings.notifications },
      privacy: { ...state.settings.privacy },
    },
  };
}

export function DemoAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createInitialDemoState);
  const [hydrated, setHydrated] = useState(false);

  const ready = true;

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      setHydrated(true);
      return;
    }

    try {
      setState(cloneState(JSON.parse(saved) as DemoState));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const value: DemoAppContextValue = {
    ready,
    state,
    applyPreset(preset) {
      setState((current) => buildPresetState(current, preset));
    },
    beginEmailVerification(email) {
      setState((current) => ({
        ...current,
        pendingEmail: email,
      }));
    },
    completeEmailVerification() {
      setState((current) => ({
        ...current,
        role: "user",
        profile: {
          ...current.profile,
          email: current.pendingEmail || current.profile.email,
        },
      }));
    },
    enterAdmin() {
      setState((current) => ({
        ...current,
        role: "admin",
      }));
    },
    logout() {
      setState((current) => ({
        ...current,
        role: "guest",
        pendingEmail: "",
      }));
    },
    updateProfile(updates) {
      setState((current) => {
        const nextProfile = {
          ...current.profile,
          ...updates,
        };

        return {
          ...current,
          profile: nextProfile,
          profileCompleted: isProfileReady(nextProfile),
        };
      });
    },
    saveQuestionnaireDraft(answers) {
      setState((current) => ({
        ...current,
        questionnaireStatus: "draft",
        questionnaireAnswers: { ...answers },
        lastQuestionnaireSavedAt: "刚刚",
      }));
    },
    submitQuestionnaire(answers) {
      setState((current) => ({
        ...current,
        questionnaireStatus: "submitted",
        questionnaireAnswers: { ...answers },
        lastQuestionnaireSavedAt: "刚刚",
      }));
    },
    setQuestionnaireStatus(status) {
      setState((current) => ({
        ...current,
        questionnaireStatus: status,
        questionnaireAnswers: getQuestionnairePreset(status),
        weeklyParticipation:
          status === "submitted" ? current.weeklyParticipation : "not_joined",
        contactStatus: status === "submitted" ? current.contactStatus : "idle",
        latestMatchStatus:
          status === "submitted" ? current.latestMatchStatus : "no_match",
      }));
    },
    setWeeklyParticipation(status) {
      setState((current) => ({
        ...current,
        weeklyParticipation:
          current.questionnaireStatus === "submitted" ? status : "not_joined",
      }));
    },
    setContactStatus(status) {
      setState((current) => ({
        ...current,
        contactStatus:
          current.latestMatchStatus === "matched" ? status : "idle",
      }));
    },
    setLatestMatchStatus(status) {
      setState((current) => ({
        ...current,
        latestMatchStatus: status,
        weeklyParticipation:
          status === "waiting" ? "joined" : current.weeklyParticipation,
        contactStatus: status === "matched" ? current.contactStatus : "idle",
      }));
    },
    updateSettings(section, key, value) {
      setState((current) => {
        if (section === "accountState") {
          return {
            ...current,
            settings: {
              ...current.settings,
              accountState: value as UserSettings["accountState"],
            },
          };
        }

        if (section === "exportRequested") {
          return {
            ...current,
            settings: {
              ...current.settings,
              exportRequested: Boolean(value),
            },
          };
        }

        return {
          ...current,
          settings: {
            ...current.settings,
            [section]: {
              ...current.settings[section],
              [key]: Boolean(value),
            },
          },
        };
      });
    },
    setAdminDataMode(mode) {
      setState((current) => ({
        ...current,
        adminDataMode: mode,
      }));
    },
  };

  return (
    <DemoAppContext.Provider value={value}>{children}</DemoAppContext.Provider>
  );
}

export function useDemoApp() {
  const context = useContext(DemoAppContext);

  if (!context) {
    throw new Error("useDemoApp must be used within DemoAppProvider");
  }

  return context;
}
