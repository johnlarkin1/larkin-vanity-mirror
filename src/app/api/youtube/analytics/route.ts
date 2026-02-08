import { NextRequest, NextResponse } from "next/server";
import { fetchYouTubeAnalytics } from "@/lib/youtube";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = rateLimit(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  try {
    const data = await fetchYouTubeAnalytics();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("YouTube analytics error:", error);

    if (error instanceof Error) {
      if (error.message.includes("quota exceeded")) {
        return NextResponse.json(
          { success: false, error: "YouTube API quota exceeded" },
          { status: 429 }
        );
      }

      if (error.message.includes("authentication failed")) {
        return NextResponse.json(
          { success: false, error: "YouTube API authentication failed" },
          { status: 401 }
        );
      }

      if (error.message.includes("not found")) {
        return NextResponse.json(
          { success: false, error: "YouTube channel not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch YouTube analytics" },
      { status: 500 }
    );
  }
}
