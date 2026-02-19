import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings } from "lucide-react";

const settingLabels: Record<string, string> = {
  store_name: "স্টোরের নাম",
  store_phone: "ফোন নম্বর",
  store_email: "ইমেইল",
  store_address: "ঠিকানা",
  delivery_fee: "ডেলিভারি ফি (৳)",
  free_delivery_min: "ফ্রি ডেলিভারি সর্বনিম্ন (৳)",
  whatsapp_number: "WhatsApp নম্বর",
};

const AdminSettings = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").order("key");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const vals: Record<string, string> = {};
      settings.forEach((s: any) => { vals[s.key] = s.value || ""; });
      setFormValues(vals);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (vals: Record<string, string>) => {
      const promises = Object.entries(vals).map(([key, value]) =>
        supabase.from("site_settings").update({ value }).eq("key", key)
      );
      const results = await Promise.all(promises);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({ title: "সেটিংস সেভ হয়েছে" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formValues);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-display font-bold">সেটিংস</h2>
          <p className="text-muted-foreground text-sm">স্টোর কনফিগারেশন</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">সাধারণ সেটিংস</h3>
              </div>
              {Object.entries(settingLabels).map(([key, label]) => (
                <div key={key}>
                  <label className="text-sm font-medium">{label}</label>
                  <Input
                    value={formValues[key] || ""}
                    onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <Button type="submit" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </Button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
