"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";

type Supplier = { id: string; name: string; phone: string | null; address: string | null; taxId: string | null; isActive: boolean };

export default function SuppliersPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", taxId: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/suppliers?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function resetForm(s?: Supplier | null) {
    if (s) setForm({ name: s.name, phone: s.phone || "", address: s.address || "", taxId: s.taxId || "" });
    else setForm({ name: "", phone: "", address: "", taxId: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/suppliers/${editing.id}` : "/api/suppliers";
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setDialogOpen(false); setEditing(null); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا المورد؟")) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">الموردين</h1><p className="text-muted-foreground text-sm">إدارة الموردين</p></div>
        <button onClick={() => { setEditing(null); resetForm(null); setDialogOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> إضافة مورد</button>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="rounded-lg border border-input bg-background pr-9 pl-3 py-2 text-sm w-48" />
        </div>
      </div>
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-right p-3 font-medium">الاسم</th><th className="text-right p-3 font-medium">الهاتف</th><th className="text-right p-3 font-medium">العنوان</th>
              <th className="text-right p-3 font-medium">الرقم الضريبي</th><th className="text-right p-3 font-medium">الحالة</th><th className="text-center p-3 font-medium w-24">إجراءات</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              : items.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">لا يوجد موردين</td></tr>
              : items.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{s.name}</td><td className="p-3" dir="ltr">{s.phone || "-"}</td>
                  <td className="p-3 max-w-[200px] truncate">{s.address || "-"}</td><td className="p-3">{s.taxId || "-"}</td>
                  <td className="p-3"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.isActive ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"}`}>{s.isActive ? "نشط" : "غير نشط"}</span></td>
                  <td className="p-3"><div className="flex items-center justify-center gap-1">
                    <button onClick={() => { setEditing(s); resetForm(s); setDialogOpen(true); }} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(s.id)} className="rounded-md p-1.5 hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
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
              <Dialog.Title className="text-lg font-semibold">{editing ? "تعديل مورد" : "إضافة مورد"}</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">الاسم</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">الهاتف</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">الرقم الضريبي</label><input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">العنوان</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
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
