/** Preserve authored paragraphs; split legacy single-block drafts into greeting, context and ask. */
export function formatEmail(text: string) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean || clean.includes("\n\n")) return clean;
  const greeting = clean.match(/^(Hi|Hello|Dear)\s+[^,\n]+,\s*/);
  const body = greeting ? clean.slice(greeting[0].length) : clean;
  const sentences = body.match(/[^.!?]+[.!?]+(?:[”"']?)(?:\s+|$)|[^.!?]+$/g)?.map((s) => s.trim()) ?? [body];
  const ask = sentences.findIndex((s, i) => i > 0 && /^(Could|Can|Would|Want|Does|Are|Let[’']s|Happy to)/.test(s));
  const paragraphs = ask > 0 ? [sentences.slice(0, ask).join(" "), sentences.slice(ask).join(" ")] : [sentences.join(" ")];
  return [...(greeting ? [greeting[0].trim()] : []), ...paragraphs].join("\n\n");
}