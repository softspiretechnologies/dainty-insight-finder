# Enquiries / lead management (v1)

Simple lead capture for DaintyHand. Not a CRM, checkout, or quoting system.

## Public workflow

1. Visitor opens enquiry on Contact, a product page (**Get a Quote**), or a service.
2. Form is validated server-side and saved to MySQL/`enquiries`.
3. Success screen offers **Continue on WhatsApp** with a prefilled message.
4. WhatsApp is optional — the lead is already stored.

## Admin workflow

1. Open **Admin → Enquiries**.
2. Filter by status (`new`, `contacted`, `quoted`, `confirmed`, `lost`) or search name/phone/product.
3. Open an enquiry → **Open WhatsApp**, **Call**, change status, edit internal notes.

Internal notes are never shown on the public site.

## Statuses

| Status | Meaning |
| --- | --- |
| `new` | Just submitted |
| `contacted` | Team reached out |
| `quoted` | Price / options shared |
| `confirmed` | Customer proceeding |
| `lost` | Not proceeding |

## Production schema

Hostinger Build Command stays:

```bash
npm run build
```

(`db:ensure` → `db:verify` → `build:app`)

`db:ensure` creates `enquiries` if missing. Do not use `db:migrate` or `db:seed` for this on production.

## Privacy / security

- Public submission cannot set `status` or `admin_notes`.
- Product/service names are resolved server-side from IDs/slugs.
- Honeypot field + IP rate limiting (reuses `admin_login_attempts` scope `enquiry_ip`).
- Enquiry list/detail APIs require admin auth.
- Routine logs do not include phone, email, or message bodies.
