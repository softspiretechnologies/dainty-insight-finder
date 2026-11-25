import { Link } from "@tanstack/react-router";
import { formatSiteCopyrightYear } from "@/lib/admin-format";
import { site } from "@/lib/site";
import { useSiteContact } from "@/hooks/useSiteContact";
import { trackEvent } from "@/lib/analytics";

export function SiteFooter() {
  const { waLink, founder, location, instagramUrl, instagramHandle } = useSiteContact();

  return (
    <footer className="border-t border-border py-12 md:py-20 px-5 md:px-6">
      <div className="max-w-7xl mx-auto flex min-w-0 flex-col md:flex-row justify-between items-start gap-8 md:gap-12">
        <div className="min-w-0">
          <div className="font-display italic text-2xl mb-2">{site.name}</div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted max-w-xs leading-relaxed mb-3">
            Handcrafted gifting &amp; wedding celebration studio based in {location}.
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
            © {formatSiteCopyrightYear()} · {location}
          </p>
        </div>

        <div className="flex flex-wrap gap-8 sm:gap-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium block mb-3 text-muted">
              Explore
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/catalog" className="hover:text-primary transition-colors">
                  Past Creations
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-primary transition-colors">
                  Celebration Services
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-primary transition-colors">
                  Journal &amp; Guides
                </Link>
              </li>
              <li>
                <Link to="/custom" className="hover:text-primary transition-colors">
                  Custom Order Brief
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium block mb-3 text-muted">
              Connect
            </span>
            <div className="space-y-3">
              <a
                href={instagramUrl}
                onClick={() => trackEvent("instagram_click", { source_page: "footer" })}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted group-hover:text-primary transition-colors block">
                  Instagram
                </span>
                <span className="break-words text-xs">{instagramHandle}</span>
              </a>
              <a
                href={waLink(`Hi ${founder}, I'd like to enquire.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted group-hover:text-primary transition-colors block">
                  Enquire
                </span>
                <span className="text-xs text-primary font-semibold">Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
