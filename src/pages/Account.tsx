import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Package, Mail, Phone, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

const Account = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const startEditing = () => {
    setEditName(profile?.full_name || user?.user_metadata?.full_name || "");
    setEditPhone(profile?.phone || "");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    const name = editName.trim().slice(0, 100);
    const phone = editPhone.trim().slice(0, 20);
    if (!name) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name, phone: phone || null })
        .eq("user_id", user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Profile updated!");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading || !user) {
    return (
      <main className="section-container py-20 text-center text-muted-foreground">
        Loading...
      </main>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  return (
    <main className="section-container py-6 pb-24 md:pb-10">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        {!editing ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User size={28} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-display font-bold text-foreground truncate">{displayName}</h1>
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                <Mail size={14} />
                {user.email}
              </p>
              {profile?.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Phone size={14} />
                  {profile.phone}
                </p>
              )}
            </div>
            <button onClick={startEditing} className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-muted shrink-0">
              <Pencil size={18} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                maxLength={20}
                placeholder="01XXXXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Check size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <h2 className="text-base font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Package size={18} className="text-primary" />
          Recent Orders
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between border border-border/50 rounded-xl p-3.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">৳{order.total}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    order.status === "delivered" ? "bg-green-100 text-green-700" :
                    order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors text-sm font-medium"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </main>
  );
};

export default Account;
