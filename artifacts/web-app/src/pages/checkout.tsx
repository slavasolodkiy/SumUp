import { useState } from "react";
import { useListCheckouts, useCreateCheckout, getListCheckoutsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link2, Copy, Plus, Check, ExternalLink } from "lucide-react";

export default function CheckoutPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", currency: "GBP", title: "", description: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: checkouts, isLoading } = useListCheckouts();
  const create = useCreateCheckout();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({ data: { ...form, amount: parseFloat(form.amount) } as any });
      qc.invalidateQueries({ queryKey: getListCheckoutsQueryKey() });
      setShowForm(false);
      setForm({ amount: "", currency: "GBP", title: "", description: "" });
      toast({ title: "Payment link created" });
    } catch {
      toast({ title: "Error", description: "Failed to create payment link", variant: "destructive" });
    }
  };

  const copyUrl = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied" });
  };

  const fmt = (n: number, c = "GBP") => new Intl.NumberFormat("en-GB", { style: "currency", currency: c }).format(n);

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">Payment Links</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create shareable checkout links</p>
          </div>
          <Button onClick={() => setShowForm(true)} data-testid="button-create-link">
            <Plus size={16} className="mr-1.5" />
            Create link
          </Button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="font-medium text-foreground mb-4">New payment link</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" min="0" step="0.01" placeholder="25.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required data-testid="input-amount" />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} data-testid="select-currency">
                  <option value="GBP">GBP (pound)</option>
                  <option value="EUR">EUR (euro)</option>
                  <option value="USD">USD (dollar)</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Title</Label>
                <Input placeholder="Coffee & Cake Package" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-title" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description (optional)</Label>
                <Input placeholder="What's included in this payment" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-description" />
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <Button type="submit" disabled={create.isPending} data-testid="button-submit-checkout">
                  {create.isPending ? "Creating..." : "Create payment link"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel">Cancel</Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : checkouts?.length ? (
            <div className="divide-y divide-border">
              {checkouts.map((c: any) => (
                <div key={c.id} className="px-5 py-4" data-testid={`card-checkout-${c.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Link2 size={15} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground" data-testid={`text-checkout-title-${c.id}`}>{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-foreground">{fmt(c.amount, c.currency)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === "pending" ? "bg-amber-100 text-amber-700" : c.status === "paid" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{c.status}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0 bg-muted/50 border border-border rounded-md px-3 py-1.5">
                      <p className="text-xs font-mono text-muted-foreground truncate" data-testid={`text-checkout-url-${c.id}`}>{c.checkout_url}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-shrink-0"
                      onClick={() => copyUrl(c.id, c.checkout_url)}
                      data-testid={`button-copy-${c.id}`}
                    >
                      {copiedId === c.id ? <Check size={13} className="mr-1" /> : <Copy size={13} className="mr-1" />}
                      {copiedId === c.id ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-16 text-center">
              <Link2 size={36} className="text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No payment links yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Create a link and share it with your customers to accept online payments</p>
              <Button className="mt-4" onClick={() => setShowForm(true)} data-testid="button-create-first-link">
                <Plus size={16} className="mr-1.5" />
                Create your first link
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
