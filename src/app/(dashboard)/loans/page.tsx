"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { formatEGP, formatDate } from "@/lib/utils";

type Employee = { id: string; name: string; position: string | null; baseSalary: number | null };
type Loan = {
  id: string; amount: number; installments: number; installmentAmount: number;
  paidAmount: number; remaining: number; date: string; status: string; notes: string | null;
  employee: { name: string; position: string | null; baseSalary: number | null };
  employeeId: string;
};

export default function LoansPage() {
  const { data: session } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [form, setForm] = useState({
    employeeId: "", amount: 0, installments: 1, notes: "",
  });
  const [editForm, setEditForm] = useState({
    paidAmount: 0, remaining: 0, status: "active", notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterEmployee) params.set("employeeId", filterEmployee);
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/loans?${params}`);
    if (res.ok) setLoans(await res.json());
    setLoading(false);
  }, [filterEmployee, filterStatus]);

  const fetchEmployees = useCallback(async () => {
    const res = await fetch("/api/employees/list");
    if (res.ok) setEmployees(await res.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setDialogOpen(false); setForm({ employeeId: "", amount: 0, installments: 1, notes: "" }); fetchData(); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const res = await fetch(`/api/loans/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) { setEditDialogOpen(false); setEditing(null); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا السلف؟")) return;
    const res = await fetch(`/api/loans/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  function openEdit(loan: Loan) {
    setEditing(loan);
    setEditForm({ paidAmount: loan.paidAmount, remaining: loan.remaining, status: loan.status, notes: loan.notes || "" });
    setEditDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">السلف</h1>
          <p className="text-muted-foreground text-sm">إدارة سلف الموظفين</p>
        </div>
        <button onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> إضافة سلفة
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
          <label className="block text-xs text-muted-foreground mb-1">الحالة</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">الكل</option>
            <option value="active">نشط</option>
            <option value="paid">مسدد</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-right p-3 font-medium">الموظف</th>
                <th className="text-right p-3 font-medium">المبلغ</th>
                <th className="text-right p-3 font-medium">الأقساط</th>
                <th className="text-right p-3 font-medium">القسط</th>
                <th className="text-right p-3 font-medium">المدفوع</th>
                <th className="text-right p-3 font-medium">المتبقي</th>
                <th className="text-right p-3 font-medium">التاريخ</th>
                <th className="text-right p-3 font-medium">الحالة</th>
                <th className="text-right p-3 font-medium">ملاحظات</th>
                <th className="text-center p-3 font-medium w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">لا توجد سلف</td></tr>
              ) : loans.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">{l.employee.name}</td>
                  <td className="p-3 font-medium">{formatEGP(l.amount)}</td>
                  <td className="p-3">{l.installments}</td>
                  <td className="p-3">{formatEGP(l.installmentAmount)}</td>
                  <td className="p-3 text-green-600">{formatEGP(l.paidAmount)}</td>
                  <td className="p-3 text-red-600">{formatEGP(l.remaining)}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(l.date)}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      l.status === "paid" ? "text-green-600 bg-green-100" : "text-amber-600 bg-amber-100"
                    }`}>{l.status === "paid" ? "مسدد" : "نشط"}</span>
                  </td>
                  <td className="p-3 text-muted-foreground max-w-[120px] truncate">{l.notes || "-"}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(l)} className="rounded-md p-1.5 hover:bg-muted" title="تعديل">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(l.id)} className="rounded-md p-1.5 hover:bg-destructive/10" title="حذف">
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

      {/* Create Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card rounded-xl shadow-lg z-50 border p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <Dialog.Title className="text-lg font-semibold">إضافة سلفة</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الموظف</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر موظف</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المبلغ</label>
                <input type="number" step="0.01" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">عدد الأقساط</label>
                <input type="number" min="1" value={form.installments} onChange={(e) => setForm({ ...form, installments: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button type="button" className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted">إلغاء</button>
                </Dialog.Close>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">إضافة</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Dialog */}
      <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card rounded-xl shadow-lg z-50 border p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <Dialog.Title className="text-lg font-semibold">تحديث السلفة</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={handleEdit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">المبلغ المدفوع</label>
                <input type="number" step="0.01" value={editForm.paidAmount} onChange={(e) => setEditForm({ ...editForm, paidAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المبلغ المتبقي</label>
                <input type="number" step="0.01" value={editForm.remaining} onChange={(e) => setEditForm({ ...editForm, remaining: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الحالة</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="active">نشط</option>
                  <option value="paid">مسدد</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button type="button" className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted">إلغاء</button>
                </Dialog.Close>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">حفظ</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
