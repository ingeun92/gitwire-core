-- repositories 테이블에 메타데이터 컬럼 추가
ALTER TABLE repositories
  ADD COLUMN IF NOT EXISTS open_issues_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS license_name TEXT,
  ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pushed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at_gh TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS homepage_url TEXT;

-- trend_metrics 테이블에 스냅샷 컬럼 추가 (delta 계산용)
ALTER TABLE trend_metrics
  ADD COLUMN IF NOT EXISTS total_stars_snapshot INT DEFAULT 0;
