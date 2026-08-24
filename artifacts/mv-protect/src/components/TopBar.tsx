/**
 * TopBar — barre fine au-dessus du header.
 * Affiche téléphone, email et liens réseaux sociaux.
 */
import { Phone, Mail, Clock } from "lucide-react";
import { useContentBlock } from "@/hooks/useContentBlock";

// ── Icônes SVG réseaux sociaux ────────────────────────────────────────────────
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
    </svg>
  );
}

export function TopBar() {
  const phone = useContentBlock("contact.phone", "+33382561062");
  const phoneDisplay = useContentBlock("contact.phone_display", "+33 3 82 56 10 62");
  const email = useContentBlock("contact.email", "contact@mvprotect.fr");

  return (
    <div className="fixed top-0 left-0 right-0 z-[55] h-9 bg-[hsl(var(--background))] border-b border-primary/15 flex items-center">
      <div className="container mx-auto px-4 flex items-center justify-between w-full">

        {/* Gauche : téléphone + email */}
        <div className="flex items-center gap-4 md:gap-6">
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground hover:text-primary transition-colors group"
            aria-label="Appeler MV Protect"
          >
            <Phone className="w-3 h-3 text-primary" />
            <span className="hidden sm:inline">{phoneDisplay}</span>
          </a>
          <a
            href={`mailto:${email}`}
            className="hidden md:flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground hover:text-primary transition-colors"
            aria-label="Envoyer un email"
          >
            <Mail className="w-3 h-3 text-primary" />
            <span>{email}</span>
          </a>
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground">
            <Clock className="w-3 h-3 text-primary" />
            <span>Lun–Ven&nbsp;8h30–18h&nbsp;·&nbsp;Sam&nbsp;9h–17h&nbsp;(RDV)</span>
          </div>
        </div>

        {/* Droite : réseaux sociaux */}
        <div className="flex items-center gap-3">
          <a
            href="https://www.instagram.com/mvprotect_/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram MV Protect"
            className="flex items-center justify-center w-6 h-6 rounded-sm text-muted-foreground hover:text-white transition-colors hover:bg-gradient-to-br hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045]"
          >
            <InstagramIcon className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://www.tiktok.com/@maximeviraud1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok MV Protect"
            className="flex items-center justify-center w-6 h-6 rounded-sm text-muted-foreground hover:text-white hover:bg-black/60 transition-colors"
          >
            <TikTokIcon className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}
