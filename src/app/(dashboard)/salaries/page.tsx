"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { formatEGP } from "@/lib/utils";

type Employee = { id: string; name: string; position: string | null; baseSalary: number | null };
type Salary = {
  id: string; month: number; year: number; base: number; bonuses: number;
  deductions: number; net: number; paidDate: string; notes: string | null;
  employee: { name: string; position: string | null };
  employeeId: string;
};

const MONTHS = [
  { value: 1, label: "يناير" }, { value: 2, label: "فبراير" }, { value: 3, label: "مارس" },
  { value: 4, label: "أبريل" }, { value: 5, label: "مايو" }, { value: 6, label: "يونيو" },
  { value: 7, label: "يوليو" }, { value: 8, label: "أغسطس" }, { value: 9, label: "سبتمبر" },
  { value: 10, label: "أكتوبر" }, { value: 11, label: "نوفمبر" }, { value: 12, label: "ديسمبر" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function SalariesPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";

  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState<string>(currentYear.toString());
  const [filterEmployee, setFilterEmployee] = useState("");
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Salary | null>(null);
  const [form, setForm] = useState({
    employeeId: "", month: new Date().getMonth() + 1, year: currentYear,
    base: 0, bonuses: 0, deductions: 0, net: 0, paidDate: new Date().toISOString().split("T")[0], notes: "",
  });

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterMonth) params.set("month", filterMonth);
    if (filterYear) params.set("year", filterYear);
    if (filterEmployee) params.set("employeeId", filterEmployee);
    const res = await fetch(`/api/salaries?${params}`);
    if (res.ok) {
      const data = await res.json();
      setSalaries(data.salaries);
    }
    setLoading(false);
  }, [filterMonth, filterYear, filterEmployee]);

  const fetchEmployees = useCallback(async () => {
    const res = await fetch("/api/employees/list");
    if (res.ok) {
      const data = await res.json();
      setEmployees(data);
    }
  }, []);

  useEffect(() => { fetchSalaries(); }, [fetchSalaries]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  function resetForm(emp?: Salary | null) {
    if (emp) {
      setForm({
        employeeId: emp.employeeId, month: emp.month, year: emp.year,
        base: emp.base, bonuses: emp.bonuses, deductions: emp.deductions,
        net: emp.net, paidDate: emp.paidDate.split("T")[0] || new Date().toISOString().split("T")[0],
        notes: emp.notes || "",
      });
    } else {
      setForm({
        employeeId: "", month: new Date().getMonth() + 1, year: currentYear,
        base: 0, bonuses: 0, deductions: 0, net: 0,
        paidDate: new Date().toISOString().split("T")[0], notes: "",
      });
    }
  }

  function calcNet(base: number, bonuses: number, deductions: number) {
    return base + bonuses - deductions;
  }

  function handleFieldChange(field: string, value: string | number) {
    const updated = { ...form, [field]: value };
    if (["base", "bonuses", "deductions"].includes(field)) {
      updated.net = calcNet(updated.base, updated.bonuses, updated.deductions);
    }
    if (field === "employeeId") {
      const emp = employees.find((e) => e.id === value);
      if (emp && emp.baseSalary) {
        updated.base = emp.baseSalary;
        updated.net = calcNet(emp.baseSalary, updated.bonuses, updated.deductions);
      }
    }
    setForm(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/salaries/${editing.id}` : "/api/salaries";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setDialogOpen(false);
      setEditing(null);
      fetchSalaries();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الراتب؟")) return;
    const res = await fetch(`/api/salaries/${id}`, { method: "DELETE" });
    if (res.ok) fetchSalaries();
  }

  function openEdit(salary: Salary) {
    setEditing(salary);
    resetForm(salary);
    setDialogOpen(true);
  }

  function openCreate() {
    setEditing(null);
    resetForm(null);
    setDialogOpen(true);
  }

  const filteredSalaries = salaries.filter((s) =>
    !search || s.employee.name.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المرتبات</h1>
          <p className="text-muted-foreground text-sm">إدارة رواتب الموظفين</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> إضافة مرتب
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">الشهر</label>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">الكل</option>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">السنة</label>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">الكل</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">الموظف</label>
          <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">كل الموظفين</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..."
            className="rounded-lg border border-input bg-background pr-9 pl-3 py-2 text-sm w-48" />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-right p-3 font-medium">الموظف</th>
                <th className="text-right p-3 font-medium">الوظيفة</th>
                <th className="text-right p-3 font-medium">الشهر</th>
                <th className="text-right p-3 font-medium">السنة</th>
                <th className="text-right p-3 font-medium">الأساسي</th>
                <th className="text-right p-3 font-medium">الإضافي</th>
                <th className="text-right p-3 font-medium">الخصم</th>
                <th className="text-right p-3 font-medium">الصافي</th>
                <th className="text-right p-3 font-medium">تاريخ الصرف</th>
                <th className="text-center p-3 font-medium w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              ) : filteredSalaries.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">لا توجد مرتبات</td></tr>
              ) : filteredSalaries.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">{s.employee.name}</td>
                  <td className="p-3 text-muted-foreground">{s.employee.position || "-"}</td>
                  <td className="p-3">{MONTHS.find((m) => m.value === s.month)?.label}</td>
                  <td className="p-3">{s.year}</td>
                  <td className="p-3">{formatEGP(s.base)}</td>
                  <td className="p-3 text-green-600">{formatEGP(s.bonuses)}</td>
                  <td className="p-3 text-red-600">{formatEGP(s.deductions)}</td>
                  <td className="p-3 font-medium">{formatEGP(s.net)}</td>
                  <td className="p-3 text-muted-foreground">{new Date(s.paidDate).toLocaleDateString("ar-EG")}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(s)}
                        className="rounded-md p-1.5 hover:bg-muted transition-colors" title="تعديل">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(s.id)}
                        className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors" title="حذف">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card rounded-xl shadow-lg z-50 border p-0 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <Dialog.Title className="text-lg font-semibold">
                {editing ? "تعديل المرتب" : "إضافة مرتب"}
              </Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الموظف</label>
                <select value={form.employeeId} onChange={(e) => handleFieldChange("employeeId", e.target.value)} required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر موظف</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الشهر</label>
                  <select value={form.month} onChange={(e) => handleFieldChange("month", parseInt(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السنة</label>
                  <select value={form.year} onChange={(e) => handleFieldChange("year", parseInt(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الأساسي</label>
                  <input type="number" value={form.base} onChange={(e) => handleFieldChange("base", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الإضافي</label>
                  <input type="number" value={form.bonuses} onChange={(e) => handleFieldChange("bonuses", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الخصم</label>
                  <input type="number" value={form.deductions} onChange={(e) => handleFieldChange("deductions", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الصافي</label>
                <input type="number" value={form.net} readOnly
                  className="w-full rounded-lg border bg-muted px-3 py-2 text-sm font-medium" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ الصرف</label>
                <input type="date" value={form.paidDate} onChange={(e) => handleFieldChange("paidDate", e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={(e) => handleFieldChange("notes", e.target.value)} rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button type="button"
                    className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted transition-colors">
                    إلغاء
                  </button>
                </Dialog.Close>
                <button type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  {editing ? "حفظ التعديلات" : "إضافة"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
