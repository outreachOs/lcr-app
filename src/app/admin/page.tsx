import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminDashboard from "./dashboard-client";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if ((session.user as any).role !== "ADMIN") redirect("/");

  return <AdminDashboard />;
}
