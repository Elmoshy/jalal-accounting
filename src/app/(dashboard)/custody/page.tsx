"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { formatEGP, formatDate } from "@/lib/utils";

type Employee = { id: string; name: string };
type Custody = { id: string; itemName: string; qty: number; value: number | null; dateAssigned: string; dateReturned: string | null; status: string; notes: string | null; employee: { name: string }; employeeId: string };

const STATUS_OPTS = [
  { value: "active", label: "نشط", color: "text-blue-600 bg-blue-100" },
  { value: "returned", label: "مرتجع", color: "text-green-600 bg-green-100" },
  { value: "lost", label: "مفقود", color: "text-red-600 bg-red-100" },
];

export default function CustodyPage() {
  const [items, setItems] = useState<Custody[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEmp, setFilterEmp] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Custody | null>(null);
  const [form, setForm] = useState({ employeeId: "", itemName: "", qty: 1, value: 0, notes: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterEmp) params.set("employeeId", filterEmp);
    const res = await fetch(`/api/custody?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [filterStatus, filterEmp]);

  const fetchEmps = useCallback(async () => {
    const res = await fetch("/api/employees/list");
    if (res.ok) setEmployees(await res.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchEmps(); }, [fetchEmps]);

  function resetForm(c?: Custody | null) {
    if (c) setForm({ employeeId: c.employeeId, itemName: c.itemName, qty: c.qty, value: c.value || 0, notes: c.notes || "" });
    else setForm({ employeeId: "", itemName: "", qty: 1, value: 0, notes: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/custody/${editing.id}` : "/api/custody";
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setDialogOpen(false); setEditing(null); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذه العهدة؟")) return;
    await fetch(`/api/custody/${id}`, { method: "DELETE" });
    fetchData();
  }

  const badge = (s: string) => {
    const o = STATUS_OPTS.find((x) => x.value === s);
    return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${o?.color}`}>{o?.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">العهد</h1><p className="text-muted-foreground text-sm">إدارة عهد الموظفين</p></div>
        <button onClick={() => { setEditing(null); resetForm(null); setDialogOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> إضافة عهدة</button>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div><label className="block text-xs text-muted-foreground mb-1">الحالة</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">الكل</option>{STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select></div>
        <div><label className="block text-xs text-muted-foreground mb-1">الموظف</label>
          <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">الكل</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select></div>
      </div>
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-right p-3 font-medium">الموظف</th><th className="text-right p-3 font-medium">الاسم</th><th className="text-right p-3 font-medium">الكمية</th>
              <th className="text-right p-3 font-medium">القيمة</th><th className="text-right p-3 font-medium">تاريخ الاستلام</th><th className="text-right p-3 font-medium">تاريخ الإرجاع</th>
              <th className="text-right p-3 font-medium">الحالة</th><th className="text-center p-3 font-medium w-24">إجراءات</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              : items.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">لا توجد عهد</td></tr>
              : items.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">{c.employee.name}</td><td className="p-3">{c.itemName}</td><td className="p-3">{c.qty}</td>
                  <td className="p-3">{c.value ? formatEGP(c.value) : "-"}</td><td className="p-3">{formatDate(c.dateAssigned)}</td>
                  <td className="p-3">{c.dateReturned ? formatDate(c.dateReturned) : "-"}</td><td className="p-3">{badge(c.status)}</td>
                  <td className="p-3"><div className="flex items-center justify-center gap-1">
                    <button onClick={() => { setEditing(c); resetForm(c); setDialogOpen(true); }} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(c.id)} className="rounded-md p-1.5 hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card rounded-xl shadow-lg z-50 border p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <Dialog.Title className="text-lg font-semibold">{editing ? "تعديل العهدة" : "إضافة عهدة"}</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">الموظف</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium mb-1">اسم العهدة</label>
                <input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">الكمية</label>
                  <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: parseInt(e.target.value) || 1 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">القيمة</label>
                  <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
              {editing && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">الحالة</label>
                    <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-medium mb-1">تاريخ الإرجاع</label>
                    <input type="date" onChange={(e) => setEditing({ ...editing, dateReturned: e.target.value || null })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                </div>
              )}
              <div><label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <Dialog.Close asChild><button type="button" className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted">إلغاء</button></Dialog.Close>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">{editing ? "حفظ" : "إضافة"}</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
