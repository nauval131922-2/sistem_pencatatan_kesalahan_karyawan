export function buildFtsQuery(search: string): string | null {
  const trimmed = search.trim();
  if (!trimmed) return null;

  const finalized = /[\s.]$/.test(search);
  const tokens = trimmed
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.replace(/"/g, "").trim())
    .filter(Boolean);

  if (tokens.length === 0) return null;
  if (tokens.length === 1) return `${tokens[0]}*`;

  const phrase = `"${tokens.join(" ")}"`;
  return finalized ? phrase : `${phrase}*`;
}
