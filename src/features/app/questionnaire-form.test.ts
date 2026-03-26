import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuestionnaireForm } from "@/features/app/questionnaire-form";

const sections = [
  {
    id: "section-1",
    code: "intro",
    title: "Basics",
    subtitle: "",
    description: "Test section",
    sortOrder: 1,
    questions: [
      {
        id: "question-1",
        questionCode: "mood",
        kind: "single" as const,
        prompt: "Current mood?",
        helperText: null,
        placeholder: null,
        isRequired: true,
        options: [
          { id: "good", label: "Good" },
          { id: "normal", label: "Normal" },
        ],
        scaleMin: null,
        scaleMax: null,
        scaleLeftLabel: null,
        scaleMiddleLabel: null,
        scaleRightLabel: null,
        sortOrder: 1,
        weight: 1,
      },
    ],
  },
];

describe("QuestionnaireForm", () => {
  it("disables questionnaire actions until answers change", async () => {
    const user = userEvent.setup();

    render(
      React.createElement(QuestionnaireForm, {
        answers: {
          mood: "good",
        },
        disabled: false,
        hasDraft: false,
        saveDraftAction: vi.fn(async () => {}),
        sections,
        submitAction: vi.fn(async () => {}),
      }),
    );

    const [saveDraftButton, submitButton] = screen.getAllByRole("button");
    const normalOption = screen.getByLabelText("Normal");
    const goodOption = screen.getByLabelText("Good");

    expect(saveDraftButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(saveDraftButton).toHaveClass("disabled:cursor-default");
    expect(submitButton).toHaveClass("disabled:cursor-default");

    await user.click(normalOption);

    expect(saveDraftButton).toBeEnabled();
    expect(submitButton).toBeEnabled();

    await user.click(goodOption);

    expect(saveDraftButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("allows submitting an existing draft without additional edits", () => {
    render(
      React.createElement(QuestionnaireForm, {
        answers: {
          mood: "good",
        },
        disabled: false,
        hasDraft: true,
        saveDraftAction: vi.fn(async () => {}),
        sections,
        submitAction: vi.fn(async () => {}),
      }),
    );

    const [saveDraftButton, submitButton] = screen.getAllByRole("button");

    expect(saveDraftButton).toBeDisabled();
    expect(submitButton).toBeEnabled();
  });
});
