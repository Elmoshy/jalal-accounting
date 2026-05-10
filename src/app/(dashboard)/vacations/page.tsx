"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Employee = { id: string; name: string; position: string | null };
type Vacation = {
  id: string; type: string; startDate: string; endDate: string;
  days: number; status: string; notes: string | null;
  employee: { name: string; position: string | null };
  employeeId: string;
};

const VACATION_TYPES = [
  { value: "annual", label: "سنوية" },
  { value: "sick", label: "مرضية" },
  { value: "emergency", label: "طارئة" },
  { value: "pilgrimage", label: "حج" },
  { value: "marriage", label: "زواج" },
  { value: "maternity", label: "وضع" },
  { value: "unpaid", label: "بدون أجر" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "معلق", color: "text-amber-600 bg-amber-100" },
  { value: "approved", label: "معتمدة", color: "text-green-600 bg-green-100" },
  { value: "rejected", label: "مرفوضة", color: "text-red-600 bg-red-100" },
];

const MAX_DAYS = 84;

export default function VacationsPage() {
  const { data: session } = useSession();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vacation | null>(null);
  const [form, setForm] = useState({
    employeeId: "", type: "annual", startDate: "", endDate: "",
    days: 1, status: "pending", notes: "",
  });
  const [errMsg, setErrMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterEmployee) params.set("employeeId", filterEmployee);
    if (filterYear) params.set("year", filterYear);
    const res = await fetch(`/api/vacations?${params}`);
    if (res.ok) setVacations(await res.json());
    setLoading(false);
  }, [filterEmployee, filterYear]);

  const fetchEmployees = useCallback(async () => {
    const res = await fetch("/api/employees/list");
    if (res.ok) setEmployees(await res.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  function resetForm(v?: Vacation | null) {
    if (v) {
      setForm({
        employeeId: v.employeeId, type: v.type,
        startDate: v.startDate.split("T")[0], endDate: v.endDate.split("T")[0],
        days: v.days, status: v.status, notes: v.notes || "",
      });
    } else {
      setForm({ employeeId: "", type: "annual", startDate: "", endDate: "", days: 1, status: "pending", notes: "" });
    }
    setErrMsg("");
  }

  function calcDays(start: string, end: string) {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg("");
    const res = await fetch(editing ? `/api/vacations/${editing.id}` : "/api/vacations", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setDialogOpen(false);
      setEditing(null);
      fetchData();
    } else {
      setErrMsg(data.error || "حدث خطأ");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه الإجازة؟")) return;
    const res = await fetch(`/api/vacations/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  function openEdit(v: Vacation) { setEditing(v); resetForm(v); setDialogOpen(true); }
  function openCreate() { setEditing(null); resetForm(null); setDialogOpen(true); }

  function updateDateField(field: string, value: string) {
    const updated = { ...form, [field]: value };
    if (updated.startDate && updated.endDate) {
      updated.days = calcDays(updated.startDate, updated.endDate);
    }
    setForm(updated);
  }

  const typeBadge = (t: string) => VACATION_TYPES.find((vt) => vt.value === t)?.label || t;
  const statusBadge = (s: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === s);
    const colors = opt?.color || "text-gray-600 bg-gray-100";
    return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}>{opt?.label || s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الإجازات</h1>
          <p className="text-muted-foreground text-sm">إدارة إجازات الموظفين (حد أقصى {MAX_DAYS} يوم/السنة)</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> إضافة إجازة
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">الموظف</label>
          <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">الكل</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">السنة</label>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-right p-3 font-medium">الموظف</th>
                <th className="text-right p-3 font-medium">النوع</th>
                <th className="text-right p-3 font-medium">من</th>
                <th className="text-right p-3 font-medium">إلى</th>
                <th className="text-right p-3 font-medium">أيام</th>
                <th className="text-right p-3 font-medium">الحالة</th>
                <th className="text-right p-3 font-medium">ملاحظات</th>
                <th className="text-center p-3 font-medium w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              ) : vacations.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">لا توجد إجازات</td></tr>
              ) : vacations.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">{v.employee.name}</td>
                  <td className="p-3">{typeBadge(v.type)}</td>
                  <td className="p-3">{formatDate(v.startDate)}</td>
                  <td className="p-3">{formatDate(v.endDate)}</td>
                  <td className="p-3 font-medium">{v.days}</td>
                  <td className="p-3">{statusBadge(v.status)}</td>
                  <td className="p-3 text-muted-foreground max-w-[150px] truncate">{v.notes || "-"}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(v)} className="rounded-md p-1.5 hover:bg-muted" title="تعديل">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(v.id)} className="rounded-md p-1.5 hover:bg-destructive/10" title="حذف">
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
              <Dialog.Title className="text-lg font-semibold">{editing ? "تعديل الإجازة" : "إضافة إجازة"}</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {errMsg && <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">{errMsg}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">الموظف</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر موظف</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">نوع الإجازة</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {VACATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">من تاريخ</label>
                  <input type="date" value={form.startDate} onChange={(e) => updateDateField("startDate", e.target.value)} required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
                  <input type="date" value={form.endDate} onChange={(e) => updateDateField("endDate", e.target.value)} required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">عدد الأيام</label>
                <input type="number" value={form.days} onChange={(e) => setForm({ ...form, days: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button type="button" className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted">إلغاء</button>
                </Dialog.Close>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
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
