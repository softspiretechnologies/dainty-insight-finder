import { Link } from "@tanstack/react-router";
import { site, whatsappLink } from "@/lib/site";

const navItems = [
  { to: "/catalog", label: "Catalog" },
  { to: "/custom", label: "Custom Order" },
  { to: "/about", label: "Our Story" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display italic text-xl tracking-tight text-foreground">
          {site.name}
        </Link>
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
        <a
          href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about a custom order.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary transition-colors"
        >
          WhatsApp
        </a>
      </div>
    </nav>
  );
}