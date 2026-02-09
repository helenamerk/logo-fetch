import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnvFile(dir: string = process.cwd()): void {
  try {
    const content = readFileSync(resolve(dir, ".env"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      const val = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // No .env file
  }
}
