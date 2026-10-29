import { describe, it, expect } from "vitest";
import {
  normalizeBusinessName, normalizeDomain, normalizeHandle, normalizeState,
  buildDomainLabels, interpretDnsResult,
} from "./nameNormalization";

describe("business name normalization", () => {
  it("Pivot, pivot, PIVOT and PiVoT share one comparison value", () => {
    const keys = ["Pivot", "pivot", "PIVOT", "PiVoT"].map((n) => normalizeBusinessName(n).comparison);
    expect(new Set(keys)).toEqual(new Set(["pivot"]));
  });
  it("trims and collapses whitespace", () => {
    expect(normalizeBusinessName("  Pivot   Hub ").comparison).toBe("pivot hub");
  });
  it("keeps the user's capitalization for display", () => {
    expect(normalizeBusinessName(" PIVOT ").display).toBe("PIVOT");
    expect(normalizeBusinessName("iPivot").display).toBe("iPivot");
  });
  it("domain labels do not depend on capitalization", () => {
    expect(buildDomainLabels(normalizeBusinessName("PIVOT Hub").slug))
      .toEqual(buildDomainLabels(normalizeBusinessName("pivot hub").slug));
  });
});

describe("domains", () => {
  it("lowercases and strips URL parts", () => {
    expect(normalizeDomain("HTTPS://WWW.Pivot.IO/path?x=1")).toBe("www.pivot.io");
  });
  it("rejects invalid domains", () => {
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("-bad.com")).toBeNull();
  });
  it("only DNS answers mark a domain taken; failures stay unverified", () => {
    expect(interpretDnsResult({ Status: 0, Answer: [{}] })).toBe("taken");
    expect(interpretDnsResult({ Status: 3 })).toBe("no_records");
    expect(interpretDnsResult({ Status: 2 })).toBe("unverified");
    expect(interpretDnsResult(null)).toBe("unverified");
  });
});

describe("social handles", () => {
  it("normalize the same regardless of case", () => {
    expect(normalizeHandle("PIVOT Hub", "Instagram")).toBe(normalizeHandle("pivot hub", "Instagram"));
    expect(normalizeHandle("Pivot Hub", "Instagram")).toBe("pivothub");
  });
  it("rejects handles that break platform rules", () => {
    expect(normalizeHandle("Ab", "X (Twitter)")).toBeNull(); // X needs 4+
    expect(normalizeHandle("a".repeat(20), "X (Twitter)")).toBeNull(); // max 15
  });
});

describe("states", () => {
  it("maps names, codes and slugs to one state", () => {
    for (const v of ["MI", "mi", " Michigan ", "MICHIGAN"]) expect(normalizeState(v)?.code).toBe("MI");
    expect(normalizeState("new-york")?.code).toBe("NY");
    expect(normalizeState("North   Carolina")?.code).toBe("NC");
  });
  it("rejects unknown jurisdictions", () => {
    expect(normalizeState("Atlantis")).toBeNull();
  });
});
