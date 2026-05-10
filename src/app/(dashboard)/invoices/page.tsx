"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { formatEGP, formatDate } from "@/lib/utils";

type Supplier = { id: string; name: string };
type Project = { id: string; name: string };
type Invoice = { id: string; invNo: string; date: string; subtotal: number; tax: number; total: number; notes: string | null; supplier: { id: string; name: string }; items: InvoiceItem[] };
type InvoiceItem = { id: string; code: string; name: string; qty: number; unit: string; price: number; total: number };

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ invNo: "", date: new Date().toISOString().split("T")[0], supplierId: "", projectId: "", subtotal: 0, tax: 0, total: 0, notes: "", items: [] as { code: string; name: string; qty: number; unit: string; price: number; total: number }[] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/invoices?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [search]);

  const fetchRefs = useCallback(async () => {
    const [sRes, pRes] = await Promise.all([fetch("/api/suppliers"), fetch("/api/projects?status=active")]);
    if (sRes.ok) setSuppliers(await sRes.json());
    if (pRes.ok) setProjects(await pRes.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchRefs(); }, [fetchRefs]);

  function recalc(items: { qty: number; price: number }[]) {
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const tax = subtotal * 0.14;
    return { subtotal, tax, total: subtotal + tax };
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { code: "", name: "", qty: 1, unit: "قطعة", price: 0, total: 0 }] });
  }

  function updateItem(idx: number, field: string, value: string | number) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === "qty" || field === "price") items[idx].total = items[idx].qty * items[idx].price;
    const calc = recalc(items);
    setForm({ ...form, items, ...calc });
  }

  function removeItem(idx: number) {
    const items = form.items.filter((_, i) => i !== idx);
    const calc = recalc(items);
    setForm({ ...form, items, ...calc });
  }

  function resetForm(inv?: Invoice | null) {
    if (inv) {
      setForm({
        invNo: inv.invNo, date: inv.date.split("T")[0], supplierId: inv.supplier.id, projectId: "",
        subtotal: inv.subtotal, tax: inv.tax, total: inv.total, notes: inv.notes || "",
        items: inv.items.map((i) => ({ code: i.code, name: i.name, qty: i.qty, unit: i.unit, price: i.price, total: i.total })),
      });
    } else {
      setForm({ invNo: "", date: new Date().toISOString().split("T")[0], supplierId: "", projectId: "", subtotal: 0, tax: 0, total: 0, notes: "", items: [] });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/invoices/${editing.id}` : "/api/invoices";
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setDialogOpen(false); setEditing(null); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذه الفاتورة؟")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">الفواتير</h1><p className="text-muted-foreground text-sm">إدارة فواتير المشتريات</p></div>
        <button onClick={() => { setEditing(null); resetForm(null); setDialogOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> إضافة فاتورة</button>
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
              <th className="text-right p-3 font-medium">رقم الفاتورة</th><th className="text-right p-3 font-medium">التاريخ</th><th className="text-right p-3 font-medium">المورد</th>
              <th className="text-right p-3 font-medium">الضريبة</th><th className="text-right p-3 font-medium">الإجمالي</th><th className="text-center p-3 font-medium w-24">إجراءات</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              : items.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">لا توجد فواتير</td></tr>
              : items.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{inv.invNo}</td><td className="p-3">{formatDate(inv.date)}</td>
                  <td className="p-3">{inv.supplier.name}</td><td className="p-3">{formatEGP(inv.tax)}</td>
                  <td className="p-3 font-medium">{formatEGP(inv.total)}</td>
                  <td className="p-3"><div className="flex items-center justify-center gap-1">
                    <button onClick={() => { setEditing(inv); resetForm(inv); setDialogOpen(true); }} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(inv.id)} className="rounded-md p-1.5 hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
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
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-xl shadow-lg z-50 border p-0 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <Dialog.Title className="text-lg font-semibold">{editing ? "تعديل فاتورة" : "إضافة فاتورة"}</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">رقم الفاتورة</label>
                  <input value={form.invNo} onChange={(e) => setForm({ ...form, invNo: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">التاريخ</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">المورد</label>
                  <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">اختر</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium mb-1">المشروع</label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">بدون</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select></div>
              </div>
              <div className="border rounded-lg">
                <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
                  <span className="text-sm font-medium">الأصناف</span>
                  <button type="button" onClick={addItem} className="text-xs text-primary hover:underline">+ إضافة صنف</button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 p-3 border-b last:border-0 items-end">
                    <div><label className="block text-xs text-muted-foreground mb-1">الكود</label><input value={item.code} onChange={(e) => updateItem(idx, "code", e.target.value)} className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs" /></div>
                    <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">الاسم</label><input value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs" /></div>
                    <div><label className="block text-xs text-muted-foreground mb-1">الكمية</label><input type="number" value={item.qty} onChange={(e) => updateItem(idx, "qty", parseFloat(e.target.value) || 0)} className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs" /></div>
                    <div><label className="block text-xs text-muted-foreground mb-1">السعر</label><input type="number" step="0.01" value={item.price} onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)} className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs" /></div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">{formatEGP(item.total)}</span>
                      <button type="button" onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive/80 mr-auto"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-6 text-sm">
                <span>الضريبة: <strong>{formatEGP(form.tax)}</strong></span>
                <span>الإجمالي: <strong>{formatEGP(form.total)}</strong></span>
              </div>
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
