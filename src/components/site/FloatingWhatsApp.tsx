import { useState, useRef, useEffect } from "react";
import { X, MessageCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { site, whatsappLink, resolveWhatsAppNumber } from "@/lib/site";
import type { CatalogCategory, SiteSettingsData } from "@/types/catalog";

/* ─── conversation tree ─────────────────────────────────────── */

type Screen = "home" | "browse" | "custom" | "howItWorks" | "delivery";

interface BotMessage {
  text: string;
  isBot: true;
}

const screens: Record<Screen, { messages: BotMessage[]; back?: Screen }> = {
  home: {
    messages: [
      { text: `Hi! I'm ${site.founder}'s assistant 👋`, isBot: true },
      { text: "How can I help you today?", isBot: true },
    ],
  },
  browse: {
    messages: [
      {
        text: "We handcraft 8 types of pieces — pick one to explore or view the full catalog.",
        isBot: true,
      },
    ],
    back: "home",
  },
  custom: {
    messages: [
      { text: "Every piece is made to order, fully customised around your occasion.", isBot: true },
      {
        text: `Share your idea on WhatsApp — ${site.founder} will reply with mood boards, materials & a quote within 24 hours.`,
        isBot: true,
      },
    ],
    back: "home",
  },
  howItWorks: {
    messages: [{ text: "Our process is simple and personal:", isBot: true }],
    back: "home",
  },
  delivery: {
    messages: [{ text: "We deliver everywhere — here's how:", isBot: true }],
    back: "home",
  },
};

const steps = [
  { n: "01", t: "Share your idea", d: "Message on WhatsApp with occasion, vibe & budget." },
  { n: "02", t: "We design", d: "Mood boards, materials & quote within 24 hours." },
  { n: "03", t: "Approve & confirm", d: "Approve the design, confirm with advance." },
  { n: "04", t: "Delivery", d: "Hand-delivered locally or shipped India-wide & worldwide." },
];

const deliveryZones = [
  { place: "Perinthalmanna & Malappuram", note: "Hand-delivered in person." },
  { place: "Anywhere in India", note: "Couriered to your door." },
  { place: "International", note: "Worldwide shipping available." },
];

/* ─── component ─────────────────────────────────────────────── */

export function FloatingWhatsApp({
  categories,
  siteSettings,
}: {
  categories: CatalogCategory[];
  siteSettings: SiteSettingsData;
}) {
  const founder = siteSettings.founder || site.founder;
  const waLink = (message?: string) =>
    whatsappLink(message, resolveWhatsAppNumber(siteSettings.whatsappNumber));
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [screen, open]);

  const go = (s: Screen) => setScreen(s);
  const back = () => {
    const b = screens[screen].back;
    if (b) setScreen(b);
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="DaintyHand WhatsApp assistant"
          data-testid="whatsapp-panel"
          className="fixed left-[max(1rem,env(safe-area-inset-left,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] sm:left-auto sm:w-[340px] md:right-[max(2rem,env(safe-area-inset-right,0px))] z-50 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)",
            maxHeight:
              "min(520px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 6rem))",
          }}
        >
          {/* Header */}
          <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="size-8 rounded-full bg-primary grid place-items-center">
                <MessageCircle className="size-4" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold leading-none">{site.name}</p>
                <p className="truncate text-[10px] text-background/60 mt-0.5">
                  Usually replies quickly
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setScreen("home"); /* reset only on explicit close */
              }}
              className="-my-2 -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-background/60 hover:bg-background/10 hover:text-background transition-colors"
              aria-label="Close chat"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div
            ref={bodyRef}
            data-testid="whatsapp-panel-body"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3 bg-surface/40"
          >
            {/* Bot messages */}
            {screens[screen].messages.map((m, i) => (
              <div key={i} className="flex gap-2 items-end">
                {i === 0 && (
                  <div className="size-6 rounded-full bg-foreground text-background grid place-items-center shrink-0 mb-0.5">
                    <span className="font-display italic text-[9px]">D</span>
                  </div>
                )}
                {i > 0 && <div className="size-6 shrink-0" />}
                <div className="max-w-[85%] break-words bg-background border border-border rounded-2xl rounded-bl-sm px-3 py-2 text-[12px] leading-relaxed">
                  {m.text.replace("${site.founder}", founder)}
                </div>
              </div>
            ))}

            {/* Screen-specific content */}
            {screen === "browse" && (
              <div className="ml-8 grid grid-cols-2 gap-1.5">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to="/catalog"
                    search={{ category: c.id }}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 min-w-0 items-center break-words bg-background border border-border rounded-xl px-3 py-2.5 text-[11px] font-medium hover:border-foreground hover:bg-surface transition-colors text-left leading-tight"
                  >
                    {c.label}
                  </Link>
                ))}
                <Link
                  to="/catalog"
                  onClick={() => setOpen(false)}
                  className="col-span-2 flex min-h-11 items-center justify-center break-words bg-foreground text-background rounded-xl px-3 py-2.5 text-[11px] font-semibold text-center hover:bg-primary transition-colors"
                >
                  View full catalog →
                </Link>
              </div>
            )}

            {screen === "howItWorks" && (
              <div className="ml-8 space-y-2">
                {steps.map((s) => (
                  <div
                    key={s.n}
                    className="bg-background border border-border rounded-xl px-3 py-2.5 text-[11px]"
                  >
                    <span className="font-mono text-[9px] text-primary block mb-0.5">
                      Step {s.n}
                    </span>
                    <p className="font-semibold leading-tight">{s.t}</p>
                    <p className="text-muted mt-0.5 leading-relaxed">{s.d}</p>
                  </div>
                ))}
                <a
                  href={waLink(`Hi ${founder}, I'd like to start an order.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 w-full items-center justify-center break-words bg-foreground text-background rounded-xl px-3 py-2.5 text-[11px] font-semibold text-center hover:bg-primary transition-colors"
                >
                  Start now on WhatsApp →
                </a>
              </div>
            )}

            {screen === "delivery" && (
              <div className="ml-8 space-y-1.5">
                {deliveryZones.map((z) => (
                  <div
                    key={z.place}
                    className="bg-background border border-border rounded-xl px-3 py-2.5 text-[11px]"
                  >
                    <p className="font-semibold leading-tight">{z.place}</p>
                    <p className="text-muted mt-0.5">{z.note}</p>
                  </div>
                ))}
                <a
                  href={waLink(`Hi ${founder}, I'd like to enquire about delivery to my location.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 w-full items-center justify-center break-words bg-foreground text-background rounded-xl px-3 py-2.5 text-[11px] font-semibold text-center hover:bg-primary transition-colors mt-2"
                >
                  Ask about delivery →
                </a>
              </div>
            )}

            {screen === "custom" && (
              <div className="ml-8 space-y-2">
                <Link
                  to="/custom"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 w-full items-center justify-center break-words bg-foreground text-background rounded-xl px-3 py-2.5 text-[11px] font-semibold text-center hover:bg-primary transition-colors"
                >
                  Fill custom order form →
                </Link>
                <a
                  href={waLink(`Hi ${founder}, I'd like to start a custom order.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 w-full items-center justify-center break-words border border-foreground rounded-xl px-3 py-2.5 text-[11px] font-semibold text-center hover:bg-surface transition-colors"
                >
                  Message directly on WhatsApp →
                </a>
              </div>
            )}
          </div>

          {/* Quick replies / back */}
          <div className="px-4 py-3 border-t border-border bg-background shrink-0">
            {screen === "home" ? (
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { label: "Browse creations", s: "browse" as Screen },
                    { label: "Custom order", s: "custom" as Screen },
                    { label: "How it works", s: "howItWorks" as Screen },
                    { label: "Delivery info", s: "delivery" as Screen },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.s}
                    onClick={() => go(opt.s)}
                    className="flex min-h-11 min-w-0 items-center justify-between gap-1 border border-border rounded-xl px-3 py-2 text-[11px] font-medium hover:border-foreground hover:bg-surface transition-colors text-left"
                  >
                    {opt.label}
                    <ChevronRight className="size-3 shrink-0 text-muted" />
                  </button>
                ))}
                <a
                  href={waLink(`Hi ${founder}, I'd like to enquire.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 min-w-0 items-center justify-between gap-1 bg-foreground text-background border border-foreground rounded-xl px-3 py-2 text-[11px] font-semibold hover:bg-primary transition-colors"
                >
                  Chat on WhatsApp
                  <ChevronRight className="size-3 shrink-0" />
                </a>
              </div>
            ) : (
              <button
                onClick={back}
                className="flex min-h-11 items-center gap-1.5 text-[11px] text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3" />
                Back
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        aria-label={open ? "Close chat" : `Chat with ${founder} on WhatsApp`}
        data-testid="whatsapp-toggle"
        className="fixed right-[max(1rem,env(safe-area-inset-right,0px))] md:right-[max(2rem,env(safe-area-inset-right,0px))] z-50 grid place-items-center size-12 bg-foreground text-background rounded-full shadow-lg hover:bg-primary hover:scale-[1.02] transition-all"
      >
        {open ? (
          <X className="size-5" strokeWidth={1.5} />
        ) : (
          <MessageCircle className="size-5" strokeWidth={1.5} />
        )}
      </button>
    </>
  );
}
