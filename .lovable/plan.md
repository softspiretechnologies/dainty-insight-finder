ns# Dainty Handd — Storefront Website Plan

A warm, handcrafted-feeling catalog site for a Kerala-based custom celebration business. No checkout; orders happen over WhatsApp/Instagram DM (matches how this business actually operates).

## Pages

1. **Home (`/`)**
   - Hero with brand name "Dainty Handd", tagline "Your plans, Our goals", and a primary CTA "Request a custom order" (opens WhatsApp).
   - Service grid: Hampers · Bouquets · Invitations · Engagement.
   - Featured gallery (recent work).
   - About strip (Nafisa, Perinthalmanna, Malappuram).
   - Testimonials placeholder.
   - Footer with Instagram + WhatsApp.

2. **Catalog (`/catalog`)**
   - Filter chips by category (Hampers, Bouquets, Invitations, Engagement).
   - Masonry/grid of product cards (image, name, short description, "Enquire on WhatsApp").

3. **Product detail (`/catalog/$slug`)**
   - Image gallery, description, customization options listed as text, "Request this on WhatsApp" CTA prefilled with product name.

4. **Custom Order (`/custom`)**
   - Simple form (name, phone, event type, event date, budget, notes) that builds a WhatsApp message and opens `wa.me` link. No backend.

5. **About (`/about`)**
   - Founder story, location, what makes the work different.

6. **Contact (`/contact`)**
   - WhatsApp, Instagram (@dainty.handd), email, service area.

## Data

- Static `src/data/products.ts` array (id, slug, name, category, blurb, images, price range optional). Easy to edit later. No Lovable Cloud needed for v1.
- WhatsApp number stored in one config constant so it's swappable.

## Design direction

Soft editorial / handcrafted: warm off-white background, deep moss or terracotta accent, serif display headings paired with a clean sans body, generous whitespace, rounded cards with subtle shadow, photography-led. I'll generate 3 design directions for you to choose from before building.

## Tech notes (for the technical reader)

- TanStack Start file-based routes under `src/routes/`.
- Routes: `index.tsx`, `catalog.tsx` (layout with `<Outlet />`), `catalog.index.tsx`, `catalog.$slug.tsx`, `custom.tsx`, `about.tsx`, `contact.tsx`.
- Each route sets its own `head()` with unique title/description/OG tags.
- Components: `Header`, `Footer`, `ProductCard`, `CategoryChips`, `WhatsAppButton`, `Hero`, `SectionHeading`.
- Shadcn `button`, `card`, `input`, `textarea`, `select` for the custom-order form.
- Images: placeholder hero/product images generated via the image tool (warm, editorial product photography style).
- No auth, no database — pure static catalog. Easy to layer Lovable Cloud later if you want real product management or order storage.

## Out of scope (v1)

- Payments / cart / checkout.
- Admin product editor (edit `products.ts` directly).
- Real Instagram feed embed.
- Order tracking / CRM (separate project — your OMS idea).

## Next step

After you approve, I'll generate 3 design directions to pick from, then build the selected one.
