import { Link } from "@tanstack/react-router";
import { site, whatsappLink } from "@/lib/site";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const navItems = [
  { to: "/catalog", label: "Past Creations" },
  { to: "/services", label: "Services" },
  { to: "/custom", label: "Custom Order" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display italic text-xl tracking-tight text-foreground">
          {site.name}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-8 text-[11px] uppercase tracking-[0.2em] font-medium text-muted">
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
            href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about a custom order.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary transition-colors"
          >
            WhatsApp
          </a>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden p-2 -mr-2 text-foreground"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background border-border p-6">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col gap-8 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="text-sm uppercase tracking-[0.2em] font-medium text-muted hover:text-foreground transition-colors"
                    activeProps={{ className: "text-foreground font-semibold" }}
                  >
                    {item.label}
                  </Link>
                ))}
                <a
                  href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about a custom order.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm uppercase tracking-[0.2em] font-semibold text-primary hover:text-foreground transition-colors"
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
