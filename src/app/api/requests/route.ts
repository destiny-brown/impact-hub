import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server"
import { sendEvent } from "@/lib/kafka";
import { forbiddenResponse, getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const getRequestsSchema = z.object({
  eventId: z.string().min(1).optional(),
  volunteerId: z.string().min(1).optional(),
});

const createRequestSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  message: z.string().trim().max(500).optional().nullable(),
});

const updateRequestSchema = z.object({
  id: z.string().min(1, "Request id is required"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"]),
});


//Get all volunteer requests
export async function GET(request: Request) {
  try{
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    const {searchParams} = new URL(request.url);

    const parsedQuery = getRequestsSchema.safeParse({
      eventId: searchParams.get("eventId") ?? undefined,
      volunteerId: searchParams.get("volunteerId") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Invalid request filters" }, { status: 400 });
    }

    const { eventId, volunteerId } = parsedQuery.data;

    //build filter
    const filter: any = {};

    if (eventId) {
      filter.eventId = eventId;
    }

    if (user.role === "ADMIN") {
      if (volunteerId) {
        filter.volunteerId = volunteerId;
      }
    } else {
      if (!user.volunteerId) {
        return NextResponse.json({ error: "Volunteer profile not found" }, { status: 404 });
      }

      filter.volunteerId = user.volunteerId;
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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    if (user.role !== "VOLUNTEER" || !user.volunteerId) {
      return forbiddenResponse();
    }

    const volunteerId = user.volunteerId;

    const parsed = createRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request details" }, { status: 400 });
    }

    const body = parsed.data;

    const newVolunteerRequest = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: body.eventId },
        include: {
          _count: {
            select: {
              volunteerRequests: {
                where: { status: { in: ["PENDING", "APPROVED"] } },
              },
            },
          },
        },
      });

      if (!event) {
        throw new Error("EVENT_NOT_FOUND");
      }

      if (event.capacity !== null && event._count.volunteerRequests >= event.capacity) {
        throw new Error("EVENT_FULL");
      }

      return tx.volunteerRequest.create({
        data: {
          volunteerId,
          eventId: body.eventId,
          message: body.message || null,
                
            },
      });
    });

        await sendEvent({
          type: "REQUEST_CREATED",
          data: newVolunteerRequest,
        });

        return NextResponse.json(newVolunteerRequest, { status: 201 });
      }  catch (error) {
        if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
          return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (error instanceof Error && error.message === "EVENT_FULL") {
          return NextResponse.json({ error: "This event is already at capacity" }, { status: 409 });
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          return NextResponse.json({ error: "You have already applied for this event" }, { status: 409 });
        }

        console.error(error);
        return NextResponse.json({ error: "Failed to create volunteer request" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return forbiddenResponse();
    }

    const parsed = updateRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request update" }, { status: 400 });
    }

    const { id, status: normalizedStatus } = parsed.data;

    const updatedRequest = await prisma.$transaction(async (tx) => {
      //find existing request
      const existingRequest = await tx.volunteerRequest.findUnique({
        where: { id },
        include: { event: true },
      });

      if (!existingRequest) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      if (
        existingRequest.status === "APPROVED" || 
        existingRequest.status === "WITHDRAWN" || 
        existingRequest.status === "REJECTED"
      ) {
        throw new Error("REQUEST_CLOSED");
      }

      if (normalizedStatus === "APPROVED" && existingRequest.event.capacity !== null) {
        const approvedCount = await tx.volunteerRequest.count({
          where: {
            eventId: existingRequest.eventId,
            status: "APPROVED",
          },
        });

        if (approvedCount >= existingRequest.event.capacity) {
          throw new Error("EVENT_FULL");
        }
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
        updateData.approvedBy = user.id;
      }

      return tx.volunteerRequest.update({
        where: { id },
        data: updateData,
      });
    });

    await sendEvent({
      type: "REQUEST_UPDATED",
      data: updatedRequest,
    });

    
    return NextResponse.json({
      message: "Request updated successfully",
      request: updatedRequest,
    }, { status: 200 });
   } catch (error) {
    if (error instanceof Error && error.message === "REQUEST_NOT_FOUND") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "REQUEST_CLOSED") {
      return NextResponse.json({ error: "Cannot update a request that is already approved, rejected, or withdrawn" }, { status: 422 });
    }

    if (error instanceof Error && error.message === "EVENT_FULL") {
      return NextResponse.json({ error: "This event is already at capacity" }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: "Failed to update volunteer request" }, { status: 500 });
    };

  }


