import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, MessageSquareQuote, Package, Settings, Sparkles, Tags } from "lucide-react";
import { useState } from "react";

import { logoutAdmin } from "@/lib/api/admin/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", shortLabel: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", shortLabel: "Categories", icon: Tags },
  { to: "/admin/services", label: "Services", shortLabel: "Services", icon: Sparkles },
  { to: "/admin/testimonials", label: "Testimonials", shortLabel: "Reviews", icon: MessageSquareQuote },
  { to: "/admin/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
] as const;

function NavLink({
  item,
  onClick,
  className,
}: {
  item: (typeof nav)[number];
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      to={item.to}
      activeOptions={item.exact ? { exact: true } : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-background transition-colors [&.active]:bg-foreground [&.active]:text-background",
        className,
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function AdminShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName?: string;
}) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAdmin();
    await router.navigate({ to: "/admin/login" });
  };

  const currentPage = nav.find((item) =>
    item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to),
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-border bg-surface/40 p-5 flex-col gap-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">DaintyHand</p>
          <p className="font-display text-xl italic mt-1">Admin</p>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          {userName ? <p className="text-xs text-muted px-1">Signed in as {userName}</p> : null}
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
          <Link to="/" className="block text-xs text-muted hover:text-foreground px-1">
            ← View site
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted">DaintyHand Admin</p>
          <p className="font-display text-lg italic truncate">{currentPage?.label ?? "Admin"}</p>
        </div>
        <Button variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </Button>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[min(100%,20rem)] p-5">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="font-display italic font-normal text-2xl">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 mb-8">
            {nav.map((item) => (
              <NavLink key={item.to} item={item} onClick={() => setMenuOpen(false)} />
            ))}
          </nav>
          {userName ? <p className="text-xs text-muted mb-4">Signed in as {userName}</p> : null}
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
            <Button variant="outline" className="w-full" asChild onClick={() => setMenuOpen(false)}>
              <Link to="/">View site</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1 min-w-0 p-4 pb-24 md:p-10 md:pb-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        <div className="grid grid-cols-3 px-1 pt-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={item.exact ? { exact: true } : undefined}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] text-muted transition-colors [&.active]:text-foreground"
            >
              <item.icon className="w-5 h-5" />
              <span className="truncate max-w-full">{item.shortLabel}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
