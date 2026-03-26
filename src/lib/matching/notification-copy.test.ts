import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260326143000_update_notification_copy.sql",
);

describe("notification copy migration", () => {
  it("uses round-based copy for published match-result notifications", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("'第 ' || v_batch.round_no || ' 轮匹配结果已发布'");
    expect(sql).toContain("'点击“立即查看”查看本轮匹配结果'");
    expect(sql).not.toContain("本周匹配结果已发布");
    expect(sql).not.toContain("你的本周匹配结果已经发布");
  });

  it("keeps the match-result notification level mapping unchanged", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("when result.status = 'matched' then 'success'");
    expect(sql).toContain("else 'info'");
  });
});
