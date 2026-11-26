import { useRouteContext } from "@tanstack/react-router";

import { resolveSiteContact, whatsappLink } from "@/lib/site";

/** Contact details from MySQL site_settings (editable in /admin/settings). */
export function useSiteContact() {
  const { siteSettings } = useRouteContext({ from: "__root__" });
  const contact = resolveSiteContact(siteSettings);

  return {
    ...contact,
    waLink: (message?: string) => whatsappLink(message, contact.whatsappNumber),
  };
}
