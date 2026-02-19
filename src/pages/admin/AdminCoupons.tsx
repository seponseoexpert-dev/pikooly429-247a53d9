import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, Ticket } from "lucide-react";
import { format } from "date-fns";

interface CouponForm {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  is_active: boolean;
  expires_at: string;
}

const empty: CouponForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  min_order_amount: 0,
  max_uses: null,
  is_active: true,
  expires_at: "",
};

const AdminCoupons = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: CouponForm) => {
      const payload = {
        code: f.code.toUpperCase().trim(),
        description: f.description,
        discount_type: f.discount_type,
        discount_value: f.discount_value,
        min_order_amount: f.min_order_amount,
        max_uses: f.max_uses,
        is_active: f.is_active,
        expires_at: f.expires_at || null,
      };
      if (editId) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: editId ? "কুপন আপডেট হয়েছে" : "কুপন তৈরি হয়েছে" });
      setOpen(false);
      setForm(empty);
      setEditId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "কুপন মুছে ফেলা হয়েছে" });
    },
  });

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount || 0,
      max_uses: c.max_uses,
      is_active: c.is_active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
    });
    setOpen(true);
  };

  const filtered = coupons.filter(
    (c: any) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">কুপন ম্যানেজমেন্ট</h2>
            <p className="text-muted-foreground text-sm">প্রোমো কোড ও কুপন পরিচালনা</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(empty); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />নতুন কুপন</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editId ? "কুপন এডিট" : "নতুন কুপন"}</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium">কোড *</label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="SAVE20" className="uppercase" />
                </div>
                <div>
                  <label className="text-sm font-medium">বিবরণ</label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="২০% ছাড়" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">ধরন</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.discount_type}
                      onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
                    >
                      <option value="percentage">শতাংশ (%)</option>
                      <option value="fixed">নির্দিষ্ট (৳)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">মান</label>
                    <Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} min={0} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">সর্বনিম্ন অর্ডার (৳)</label>
                    <Input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })} min={0} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">সর্বোচ্চ ব্যবহার</label>
                    <Input type="number" value={form.max_uses ?? ""} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })} placeholder="সীমাহীন" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">মেয়াদ শেষ</label>
                  <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} id="active" />
                  <label htmlFor="active" className="text-sm">সক্রিয়</label>
                </div>
                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="কুপন খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>কোনো কুপন পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>কোড</TableHead>
                  <TableHead>ছাড়</TableHead>
                  <TableHead>সর্বনিম্ন</TableHead>
                  <TableHead>ব্যবহার</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>মেয়াদ</TableHead>
                  <TableHead className="w-20">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: any) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => openEdit(c)}>
                    <TableCell className="font-mono font-bold">{c.code}</TableCell>
                    <TableCell>
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${c.discount_value}`}
                    </TableCell>
                    <TableCell>৳{c.min_order_amount}</TableCell>
                    <TableCell>{c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.expires_at ? format(new Date(c.expires_at), "dd MMM yyyy") : "সীমাহীন"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="icon"
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(c.id); }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCoupons;
