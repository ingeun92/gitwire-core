import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface GitHubRepo {
  html_url: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: { spdx_id: string; name: string } | null;
  topics: string[];
  pushed_at: string;
  created_at: string;
  archived: boolean;
  homepage: string | null;
}

interface GitHubSearchResponse {
  items: GitHubRepo[];
}

async function getStarSnapshot(
  repoId: string,
  hoursAgo: number
): Promise<number | null> {
  const since = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from("trend_metrics")
    .select("total_stars_snapshot")
    .eq("repo_id", repoId)
    .lte("snapshot_time", since)
    .order("snapshot_time", { ascending: false })
    .limit(1)
    .single();
  return data?.total_stars_snapshot ?? null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const githubHeaders: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "GitWire-Core/1.0",
    };

    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      githubHeaders["Authorization"] = `Bearer ${githubToken}`;
    }

    const githubRes = await fetch(
      "https://api.github.com/search/repositories?q=stars:%3E1000&sort=stars&order=desc&per_page=30",
      { headers: githubHeaders }
    );

    if (!githubRes.ok) {
      throw new Error(
        `GitHub API error: ${githubRes.status} ${githubRes.statusText}`
      );
    }

    const githubData: GitHubSearchResponse = await githubRes.json();
    const repos = githubData.items;

    let upsertedCount = 0;
    let snapshotCount = 0;
    const errors: string[] = [];

    for (const repo of repos) {
      try {
        const { data: repoData, error: repoError } = await supabase
          .from("repositories")
          .upsert(
            {
              github_url: repo.html_url,
              name: repo.full_name,
              description: repo.description,
              language: repo.language,
              total_stars: repo.stargazers_count,
              total_forks: repo.forks_count,
              updated_at: new Date().toISOString(),
              open_issues_count: repo.open_issues_count,
              license_name: repo.license?.spdx_id ?? null,
              topics: repo.topics ?? [],
              pushed_at: repo.pushed_at,
              created_at_gh: repo.created_at,
              archived: repo.archived,
              homepage_url: repo.homepage,
            },
            { onConflict: "github_url" }
          )
          .select("id")
          .single();

        if (repoError || !repoData) {
          errors.push(
            `Failed to upsert ${repo.full_name}: ${repoError?.message}`
          );
          continue;
        }

        upsertedCount++;

        // Star delta 계산: 이전 스냅샷과 비교
        const [snap24h, snap1w, snap1m] = await Promise.all([
          getStarSnapshot(repoData.id, 24),
          getStarSnapshot(repoData.id, 24 * 7),
          getStarSnapshot(repoData.id, 24 * 30),
        ]);

        const currentStars = repo.stargazers_count;
        const stars24h = snap24h !== null ? currentStars - snap24h : 0;
        const stars1w = snap1w !== null ? currentStars - snap1w : 0;
        const stars1m = snap1m !== null ? currentStars - snap1m : 0;

        const { error: metricError } = await supabase
          .from("trend_metrics")
          .insert({
            repo_id: repoData.id,
            snapshot_time: new Date().toISOString(),
            stars_24h: stars24h,
            stars_1w: stars1w,
            stars_1m: stars1m,
            total_stars_snapshot: currentStars,
          });

        if (metricError) {
          errors.push(
            `Failed to insert metric for ${repo.full_name}: ${metricError.message}`
          );
        } else {
          snapshotCount++;
        }
      } catch (err) {
        errors.push(
          `Unexpected error for ${repo.full_name}: ${String(err)}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      upserted: upsertedCount,
      snapshots: snapshotCount,
      total: repos.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Cron fetch-github error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
