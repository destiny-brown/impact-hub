import prisma from "@/lib/prisma";
import { NextResponse } from "next/server"
import { forbiddenResponse, getAuthorizedUser } from "@/lib/auth";

//Create a new event
export async function POST(request: Request) {
    try {
        const user = await getAuthorizedUser("ADMIN");

        if (!user) {
            return forbiddenResponse();
        }

        const body = await request.json();

        if (!body.title || !body.description || !body.location || !body.date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const slugBase = body.title.toLowerCase().replace(/\s+/g, '-');

        const newEvent = await prisma.event.create({
            data: {
                title: body.title,
                description: body.description,
                slug: slugBase,
                location: body.location,
                date: new Date(body.date),
                capacity: body.capacity || null,
                
            },
        });
        
        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {

console.error("CREATE EVENT ERROR:", error);

  return NextResponse.json(
    {
      message: "Failed to create event",
      error: String(error),
    },
    { status: 500 }
    );

    }
}

//Get all events
export async function GET() {
    const events = await prisma.event.findMany();
    return NextResponse.json(events);
}
