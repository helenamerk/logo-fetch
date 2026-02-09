export interface LogoResult {
  /** Direct URL to the logo image */
  url: string;
  /** "logo" = wordmark (with company name), "icon" = square icon */
  type: "logo" | "icon";
  /** light, dark, or has_opaque_background */
  mode: string | null;
  /** File format inferred from URL (svg, png, jpg, etc.) */
  format: string | null;
  /** Image dimensions if available */
  width: number | null;
  height: number | null;
}

export interface LogoFetchOptions {
  /** Brand.dev API key — defaults to BRAND_DEV_API_KEY env var */
  brandDevApiKey?: string;
  /** Prefer a specific mode: "light" or "dark" */
  mode?: "light" | "dark";
  /** Prefer SVG format (default: true) */
  preferSvg?: boolean;
  /** Skip name lookup, use this domain directly */
  domain?: string;
}

export interface BatchLogoResult {
  company: string;
  logo: LogoResult | null;
  error?: string;
}
