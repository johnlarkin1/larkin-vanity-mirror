// GitHub API client for fetching repository analytics

interface GitHubConfig {
  username: string;
  token?: string;
}

function getConfig(): GitHubConfig {
  const username = process.env.GITHUB_USERNAME;
  const token = process.env.GITHUB_TOKEN;

  if (!username) {
    throw new Error("Missing GITHUB_USERNAME environment variable");
  }

  return { username, token: token || undefined };
}

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// GitHub API types
interface GitHubApiRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string | null;
  archived: boolean;
  fork: boolean;
  private: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

// Public interfaces
export interface LanguageBreakdown {
  language: string;
  bytes: number;
  percentage: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  watchers: number;
  language: string | null;
  languages: LanguageBreakdown[];
  isArchived: boolean;
  isFork: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface StarHistoryPoint {
  date: string;
  totalStars: number;
  newStars: number;
}

export interface GitHubAnalyticsData {
  metrics: {
    totalStars: number;
    totalForks: number;
    totalWatchers: number;
    repoCount: number;
    newStarsThisWeek: number;
    starsTrend: number;
  };
  repositories: GitHubRepository[];
  starHistory: StarHistoryPoint[];
}

async function fetchWithAuth(url: string, token?: string): Promise<Response> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "larkin-vanity-mirror",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  // Check rate limit
  const remaining = response.headers.get("X-RateLimit-Remaining");
  const resetTime = response.headers.get("X-RateLimit-Reset");

  if (response.status === 403 && remaining === "0") {
    const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
    throw new Error(
      `GitHub API rate limit exceeded. Resets at ${resetDate?.toISOString() ?? "unknown"}`
    );
  }

  return response;
}

/**
 * Fetch language breakdown for a repository
 * Returns bytes per language, which we convert to percentages
 */
async function fetchRepoLanguages(
  fullName: string,
  token?: string
): Promise<LanguageBreakdown[]> {
  const cacheKey = `languages:${fullName}`;
  const cached = getCached<LanguageBreakdown[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${fullName}/languages`;
    const response = await fetchWithAuth(url, token);

    if (!response.ok) {
      return [];
    }

    const data: Record<string, number> = await response.json();
    const totalBytes = Object.values(data).reduce((sum, bytes) => sum + bytes, 0);

    if (totalBytes === 0) return [];

    const languages = Object.entries(data)
      .map(([language, bytes]) => ({
        language,
        bytes,
        percentage: Math.round((bytes / totalBytes) * 1000) / 10, // One decimal place
      }))
      .sort((a, b) => b.bytes - a.bytes);

    setCache(cacheKey, languages);
    return languages;
  } catch {
    return [];
  }
}

export async function fetchUserRepositories(
  username: string,
  token?: string
): Promise<GitHubRepository[]> {
  const cacheKey = `repos:${username}`;
  const cached = getCached<GitHubRepository[]>(cacheKey);
  if (cached) return cached;

  const repos: GitHubRepository[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    // Use /user/repos endpoint with token to include private repos
    // Falls back to /users/{username}/repos for unauthenticated requests (public only)
    const url = token
      ? `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&affiliation=owner&visibility=all&sort=updated`
      : `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}&type=owner&sort=updated`;

    const response = await fetchWithAuth(url, token);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`GitHub user '${username}' not found`);
      }
      if (response.status === 401) {
        throw new Error("GitHub authentication failed. Check your GITHUB_TOKEN.");
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data: GitHubApiRepo[] = await response.json();

    if (data.length === 0) break;

    repos.push(
      ...data.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
          language: repo.language,
          languages: [] as LanguageBreakdown[], // Will be populated below
          isArchived: repo.archived,
          isFork: repo.fork,
          isPrivate: repo.private,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at,
        }))
    );

    if (data.length < perPage) break;
    page++;
  }

  // Sort by stars descending, then by most recently updated descending
  repos.sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Fetch language breakdowns in parallel for all repos
  const languagePromises = repos.map((repo) => fetchRepoLanguages(repo.fullName, token));
  const languageResults = await Promise.all(languagePromises);

  // Assign language breakdowns to repos
  repos.forEach((repo, index) => {
    repo.languages = languageResults[index];
  });

  setCache(cacheKey, repos);
  return repos;
}

// Simple star history approximation based on repo creation dates
// Real star history would require the Events API which is rate-limited
function generateStarHistory(repos: GitHubRepository[]): StarHistoryPoint[] {
  const history: StarHistoryPoint[] = [];
  const now = new Date();
  const days = 90;

  // Calculate total current stars
  const totalCurrentStars = repos.reduce((sum, repo) => sum + repo.stars, 0);

  // Generate approximate history (we don't have real star event data without extensive API calls)
  // This is a simplified view showing current totals
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // For simplicity, show current stars on all days
    // A real implementation would need to track star events over time
    history.push({
      date: dateStr,
      totalStars: i === 0 ? totalCurrentStars : 0, // Only show current total on today
      newStars: 0,
    });
  }

  // Update the last entry with actual current stars
  if (history.length > 0) {
    history[history.length - 1].totalStars = totalCurrentStars;
  }

  return history;
}

export async function fetchGitHubAnalytics(): Promise<GitHubAnalyticsData> {
  const { username, token } = getConfig();

  const cacheKey = `analytics:${username}`;
  const cached = getCached<GitHubAnalyticsData>(cacheKey);
  if (cached) return cached;

  const repositories = await fetchUserRepositories(username, token);

  // Calculate aggregate metrics
  const totalStars = repositories.reduce((sum, repo) => sum + repo.stars, 0);
  const totalForks = repositories.reduce((sum, repo) => sum + repo.forks, 0);
  const totalWatchers = repositories.reduce((sum, repo) => sum + repo.watchers, 0);
  const repoCount = repositories.length;

  // For new stars this week, we'd need to track star events
  // Without historical data, we'll show 0 with a note
  const newStarsThisWeek = 0;
  const starsTrend = 0;

  const starHistory = generateStarHistory(repositories);

  const data: GitHubAnalyticsData = {
    metrics: {
      totalStars,
      totalForks,
      totalWatchers,
      repoCount,
      newStarsThisWeek,
      starsTrend,
    },
    repositories,
    starHistory,
  };

  setCache(cacheKey, data);
  return data;
}
