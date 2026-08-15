import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  MoreHorizontal,
  Package,
  Settings,
  Sparkles,
  Tags,
  FileText,
  Inbox,
} from "lucide-react";
import { useRef, useState } from "react";

import { logoutAdmin } from "@/lib/api/admin/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatEnquiryBadgeCount } from "@/lib/admin-format";
import { adminPageTitle, resolveAdminMobileSection } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

const desktopNav = [
  { to: "/admin", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox, exact: false, badgeKey: "enquiries" },
  { to: "/admin/products", label: "Products", icon: Package, exact: false },
  { to: "/admin/categories", label: "Categories", icon: Tags, exact: false },
  { to: "/admin/services", label: "Services", icon: Sparkles, exact: false },
  { to: "/admin/blog", label: "Blog", icon: FileText, exact: false },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

const moreNav = [
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/services", label: "Services", icon: Sparkles },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function EnquiryBadge({ count }: { count: number }) {
  const label = formatEnquiryBadgeCount(count);
  if (!label) return null;
  return (
    <span
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
      aria-label={`${count} new enquiries`}
    >
      {label}
    </span>
  );
}

export function AdminShell({
  children,
  userName,
  newEnquiryCount = 0,
}: {
  children: React.ReactNode;
  userName?: string;
  newEnquiryCount?: number;
}) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileSection = resolveAdminMobileSection(pathname);

  const handleMoreOpenChange = (open: boolean) => {
    setMoreOpen(open);
    if (!open) requestAnimationFrame(() => moreTriggerRef.current?.focus());
  };

  const handleLogout = async () => {
    setMoreOpen(false);
    await logoutAdmin();
    await router.navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-border bg-surface/40 p-5 flex-col gap-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">DaintyHand</p>
          <p className="font-display text-xl italic mt-1">Admin</p>
        </div>

        <nav className="flex flex-col gap-1">
          {desktopNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={item.exact ? { exact: true } : undefined}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-background transition-colors [&.active]:bg-foreground [&.active]:text-background"
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 min-w-0">{item.label}</span>
              {"badgeKey" in item && item.badgeKey === "enquiries" ? (
                <EnquiryBadge count={newEnquiryCount} />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          {userName ? <p className="text-xs text-muted px-1">Signed in as {userName}</p> : null}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
          <Link to="/" className="block text-xs text-muted hover:text-foreground px-1">
            ← View website
          </Link>
        </div>
      </aside>

      <header
        className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur px-4 py-3"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
          paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
          paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
        }}
      >
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted">
            DaintyHand Admin
          </p>
          <p className="font-display text-lg italic truncate">{adminPageTitle(pathname)}</p>
        </div>
      </header>

      <Sheet open={moreOpen} onOpenChange={handleMoreOpenChange}>
        <SheetContent side="bottom" className="mx-auto max-h-[85dvh] w-full max-w-lg rounded-t-2xl">
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="font-display italic font-normal text-2xl">More</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 mb-6">
            {moreNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
          {userName ? (
            <p className="text-xs text-muted mb-4 px-1">Signed in as {userName}</p>
          ) : null}
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2 min-h-11" asChild>
              <Link to="/" onClick={() => setMoreOpen(false)}>
                View website
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 min-h-11"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1 min-w-0 max-w-full p-4 pb-28 sm:p-6 sm:pb-28 lg:p-10 lg:pb-10">
        {children}
      </main>

      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
        aria-label="Admin"
      >
        <div
          className="grid grid-cols-4 gap-0 pt-1"
          style={{
            paddingLeft: "max(0.25rem, env(safe-area-inset-left, 0px))",
            paddingRight: "max(0.25rem, env(safe-area-inset-right, 0px))",
          }}
        >
          <MobileTab
            to="/admin"
            label="Home"
            icon={LayoutDashboard}
            active={mobileSection === "home"}
            exact
          />
          <MobileTab
            to="/admin/enquiries"
            label="Enquiries"
            icon={Inbox}
            active={mobileSection === "enquiries"}
            badge={newEnquiryCount}
          />
          <MobileTab
            to="/admin/products"
            label="Products"
            icon={Package}
            active={mobileSection === "products"}
          />
          <button
            ref={moreTriggerRef}
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] transition-colors",
              mobileSection === "more" ? "text-foreground" : "text-muted",
            )}
            aria-label="More menu"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function MobileTab({
  to,
  label,
  icon: Icon,
  active,
  exact,
  badge = 0,
}: {
  to: "/admin" | "/admin/enquiries" | "/admin/products";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  exact?: boolean;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      activeOptions={exact ? { exact: true } : undefined}
      className={cn(
        "relative flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] transition-colors",
        active ? "text-foreground" : "text-muted",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative">
        <Icon className="w-5 h-5" />
        {badge > 0 ? (
          <span className="absolute -right-2 -top-1">
            <EnquiryBadge count={badge} />
          </span>
        ) : null}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
