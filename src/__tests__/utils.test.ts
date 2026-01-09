import {
  cn,
  formatRating,
  getLanguageFlag,
  getLanguageName,
} from "@/lib/utils";

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});

describe("formatRating", () => {
  it("should format rating to one decimal", () => {
    expect(formatRating(4.567)).toBe("4.6");
  });

  it("should handle whole numbers", () => {
    expect(formatRating(4)).toBe("4.0");
  });

  it("should handle zero", () => {
    expect(formatRating(0)).toBe("0.0");
  });
});

describe("getLanguageFlag", () => {
  it("should return correct flag for English", () => {
    expect(getLanguageFlag("en")).toBe("🇺🇸");
  });

  it("should return correct flag for Spanish", () => {
    expect(getLanguageFlag("es")).toBe("🇪🇸");
  });

  it("should return globe for unknown language", () => {
    expect(getLanguageFlag("xx")).toBe("🌐");
  });
});

describe("getLanguageName", () => {
  it("should return correct name for English", () => {
    expect(getLanguageName("en")).toBe("English");
  });

  it("should return correct name for Spanish", () => {
    expect(getLanguageName("es")).toBe("Spanish");
  });

  it("should return uppercase code for unknown language", () => {
    expect(getLanguageName("xx")).toBe("XX");
  });
});
