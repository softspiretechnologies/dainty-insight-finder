import { site, whatsappLink } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-20 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="text-center md:text-left">
          <div className="font-display italic text-2xl mb-2">{site.name}</div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
            © {new Date().getFullYear()} · {site.location}
          </p>
        </div>

        <div className="flex gap-12">
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium block mb-2 text-muted group-hover:text-primary transition-colors">
              Instagram
            </span>
            <span className="text-xs">{site.instagramHandle}</span>
          </a>
          <a
            href={whatsappLink(`Hi ${site.founder}, I'd like to enquire.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium block mb-2 text-muted group-hover:text-primary transition-colors">
              Enquire
            </span>
            <span className="text-xs text-primary font-semibold">Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </footer>
  );
}