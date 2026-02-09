#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "./env.js";
import { getLogo, getAllLogos } from "./index.js";
import type { LogoResult } from "./types.js";

loadEnvFile();

function timestamp(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join("");
}

async function downloadLogo(
  logo: LogoResult,
  dir: string,
  name: string,
): Promise<string> {
  const ext = logo.format ?? "png";
  const filename = `${name}.${ext}`;
  const filepath = join(dir, filename);
  const res = await fetch(logo.url);
  if (!res.ok) throw new Error(`Failed to download ${logo.url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(filepath, buffer);
  return filepath;
}

function printHelp() {
  console.log(`
  logo-fetch — Download high-quality company logos with the company name

  QUICK START
    logo-fetch Stripe                         Download Stripe's logo
    logo-fetch "Stripe, Notion, Vercel"       Download logos for multiple companies

  USAGE
    logo-fetch <company>         Download the best wordmark logo (SVG preferred)
    logo-fetch <companies>       Comma-separated list of company names

  OPTIONS
    --dark          Get the dark mode version of the logo (default: light)
    --no-svg        Get PNG instead of SVG
    --all           Download all available variants (light, dark, icon, etc.)
    --url           Just print the logo URL (don't download the file)
    --json          Print full details as JSON (don't download)
    --domain <d>    Use a specific website domain instead of looking it up

  EXAMPLES
    logo-fetch Stripe
      -> Downloads Stripe's wordmark logo to Logos-<timestamp>/Stripe.svg

    logo-fetch "Stripe, Notion, Vercel"
      -> Downloads all three logos into one folder

    logo-fetch Stripe --dark
      -> Gets the dark mode variant

    logo-fetch Stripe --all
      -> Downloads every variant (light wordmark, dark wordmark, icon, etc.)

    logo-fetch --domain stripe.com
      -> Skip the company name lookup, use stripe.com directly

  SETUP
    This tool requires a Brand.dev API key (free to create).
    Set it as an environment variable or in a .env file:

      BRAND_DEV_API_KEY=your_key_here

    Optionally, set ANTHROPIC_API_KEY to enable company name -> domain lookup.
    Without it, use --domain to specify the company website directly.
  `.trimEnd());
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h") || args.includes("help")) {
    printHelp();
    process.exit(0);
  }

  // Check for API key early
  if (!process.env["BRAND_DEV_API_KEY"]) {
    console.error(
      "Missing BRAND_DEV_API_KEY. Set it in your environment or in a .env file.\n" +
        "Get a free key at https://www.brand.dev",
    );
    process.exit(1);
  }

  const showAll = args.includes("--all");
  const asJson = args.includes("--json");
  const urlOnly = args.includes("--url") || asJson;
  const darkMode = args.includes("--dark");
  const noSvg = args.includes("--no-svg");

  let domain: string | undefined;
  const domainIdx = args.indexOf("--domain");
  if (domainIdx !== -1 && args[domainIdx + 1]) {
    domain = args[domainIdx + 1]!;
  }

  const rawInput = args
    .filter(
      (a, i) =>
        !a.startsWith("--") && !(domainIdx !== -1 && i === domainIdx + 1),
    )
    .join(" ");

  if (!rawInput && !domain) {
    console.error(
      'Please provide a company name. Example: logo-fetch "Stripe"\n' +
        "Run logo-fetch --help for more options.",
    );
    process.exit(1);
  }

  const opts = {
    domain,
    mode: darkMode ? ("dark" as const) : ("light" as const),
    preferSvg: !noSvg,
  };

  const companies = (rawInput || domain!)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Collect results
  const results: { company: string; logos: LogoResult[]; error?: string }[] =
    [];

  for (const company of companies) {
    console.log(`Looking up ${company}...`);
    try {
      if (showAll) {
        const logos = await getAllLogos(company, opts);
        results.push({ company, logos });
      } else {
        const logo = await getLogo(company, opts);
        results.push({ company, logos: logo ? [logo] : [] });
      }
    } catch (err) {
      results.push({
        company,
        logos: [],
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // URL-only / JSON mode
  if (urlOnly) {
    if (asJson) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      for (const r of results) {
        if (r.error) {
          console.error(`${r.company}: Error - ${r.error}`);
        } else if (r.logos.length === 0) {
          console.log(`${r.company}: not found`);
        } else {
          for (const l of r.logos) {
            const prefix = companies.length > 1 ? `${r.company}: ` : "";
            console.log(`${prefix}${l.url}`);
          }
        }
      }
    }
    return;
  }

  // Download mode
  const outDir = `Logos-${timestamp()}`;
  mkdirSync(outDir, { recursive: true });

  let downloadCount = 0;
  for (const r of results) {
    if (r.error) {
      console.error(`  Could not find ${r.company}: ${r.error}`);
      continue;
    }
    if (r.logos.length === 0) {
      console.error(`  Could not find a logo for ${r.company}`);
      continue;
    }

    if (showAll) {
      for (const logo of r.logos) {
        const suffix =
          r.logos.length > 1
            ? `-${logo.type}-${logo.mode ?? "default"}`
            : "";
        const path = await downloadLogo(logo, outDir, `${r.company}${suffix}`);
        console.log(`  Saved ${path}`);
        downloadCount++;
      }
    } else {
      const path = await downloadLogo(r.logos[0]!, outDir, r.company);
      console.log(`  Saved ${path}`);
      downloadCount++;
    }
  }

  if (downloadCount > 0) {
    console.log(
      `\nDone! ${downloadCount} logo${downloadCount > 1 ? "s" : ""} saved to ${outDir}/`,
    );
  }
}

main().catch((err: unknown) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
