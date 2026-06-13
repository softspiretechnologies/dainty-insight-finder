import { useRouteContext } from "@tanstack/react-router";

import { site, whatsappLink, resolveWhatsAppNumber, formatTelephone } from "@/lib/site";

/** Contact details from MySQL site_settings (editable in /admin/settings). */
export function useSiteContact() {
  const { siteSettings } = useRouteContext({ from: "__root__" });
  const whatsappNumber = resolveWhatsAppNumber(siteSettings.whatsappNumber);
  const founder = siteSettings.founder || site.founder;
  const email = siteSettings.email || site.email;
  const instagramUrl = siteSettings.instagramUrl || site.instagramUrl;
  const location = siteSettings.location || site.location;

  return {
    whatsappNumber,
    founder,
    email,
    instagramUrl,
    location,
    telephone: formatTelephone(whatsappNumber),
    waLink: (message?: string) => whatsappLink(message, whatsappNumber),
  };
}
