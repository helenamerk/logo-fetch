import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickBestLogo } from "./sources.js";
import type { LogoResult } from "./types.js";

const svgWordmarkLight: LogoResult = {
  url: "https://asset.brandfetch.io/id/logo-light.svg",
  type: "logo",
  mode: "light",
  format: "svg",
  width: 800,
  height: 200,
};

const pngWordmarkDark: LogoResult = {
  url: "https://asset.brandfetch.io/id/logo-dark.png",
  type: "logo",
  mode: "dark",
  format: "png",
  width: 400,
  height: 100,
};

const svgIcon: LogoResult = {
  url: "https://asset.brandfetch.io/id/icon.svg",
  type: "icon",
  mode: "light",
  format: "svg",
  width: 128,
  height: 128,
};

const pngIcon: LogoResult = {
  url: "https://asset.brandfetch.io/id/icon.png",
  type: "icon",
  mode: "dark",
  format: "png",
  width: 64,
  height: 64,
};

describe("pickBestLogo", () => {
  it("returns null for empty array", () => {
    assert.equal(pickBestLogo([]), null);
  });

  it("prefers wordmark (type=logo) over icon", () => {
    const result = pickBestLogo([svgIcon, pngWordmarkDark]);
    assert.equal(result?.type, "logo");
  });

  it("prefers SVG over PNG for wordmarks", () => {
    const result = pickBestLogo([pngWordmarkDark, svgWordmarkLight]);
    assert.equal(result?.format, "svg");
  });

  it("prefers light mode by default", () => {
    const result = pickBestLogo([pngWordmarkDark, svgWordmarkLight]);
    assert.equal(result?.mode, "light");
  });

  it("prefers dark mode when requested", () => {
    const result = pickBestLogo([svgWordmarkLight, pngWordmarkDark], {
      mode: "dark",
    });
    assert.equal(result?.mode, "dark");
  });

  it("falls back to icons if no wordmarks available", () => {
    const result = pickBestLogo([svgIcon, pngIcon]);
    assert.ok(result);
    assert.equal(result.type, "icon");
  });

  it("prefers SVG even when not a wordmark", () => {
    const result = pickBestLogo([pngIcon, svgIcon]);
    assert.equal(result?.format, "svg");
  });

  it("can disable SVG preference", () => {
    // With SVG preference off, the light-mode wordmark should still win
    // but not get the SVG bonus
    const result = pickBestLogo([pngWordmarkDark, svgWordmarkLight], {
      preferSvg: false,
    });
    assert.equal(result?.type, "logo");
  });
});
