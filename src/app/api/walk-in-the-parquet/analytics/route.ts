import { NextRequest, NextResponse } from "next/server";
import { fetchAnalyticsForProperty } from "@/lib/google-analytics";
import {
  fetchAppStoreAnalytics,
  isAppStoreConnectConfigured,
} from "@/lib/app-store-connect";
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

  const gaPropertyId = process.env.WALK_IN_THE_PARQUET_GA_PROPERTY_ID;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const appStoreConfigured = isAppStoreConnectConfigured();

  // Check if at least one data source is configured
  if (!gaPropertyId && !appStoreConfigured) {
    console.error("Walk in the Parquet: No data sources configured");
    return NextResponse.json(
      { success: false, error: "Analytics data sources not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch data from both sources in parallel
    const [documentationData, appStoreData] = await Promise.all([
      gaPropertyId && serviceAccountKey
        ? fetchAnalyticsForProperty(gaPropertyId, startDate, endDate).catch(
            (err) => {
              console.error(
                "Error fetching GA data for Walk in the Parquet:",
                err
              );
              return null;
            }
          )
        : Promise.resolve(null),
      appStoreConfigured
        ? fetchAppStoreAnalytics(startDate, endDate).catch((err) => {
            console.error("Error fetching App Store data:", err);
            return null;
          })
        : Promise.resolve(null),
    ]);

    // Return combined response
    return NextResponse.json({
      success: true,
      data: {
        documentation: documentationData,
        appStore: appStoreData,
      },
    });
  } catch (error) {
    console.error("Walk in the Parquet analytics error:", error);

    // Return generic error messages - never expose internal details
    if (error instanceof Error) {
      // Check for authentication errors
      if (
        error.message.includes("UNAUTHENTICATED") ||
        error.message.includes("invalid_grant") ||
        error.message.includes("401")
      ) {
        return NextResponse.json(
          { success: false, error: "Service authentication failed" },
          { status: 502 }
        );
      }

      // Check for permission errors
      if (
        error.message.includes("PERMISSION_DENIED") ||
        error.message.includes("403")
      ) {
        return NextResponse.json(
          { success: false, error: "Access denied to analytics data" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
