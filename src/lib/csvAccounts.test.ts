import { describe, expect, it } from "vitest";
import { parseCsv } from "./csvAccounts";

describe("parseCsv", () => {
  it("returns empty array for empty or header-only input", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("Name,Type")).toEqual([]);
  });

  it("parses a well-formed row with label values", () => {
    const csv = [
      "Name,Account Type,Wrapper,Current Value,Owner,Interest Rate (%),Term Remaining (months)",
      "Vanguard ISA,Stocks & Shares ISA,ISA,12500,Andrea,,",
    ].join("\n");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Vanguard ISA");
    expect(rows[0].account_type).toBe("stocks_and_shares_isa");
    expect(rows[0].wrapper_type).toBe("isa");
    expect(rows[0].current_value).toBe(12500);
    expect(rows[0].owner_name).toBe("Andrea");
    expect(rows[0].interest_rate).toBeNull();
    expect(rows[0].term_remaining_months).toBeNull();
    expect(rows[0]._errors).toEqual([]);
  });

  it("accepts raw enum keys for type and wrapper", () => {
    const csv = [
      "Name,Account Type,Wrapper,Current Value,Owner",
      "Savings Pot,savings,none,5000,Giulia",
    ].join("\n");
    const [row] = parseCsv(csv);
    expect(row.account_type).toBe("savings");
    expect(row.wrapper_type).toBe("none");
    expect(row._errors).toEqual([]);
  });

  it("strips currency symbols and commas from values", () => {
    const csv = [
      "Name,Account Type,Wrapper,Current Value,Owner",
      'House,Property,None,"£450,000",Andrea',
    ].join("\n");
    const [row] = parseCsv(csv);
    expect(row.current_value).toBe(450000);
  });

  it("parses interest rate and term for debt rows", () => {
    const csv = [
      "Name,Account Type,Wrapper,Current Value,Owner,Interest Rate (%),Term Remaining (months)",
      "Mortgage,Mortgage,None,-280000,Andrea,4.5,240",
    ].join("\n");
    const [row] = parseCsv(csv);
    expect(row.current_value).toBe(-280000);
    expect(row.interest_rate).toBe(4.5);
    expect(row.term_remaining_months).toBe(240);
  });

  it("flags missing name and unknown type/wrapper", () => {
    const csv = [
      "Name,Account Type,Wrapper,Current Value,Owner",
      ",Unicorn Account,FooBar,100,Andrea",
    ].join("\n");
    const [row] = parseCsv(csv);
    expect(row._errors).toContain("Missing name");
    expect(row._errors.some((e) => e.startsWith("Invalid type"))).toBe(true);
    expect(row._errors.some((e) => e.startsWith("Invalid wrapper"))).toBe(true);
  });

  it("flags non-numeric values", () => {
    const csv = [
      "Name,Account Type,Wrapper,Current Value,Owner",
      "Test,Savings,None,not-a-number,Andrea",
    ].join("\n");
    const [row] = parseCsv(csv);
    expect(row._errors).toContain("Invalid value");
    expect(row.current_value).toBe(0);
  });

  it("defaults wrapper to 'none' when blank", () => {
    const csv = [
      "Name,Account Type,Wrapper,Current Value,Owner",
      "Test,Savings,,1000,Andrea",
    ].join("\n");
    const [row] = parseCsv(csv);
    expect(row.wrapper_type).toBe("none");
    expect(row._errors).toEqual([]);
  });

  it("handles quoted fields containing commas", () => {
    const csv = [
      "Name,Account Type,Wrapper,Current Value,Owner",
      '"Smith, J. Mortgage",Mortgage,None,-100000,"Andrea, Giulia"',
    ].join("\n");
    const [row] = parseCsv(csv);
    expect(row.name).toBe("Smith, J. Mortgage");
    expect(row.owner_name).toBe("Andrea, Giulia");
  });
});
