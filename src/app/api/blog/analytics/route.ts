import { NextRequest, NextResponse } from "next/server";
import { fetchBlogAnalytics } from "@/lib/google-analytics";

export async function GET(request: NextRequest) {
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
    const data = await fetchBlogAnalytics(startDate, endDate);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching blog analytics:", error);

    // Check for specific error types
    if (error instanceof Error) {
      // Check for missing env vars or parse errors
      if (error.message.includes("Missing GOOGLE_") ||
          error.message.includes("Failed to parse") ||
          error.message.includes("Invalid service account")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 500 }
        );
      }

      // Check for authentication errors
      if (error.message.includes("Could not load the default credentials") ||
          error.message.includes("invalid_grant") ||
          error.message.includes("UNAUTHENTICATED") ||
          error.message.includes("ACCOUNT_STATE_INVALID")) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication failed. The service account credentials may be invalid or the account may be disabled. Please verify your GOOGLE_SERVICE_ACCOUNT_KEY is correctly base64-encoded and the service account is active.",
          },
          { status: 502 }
        );
      }

      // Check for permission errors
      if (error.message.includes("PERMISSION_DENIED")) {
        return NextResponse.json(
          {
            success: false,
            error: "Permission denied. Ensure the service account has Viewer access to the GA4 property.",
          },
          { status: 403 }
        );
      }

      // Check for property not found
      if (error.message.includes("NOT_FOUND")) {
        return NextResponse.json(
          {
            success: false,
            error: "GA4 property not found. Check your GOOGLE_ANALYTICS_PROPERTY_ID.",
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics data",
      },
      { status: 500 }
    );
  }
}
