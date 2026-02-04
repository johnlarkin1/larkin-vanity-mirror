import { NextResponse } from "next/server";
import { fetchGitHubAnalytics } from "@/lib/github";

export async function GET() {
  try {
    const data = await fetchGitHubAnalytics();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching GitHub analytics:", error);

    if (error instanceof Error) {
      // Check for missing env vars
      if (error.message.includes("Missing GITHUB_USERNAME")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 500 }
        );
      }

      // Check for rate limit
      if (error.message.includes("rate limit exceeded")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 429 }
        );
      }

      // Check for auth errors
      if (error.message.includes("authentication failed")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 401 }
        );
      }

      // Check for user not found
      if (error.message.includes("not found")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch GitHub analytics",
      },
      { status: 500 }
    );
  }
}
