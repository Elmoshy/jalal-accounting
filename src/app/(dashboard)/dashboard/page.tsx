import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { role, locationId } = session.user;
  const isAdmin = role === "super_admin";

  const locationFilter = isAdmin ? {} : { locationId };

  const [totalLocations, totalEmployees, totalSuppliers, totalProjects, totalInventoryItems, pendingCustodies] =
    await Promise.all([
      prisma.location.count({ where: { isActive: true } }),
      prisma.employee.count({ where: { isActive: true, ...locationFilter } }),
      prisma.supplier.count({ where: { isActive: true, ...locationFilter } }),
      prisma.project.count({ where: { status: "active", ...locationFilter } }),
      prisma.inventory.count({ where: { ...locationFilter } }),
      prisma.custody.count({ where: { status: "active", ...locationFilter } }),
    ]);

  const recentInvoices = await prisma.invoice.findMany({
    where: locationFilter,
    orderBy: { date: "desc" },
    take: 10,
    include: { supplier: { select: { name: true } } },
  });

  return (
    <DashboardClient
      totalLocations={isAdmin ? totalLocations : null}
      totalEmployees={totalEmployees}
      totalSuppliers={totalSuppliers}
      totalProjects={totalProjects}
      totalInventoryItems={totalInventoryItems}
      pendingCustodies={pendingCustodies}
      recentInvoices={recentInvoices.map((inv) => ({
        id: inv.id,
        invNo: inv.invNo,
        date: inv.date.toISOString(),
        total: inv.total,
        supplierName: inv.supplier.name,
      }))}
    />
  );
}
