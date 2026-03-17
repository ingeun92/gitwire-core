export interface Repository {
  id: string;
  github_url: string;
  name: string;
  description: string | null;
  language: string | null;
  total_stars: number;
  total_forks: number;
  updated_at: string;
}

export interface TrendMetric {
  id: string;
  repo_id: string;
  snapshot_time: string;
  stars_24h: number;
  stars_1w: number;
  stars_1m: number;
}

export interface Investment {
  id: string;
  repo_id: string;
  round_type: string | null;
  investor_name: string | null;
  news_url: string | null;
}

export interface Insight {
  id: string;
  repo_id: string;
  content: string;
  is_published: boolean;
  created_at: string;
}

export type TrendWindow = "24h" | "1w" | "1m";
