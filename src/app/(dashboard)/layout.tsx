"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  ShieldCheck,
  Wallet,
  Users,
  FileText,
  Building2,
  UserCog,
  LogOut,
  Sun,
  Moon,
  KeyRound,
  Clock,
  CalendarCheck,
  HandCoins,
} from "lucide-react";
import { ChangePasswordDialog } from "@/components/shared/change-password-dialog";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, roles: ["super_admin", "city_admin", "accountant", "viewer"] },
  { href: "/inventory", label: "المخزون", icon: Package, roles: ["super_admin", "city_admin", "accountant", "viewer"] },
  { href: "/salaries", label: "المرتبات", icon: DollarSign, roles: ["super_admin", "city_admin"] },
  { href: "/attendance", label: "الحضور والغياب", icon: Clock, roles: ["super_admin", "city_admin", "accountant"] },
  { href: "/vacations", label: "الإجازات", icon: CalendarCheck, roles: ["super_admin", "city_admin"] },
  { href: "/loans", label: "السلف", icon: HandCoins, roles: ["super_admin", "city_admin"] },
  { href: "/custody", label: "العهد", icon: ShieldCheck, roles: ["super_admin", "city_admin", "accountant"] },
  { href: "/expenses", label: "المصروفات", icon: Wallet, roles: ["super_admin", "city_admin", "accountant"] },
  { href: "/suppliers", label: "الموردين", icon: Users, roles: ["super_admin", "city_admin", "accountant", "viewer"] },
  { href: "/invoices", label: "الفواتير", icon: FileText, roles: ["super_admin", "city_admin", "accountant", "viewer"] },
  { href: "/employees", label: "الموظفين", icon: Building2, roles: ["super_admin", "city_admin", "accountant"] },
  { href: "/projects", label: "المشاريع", icon: Building2, roles: ["super_admin", "city_admin", "accountant", "viewer"] },
  { href: "/locations", label: "إدارة المدن", icon: Building2, roles: ["super_admin"] },
  { href: "/users", label: "المستخدمين", icon: UserCog, roles: ["super_admin"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return null;

  const userRole = session.user?.role as string;
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-l bg-sidebar-background flex flex-col fixed h-full">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">جلال عثمان</h2>
          <p className="text-xs text-muted-foreground">النظام المحاسبي</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-foreground">{session.user?.name}</p>
              <p className="text-xs truncate">{session.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPasswordDialogOpen(true)}
              className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent/50 transition-colors"
              title="تغيير كلمة المرور"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent/50 transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "فاتح" : "داكن"}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <ChangePasswordDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />
      </aside>

      <main className="mr-64 flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
