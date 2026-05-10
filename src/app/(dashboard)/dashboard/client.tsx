"use client";

import { motion } from "framer-motion";
import { Package, Users, Building2, ShieldCheck, FileText, MapPin } from "lucide-react";
import { staggerContainer, slideUp, cardHover, fadeIn } from "@/lib/animations";

interface DashboardClientProps {
  totalLocations: number | null;
  totalEmployees: number;
  totalSuppliers: number;
  totalProjects: number;
  totalInventoryItems: number;
  pendingCustodies: number;
  recentInvoices: Array<{
    id: string;
    invNo: string;
    date: string;
    total: number;
    supplierName: string;
  }>;
}

export function DashboardClient(props: DashboardClientProps) {
  const stats = [
    ...(props.totalLocations !== null
      ? [{ label: "المدن", value: props.totalLocations, icon: MapPin, color: "text-blue-600 bg-blue-100" }]
      : []),
    { label: "الموظفين", value: props.totalEmployees, icon: Users, color: "text-green-600 bg-green-100" },
    { label: "الموردين", value: props.totalSuppliers, icon: Users, color: "text-amber-600 bg-amber-100" },
    { label: "المشاريع", value: props.totalProjects, icon: Building2, color: "text-purple-600 bg-purple-100" },
    { label: "المخزون", value: props.totalInventoryItems, icon: Package, color: "text-cyan-600 bg-cyan-100" },
    { label: "عهد نشطة", value: props.pendingCustodies, icon: ShieldCheck, color: "text-rose-600 bg-rose-100" },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={slideUp}>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة على النظام المحاسبي</p>
      </motion.div>

      <motion.div variants={staggerContainer} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={slideUp}
              whileHover={{ y: -4, boxShadow: "0 8px 25px rgba(0,0,0,0.1)", transition: { type: "spring", stiffness: 400, damping: 20 } }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl border bg-card p-4 shadow-sm cursor-default"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={false}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className={`rounded-lg p-2 ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={slideUp} className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">آخر الفواتير</h2>
        </div>
        <div className="p-4">
          {props.recentInvoices.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground text-center py-8"
            >
              لا توجد فواتير بعد
            </motion.p>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
              {props.recentInvoices.map((inv) => (
                <motion.div
                  key={inv.id}
                  variants={fadeIn}
                  whileHover={{ backgroundColor: "hsl(var(--accent)/0.3)", borderRadius: 8 }}
                  className="flex items-center justify-between py-2 px-1 border-b last:border-0 -mx-1 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{inv.invNo}</p>
                      <p className="text-xs text-muted-foreground">{inv.supplierName}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(inv.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(inv.date).toLocaleDateString("ar-EG")}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
