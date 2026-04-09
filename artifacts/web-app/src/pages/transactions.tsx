import { useState } from "react";
import { useListTransactions, useRefundTransaction, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Search, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

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

export default function TransactionsPage() {
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 20;
  const qc = useQueryClient();
  const { toast } = useToast();

  const params = { limit, offset, ...(statusFilter ? { status: statusFilter as "successful" | "refunded" | "failed" } : {}) };
  const { data, isLoading } = useListTransactions(params, { query: { queryKey: getListTransactionsQueryKey(params) } });
  const refund = useRefundTransaction();

  const fmt = (n: number, currency = "GBP") =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n);

  const handleRefund = async (txId: string) => {
    try {
      await refund.mutateAsync({ transactionId: txId, data: {} });
      qc.invalidateQueries({ queryKey: getListTransactionsQueryKey(params) });
      toast({ title: "Refund processed", description: "The transaction has been refunded" });
    } catch {
      toast({ title: "Refund failed", description: "Please try again", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">All your payment activity</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 h-8 text-sm"
                placeholder="Filter by status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
                data-testid="input-filter-status"
              />
            </div>
            <select
              className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
              data-testid="select-status-filter"
            >
              <option value="">All statuses</option>
              <option value="successful">Successful</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data?.items?.length ? (
            <>
              <div className="divide-y divide-border">
                {data.items.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-4" data-testid={`row-transaction-${tx.id}`}>
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <CreditCard size={15} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tx.description || tx.product_name || "Sale"}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.payment_method?.replace(/_/g, " ")}
                        {tx.card_last_four ? ` •••• ${tx.card_last_four}` : ""}
                        {tx.card_scheme ? ` · ${tx.card_scheme}` : ""}
                        {" · "}{new Date(tx.created_at!).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <StatusBadge status={tx.status} />
                    <span className="text-sm font-semibold text-foreground w-20 text-right">{fmt(tx.amount, tx.currency)}</span>
                    {tx.status === "successful" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefund(tx.id)}
                        className="text-muted-foreground hover:text-destructive h-7 px-2"
                        data-testid={`button-refund-${tx.id}`}
                      >
                        <RotateCcw size={13} className="mr-1" />
                        Refund
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {offset + 1}–{Math.min(offset + limit, data.total)} of {data.total}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={offset + limit >= data.total}
                    onClick={() => setOffset(offset + limit)}
                    data-testid="button-next-page"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="px-5 py-16 text-center">
              <CreditCard size={36} className="text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Your payments will appear here once you start accepting them</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
