import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") ?? "total_stars";
  const order = searchParams.get("order") ?? "desc";
  const language = searchParams.get("language");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "30"), 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0);

  const validSortColumns = [
    "total_stars",
    "stars_24h",
    "stars_1w",
    "stars_1m",
    "name",
    "pushed_at",
  ];
  const sortColumn = validSortColumns.includes(sort) ? sort : "total_stars";
  const ascending = order === "asc";

  try {
    // 1. Get repositories with latest trend metrics
    let repoQuery = supabase
      .from("repositories")
      .select("*")
      .eq("archived", false)
      .order(
        ["stars_24h", "stars_1w", "stars_1m"].includes(sortColumn)
          ? "total_stars"
          : sortColumn,
        { ascending }
      )
      .range(offset, offset + limit - 1);

    if (language) {
      repoQuery = repoQuery.ilike("language", language);
    }

    const { data: repos, error: repoError } = await repoQuery;

    if (repoError) {
      return NextResponse.json(
        { error: "Failed to fetch repositories", details: repoError.message },
        { status: 500 }
      );
    }

    if (!repos || repos.length === 0) {
      return NextResponse.json({ data: [], total: 0 });
    }

    // 2. Get latest metrics for each repo
    const repoIds = repos.map((r) => r.id);
    const enrichedRepos = await Promise.all(
      repoIds.map(async (repoId) => {
        const repo = repos.find((r) => r.id === repoId)!;

        // Latest trend metric
        const { data: latestMetric } = await supabase
          .from("trend_metrics")
          .select("stars_24h, stars_1w, stars_1m, snapshot_time, total_stars_snapshot")
          .eq("repo_id", repoId)
          .order("snapshot_time", { ascending: false })
          .limit(1)
          .single();

        // Sparkline: daily star counts for last 7 days
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 3600 * 1000
        ).toISOString();
        const { data: snapshots } = await supabase
          .from("trend_metrics")
          .select("total_stars_snapshot, snapshot_time")
          .eq("repo_id", repoId)
          .gte("snapshot_time", sevenDaysAgo)
          .order("snapshot_time", { ascending: true });

        // Aggregate to daily: pick last snapshot per day
        const dailyMap = new Map<string, number>();
        for (const snap of snapshots ?? []) {
          const day = snap.snapshot_time.slice(0, 10);
          dailyMap.set(day, snap.total_stars_snapshot);
        }
        const sparkline7d = Array.from(dailyMap.values());

        const stars24h = latestMetric?.stars_24h ?? 0;
        const starVelocityPct =
          repo.total_stars > 0
            ? parseFloat(((stars24h / repo.total_stars) * 100).toFixed(3))
            : 0;

        return {
          ...repo,
          stars_24h: latestMetric?.stars_24h ?? 0,
          stars_1w: latestMetric?.stars_1w ?? 0,
          stars_1m: latestMetric?.stars_1m ?? 0,
          star_velocity_pct: starVelocityPct,
          sparkline_7d: sparkline7d,
          latest_snapshot_time: latestMetric?.snapshot_time ?? null,
        };
      })
    );

    // Sort by trend columns if needed
    if (["stars_24h", "stars_1w", "stars_1m"].includes(sortColumn)) {
      enrichedRepos.sort((a, b) => {
        const aVal = a[sortColumn as keyof typeof a] as number;
        const bVal = b[sortColumn as keyof typeof b] as number;
        return ascending ? aVal - bVal : bVal - aVal;
      });
    }

    // Get total count
    let countQuery = supabase
      .from("repositories")
      .select("id", { count: "exact", head: true })
      .eq("archived", false);
    if (language) {
      countQuery = countQuery.ilike("language", language);
    }
    const { count } = await countQuery;

    return NextResponse.json({
      data: enrichedRepos,
      total: count ?? enrichedRepos.length,
    });
  } catch (err) {
    console.error("Repositories route error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
