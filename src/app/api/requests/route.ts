import prisma from "@/lib/prisma";
import { NextResponse } from "next/server"


//Get all volunteer requests
export async function GET(request: Request) {
  try{
    const {searchParams} = new URL(request.url);

    const eventId = searchParams.get("eventId");
    const volunteerId = searchParams.get("volunteerId");

    //build filter
    const filter: any = {};

    if (eventId) {
      filter.eventId = eventId;
    }

    if (volunteerId) {
      filter.volunteerId = volunteerId;
    }
    
    const volunteerRequests = await prisma.volunteerRequest.findMany({
      where: filter,
      include: {
        volunteer: true,
        event: true,
      },
    });
    return NextResponse.json(volunteerRequests);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch requests" }, 
      { status: 500 });
  }
}

//Create a new volunteer request 
export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.volunteerId || !body.eventId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newVolunteerRequest = await prisma.volunteerRequest.create({
            data: {
                volunteerId: body.volunteerId,
                eventId: body.eventId,
                message: body.message || null,
                
            },
        });
      }  catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create volunteer request" }, { status: 500 });
    }
}


