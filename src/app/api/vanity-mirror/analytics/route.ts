import { NextRequest, NextResponse } from "next/server";
import { fetchAnalyticsForProperty } from "@/lib/google-analytics";
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

  // Get the Vanity Mirror GA property ID
  const propertyId = process.env.VANITY_MIRROR_GA_PROPERTY_ID;
  if (!propertyId) {
    return NextResponse.json(
      { success: false, error: "Vanity Mirror analytics not configured" },
      { status: 503 }
    );
  }

  try {
    const data = await fetchAnalyticsForProperty(propertyId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Vanity Mirror analytics error:", error);

    // Return generic error messages - never expose internal details
    if (error instanceof Error) {
      // Check for authentication errors
      if (
        error.message.includes("Could not load the default credentials") ||
        error.message.includes("invalid_grant") ||
        error.message.includes("UNAUTHENTICATED") ||
        error.message.includes("ACCOUNT_STATE_INVALID")
      ) {
        return NextResponse.json(
          { success: false, error: "Service authentication failed" },
          { status: 502 }
        );
      }

      // Check for permission errors
      if (error.message.includes("PERMISSION_DENIED")) {
        return NextResponse.json(
          { success: false, error: "Access denied to analytics data" },
          { status: 403 }
        );
      }

      // Check for property not found
      if (error.message.includes("NOT_FOUND")) {
        return NextResponse.json(
          { success: false, error: "Analytics property not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
