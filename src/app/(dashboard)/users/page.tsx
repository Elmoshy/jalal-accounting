import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlaceholderPage from "../placeholder";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "super_admin") redirect("/dashboard");
  return <PlaceholderPage title="إدارة المستخدمين" />;
}
