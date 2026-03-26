import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260327100000_update_match_result_notification_body.sql",
);

describe("latest notification copy migration", () => {
  it("uses the updated published match-result notification body", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("'第 ' || v_batch.round_no || ' 轮匹配结果已发布'");
    expect(sql).toContain("'访问“匹配记录”查看匹配结果吧！'");
    expect(sql).not.toContain("'点击“立即查看”查看本轮匹配结果'");
  });

  it("keeps the match-result notification level mapping unchanged", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("when result.status = 'matched' then 'success'");
    expect(sql).toContain("else 'info'");
  });
});
