import { NextRequest, NextResponse } from "next/server";
import { fetchTennisScorigamiAnalytics } from "@/lib/posthog";
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

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Validate required parameters
  if (!startDate || !endDate) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required parameters: startDate and endDate are required",
      },
      { status: 400 }
    );
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD",
      },
      { status: 400 }
    );
  }

  try {
    const data = await fetchTennisScorigamiAnalytics(startDate, endDate);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Tennis scorigami analytics error:", error);

    // Return generic error messages - never expose internal details
    if (error instanceof Error) {
      // Check for authentication errors
      if (error.message.includes("authentication failed")) {
        return NextResponse.json(
          { success: false, error: "Analytics authentication failed" },
          { status: 401 }
        );
      }

      // Check for project not found
      if (error.message.includes("project not found")) {
        return NextResponse.json(
          { success: false, error: "Analytics project not found" },
          { status: 404 }
        );
      }

      // Check for rate limiting from PostHog
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { success: false, error: "Analytics API rate limit exceeded" },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
