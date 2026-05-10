"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Project = { id: string; name: string; projectLocation: string | null; startDate: string | null; endDate: string | null; status: string };

const STATUS_OPTS = [
  { value: "active", label: "نشط", color: "text-green-600 bg-green-100" },
  { value: "completed", label: "مكتمل", color: "text-blue-600 bg-blue-100" },
  { value: "cancelled", label: "ملغي", color: "text-red-600 bg-red-100" },
];

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: "", projectLocation: "", startDate: "", endDate: "", status: "active" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/projects?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function resetForm(p?: Project | null) {
    if (p) setForm({ name: p.name, projectLocation: p.projectLocation || "", startDate: p.startDate ? p.startDate.split("T")[0]! : "", endDate: p.endDate ? p.endDate.split("T")[0]! : "", status: p.status });
    else setForm({ name: "", projectLocation: "", startDate: "", endDate: "", status: "active" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/projects/${editing.id}` : "/api/projects";
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setDialogOpen(false); setEditing(null); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا المشروع؟")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    fetchData();
  }

  const badge = (s: string) => {
    const o = STATUS_OPTS.find((x) => x.value === s);
    return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${o?.color}`}>{o?.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">المشاريع</h1><p className="text-muted-foreground text-sm">إدارة مشاريع الشركة</p></div>
        <button onClick={() => { setEditing(null); resetForm(null); setDialogOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> إضافة مشروع</button>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div><label className="block text-xs text-muted-foreground mb-1">الحالة</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">الكل</option>{STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select></div>
      </div>
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-right p-3 font-medium">الاسم</th><th className="text-right p-3 font-medium">الموقع</th><th className="text-right p-3 font-medium">تاريخ البداية</th>
              <th className="text-right p-3 font-medium">تاريخ النهاية</th><th className="text-right p-3 font-medium">الحالة</th><th className="text-center p-3 font-medium w-24">إجراءات</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              : items.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">لا توجد مشاريع</td></tr>
              : items.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{p.name}</td><td className="p-3">{p.projectLocation || "-"}</td>
                  <td className="p-3">{p.startDate ? formatDate(p.startDate) : "-"}</td><td className="p-3">{p.endDate ? formatDate(p.endDate) : "-"}</td>
                  <td className="p-3">{badge(p.status)}</td>
                  <td className="p-3"><div className="flex items-center justify-center gap-1">
                    <button onClick={() => { setEditing(p); resetForm(p); setDialogOpen(true); }} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(p.id)} className="rounded-md p-1.5 hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
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
              <Dialog.Title className="text-lg font-semibold">{editing ? "تعديل مشروع" : "إضافة مشروع"}</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">الاسم</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">الموقع</label><input value={form.projectLocation} onChange={(e) => setForm({ ...form, projectLocation: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">تاريخ البداية</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">تاريخ النهاية</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">الحالة</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select></div>
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
