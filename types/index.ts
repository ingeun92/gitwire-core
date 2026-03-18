export interface Repository {
  id: string;
  github_url: string;
  name: string;
  description: string | null;
  language: string | null;
  total_stars: number;
  total_forks: number;
  updated_at: string;
  open_issues_count: number;
  license_name: string | null;
  topics: string[];
  pushed_at: string | null;
  created_at_gh: string | null;
  archived: boolean;
  homepage_url: string | null;
}

export interface TrendMetric {
  id: string;
  repo_id: string;
  snapshot_time: string;
  stars_24h: number;
  stars_1w: number;
  stars_1m: number;
  total_stars_snapshot: number;
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

export interface EnrichedRepository extends Repository {
  stars_24h: number;
  stars_1w: number;
  stars_1m: number;
  star_velocity_pct: number;
  sparkline_7d: number[];
  latest_snapshot_time: string | null;
}
