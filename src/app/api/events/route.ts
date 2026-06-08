import prisma from "@/lib/prisma";
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
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
        console.error(error);
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}

