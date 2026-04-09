import { useState, useEffect } from "react";
import { useGetMyMerchant, useUpdateMyMerchant, getGetMyMerchantQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Building2, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: merchant, isLoading } = useGetMyMerchant();
  const update = useUpdateMyMerchant();

  const [form, setForm] = useState({ first_name: "", last_name: "", business_name: "", business_category: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (merchant) {
      setForm({
        first_name: (merchant as any).first_name || "",
        last_name: (merchant as any).last_name || "",
        business_name: (merchant as any).business_name || "",
        business_category: (merchant as any).business_category || "",
      });
    }
  }, [merchant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({ data: form as any });
      qc.invalidateQueries({ queryKey: getGetMyMerchantQueryKey() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Profile updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account and business profile</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={16} className="text-muted-foreground" />
                <h2 className="font-medium text-foreground text-sm">Personal details</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} data-testid="input-first-name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} data-testid="input-last-name" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Email</Label>
                  <Input value={(merchant as any)?.email || ""} disabled className="opacity-60" data-testid="input-email" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} className="text-muted-foreground" />
                <h2 className="font-medium text-foreground text-sm">Business details</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Business name</Label>
                  <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Your business name" data-testid="input-business-name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Business category</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.business_category}
                    onChange={(e) => setForm({ ...form, business_category: e.target.value })}
                    data-testid="select-business-category"
                  >
                    <option value="">Select category</option>
                    <option value="food_drink">Food and Drink</option>
                    <option value="retail">Retail</option>
                    <option value="health_beauty">Health and Beauty</option>
                    <option value="sport_fitness">Sport and Fitness</option>
                    <option value="services">Services</option>
                    <option value="events">Events and Entertainment</option>
                    <option value="charity">Charity and Non-profit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Settings size={16} className="text-muted-foreground" />
                <h2 className="font-medium text-foreground text-sm">Account status</h2>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className={`${(merchant as any)?.status === "active" ? "text-green-600" : "text-amber-500"}`} />
                <span className="text-sm text-foreground capitalize">{(merchant as any)?.status?.replace(/_/g, " ") || "Unknown"}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Country: {(merchant as any)?.country || "Not set"}</p>
            </div>

            <Button type="submit" disabled={update.isPending} data-testid="button-save-settings">
              {update.isPending ? "Saving..." : saved ? "Saved" : "Save changes"}
            </Button>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
