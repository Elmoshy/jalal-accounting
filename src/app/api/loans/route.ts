import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function getLocationFilter(session: { user: { role: string; locationId?: string | null } }) {
  return session.user.role === "super_admin" ? {} : { locationId: session.user.locationId! };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { ...getLocationFilter(session) };
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;

  const loans = await prisma.loan.findMany({
    where,
    include: { employee: { select: { name: true, position: true, baseSalary: true } } },
    orderBy: [{ date: "desc" }],
  });

  return NextResponse.json(loans);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { employeeId, amount, installments, notes } = body;

  if (!employeeId || !amount) {
    return NextResponse.json({ error: "employeeId and amount are required" }, { status: 400 });
  }

  const locationId = session.user.role === "super_admin" ? body.locationId : session.user.locationId!;
  const ins = installments || 1;
  const installmentAmount = amount / ins;

  const loan = await prisma.loan.create({
    data: {
      employeeId, amount, installments: ins,
      installmentAmount, paidAmount: 0, remaining: amount,
      status: "active", notes, locationId,
    },
  });

  return NextResponse.json({ loan });
}
