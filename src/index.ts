export type { LogoResult, LogoFetchOptions, BatchLogoResult } from "./types.js";
export { resolveCompanyDomain } from "./resolve.js";
export { fetchLogos, pickBestLogo } from "./sources.js";

import { resolveCompanyDomain } from "./resolve.js";
import { fetchLogos, pickBestLogo } from "./sources.js";
import type { LogoFetchOptions, LogoResult, BatchLogoResult } from "./types.js";

async function getDomain(
  company: string,
  opts: LogoFetchOptions,
): Promise<string> {
  if (opts.domain) return opts.domain;
  return resolveCompanyDomain(company, opts.anthropicApiKey);
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
  const domain = await getDomain(company, opts);
  const logos = await fetchLogos(domain, opts);
  return pickBestLogo(logos, opts);
}

/**
 * Get all available logos for a company (wordmarks + icons, all modes).
 */
export async function getAllLogos(
  company: string,
  opts: LogoFetchOptions = {},
): Promise<LogoResult[]> {
  const domain = await getDomain(company, opts);
  return fetchLogos(domain, opts);
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
