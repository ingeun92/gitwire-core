import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 100) : 10;

  try {
    const { data, error, count } = await supabase
      .from("insights")
      .select(
        `
        id,
        content,
        is_published,
        created_at,
        repositories (
          id,
          github_url,
          name,
          description,
          language,
          total_stars,
          total_forks,
          updated_at,
          investments (
            id,
            round_type,
            investor_name,
            news_url
          )
        )
      `,
        { count: "exact" }
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Insights query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch insights", details: error.message },
        { status: 500 }
      );
    }

    // Supabase 응답 변환: repositories→repository, investments를 최상위로 이동
    const transformed = (data ?? []).map((item: Record<string, unknown>) => {
      const { repositories, ...rest } = item;
      const repo = repositories as Record<string, unknown> | null;
      const investments = repo?.investments ?? [];
      const { investments: _, ...repoWithoutInvestments } = repo ?? {};
      return {
        ...rest,
        repository: repo ? repoWithoutInvestments : null,
        investments,
      };
    });

    return NextResponse.json({ data: transformed, total: count ?? 0 });
  } catch (err) {
    console.error("Insights route error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
