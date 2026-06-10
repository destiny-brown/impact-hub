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
        return NextResponse.json(newVolunteerRequest, { status: 201 });
      }  catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create volunteer request" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    //Check if status is valid
    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const normalizedStatus = status.toUpperCase();

    const allowedStatuses = ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"];
    
    
    //if normalized status is not in allowed statuses, return error
    if (!allowedStatuses.includes(normalizedStatus)) {
      return NextResponse.json({ error: `Invalid status value must be one of ${allowedStatuses.join(", ")}` }, 
      { status: 400 });
    }

    //find existing request
    const existingRequest = await prisma.volunteerRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Request not found" }, 
        { status: 404 });
    }

    if (
      existingRequest.status === "APPROVED" || 
      existingRequest.status === "WITHDRAWN" || 
      existingRequest.status === "REJECTED"
    ) {
      return NextResponse.json({ error: "Cannot update a request that is already approved, rejected, or withdrawn" }, 
        { status: 422 }); //Unprocessable Entity
      }

      //Build update data
      const updateData: any = {
        status: normalizedStatus,
      };

      //If status is being updated to approved, set approvedAt timestamp
      if (
        normalizedStatus === "APPROVED" ||
        normalizedStatus === "REJECTED"  
      ) {
        updateData.approvedAt = new Date();
      }

    const updatedRequest = await prisma.volunteerRequest.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json({
      message: "Request updated successfully",
      request: updatedRequest,
    }, { status: 200 });
   } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update volunteer request" }, { status: 500 });
    };

  }


