import { generateShortCode, isValidUrl, isValidAlias } from "./utils";

describe("generateShortCode", () => {
  it("should generate a code of default length 6", () => {
    const code = generateShortCode();
    expect(code).toHaveLength(6);
  });

  it("should generate a code of specified length", () => {
    const code = generateShortCode(10);
    expect(code).toHaveLength(10);
  });

  it("should only contain alphanumeric characters", () => {
    const code = generateShortCode(100);
    expect(code).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("should generate unique codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateShortCode());
    }
    // With 62^6 possibilities, 100 codes should be unique
    expect(codes.size).toBe(100);
  });
});

describe("isValidUrl", () => {
  it("should return true for valid HTTP URLs", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
    expect(isValidUrl("http://example.com/path")).toBe(true);
    expect(isValidUrl("http://example.com/path?query=value")).toBe(true);
  });

  it("should return true for valid HTTPS URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("https://www.example.com")).toBe(true);
    expect(isValidUrl("https://sub.domain.example.com")).toBe(true);
  });

  it("should return true for URLs with ports", () => {
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("https://example.com:8080/path")).toBe(true);
  });

  it("should return true for URLs with fragments", () => {
    expect(isValidUrl("https://example.com/page#section")).toBe(true);
  });

  it("should return false for invalid URLs", () => {
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("example.com")).toBe(false);
    expect(isValidUrl("://example.com")).toBe(false);
  });

  it("should return true for other valid protocols", () => {
    expect(isValidUrl("ftp://files.example.com")).toBe(true);
    expect(isValidUrl("file:///path/to/file")).toBe(true);
  });
});

describe("isValidAlias", () => {
  it("should return true for valid aliases", () => {
    expect(isValidAlias("abc")).toBe(true);
    expect(isValidAlias("my-link")).toBe(true);
    expect(isValidAlias("my_link")).toBe(true);
    expect(isValidAlias("MyLink123")).toBe(true);
    expect(isValidAlias("test-url_2024")).toBe(true);
  });

  it("should return true for aliases at minimum length (3)", () => {
    expect(isValidAlias("abc")).toBe(true);
    expect(isValidAlias("a-b")).toBe(true);
    expect(isValidAlias("1_2")).toBe(true);
  });

  it("should return true for aliases at maximum length (20)", () => {
    expect(isValidAlias("a".repeat(20))).toBe(true);
    expect(isValidAlias("12345678901234567890")).toBe(true);
  });

  it("should return false for aliases too short", () => {
    expect(isValidAlias("")).toBe(false);
    expect(isValidAlias("a")).toBe(false);
    expect(isValidAlias("ab")).toBe(false);
  });

  it("should return false for aliases too long", () => {
    expect(isValidAlias("a".repeat(21))).toBe(false);
    expect(isValidAlias("123456789012345678901")).toBe(false);
  });

  it("should return false for aliases with invalid characters", () => {
    expect(isValidAlias("my link")).toBe(false);
    expect(isValidAlias("my.link")).toBe(false);
    expect(isValidAlias("my@link")).toBe(false);
    expect(isValidAlias("my#link")).toBe(false);
    expect(isValidAlias("my!link")).toBe(false);
    expect(isValidAlias("my/link")).toBe(false);
  });
});
