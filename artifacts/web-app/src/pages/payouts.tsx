import { useListPayouts } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Wallet, ArrowDownToLine } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export default function PayoutsPage() {
  const { data: payouts, isLoading } = useListPayouts();

  const fmt = (n: number, c = "GBP") => new Intl.NumberFormat("en-GB", { style: "currency", currency: c }).format(n);

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">Payouts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Funds transferred to your bank account</p>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : payouts?.length ? (
            <div className="divide-y divide-border">
              {payouts.map((p: any) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4" data-testid={`row-payout-${p.id}`}>
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ArrowDownToLine size={15} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.reference || "Payout"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.payout_date ? new Date(p.payout_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Pending"}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                  <span className="text-sm font-semibold text-foreground ml-3">{fmt(p.amount, p.currency)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-16 text-center">
              <Wallet size={36} className="text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No payouts yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Payouts are processed automatically once you start receiving payments</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
