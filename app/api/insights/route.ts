import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { getCurrentAccount } from "@/lib/sessionAccount";
import { findOutliers, getSeriesIndex } from "@/lib/insights";

export async function GET() {
  await connectDB();
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [outlierData, seriesData] = await Promise.all([
    findOutliers(account._id),
    getSeriesIndex(account._id),
  ]);

  return NextResponse.json({ ...outlierData, ...seriesData });
}
