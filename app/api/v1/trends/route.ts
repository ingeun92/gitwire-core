import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { TrendWindow } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const windowParam = searchParams.get("window") ?? "24h";

  const validWindows: TrendWindow[] = ["24h", "1w", "1m"];
  const window: TrendWindow = validWindows.includes(windowParam as TrendWindow)
    ? (windowParam as TrendWindow)
    : "24h";

  const starColumn =
    window === "24h" ? "stars_24h" : window === "1w" ? "stars_1w" : "stars_1m";

  try {
    const { data, error } = await supabase
      .from("trend_metrics")
      .select(
        `
        id,
        snapshot_time,
        stars_24h,
        stars_1w,
        stars_1m,
        repositories (
          id,
          github_url,
          name,
          description,
          language,
          total_stars,
          total_forks,
          updated_at
        )
      `
      )
      .order(starColumn, { ascending: false })
      .limit(20);

    if (error) {
      console.error("Trends query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch trends", details: error.message },
        { status: 500 }
      );
    }

    // Supabase는 테이블명(repositories)을 키로 사용하므로 단수형(repository)으로 변환
    const transformed = (data ?? []).map((item: Record<string, unknown>) => {
      const { repositories, ...rest } = item;
      return { ...rest, repository: repositories ?? null };
    });

    return NextResponse.json({ data: transformed, window });
  } catch (err) {
    console.error("Trends route error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
