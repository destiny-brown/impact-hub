import EventsClient from "./events-client";
import { requireUser } from "@/lib/auth";

export default async function EventsPage() {
  const user = await requireUser("VOLUNTEER");

  return <EventsClient volunteerName={user.fullName} />;
}