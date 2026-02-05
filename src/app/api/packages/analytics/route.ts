import { NextRequest, NextResponse } from "next/server";
import { fetchPackagesAnalytics } from "@/lib/packages";
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
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Parse dates or use defaults (last 30 days)
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD).",
        },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "startDate must be before endDate.",
        },
        { status: 400 }
      );
    }

    const data = await fetchPackagesAnalytics({ startDate, endDate });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Packages analytics error:", error);

    // Return generic error messages - never expose internal details
    if (error instanceof Error) {
      // Check for rate limit from package registries
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { success: false, error: "Package registry rate limit exceeded" },
          { status: 429 }
        );
      }

      // Check for package not found
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { success: false, error: "Package not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch packages analytics" },
      { status: 500 }
    );
  }
}
