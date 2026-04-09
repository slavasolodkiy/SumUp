import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, ArrowLeftRight, Package, Wallet, Link2,
  Settings, LogOut, ChevronRight, Menu, X
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { path: "/products", label: "Products", icon: Package },
  { path: "/payouts", label: "Payouts", icon: Wallet },
  { path: "/checkout", label: "Payment Links", icon: Link2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { merchant, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleLogout = async () => {
    await logout();
    window.location.href = `${base}/login`;
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-sidebar-foreground tracking-tight">PayOS</span>
        </div>
        {merchant?.business_name && (
          <p className="text-xs text-muted-foreground mt-1.5 truncate">{merchant.business_name}</p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const href = `${base}${path}`;
          const isActive = location === path || location.startsWith(path + "/");
          return (
            <Link
              key={path}
              href={href}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
              {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-sidebar-foreground truncate">
            {merchant?.first_name} {merchant?.last_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{merchant?.email}</p>
        </div>
        <button
          data-testid="button-logout"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">P</span>
          </div>
          <span className="font-semibold">PayOS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-mobile-menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-14 left-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto lg:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
