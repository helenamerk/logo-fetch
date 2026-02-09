import BrandDev from "brand.dev";
import type { LogoResult, LogoFetchOptions } from "./types.js";

function createClient(opts: LogoFetchOptions): BrandDev {
  return new BrandDev({
    apiKey: opts.brandDevApiKey ?? process.env["BRAND_DEV_API_KEY"],
  });
}

function parseLogos(
  logos: NonNullable<
    NonNullable<
      Awaited<ReturnType<BrandDev["brand"]["retrieve"]>>["brand"]
    >["logos"]
  >,
): LogoResult[] {
  return logos
    .filter((logo) => !!logo.url)
    .map((logo): LogoResult => {
      const ext = logo.url!.split(".").pop()?.toLowerCase() ?? null;
      return {
        url: logo.url!,
        type: logo.type === "icon" ? "icon" : "logo",
        mode: logo.mode ?? null,
        format: ext,
        width: logo.resolution?.width ?? null,
        height: logo.resolution?.height ?? null,
      };
    });
}

export async function fetchLogosByDomain(
  domain: string,
  opts: LogoFetchOptions = {},
): Promise<LogoResult[]> {
  const result = await createClient(opts).brand.retrieve({ domain });
  return parseLogos(result.brand?.logos ?? []);
}

export async function fetchLogosByName(
  name: string,
  opts: LogoFetchOptions = {},
): Promise<LogoResult[]> {
  const result = await createClient(opts).brand.retrieveByName({ name });
  return parseLogos(result.brand?.logos ?? []);
}

export function pickBestLogo(
  logos: LogoResult[],
  opts: LogoFetchOptions = {},
): LogoResult | null {
  if (logos.length === 0) return null;

  const preferSvg = opts.preferSvg !== false;
  const preferMode = opts.mode ?? "light";

  // Only consider wordmarks (type: "logo"), not icons
  const wordmarks = logos.filter((l) => l.type === "logo");
  const pool = wordmarks.length > 0 ? wordmarks : logos;

  // Score each logo: higher is better
  const scored = pool.map((logo) => {
    let score = 0;
    if (logo.type === "logo") score += 100;
    if (logo.mode === preferMode) score += 50;
    if (preferSvg && logo.format === "svg") score += 25;
    return { logo, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.logo ?? null;
}
