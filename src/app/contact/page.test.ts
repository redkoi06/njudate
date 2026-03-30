import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("contact page contract", () => {
  it("keeps /contact as a static contact page without work-order entry points", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "app", "contact", "page.tsx"),
      "utf8",
    );

    expect(source).toContain("邮箱：njudate_official@163.com");
    expect(source).toContain("小红书账号：NJUDate_official");
    expect(source).not.toContain("createContactRequestAction");
    expect(source).not.toContain("<form");
  });
});
