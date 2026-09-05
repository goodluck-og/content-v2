// IMPORTANT HONESTY NOTE: there is no free/legitimate API for live competitor
// performance data on TikTok/YouTube - that requires either paid enterprise
// tools or scraping (which breaks platform ToS). This gives the user *context*
// using published industry engagement-rate ranges, not real competitor spying.
// Update these numbers periodically from public reports (e.g. platform
// creator blogs, Social Insider, Hootsuite benchmark reports) rather than
// treating them as live data.

export const NICHE_BENCHMARKS: Record<string, { avgEngagementRate: string; note: string }> = {
  "gaming/anime edits": {
    avgEngagementRate: "5-9%",
    note: "Gaming/anime edit content on TikTok Shorts typically sees higher-than-average engagement due to strong niche communities.",
  },
  "general shorts": {
    avgEngagementRate: "3-6%",
    note: "General short-form content average across TikTok/YouTube Shorts.",
  },
};

export function getBenchmarkForNiche(niche: string) {
  const key = Object.keys(NICHE_BENCHMARKS).find((k) =>
    niche.toLowerCase().includes(k.split("/")[0])
  );
  return NICHE_BENCHMARKS[key || "general shorts"];
}

/**
 * Compares the account's own average engagement rate against the published
 * niche range, for context only - not a competitor comparison.
 */
export function compareToNicheBenchmark(accountAvgEngagementRate: number, niche: string) {
  const benchmark = getBenchmarkForNiche(niche);
  return {
    yourRate: `${(accountAvgEngagementRate * 100).toFixed(1)}%`,
    nicheTypicalRange: benchmark.avgEngagementRate,
    note: benchmark.note,
    disclaimer:
      "Based on published industry averages, not live competitor data - use as rough context only.",
  };
}
