import DashboardClient from "./dashboard-client";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser("ADMIN");

  return <DashboardClient adminName={user.fullName} />;
}