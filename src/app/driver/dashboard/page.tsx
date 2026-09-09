import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DriverDashboard from "./dashboard-client";

export default async function DriverDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/driver/dashboard");
  if ((session.user as any).role !== "DRIVER") redirect("/");

  return <DriverDashboard />;
}
