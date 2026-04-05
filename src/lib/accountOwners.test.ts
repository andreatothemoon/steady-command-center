import { describe, expect, it } from "vitest";
import { accountHasOwner, formatOwnerGroup, splitOwnerNames } from "@/lib/accountOwners";

describe("accountOwners", () => {
  it("matches comma-separated owners case-insensitively", () => {
    expect(accountHasOwner("Andrea, Giulia", "giulia")).toBe(true);
    expect(accountHasOwner("Andrea, Giulia", "Marco")).toBe(false);
  });

  it("handles missing owner values safely", () => {
    expect(splitOwnerNames(undefined)).toEqual([]);
    expect(accountHasOwner(undefined, "Andrea")).toBe(false);
    expect(formatOwnerGroup("")).toBe("Unassigned");
  });
});
