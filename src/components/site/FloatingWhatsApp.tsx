import { site, whatsappLink } from "@/lib/site";

export function FloatingWhatsApp() {
  return (
    <a
      href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about ${site.name}.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${site.founder} on WhatsApp`}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      className="fixed right-4 md:right-8 md:!bottom-8 z-50 group flex items-center gap-2 sm:gap-3 bg-[#25D366] text-white p-3 sm:pl-4 sm:pr-5 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
    >
      <svg viewBox="0 0 32 32" className="size-6 fill-current" aria-hidden="true">
        <path d="M19.11 17.21c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.21 5.1 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM16.02 5.33C10.13 5.33 5.33 10.13 5.33 16.02c0 1.89.5 3.74 1.44 5.37L5.33 26.67l5.41-1.41a10.65 10.65 0 0 0 5.28 1.41h.01c5.89 0 10.69-4.8 10.69-10.69 0-2.86-1.11-5.54-3.13-7.55a10.6 10.6 0 0 0-7.57-3.1zm0 19.55h-.01a8.86 8.86 0 0 1-4.51-1.24l-.32-.19-3.21.84.86-3.13-.21-.32a8.84 8.84 0 0 1-1.36-4.73c0-4.9 3.99-8.88 8.89-8.88 2.37 0 4.6.93 6.28 2.6a8.81 8.81 0 0 1 2.6 6.28c0 4.9-3.99 8.89-8.88 8.89z" />
      </svg>
      <span className="hidden sm:flex flex-col text-left leading-tight">
        <span className="text-[12px] font-semibold">Chat with {site.founder}</span>
        <span className="text-[10px] opacity-80">Usually replies quickly</span>
      </span>
    </a>
  );
}