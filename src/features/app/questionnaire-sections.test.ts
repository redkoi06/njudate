import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuestionnaireSections } from "@/features/app/questionnaire-sections";

function createScaleSection(input?: {
  scaleMax?: number;
  scaleMiddleLabel?: string | null;
  scaleMin?: number;
}) {
  return [
    {
      id: "section-1",
      code: "scale",
      title: "Scale",
      subtitle: "",
      description: "Scale section",
      sortOrder: 1,
      questions: [
        {
          id: "question-1",
          questionCode: "q-scale",
          kind: "scale" as const,
          prompt: "How do you feel?",
          helperText: null,
          placeholder: null,
          isRequired: true,
          options: [],
          scaleMin: input?.scaleMin ?? 1,
          scaleMax: input?.scaleMax ?? 7,
          scaleLeftLabel: "Left",
          scaleMiddleLabel: input?.scaleMiddleLabel ?? null,
          scaleRightLabel: "Right",
          sortOrder: 1,
          weight: 1,
        },
      ],
    },
  ];
}

function renderQuestionnaireSections(
  sections: ReturnType<typeof createScaleSection>,
) {
  render(
    React.createElement(QuestionnaireSections, {
      answers: {},
      disabled: false,
      sections,
    }),
  );
}

describe("QuestionnaireSections", () => {
  it("keeps left-right anchors with numeric prefixes when scaleMiddleLabel is absent", () => {
    renderQuestionnaireSections(createScaleSection());

    expect(screen.getByText("1 (Left)")).toBeInTheDocument();
    expect(screen.getByText("7 (Right)")).toBeInTheDocument();
    expect(screen.queryByText("4 (Middle)")).not.toBeInTheDocument();
  });

  it("renders three numeric anchors when scaleMiddleLabel exists and the scale has an integer midpoint", () => {
    renderQuestionnaireSections(
      createScaleSection({ scaleMiddleLabel: "Middle" }),
    );

    expect(screen.getByText("1 (Left)")).toBeInTheDocument();
    expect(screen.getByText("4 (Middle)")).toBeInTheDocument();
    expect(screen.getByText("7 (Right)")).toBeInTheDocument();
  });

  it("spreads scale options across the available width with a responsive grid", () => {
    renderQuestionnaireSections(
      createScaleSection({ scaleMiddleLabel: "Middle" }),
    );

    expect(screen.getByTestId("scale-options-q-scale")).toHaveStyle({
      gridTemplateColumns: "repeat(auto-fit, minmax(4.75rem, 1fr))",
    });
  });

  it("falls back to left-right numeric anchors when no integer midpoint exists", () => {
    renderQuestionnaireSections(
      createScaleSection({
        scaleMax: 6,
        scaleMiddleLabel: "Middle",
      }),
    );

    expect(screen.getByText("1 (Left)")).toBeInTheDocument();
    expect(screen.getByText("6 (Right)")).toBeInTheDocument();
    expect(screen.queryByText("Middle")).not.toBeInTheDocument();
    expect(screen.queryByText("4 (Middle)")).not.toBeInTheDocument();
  });
});
