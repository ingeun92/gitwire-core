-- repositories 테이블
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_url TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT,
  total_stars INT DEFAULT 0,
  total_forks INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- trend_metrics 테이블
CREATE TABLE IF NOT EXISTS trend_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  snapshot_time TIMESTAMPTZ DEFAULT now(),
  stars_24h INT DEFAULT 0,
  stars_1w INT DEFAULT 0,
  stars_1m INT DEFAULT 0
);

-- investments 테이블
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  round_type TEXT,
  investor_name TEXT,
  news_url TEXT
);

-- insights 테이블
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  content TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_trend_metrics_repo_snapshot
  ON trend_metrics (repo_id, snapshot_time);

CREATE INDEX IF NOT EXISTS idx_insights_published_created
  ON insights (is_published, created_at);
