import { NextResponse } from "next/server";
import { getPublicActivity } from "@/lib/activity";

export async function GET() {
  try {
    const activity = await getPublicActivity();

    return NextResponse.json(activity);
  } catch (error) {
    console.error("PUBLIC ACTIVITY ERROR:", error);
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  }
}