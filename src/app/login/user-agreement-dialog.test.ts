import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { UserAgreementDialog } from "@/app/login/user-agreement-dialog";
import { PRIVACY_PAGE_CONTENT } from "@/features/legal/content";

describe("UserAgreementDialog", () => {
  it("opens the dialog and renders the shared agreement content", async () => {
    const user = userEvent.setup();

    render(createElement(UserAgreementDialog));

    await user.click(
      screen.getByRole("button", { name: PRIVACY_PAGE_CONTENT.title }),
    );

    expect(
      screen.getByRole("dialog", { name: PRIVACY_PAGE_CONTENT.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("💡 太长不看版（核心摘要）：")).toBeInTheDocument();
    expect(screen.getByText("一、账号注册与用户规范")).toBeInTheDocument();
  });

  it("closes the dialog through the close button", async () => {
    const user = userEvent.setup();

    render(createElement(UserAgreementDialog));

    await user.click(
      screen.getByRole("button", { name: PRIVACY_PAGE_CONTENT.title }),
    );
    await user.click(screen.getByRole("button", { name: "关闭用户协议" }));

    expect(
      screen.queryByRole("dialog", { name: PRIVACY_PAGE_CONTENT.title }),
    ).not.toBeInTheDocument();
  });
});
