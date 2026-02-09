import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Test the domain extraction logic used in resolveCompanyDomain
function extractDomain(text: string): string | null {
  const domain = text
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!domain || !domain.includes(".")) return null;
  return domain;
}

describe("domain extraction", () => {
  it("extracts bare domain", () => {
    assert.equal(extractDomain("stripe.com"), "stripe.com");
  });

  it("strips https prefix", () => {
    assert.equal(extractDomain("https://stripe.com"), "stripe.com");
  });

  it("strips http prefix", () => {
    assert.equal(extractDomain("http://notion.so"), "notion.so");
  });

  it("strips trailing path", () => {
    assert.equal(extractDomain("https://vercel.com/home"), "vercel.com");
  });

  it("lowercases the domain", () => {
    assert.equal(extractDomain("GitHub.com"), "github.com");
  });

  it("returns null for invalid input", () => {
    assert.equal(extractDomain("notadomain"), null);
  });

  it("returns null for empty input", () => {
    assert.equal(extractDomain(""), null);
  });
});
