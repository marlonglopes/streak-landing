import { describe, it, expect } from "vitest";
import { isLocale, matchAcceptLanguage } from "./config";

describe("isLocale", () => {
  it("accepts known locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("pt-BR")).toBe(true);
  });

  it("rejects unknown or malformed", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("pt-PT")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe("matchAcceptLanguage", () => {
  it("falls back to en for missing header", () => {
    expect(matchAcceptLanguage(null)).toBe("en");
    expect(matchAcceptLanguage(undefined)).toBe("en");
    expect(matchAcceptLanguage("")).toBe("en");
  });

  it("detects pt-BR from any Portuguese variant", () => {
    expect(matchAcceptLanguage("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt-BR");
    expect(matchAcceptLanguage("pt-PT,pt;q=0.9")).toBe("pt-BR");
    expect(matchAcceptLanguage("pt")).toBe("pt-BR");
  });

  it("detects English", () => {
    expect(matchAcceptLanguage("en-US,en;q=0.9")).toBe("en");
    expect(matchAcceptLanguage("en")).toBe("en");
  });

  it("falls back to en for unsupported languages", () => {
    expect(matchAcceptLanguage("fr-FR,fr;q=0.9")).toBe("en");
    expect(matchAcceptLanguage("ja")).toBe("en");
  });

  it("picks first listed match, not highest-weighted", () => {
    // Browsers always send highest-preferred first, so first-match is correct.
    expect(matchAcceptLanguage("pt-BR,en;q=0.5")).toBe("pt-BR");
    expect(matchAcceptLanguage("en,pt-BR;q=0.5")).toBe("en");
  });
});
