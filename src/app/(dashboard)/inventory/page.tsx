"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { formatEGP } from "@/lib/utils";

type Item = { id: string; itemCode: string; itemName: string; category: string | null; unit: string; qty: number; unitPrice: number; minQty: number | null; location: { name: string } };

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ itemCode: "", itemName: "", category: "", unit: "قطعة", qty: 0, unitPrice: 0, minQty: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    const res = await fetch(`/api/inventory?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [category, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function resetForm(i?: Item | null) {
    if (i) setForm({ itemCode: i.itemCode, itemName: i.itemName, category: i.category || "", unit: i.unit, qty: i.qty, unitPrice: i.unitPrice, minQty: i.minQty || 0 });
    else setForm({ itemCode: "", itemName: "", category: "", unit: "قطعة", qty: 0, unitPrice: 0, minQty: 0 });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/inventory/${editing.id}` : "/api/inventory";
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setDialogOpen(false); setEditing(null); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا الصنف؟")) return;
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">المخزون</h1><p className="text-muted-foreground text-sm">إدارة أصناف المخازن</p></div>
        <button onClick={() => { setEditing(null); resetForm(null); setDialogOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> إضافة صنف
        </button>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">التصنيف</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">الكل</option>
            {categories.map((c) => <option key={c} value={c!}>{c}</option>)}
          </select>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="rounded-lg border border-input bg-background pr-9 pl-3 py-2 text-sm w-48" />
        </div>
      </div>
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-right p-3 font-medium">الكود</th><th className="text-right p-3 font-medium">الاسم</th><th className="text-right p-3 font-medium">التصنيف</th>
                <th className="text-right p-3 font-medium">الوحدة</th><th className="text-right p-3 font-medium">الكمية</th><th className="text-right p-3 font-medium">السعر</th>
                <th className="text-right p-3 font-medium">الإجمالي</th><th className="text-right p-3 font-medium">الحد الأدنى</th><th className="text-center p-3 font-medium w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              : items.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">لا توجد أصناف</td></tr>
              : items.map((i) => (
                <tr key={i.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{i.itemCode}</td>
                  <td className="p-3">{i.itemName}</td>
                  <td className="p-3">{i.category || "-"}</td>
                  <td className="p-3">{i.unit}</td>
                  <td className={`p-3 font-medium ${i.minQty && i.qty <= i.minQty ? "text-red-600" : ""}`}>{i.qty}</td>
                  <td className="p-3">{formatEGP(i.unitPrice)}</td>
                  <td className="p-3 font-medium">{formatEGP(i.qty * i.unitPrice)}</td>
                  <td className="p-3">{i.minQty || "-"}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditing(i); resetForm(i); setDialogOpen(true); }} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(i.id)} className="rounded-md p-1.5 hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
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
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card rounded-xl shadow-lg z-50 border p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <Dialog.Title className="text-lg font-semibold">{editing ? "تعديل صنف" : "إضافة صنف"}</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">الكود</label><input value={form.itemCode} onChange={(e) => setForm({ ...form, itemCode: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">الاسم</label><input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">التصنيف</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">الوحدة</label><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">الكمية</label><input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">سعر الوحدة</label><input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">الحد الأدنى</label><input type="number" value={form.minQty} onChange={(e) => setForm({ ...form, minQty: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
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
