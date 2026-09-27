import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/services/container";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Verify secret if set in production
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const targetDate = searchParams.get("targetDate") || undefined;
    const yesterdayDate = searchParams.get("yesterdayDate") || undefined;

    const services = getServices();
    const result = await services.refrigerator.processDailyRefrigeratorTasks({
      targetDate,
      yesterdayDate,
    });

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Cron /api/cron/daily-refrigerators error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
