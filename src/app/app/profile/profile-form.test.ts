import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProfileForm } from "@/app/app/profile/profile-form";

describe("ProfileForm", () => {
  it("disables save until the profile data changes", async () => {
    const user = userEvent.setup();

    render(
      React.createElement(ProfileForm, {
        action: vi.fn(),
        defaultValues: {
          nickname: "阿青",
          gender: "女",
          grade: "大二",
          department: "软件学院",
          campus: "仙林校区",
          birthYear: "2003",
        },
      }),
    );

    const saveButton = screen.getByRole("button", { name: "保存资料" });
    const nicknameInput = screen.getByLabelText("昵称");

    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveClass("disabled:cursor-default");

    await user.clear(nicknameInput);
    await user.type(nicknameInput, "阿青同学");

    expect(saveButton).toBeEnabled();

    await user.clear(nicknameInput);
    await user.type(nicknameInput, "阿青");

    expect(saveButton).toBeDisabled();
  });
});
