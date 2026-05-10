"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { formatEGP, formatDate } from "@/lib/utils";

type Expense = { id: string; category: string; amount: number; description: string; date: string; receiptNo: string | null; notes: string | null; user: { name: string } };

const CATEGORIES = [
  { value: "petty_cash", label: "نثريات" }, { value: "transport", label: "مواصلات" }, { value: "office", label: "مكتبية" },
  { value: "utilities", label: "مرافق" }, { value: "maintenance", label: "صيانة" }, { value: "other", label: "أخرى" },
];

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ category: "petty_cash", amount: 0, description: "", date: new Date().toISOString().split("T")[0]!, receiptNo: "", notes: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCat) params.set("category", filterCat);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/expenses?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [filterCat, filterFrom, filterTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function resetForm(e?: Expense | null) {
    if (e) setForm({ category: e.category, amount: e.amount, description: e.description, date: e.date.split("T")[0]!, receiptNo: e.receiptNo || "", notes: e.notes || "" });
    else setForm({ category: "petty_cash", amount: 0, description: "", date: new Date().toISOString().split("T")[0]!, receiptNo: "", notes: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/expenses/${editing.id}` : "/api/expenses";
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setDialogOpen(false); setEditing(null); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا المصروف؟")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    fetchData();
  }

  const catLabel = (c: string) => CATEGORIES.find((x) => x.value === c)?.label || c;
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">المصروفات</h1><p className="text-muted-foreground text-sm">تسجيل مصروفات الشركة</p></div>
        <button onClick={() => { setEditing(null); resetForm(null); setDialogOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> إضافة مصروف</button>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div><label className="block text-xs text-muted-foreground mb-1">التصنيف</label>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">الكل</option>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select></div>
        <div><label className="block text-xs text-muted-foreground mb-1">من</label>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
        <div><label className="block text-xs text-muted-foreground mb-1">إلى</label>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
        <div className="rounded-lg bg-muted px-4 py-2 text-sm"><span className="text-muted-foreground">الإجمالي: </span><span className="font-bold">{formatEGP(total)}</span></div>
      </div>
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-right p-3 font-medium">التاريخ</th><th className="text-right p-3 font-medium">التصنيف</th><th className="text-right p-3 font-medium">البيان</th>
              <th className="text-right p-3 font-medium">المبلغ</th><th className="text-right p-3 font-medium">رقم السند</th><th className="text-right p-3 font-medium">المسجل</th><th className="text-center p-3 font-medium w-24">إجراءات</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              : items.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">لا توجد مصروفات</td></tr>
              : items.map((x) => (
                <tr key={x.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">{formatDate(x.date)}</td><td className="p-3">{catLabel(x.category)}</td>
                  <td className="p-3 max-w-[200px] truncate">{x.description}</td><td className="p-3 font-medium">{formatEGP(x.amount)}</td>
                  <td className="p-3">{x.receiptNo || "-"}</td><td className="p-3 text-muted-foreground">{x.user.name}</td>
                  <td className="p-3"><div className="flex items-center justify-center gap-1">
                    <button onClick={() => { setEditing(x); resetForm(x); setDialogOpen(true); }} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(x.id)} className="rounded-md p-1.5 hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
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
              <Dialog.Title className="text-lg font-semibold">{editing ? "تعديل مصروف" : "إضافة مصروف"}</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">التصنيف</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium mb-1">التاريخ</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">البيان</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">المبلغ</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">رقم السند</label>
                  <input value={form.receiptNo} onChange={(e) => setForm({ ...form, receiptNo: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
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
