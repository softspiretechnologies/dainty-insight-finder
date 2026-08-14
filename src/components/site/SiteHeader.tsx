import { Link } from "@tanstack/react-router";
import { site } from "@/lib/site";
import { useSiteContact } from "@/hooks/useSiteContact";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const navItems = [
  { to: "/catalog", label: "Past Creations" },
  { to: "/services", label: "Services" },
  { to: "/blog", label: "Journal" },
  { to: "/custom", label: "Custom Order" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { waLink, founder } = useSiteContact();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div
        className="max-w-7xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between"
        style={{
          paddingLeft: "max(1.25rem, env(safe-area-inset-left, 0px))",
          paddingRight: "max(1.25rem, env(safe-area-inset-right, 0px))",
        }}
      >
        <Link
          to="/"
          className="min-w-0 truncate pr-3 font-display italic text-xl tracking-tight text-foreground"
        >
          {site.name}
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex gap-7 xl:gap-8 text-[11px] uppercase tracking-[0.2em] font-medium text-muted">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="hover:text-primary transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a
            href={waLink(`Hi ${founder}, I'd like to enquire about a custom order.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary transition-colors"
          >
            WhatsApp
          </a>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden grid h-11 w-11 shrink-0 place-items-center rounded-full text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-[20rem] bg-background border-border p-6"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex min-w-0 flex-col gap-2 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center break-words py-2 text-sm uppercase tracking-[0.2em] font-medium text-muted hover:text-foreground transition-colors"
                    activeProps={{ className: "text-foreground font-semibold" }}
                  >
                    {item.label}
                  </Link>
                ))}
                <a
                  href={waLink(`Hi ${founder}, I'd like to enquire about a custom order.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center break-words py-2 text-sm uppercase tracking-[0.2em] font-semibold text-primary hover:text-foreground transition-colors"
                  onClick={() => setOpen(false)}
                >
                  WhatsApp Us
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
