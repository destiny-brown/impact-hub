import prisma from "@/lib/prisma";
import { NextResponse } from "next/server"
import { forbiddenResponse, getAuthorizedUser } from "@/lib/auth";
import { z } from "zod";

const createEventSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().min(1, "Description is required"),
    location: z.string().trim().min(1, "Location is required"),
    date: z.coerce.date(),
    capacity: z.coerce.number().int().positive().optional().nullable(),
});

//Create a new event
export async function POST(request: Request) {
    try {
        const user = await getAuthorizedUser("ADMIN");

        if (!user) {
            return forbiddenResponse();
        }

        const parsed = createEventSchema.safeParse(await request.json());

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid event details" }, { status: 400 });
        }

        const body = parsed.data;

        const slugBase = body.title.toLowerCase().replace(/\s+/g, '-');

        const newEvent = await prisma.event.create({
            data: {
                title: body.title,
                description: body.description,
                slug: slugBase,
                location: body.location,
                date: body.date,
                capacity: body.capacity ?? null,
                
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
