import type { VercelRequest, VercelResponse } from "@vercel/node";
import archiver from "archiver";
import { getLogos } from "../dist/index.js";
import type { BatchLogoResult } from "../dist/index.js";

export const config = {
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { companies, mode } = req.body as {
    companies: string[];
    mode?: "light" | "dark";
  };

  if (!Array.isArray(companies) || companies.length === 0) {
    res.status(400).json({ error: "companies must be a non-empty array" });
    return;
  }

  if (companies.length > 50) {
    res.status(400).json({ error: "Maximum 50 companies per request" });
    return;
  }

  try {
    const results: BatchLogoResult[] = await getLogos(companies, { mode });

    const successes = results.filter((r) => r.logo !== null);
    const failures = results.filter((r) => r.logo === null);

    if (successes.length === 0) {
      res.status(422).json({
        error: "No logos found for any of the provided companies",
        failures: failures.map((f) => ({
          company: f.company,
          reason: f.error ?? "Not found",
        })),
      });
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="Logos.zip"');

    const archive = archiver("zip", { zlib: { level: 5 } });
    archive.pipe(res);

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create zip archive" });
      }
    });

    for (const result of successes) {
      const logo = result.logo!;
      const ext = logo.format ?? "svg";
      const filename = `${result.company}.${ext}`;

      try {
        const response = await fetch(logo.url);
        if (!response.ok) {
          failures.push({
            company: result.company,
            logo: null,
            error: `Download failed: HTTP ${response.status}`,
          });
          continue;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        archive.append(buffer, { name: filename });
      } catch (err) {
        failures.push({
          company: result.company,
          logo: null,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (failures.length > 0) {
      const errorLines = failures.map(
        (f) => `${f.company}: ${f.error ?? "Not found"}`,
      );
      archive.append(errorLines.join("\n"), { name: "_errors.txt" });
    }

    await archive.finalize();
  } catch (err) {
    console.error("Unexpected error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
