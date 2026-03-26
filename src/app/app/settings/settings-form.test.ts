import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SettingsForm } from "@/app/app/settings/settings-form";

describe("SettingsForm", () => {
  it("disables save until the settings change", async () => {
    const user = userEvent.setup();

    render(
      React.createElement(SettingsForm, {
        action: vi.fn(),
        defaultValues: {
          notifyMatchResult: true,
        },
      }),
    );

    const saveButton = screen.getByRole("button", { name: "保存设置" });
    const matchResult = screen.getByRole("checkbox", {
      name: "匹配结果提醒",
    });

    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveClass("disabled:cursor-default");

    await user.click(matchResult);

    expect(saveButton).toBeEnabled();

    await user.click(matchResult);

    expect(saveButton).toBeDisabled();
  });
});
