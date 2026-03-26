import { describe, expect, it } from "vitest";

import {
  parseShanghaiDateTimeInput,
  shanghaiDateTimeInputToIso,
} from "@/lib/date-time";

describe("Shanghai datetime parsing", () => {
  it("converts a datetime-local value to UTC ISO using Shanghai time", () => {
    expect(shanghaiDateTimeInputToIso("2026-03-25T12:00")).toBe(
      "2026-03-25T04:00:00.000Z",
    );
  });

  it("supports values that cross back into the previous UTC day", () => {
    expect(parseShanghaiDateTimeInput("2026-03-25T00:30")?.toISOString()).toBe(
      "2026-03-24T16:30:00.000Z",
    );
  });

  it("rejects invalid calendar dates", () => {
    expect(shanghaiDateTimeInputToIso("2026-02-30T12:00")).toBeNull();
  });
});
