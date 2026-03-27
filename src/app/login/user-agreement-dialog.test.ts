import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { UserAgreementDialog } from "@/app/login/user-agreement-dialog";
import {
  type LegalRichText,
  PRIVACY_PAGE_CONTENT,
} from "@/features/legal/content";

function toPlainText(segments: LegalRichText) {
  return segments.map((segment) => segment.text).join("");
}

describe("UserAgreementDialog", () => {
  it("opens the dialog in a portal and renders the shared agreement content", async () => {
    const user = userEvent.setup();
    const { container } = render(createElement(UserAgreementDialog));

    await user.click(
      screen.getByRole("button", { name: PRIVACY_PAGE_CONTENT.title }),
    );

    expect(
      screen.getByRole("dialog", { name: PRIVACY_PAGE_CONTENT.title }),
    ).toBeInTheDocument();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe("hidden");
    expect(
      screen.getByText(toPlainText(PRIVACY_PAGE_CONTENT.summaryTitle)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(toPlainText(PRIVACY_PAGE_CONTENT.sections[0]!.title)),
    ).toBeInTheDocument();
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
    expect(document.body.style.overflow).toBe("");
  });
});
