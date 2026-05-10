"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type Location = { id: string; name: string };
type User = { id: string; name: string; email: string; role: string; isActive: boolean; locationId: string | null; location: { name: string } | null };

const ROLES = [
  { value: "super_admin", label: "مدير عام" },
  { value: "city_admin", label: "مدير فرع" },
  { value: "accountant", label: "محاسب" },
  { value: "viewer", label: "مشاهد" },
];

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer", locationId: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "", password: "", role: "", locationId: "", isActive: true });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [uRes, lRes] = await Promise.all([fetch("/api/users"), fetch("/api/locations")]);
    if (uRes.ok) setItems(await uRes.json());
    if (lRes.ok) setLocations(await lRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setDialogOpen(false); setForm({ name: "", email: "", password: "", role: "viewer", locationId: "" }); fetchData(); }
  }

  function openEdit(u: User) {
    setEditing(u);
    setEditForm({ name: u.name, email: u.email, password: "", role: u.role, locationId: u.locationId || "", isActive: u.isActive });
    setDialogOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const body = { ...editForm };
    if (!body.password) delete body.password;
    const res = await fetch(`/api/users/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setDialogOpen(false); setEditing(null); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا المستخدم؟")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchData();
  }

  const roleBadge = (r: string) => {
    const role = ROLES.find((x) => x.value === r);
    const colors: Record<string, string> = { super_admin: "text-purple-600 bg-purple-100", city_admin: "text-blue-600 bg-blue-100", accountant: "text-green-600 bg-green-100", viewer: "text-gray-600 bg-gray-100" };
    return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[r] || "bg-gray-100"}`}>{role?.label || r}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">المستخدمين</h1><p className="text-muted-foreground text-sm">إدارة حسابات المستخدمين</p></div>
        <button onClick={() => { setEditing(null); setForm({ name: "", email: "", password: "", role: "viewer", locationId: "" }); setDialogOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> إضافة مستخدم</button>
      </div>
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-right p-3 font-medium">الاسم</th><th className="text-right p-3 font-medium">البريد</th><th className="text-right p-3 font-medium">الصلاحية</th>
              <th className="text-right p-3 font-medium">الفرع</th><th className="text-right p-3 font-medium">الحالة</th><th className="text-center p-3 font-medium w-24">إجراءات</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">جاري التحميل...</td></tr>
              : items.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">لا يوجد مستخدمين</td></tr>
              : items.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{u.name}</td><td className="p-3" dir="ltr">{u.email}</td><td className="p-3">{roleBadge(u.role)}</td>
                  <td className="p-3">{u.location?.name || "-"}</td>
                  <td className="p-3"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${u.isActive ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"}`}>{u.isActive ? "نشط" : "غير نشط"}</span></td>
                  <td className="p-3"><div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(u)} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(u.id)} className="rounded-md p-1.5 hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
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
              <Dialog.Title className="text-lg font-semibold">{editing ? "تعديل مستخدم" : "إضافة مستخدم"}</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <form onSubmit={editing ? handleEdit : handleCreate} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">الاسم</label>
                  <input value={editing ? editForm.name : form.name} onChange={(e) => editing ? setEditForm({ ...editForm, name: e.target.value }) : setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">البريد</label>
                  <input type="email" value={editing ? editForm.email : form.email} onChange={(e) => editing ? setEditForm({ ...editForm, email: e.target.value }) : setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">كلمة المرور {editing ? "(اتركها فارغة إذا لم ترد التغيير)" : ""}</label>
                <input type="password" value={editing ? editForm.password : form.password} onChange={(e) => editing ? setEditForm({ ...editForm, password: e.target.value }) : setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">الصلاحية</label>
                  <select value={editing ? editForm.role : form.role} onChange={(e) => editing ? setEditForm({ ...editForm, role: e.target.value }) : setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium mb-1">الفرع</label>
                  <select value={editing ? editForm.locationId : form.locationId} onChange={(e) => editing ? setEditForm({ ...editForm, locationId: e.target.value }) : setForm({ ...form, locationId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">جميع الفروع</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select></div>
              </div>
              {editing && (
                <div><label className="block text-sm font-medium mb-1">الحالة</label>
                  <select value={editForm.isActive ? "active" : "inactive"} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "active" })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="active">نشط</option><option value="inactive">غير نشط</option>
                  </select></div>
              )}
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
