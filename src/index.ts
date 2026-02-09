export type { LogoResult, LogoFetchOptions, BatchLogoResult } from "./types.js";
export { fetchLogosByDomain, fetchLogosByName, pickBestLogo } from "./sources.js";

import { fetchLogosByDomain, fetchLogosByName, pickBestLogo } from "./sources.js";
import type { LogoFetchOptions, LogoResult, BatchLogoResult } from "./types.js";

async function fetchLogos(
  company: string,
  opts: LogoFetchOptions,
): Promise<LogoResult[]> {
  if (opts.domain) return fetchLogosByDomain(opts.domain, opts);
  return fetchLogosByName(company, opts);
}

/**
 * Get the best wordmark logo for a company.
 *
 * @example
 * ```ts
 * const logo = await getLogo("Stripe");
 * console.log(logo?.url); // SVG wordmark URL
 * ```
 */
export async function getLogo(
  company: string,
  opts: LogoFetchOptions = {},
): Promise<LogoResult | null> {
  const logos = await fetchLogos(company, opts);
  return pickBestLogo(logos, opts);
}

/**
 * Get all available logos for a company (wordmarks + icons, all modes).
 */
export async function getAllLogos(
  company: string,
  opts: LogoFetchOptions = {},
): Promise<LogoResult[]> {
  return fetchLogos(company, opts);
}

/**
 * Get logos for multiple companies in parallel.
 *
 * @example
 * ```ts
 * const results = await getLogos(["Stripe", "Notion", "Vercel"]);
 * for (const r of results) {
 *   console.log(`${r.company}: ${r.logo?.url ?? "not found"}`);
 * }
 * ```
 */
export async function getLogos(
  companies: string[],
  opts: LogoFetchOptions = {},
): Promise<BatchLogoResult[]> {
  return Promise.all(
    companies.map(async (company): Promise<BatchLogoResult> => {
      try {
        const logo = await getLogo(company, opts);
        return { company, logo };
      } catch (err) {
        return {
          company,
          logo: null,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );
}
