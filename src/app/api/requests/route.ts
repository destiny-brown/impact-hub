import prisma from "@/lib/prisma";
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const volunteerRequests = await prisma.volunteerRequest.findMany();
  
  return NextResponse.json(volunteerRequests);
}
