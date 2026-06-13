import { useState, useRef, useEffect } from "react";
import { X, MessageCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { site, whatsappLink } from "@/lib/site";
import { categories } from "@/data/products";

/* ─── conversation tree ─────────────────────────────────────── */

type Screen =
  | "home"
  | "browse"
  | "custom"
  | "howItWorks"
  | "delivery";

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
      { text: "We handcraft 8 types of pieces — pick one to explore or view the full catalog.", isBot: true },
    ],
    back: "home",
  },
  custom: {
    messages: [
      { text: "Every piece is made to order, fully customised around your occasion.", isBot: true },
      { text: "Share your idea on WhatsApp — ${site.founder} will reply with mood boards, materials & a quote within 24 hours.", isBot: true },
    ],
    back: "home",
  },
  howItWorks: {
    messages: [
      { text: "Our process is simple and personal:", isBot: true },
    ],
    back: "home",
  },
  delivery: {
    messages: [
      { text: "We deliver everywhere — here's how:", isBot: true },
    ],
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

export function FloatingWhatsApp() {
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
          className="fixed bottom-20 right-4 md:right-8 z-50 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "min(520px, calc(100dvh - 6rem))" }}
        >
          {/* Header */}
          <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-primary grid place-items-center">
                <MessageCircle className="size-4" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[12px] font-semibold leading-none">{site.name}</p>
                <p className="text-[10px] text-background/60 mt-0.5">Usually replies quickly</p>
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); setScreen("home"); }}
              className="text-background/60 hover:text-background transition-colors"
              aria-label="Close chat"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface/40">

            {/* Bot messages */}
            {screens[screen].messages.map((m, i) => (
              <div key={i} className="flex gap-2 items-end">
                {i === 0 && (
                  <div className="size-6 rounded-full bg-foreground text-background grid place-items-center shrink-0 mb-0.5">
                    <span className="font-display italic text-[9px]">D</span>
                  </div>
                )}
                {i > 0 && <div className="size-6 shrink-0" />}
                <div className="bg-background border border-border rounded-2xl rounded-bl-sm px-3 py-2 text-[12px] leading-relaxed max-w-[85%]">
                  {m.text.replace("${site.founder}", site.founder)}
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
                    className="bg-background border border-border rounded-xl px-3 py-2.5 text-[11px] font-medium hover:border-foreground hover:bg-surface transition-colors text-left leading-tight"
                  >
                    {c.label}
                  </Link>
                ))}
                <Link
                  to="/catalog"
                  onClick={() => setOpen(false)}
                  className="col-span-2 bg-foreground text-background rounded-xl px-3 py-2.5 text-[11px] font-semibold text-center hover:bg-primary transition-colors"
                >
                  View full catalog →
                </Link>
              </div>
            )}

            {screen === "howItWorks" && (
              <div className="ml-8 space-y-2">
                {steps.map((s) => (
                  <div key={s.n} className="bg-background border border-border rounded-xl px-3 py-2.5 text-[11px]">
                    <span className="font-mono text-[9px] text-primary block mb-0.5">Step {s.n}</span>
                    <p className="font-semibold leading-tight">{s.t}</p>
                    <p className="text-muted mt-0.5 leading-relaxed">{s.d}</p>
                  </div>
                ))}
                <a
                  href={whatsappLink(`Hi ${site.founder}, I'd like to start an order.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-foreground text-background rounded-xl px-3 py-2.5 text-[11px] font-semibold text-center hover:bg-primary transition-colors"
                >
                  Start now on WhatsApp →
                </a>
              </div>
            )}

            {screen === "delivery" && (
              <div className="ml-8 space-y-1.5">
                {deliveryZones.map((z) => (
                  <div key={z.place} className="bg-background border border-border rounded-xl px-3 py-2.5 text-[11px]">
                    <p className="font-semibold leading-tight">{z.place}</p>
                    <p className="text-muted mt-0.5">{z.note}</p>
                  </div>
                ))}
                <a
                  href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about delivery to my location.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-foreground text-background rounded-xl px-3 py-2.5 text-[11px] font-semibold text-center hover:bg-primary transition-colors mt-2"
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
                  className="block w-full bg-foreground text-background rounded-xl px-3 py-2.5 text-[11px] font-semibold text-center hover:bg-primary transition-colors"
                >
                  Fill custom order form →
                </Link>
                <a
                  href={whatsappLink(`Hi ${site.founder}, I'd like to start a custom order.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full border border-foreground rounded-xl px-3 py-2.5 text-[11px] font-semibold text-center hover:bg-surface transition-colors"
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
                    className="flex items-center justify-between gap-1 border border-border rounded-xl px-3 py-2 text-[11px] font-medium hover:border-foreground hover:bg-surface transition-colors text-left"
                  >
                    {opt.label}
                    <ChevronRight className="size-3 shrink-0 text-muted" />
                  </button>
                ))}
                <a
                  href={whatsappLink(`Hi ${site.founder}, I'd like to enquire.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-1 bg-foreground text-background border border-foreground rounded-xl px-3 py-2 text-[11px] font-semibold hover:bg-primary transition-colors"
                >
                  Chat on WhatsApp
                  <ChevronRight className="size-3 shrink-0" />
                </a>
              </div>
            ) : (
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-[11px] text-muted hover:text-foreground transition-colors"
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
        onClick={() => { setOpen((o) => !o); setScreen("home"); }}
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        aria-label={open ? "Close chat" : `Chat with ${site.founder} on WhatsApp`}
        className="fixed right-4 md:right-8 md:bottom-8! z-50 grid place-items-center size-12 bg-foreground text-background rounded-full shadow-lg hover:bg-primary hover:scale-[1.02] transition-all"
      >
        {open
          ? <X className="size-5" strokeWidth={1.5} />
          : <MessageCircle className="size-5" strokeWidth={1.5} />
        }
      </button>
    </>
  );
}
