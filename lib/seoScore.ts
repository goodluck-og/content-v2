// Transparent, rules-based SEO checklist - not a black-box score. Every
// point is something you can see and understand, based on well-established
// YouTube SEO basics (not guesses about the algorithm's internals).

export type SeoCheck = { label: string; pass: boolean; detail: string };

export function scoreVideoSeo({
  title,
  description,
  tags,
}: {
  title?: string;
  description?: string;
  tags?: string[];
}): { score: number; checks: SeoCheck[] } {
  const checks: SeoCheck[] = [
    {
      label: "Title length",
      pass: Boolean(title && title.length >= 20 && title.length <= 70),
      detail: `${title?.length || 0} characters (aim for 20-70)`,
    },
    {
      label: "Description length",
      pass: Boolean(description && description.length >= 100),
      detail: `${description?.length || 0} characters (aim for 100+)`,
    },
    {
      label: "Tag count",
      pass: Boolean(tags && tags.length >= 5),
      detail: `${tags?.length || 0} tags (aim for 5+)`,
    },
    {
      label: "Title has a hook word",
      pass: Boolean(
        title && /\b(how|why|best|top|secret|never|always|vs|reveal)\b/i.test(title)
      ),
      detail: "Hook words (how/why/best/vs/secret) tend to earn more clicks",
    },
    {
      label: "No ALL CAPS spam",
      pass: !(title && title === title.toUpperCase() && title.length > 10),
      detail: "All-caps titles read as spammy and can hurt trust signals",
    },
  ];

  const passCount = checks.filter((c) => c.pass).length;
  return { score: Math.round((passCount / checks.length) * 100), checks };
}
