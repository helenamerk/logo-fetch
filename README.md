# logo-fetch

Download high-quality company wordmark logos (with the company name visible) for investor decks and presentations.

Give it a company name, get back the logo file. Supports SVG and PNG, light and dark modes, and batch downloads.

## Setup

### 1. Create a free Brand.dev account

This tool uses Brand.dev to fetch logos. Create a free account (no credit card required):

https://www.brand.dev/o/d156e380-2fa2-431c-ae6c-9bd994672802

> We have no affiliation with Brand.dev and receive nothing from people using this link.

### 2. Install dependencies

```bash
npm install
npm run build
```

### 3. Add your API key

Create a `.env` file in the project root:

```
BRAND_DEV_API_KEY=your_brand_dev_key_here
```

Want to kick the tires first? Here's my free trial key — at time of writing it has about 30 credits left, so be gentle with it:

```
BRAND_DEV_API_KEY=brand_bac1041f6c1d430a86c101217d0d386c
```

### Usage

```bash
# Download a single company logo
node dist/cli.js Stripe

# Download logos for multiple companies
node dist/cli.js "Stripe, Notion, Vercel"

# Dark mode variant
node dist/cli.js Stripe --dark

# Download all variants (light, dark, icon, wordmark)
node dist/cli.js Stripe --all

# Just print the URL (don't download)
node dist/cli.js Stripe --url

# Use a domain directly
node dist/cli.js --domain stripe.com
```

Logos are saved to a `Logos-<timestamp>/` folder with the company name as the filename.

Run `node dist/cli.js --help` for all options.

### Library

```ts
import { getLogo, getLogos, getAllLogos } from "logo-fetch";

// Get the best wordmark logo for a company
const logo = await getLogo("Stripe");
console.log(logo?.url);

// Batch — get logos for multiple companies in parallel
const results = await getLogos(["Stripe", "Notion", "Vercel"]);
for (const r of results) {
  console.log(`${r.company}: ${r.logo?.url ?? "not found"}`);
}

// Get all logo variants (light/dark, wordmark/icon)
const all = await getAllLogos("Stripe");

// Skip name lookup if you know the domain
const logo2 = await getLogo("Stripe", { domain: "stripe.com" });

// Prefer dark mode
const dark = await getLogo("Stripe", { mode: "dark" });
```

## How it works

1. **Company name lookup** — Brand.dev resolves the company name to its brand profile
2. **Logo fetching** — Retrieves all logo variants (wordmarks, icons, light/dark modes, SVG/PNG)
3. **Smart selection** — Picks the best logo: prefers wordmarks (with company name) over icons, SVG over raster, and respects your light/dark preference
