import express from "express";
import archiver from "archiver";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "../dist/env.js";
import { getLogos } from "../dist/index.js";
import type { BatchLogoResult } from "../dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
loadEnvFile(projectRoot);

const app = express();
app.use(express.json());

// Serve static files from public/ (project root)
const publicDir = path.resolve(__dirname, "..", "public");
app.use(express.static(publicDir));

interface DownloadRequest {
  companies: string[];
  mode?: "light" | "dark";
}

app.post("/api/download-logos", async (req, res) => {
  const { companies, mode } = req.body as DownloadRequest;

  if (!Array.isArray(companies) || companies.length === 0) {
    res.status(400).json({ error: "companies must be a non-empty array" });
    return;
  }

  // Cap at a reasonable limit
  if (companies.length > 50) {
    res.status(400).json({ error: "Maximum 50 companies per request" });
    return;
  }

  try {
    const results: BatchLogoResult[] = await getLogos(companies, { mode });

    const successes = results.filter((r) => r.logo !== null);
    const failures = results.filter((r) => r.logo === null);

    // All failed
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

    // Stream a zip
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Logos.zip"',
    );

    const archive = archiver("zip", { zlib: { level: 5 } });
    archive.pipe(res);

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create zip archive" });
      }
    });

    // Download each logo and add to archive
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

    // Include error report if some failed
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
});

const PORT = parseInt(process.env["PORT"] ?? "3000", 10);
app.listen(PORT, () => {
  console.log(`Logo-fetch web UI running at http://localhost:${PORT}`);
});
