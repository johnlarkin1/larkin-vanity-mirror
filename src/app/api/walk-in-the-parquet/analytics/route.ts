import { NextRequest, NextResponse } from "next/server";
import { fetchAnalyticsForProperty } from "@/lib/google-analytics";
import {
  fetchAppStoreAnalytics,
  isAppStoreConnectConfigured,
} from "@/lib/app-store-connect";

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

  const gaPropertyId = process.env.WALK_IN_THE_PARQUET_GA_PROPERTY_ID;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const appStoreConfigured = isAppStoreConnectConfigured();

  // Check if at least one data source is configured
  if (!gaPropertyId && !appStoreConfigured) {
    return NextResponse.json(
      {
        success: false,
        error:
          "No data sources configured. Set WALK_IN_THE_PARQUET_GA_PROPERTY_ID and/or App Store Connect credentials.",
      },
      { status: 500 }
    );
  }

  try {
    // Fetch data from both sources in parallel
    const [documentationData, appStoreData] = await Promise.all([
      gaPropertyId && serviceAccountKey
        ? fetchAnalyticsForProperty(gaPropertyId, startDate, endDate).catch((err) => {
            console.error("Error fetching GA data for Walk in the Parquet:", err);
            return null;
          })
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
    console.error("Error fetching Walk in the Parquet analytics:", error);

    if (error instanceof Error) {
      // Check for specific error types
      if (
        error.message.includes("Missing") ||
        error.message.includes("Failed to parse") ||
        error.message.includes("Invalid")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 500 }
        );
      }

      // Check for authentication errors
      if (
        error.message.includes("UNAUTHENTICATED") ||
        error.message.includes("invalid_grant") ||
        error.message.includes("401")
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Authentication failed. Check your service account key and App Store Connect credentials.",
          },
          { status: 502 }
        );
      }

      // Check for permission errors
      if (error.message.includes("PERMISSION_DENIED") || error.message.includes("403")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Permission denied. Ensure proper access is granted for all data sources.",
          },
          { status: 403 }
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
