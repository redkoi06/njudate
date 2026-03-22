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
      screen.getByRole("button", { name: "《NJU Date用户协议》" }),
    );

    expect(
      screen.getByRole("dialog", { name: "NJU Date 用户协议" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(PRIVACY_PAGE_CONTENT.description),
    ).toBeInTheDocument();
    expect(
      screen.getByText(PRIVACY_PAGE_CONTENT.points[0] ?? ""),
    ).toBeInTheDocument();
  });

  it("closes the dialog through the close button", async () => {
    const user = userEvent.setup();

    render(createElement(UserAgreementDialog));

    await user.click(
      screen.getByRole("button", { name: "《NJU Date用户协议》" }),
    );
    await user.click(screen.getByRole("button", { name: "关闭用户协议" }));

    expect(
      screen.queryByRole("dialog", { name: "NJU Date 用户协议" }),
    ).not.toBeInTheDocument();
  });
});
