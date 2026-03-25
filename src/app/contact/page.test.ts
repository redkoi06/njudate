import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("contact page contract", () => {
  it("keeps /contact as a static explanation board without work-order entry points", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "app", "contact", "page.tsx"),
      "utf8",
    );

    expect(source).toContain("当前版本不再提供站内工单入口。");
    expect(source).toContain("平台不再接收站内咨询工单");
    expect(source).not.toContain("createContactRequestAction");
    expect(source).not.toContain("<form");
  });
});
