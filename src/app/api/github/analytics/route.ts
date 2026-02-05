import { NextRequest, NextResponse } from "next/server";
import { fetchGitHubAnalytics } from "@/lib/github";
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
    const data = await fetchGitHubAnalytics();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GitHub analytics error:", error);

    // Return generic error messages - never expose internal details
    if (error instanceof Error) {
      // Check for rate limit from GitHub API
      if (error.message.includes("rate limit exceeded")) {
        return NextResponse.json(
          { success: false, error: "GitHub API rate limit exceeded" },
          { status: 429 }
        );
      }

      // Check for auth errors
      if (error.message.includes("authentication failed")) {
        return NextResponse.json(
          { success: false, error: "GitHub authentication failed" },
          { status: 401 }
        );
      }

      // Check for user not found
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { success: false, error: "GitHub user not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch GitHub analytics" },
      { status: 500 }
    );
  }
}
