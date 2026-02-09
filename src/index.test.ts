import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { loadEnvFile } from "./env.js";
import { getLogo, getAllLogos, getLogos } from "./index.js";

before(() => loadEnvFile());

describe("getLogo with explicit domain (no LLM)", () => {
  it("returns a wordmark logo for stripe.com", async () => {
    const result = await getLogo("Stripe", { domain: "stripe.com" });
    assert.ok(result, "Expected a logo result");
    assert.ok(result.url.length > 0);
    assert.equal(result.type, "logo");
  });

  it("returns a logo for github.com", async () => {
    const result = await getLogo("GitHub", { domain: "github.com" });
    assert.ok(result);
    assert.ok(result.url.length > 0);
  });
});

describe("getAllLogos with explicit domain (no LLM)", () => {
  it("returns multiple logo variants", async () => {
    const results = await getAllLogos("Stripe", { domain: "stripe.com" });
    assert.ok(results.length > 1, "Expected multiple logo variants");
    const types = new Set(results.map((r) => r.type));
    assert.ok(types.has("logo"), "Expected at least one wordmark");
  });
});

describe("getLogos batch with explicit domains (no LLM)", () => {
  it("returns results for each company", async () => {
    const results = await getLogos(["Stripe", "GitHub"], {
      domain: "stripe.com",
    });
    assert.equal(results.length, 2);
    assert.equal(results[0]!.company, "Stripe");
    assert.equal(results[1]!.company, "GitHub");
  });
});
