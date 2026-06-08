import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const volunteerRequests = await prisma.volunteerRequest.findMany();

  return new Response(JSON.stringify(volunteerRequests), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
