"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Employee = { id: string; name: string; position: string | null; baseSalary: number | null };
type Attendance = {
  id: string; date: string; checkIn: string | null; checkOut: string | null;
  status: string; overtimeHours: number; notes: string | null;
  employee: { name: string; position: string | null };
  employeeId: string;
};

const STATUS_OPTIONS = [
  { value: "present", label: "حاضر", color: "text-green-600 bg-green-100" },
  { value: "absent", label: "غائب", color: "text-red-600 bg-red-100" },
  { value: "late", label: "متأخر", color: "text-amber-600 bg-amber-100" },
  { value: "vacation", label: "إجازة", color: "text-blue-600 bg-blue-100" },
];

export default function AttendancePage() {
  const { data: session } = useSession();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]!);
  const [filterStatus, setFilterStatus] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Attendance | null>(null);
  const [form, setForm] = useState({
    employeeId: "", date: new Date().toISOString().split("T")[0]!,
    checkIn: "08:00", checkOut: "16:00", status: "present", overtimeHours: 0, notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDate) params.set("date", filterDate);
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/attendance?${params}`);
    if (res.ok) setAttendances(await res.json());
    setLoading(false);
  }, [filterDate, filterStatus]);

  const fetchEmployees = useCallback(async () => {
    const res = await fetch("/api/employees/list");
    if (res.ok) setEmployees(await res.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  function resetForm(a?: Attendance | null) {
    if (a) {
      setForm({
        employeeId: a.employeeId, date: a.date.split("T")[0]!,
        checkIn: a.checkIn ? a.checkIn.split("T")[1]?.slice(0, 5) || "08:00" : "08:00",
        checkOut: a.checkOut ? a.checkOut.split("T")[1]?.slice(0, 5) || "16:00" : "16:00",
        status: a.status, overtimeHours: a.overtimeHours, notes: a.notes || "",
      });
    } else {
      setForm({
        employeeId: "", date: new Date().toISOString().split("T")[0]!,
        checkIn: "08:00", checkOut: "16:00", status: "present", overtimeHours: 0, notes: "",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      ...form,
      checkIn: form.checkIn ? `${form.date}T${form.checkIn}:00` : null,
      checkOut: form.checkOut ? `${form.date}T${form.checkOut}:00` : null,
    };
    const url = editing ? `/api/attendance/${editing.id}` : "/api/attendance";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setDialogOpen(false); setEditing(null); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا التسجيل؟")) return;
    const res = await fetch(`/api/attendance/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  function openEdit(a: Attendance) { setEditing(a); resetForm(a); setDialogOpen(true); }
  function openCreate() { setEditing(null); resetForm(null); setDialogOpen(true); }

  const statusBadge = (s: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === s);
    const colors = opt?.color || "text-gray-600 bg-gray-100";
    return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}>{opt?.label || s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الحضور والغياب</h1>
          <p className="text-muted-foreground text-sm">تسجيل الحضور والانصراف اليومي للموظفين</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> تسجيل حضور
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">التاريخ</label>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">الحالة</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">الكل</option>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-right p-3 font-medium">الموظف</th>
                <th className="text-right p-3 font-medium">التاريخ</th>
                <th className="text-right p-3 font-medium">الحضور</th>
                <th className="text-right p-3 font-medium">الانصراف</th>
                <th className="text-right p-3 font-medium">الحالة</th>
                <th className="text-right p-3 font-medium">ساعات إضافية</th>
                <th className="text-right p-3 font-medium">ملاحظات</th>
                <th className="text-center p-3 font-medium w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              ) : attendances.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">لا توجد تسجيلات حضور</td></tr>
              ) : attendances.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">{a.employee.name}</td>
                  <td className="p-3">{formatDate(a.date)}</td>
                  <td className="p-3">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                  <td className="p-3">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                  <td className="p-3">{statusBadge(a.status)}</td>
                  <td className="p-3">{a.overtimeHours > 0 ? `${a.overtimeHours} س` : "-"}</td>
                  <td className="p-3 text-muted-foreground max-w-[150px] truncate">{a.notes || "-"}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(a)} className="rounded-md p-1.5 hover:bg-muted transition-colors" title="تعديل">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors" title="حذف">
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
              <Dialog.Title className="text-lg font-semibold">{editing ? "تعديل تسجيل حضور" : "تسجيل حضور"}</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted transition-colors"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الموظف</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر موظف</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">التاريخ</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">وقت الحضور</label>
                  <input type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">وقت الانصراف</label>
                  <input type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ساعات إضافية</label>
                  <input type="number" step="0.5" value={form.overtimeHours} onChange={(e) => setForm({ ...form, overtimeHours: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button type="button" className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted transition-colors">إلغاء</button>
                </Dialog.Close>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  {editing ? "حفظ التعديلات" : "تسجيل"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
