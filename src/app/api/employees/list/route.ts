import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const locationFilter = session.user.role === "super_admin" ? {} : { locationId: session.user.locationId! };

  const employees = await prisma.employee.findMany({
    where: { isActive: true, ...locationFilter },
    select: { id: true, name: true, position: true, baseSalary: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(employees);
}
