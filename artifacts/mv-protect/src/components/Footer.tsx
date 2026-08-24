import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { cinematicEase } from "@/lib/animations";
import { MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";
import { useContentBlock } from "@/hooks/useContentBlock";

const navLinks = [
  { href: "/services",     label: "Services" },
  { href: "/ppf",          label: "Film PPF" },
  { href: "/tarifs",       label: "Tarifs" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/actualites",   label: "Actualités" },
];

const legalLinks = [
  { href: "/mentions-legales",           label: "Mentions légales" },
  { href: "/politique-confidentialite",  label: "Politique de confidentialité" },
  { href: "/politique-cookies",          label: "Politique des cookies" },
  { href: "/contact",                    label: "Contact" },
];

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const shouldReduceMotion = useReducedMotion();
  const phone = useContentBlock("contact.phone", "+33382561062");
  const phoneDisplay = useContentBlock("contact.phone_display", "+33 3 82 56 10 62");
  const email = useContentBlock("contact.email", "contact@mvprotect.fr");
  const address = useContentBlock("footer.address", "4 Rue du Canal, 57970 Basse-Ham");

  const colVariants = {
    hidden:  { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.8, delay: i * 0.15, ease: cinematicEase },
    }),
  };

  return (
    <footer className="bg-card border-t border-border mt-auto relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-cover bg-center mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero.webp)` }} />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand & Info */}
          <motion.div className="space-y-6" initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-40px" }} custom={0} variants={colVariants}>
            <Link href="/" className="inline-block group">
              <span className="text-3xl font-heading font-bold tracking-widest uppercase group-hover:opacity-80 transition-opacity">
                MV <span className="text-primary">PROTECT</span>
              </span>
            </Link>
            <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-xs">
              Préparation esthétique automobile haut de gamme en Moselle&nbsp;: nettoyage, protection de carrosserie (PPF, céramique) et changement de couleur (covering).
            </p>
            <div className="pt-2 space-y-1 text-sm text-foreground/80 font-sans">
              <p className="font-bold text-foreground">MV PROTECT SAS</p>
              <p>Dirigeant&nbsp;: Maxime Viraud</p>
              <p>SIREN&nbsp;: 102 779 683</p>
              <p>TVA&nbsp;: FR20102779683</p>
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div className="space-y-6" initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-40px" }} custom={1} variants={colVariants}>
            <h3 className="text-lg font-heading font-bold uppercase tracking-widest text-primary border-b border-primary/20 pb-2 inline-block">Navigation</h3>
            <ul className="space-y-4 font-sans">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm group">
                    <span className="w-1.5 h-1.5 bg-primary/50 rotate-45 inline-block group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Horaires */}
          <motion.div className="space-y-6" initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-40px" }} custom={2} variants={colVariants}>
            <h3 className="text-lg font-heading font-bold uppercase tracking-widest text-primary border-b border-primary/20 pb-2 inline-block">Horaires</h3>
            <ul className="space-y-3 text-sm font-sans text-muted-foreground">
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground font-semibold">Lun – Ven</p>
                  <p>8h30 – 12h00</p>
                  <p>13h30 – 18h00</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground font-semibold">Samedi</p>
                  <p>9h00 – 17h00 <span className="text-xs opacity-70">(sur RDV)</span></p>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div className="space-y-6" initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-40px" }} custom={3} variants={colVariants}>
            <h3 className="text-lg font-heading font-bold uppercase tracking-widest text-primary border-b border-primary/20 pb-2 inline-block">Contact</h3>
            <ul className="space-y-5 text-sm font-sans text-muted-foreground">
              <li className="flex items-start gap-4">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-tight">{address}<br/><span className="text-xs opacity-80">(Sur RDV uniquement)</span></span>
              </li>
              <li className="flex items-center gap-4">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-primary transition-colors font-bold text-foreground">
                  {phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-primary transition-colors text-foreground">
                  {email}
                </a>
              </li>
            </ul>

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3 pt-2">
              <a href="https://www.instagram.com/mvprotect_/" target="_blank" rel="noopener noreferrer"
                aria-label="Instagram MV Protect"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <Instagram className="w-4 h-4 group-hover:text-[#E1306C] transition-colors" />
                <span>@mvprotect_</span>
              </a>
              <span className="text-border">·</span>
              <a href="https://www.tiktok.com/@maximeviraud1" target="_blank" rel="noopener noreferrer"
                aria-label="TikTok MV Protect"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <TikTokIcon className="w-4 h-4" />
                <span>@maximeviraud1</span>
              </a>
            </div>
          </motion.div>

        </div>

        {/* Bottom bar */}
        <motion.div
          className="border-t border-border mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-sans text-muted-foreground uppercase tracking-wider"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5, ease: cinematicEase }}
        >
          <p>&copy; {year} MV PROTECT. TOUS DROITS RÉSERVÉS.</p>
          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/mvprotect_/" target="_blank" rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
            <a href="https://www.tiktok.com/@maximeviraud1" target="_blank" rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1.5">
              <TikTokIcon className="w-3.5 h-3.5" /> TikTok
            </a>
            {legalLinks.slice(0, 2).map(l => (
              <Link key={l.href} href={l.href} className="hover:text-primary transition-colors hidden md:inline">
                {l.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
