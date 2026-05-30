export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function tavilySearch(queries: string[]): Promise<SearchResult[]> {
  const apiKey = process.env['TAVILY_API_KEY'];
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set');
  }

  const allResults: SearchResult[] = [];

  for (const query of queries) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: 3,
        }),
      });

      if (!response.ok) {
        console.error(`Tavily search failed for query "${query}": ${response.statusText}`);
        continue;
      }

      const data = await response.json() as {
        results?: Array<{
          title?: string;
          url?: string;
          content?: string;
          score?: number;
        }>;
      };

      if (data.results) {
        for (const r of data.results) {
          allResults.push({
            title: r.title ?? '',
            url: r.url ?? '',
            content: r.content ?? '',
            score: r.score ?? 0,
          });
        }
      }
    } catch (err) {
      console.error(`Tavily search error for query "${query}":`, err);
    }
  }

  return allResults;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.';
  }

  const lines: string[] = ['=== Search Results ===', ''];

  results.forEach((r, i) => {
    lines.push(`[${i + 1}] ${r.title}`);
    lines.push(`URL: ${r.url}`);
    lines.push(r.content.slice(0, 500));
    lines.push('');
  });

  return lines.join('\n');
}
