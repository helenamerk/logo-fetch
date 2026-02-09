import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You resolve company names to their primary website domain.
Given a company name, return ONLY the domain (e.g. "stripe.com"). No explanation, no quotes, just the bare domain.`;

export async function resolveCompanyDomain(
  companyName: string,
  apiKey?: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 64,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: companyName }],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";

  const domain = text.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  if (!domain || !domain.includes(".")) {
    throw new Error(`Could not resolve domain for "${companyName}": ${text}`);
  }

  return domain;
}
