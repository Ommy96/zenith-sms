import { describe, it, expect } from "vitest";
import {
  normalizeAccountRef,
  accountRefMatches,
} from "../accountRefMatcher";

describe("normalizeAccountRef", () => {
  const canonical = "ADM20260001";
  const variants = [
    "ADM/2026/0001",
    "ADM-2026-0001",
    "ADM 2026 0001",
    " ADM/2026/0001 ",
    "adm/2026/0001",
    "Adm.2026.0001",
    "ADM_2026_0001",
  ];

  for (const v of variants) {
    it(`"${v}" → ${canonical}`, () => {
      expect(normalizeAccountRef(v)).toBe(canonical);
    });
  }

  it("collapses an unrelated short form to a different key", () => {
    expect(normalizeAccountRef("adm2026001")).not.toBe(canonical);
    expect(normalizeAccountRef("adm2026001")).toBe("ADM2026001");
  });

  it("handles null / undefined / empty", () => {
    expect(normalizeAccountRef(null)).toBe("");
    expect(normalizeAccountRef(undefined)).toBe("");
    expect(normalizeAccountRef("")).toBe("");
  });
});

describe("accountRefMatches", () => {
  it("matches across delimiters and casing", () => {
    expect(accountRefMatches("ADM/2026/0001", "adm-2026-0001")).toBe(true);
    expect(accountRefMatches(" ADM 2026 0001 ", "ADM/2026/0001")).toBe(true);
  });

  it("does not match the empty string against itself", () => {
    expect(accountRefMatches("", "")).toBe(false);
    expect(accountRefMatches(null, null)).toBe(false);
  });

  it("rejects different admission numbers", () => {
    expect(accountRefMatches("ADM/2026/0001", "ADM/2026/0002")).toBe(false);
  });
});