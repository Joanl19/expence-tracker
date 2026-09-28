import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PlusCircle,
  ReceiptText,
  PieChart,
  Wallet,
  Settings,
  IndianRupee,
} from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/add", label: "Add", icon: PlusCircle },
  { to: "/expenses", label: "Expenses", icon: ReceiptText },
  { to: "/reports", label: "Reports", icon: PieChart },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <IndianRupee className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Kharcha</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            >
              <Icon className="size-4.5" />
              {label === "Add" ? "Add Expense" : label}
            </Link>
          ))}
        </nav>
        <p className="px-3 text-xs text-muted-foreground">Personal expense tracker</p>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {actions}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-6">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
