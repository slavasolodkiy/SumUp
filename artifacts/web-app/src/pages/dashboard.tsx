import { useGetMerchantSummary } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import { TrendingUp, CreditCard, ArrowUpRight, Package } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: React.ElementType }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5" data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={16} className="text-primary" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-foreground" data-testid={`text-stat-value-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    successful: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    refunded: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { merchant } = useAuth();
  const { data: summary, isLoading } = useGetMerchantSummary();

  const fmt = (n?: number) =>
    n != null ? new Intl.NumberFormat("en-GB", { style: "currency", currency: summary?.currency || "GBP" }).format(n) : "—";

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">
            Good {getTimeOfDay()}, {merchant?.first_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {merchant?.business_name || "Your business"} — Here's how you're doing
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Today" value={fmt(summary?.today_volume)} sub={`${summary?.today_transactions ?? 0} transactions`} icon={TrendingUp} />
            <StatCard label="This week" value={fmt(summary?.week_volume)} sub="7-day total" icon={ArrowUpRight} />
            <StatCard label="This month" value={fmt(summary?.month_volume)} sub="Monthly total" icon={CreditCard} />
            <StatCard label="Avg. transaction" value={summary?.today_transactions ? fmt((summary.today_volume ?? 0) / (summary.today_transactions ?? 1)) : "—"} sub="Today" icon={Package} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-medium text-foreground text-sm">Recent transactions</h2>
              </div>
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : summary?.recent_transactions?.length ? (
                <div className="divide-y divide-border">
                  {summary.recent_transactions.slice(0, 8).map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between px-5 py-3.5" data-testid={`row-transaction-${tx.id}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <CreditCard size={14} className="text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{tx.description || tx.product_name || "Sale"}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.payment_method?.replace(/_/g, " ")}
                            {tx.card_last_four ? ` •••• ${tx.card_last_four}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                        <StatusBadge status={tx.status} />
                        <span className="text-sm font-semibold text-foreground">{fmt(tx.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-12 text-center">
                  <CreditCard size={32} className="text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Your first payment will appear here</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-medium text-foreground text-sm">Top products</h2>
              </div>
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : summary?.top_products?.length ? (
                <div className="divide-y divide-border">
                  {summary.top_products.map((p: any, i: number) => (
                    <div key={p.product_id || i} className="flex items-center justify-between px-5 py-3.5" data-testid={`row-top-product-${i}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.total_sold} sold</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground ml-3">{fmt(p.total_volume)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <Package size={28} className="text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No products yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
