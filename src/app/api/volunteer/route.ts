import prisma from "@/lib/prisma";
import { NextResponse } from "next/server"
import { forbiddenResponse, getAuthorizedUser } from "@/lib/auth";

//Create a new Volunteer
export async function POST(request: Request) {
    try {
        const user = await getAuthorizedUser("ADMIN");

        if (!user) {
            return forbiddenResponse();
        }

        const body = await request.json();

        if (!body.fullName || !body.email || !body.phone || !body.location) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newVolunteer = await prisma.volunteer.create({
            data: {
                fullName: body.fullName,
                email: body.email,
                phone: body.phone,
                location: body.location,
                bio: body.bio || null,
                
            },
        });
        
        return NextResponse.json(newVolunteer, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
}

//Get all volunteers
export async function GET() {
    const user = await getAuthorizedUser("ADMIN");

    if (!user) {
        return forbiddenResponse();
    }

    const volunteers = await prisma.volunteer.findMany();
    return NextResponse.json(volunteers);

}
