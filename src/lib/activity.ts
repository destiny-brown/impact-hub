import prisma from "@/lib/prisma";
import type { RequestEvent } from "@/lib/kafka";

export type PublicActivity = {
  id: string;
  type: RequestEvent["type"];
  label: string;
  detail: string;
  status: string;
  createdAt: string;
};

type RequestEventData = {
  id?: string;
  status?: string;
  event?: {
    title?: string | null;
  } | null;
  eventId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const globalForActivity = globalThis as unknown as {
  publicActivity?: PublicActivity[];
};

const publicActivity = globalForActivity.publicActivity ?? [];

if (process.env.NODE_ENV !== "production") {
  globalForActivity.publicActivity = publicActivity;
}

function getActivityCopy(type: RequestEvent["type"], status?: string) {
  if (type === "REQUEST_CREATED") {
    return {
      label: "Volunteer request submitted",
      status: "PENDING",
    };
  }

  return {
    label: `Request ${status?.toLowerCase() ?? "updated"}`,
    status: status ?? "UPDATED",
  };
}

function toIsoString(value: Date | string | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  return value instanceof Date ? value.toISOString() : value;
}

export function recordPublicActivity(event: RequestEvent) {
  const data = event.data as RequestEventData;
  const copy = getActivityCopy(event.type, data.status);
  const activity: PublicActivity = {
    id: `${data.id ?? crypto.randomUUID()}-${Date.now()}`,
    type: event.type,
    label: copy.label,
    detail: data.event?.title ? `Event: ${data.event.title}` : "Volunteer event request activity",
    status: copy.status,
    createdAt: toIsoString(data.updatedAt ?? data.createdAt),
  };

  publicActivity.unshift(activity);
  publicActivity.splice(12);
}

export async function getPublicActivity() {
  if (publicActivity.length > 0) {
    return publicActivity;
  }

  const requests = await prisma.volunteerRequest.findMany({
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      event: {
        select: { title: true },
      },
    },
  });

  return requests.map((request) => ({
    id: request.id,
    type: request.status === "PENDING" ? "REQUEST_CREATED" : "REQUEST_UPDATED",
    label: request.status === "PENDING" ? "Volunteer request submitted" : `Request ${request.status.toLowerCase()}`,
    detail: `Event: ${request.event.title}`,
    status: request.status,
    createdAt: request.updatedAt.toISOString(),
  })) satisfies PublicActivity[];
}