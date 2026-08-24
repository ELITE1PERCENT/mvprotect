import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cinematicEase } from "@/lib/animations";
import { useContentBlock } from "@/hooks/useContentBlock";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const phone = useContentBlock("contact.phone", "+33382561062");

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Lock body scroll when menu is open + close on Escape
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const navLinks = [
    { href: "/services",     label: "Services" },
    { href: "/tarifs",       label: "Tarifs" },
    { href: "/realisations", label: "Réalisations" },
    { href: "/actualites",   label: "Actualités" },
    { href: "/contact",      label: "Contact" },
  ];

  return (
    <>
      {/* ── Header bar ── */}
      <header className="fixed top-9 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-primary/20 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.webp`}
              alt="MV PROTECT"
              className="h-16 w-auto group-hover:scale-105 transition-transform duration-500 ease-out"
              decoding="async"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 font-heading font-bold tracking-widest text-sm uppercase">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-primary transition-colors relative py-2 ${location === link.href ? "text-primary" : "text-foreground"}`}
              >
                {link.label}
                {location === link.href && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right side : phone + burger */}
          <div className="flex items-center gap-4">
            {/* Phone — label on sm+, icon only on xs */}
            <a
              href={`tel:${phone}`}
              className="hidden sm:flex items-center justify-center gap-2 px-6 py-2.5 text-sm btn-chrome"
            >
              <Phone className="w-4 h-4" />
              <span>Appeler</span>
            </a>
            <a
              href={`tel:${phone}`}
              className="flex sm:hidden items-center justify-center w-10 h-10 btn-chrome"
              aria-label="Appeler"
            >
              <Phone className="w-4 h-4" />
            </a>

            {/* Burger — mobile / tablet only */}
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="w-10 h-10 flex lg:hidden items-center justify-center text-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile fullscreen overlay — OUTSIDE <header> so z-index is root-level ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation mobile"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -16 }}
            transition={{ duration: 0.35, ease: cinematicEase }}
            /* z-[60] > header z-50, so menu truly covers everything */
            className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-xl flex flex-col lg:hidden"
          >
            {/* Top bar inside overlay — logo + close button */}
            <div className="flex items-center justify-between px-4 h-20 border-b border-primary/10 shrink-0">
              <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
                <img
                  src={`${import.meta.env.BASE_URL}images/logo.webp`}
                  alt="MV PROTECT"
                  className="h-16 w-auto"
                  decoding="async"
                />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Fermer le menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Nav links — centred in remaining space */}
            <nav className="flex-1 flex flex-col items-center justify-center gap-6 overflow-y-auto py-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 + 0.05, duration: 0.4, ease: cinematicEase }}
                >
                  <Link
                    href={link.href}
                    className={`text-3xl font-heading font-bold uppercase tracking-widest hover:text-primary transition-colors duration-300 flex items-center gap-4 ${
                      location === link.href ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {location === link.href && (
                      <span className="w-2 h-2 bg-primary rotate-45 inline-block shrink-0" />
                    )}
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Bottom CTA */}
            <div className="px-6 pb-10 shrink-0 flex flex-col items-center gap-3">
              <a
                href={`tel:${phone}`}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 btn-chrome text-sm"
                onClick={() => setIsOpen(false)}
              >
                <Phone className="w-4 h-4" />
                <span>Appeler maintenant</span>
              </a>
              <Link
                href="/contact"
                className="w-full flex items-center justify-center px-6 py-3.5 btn-outline-skew text-sm"
                onClick={() => setIsOpen(false)}
              >
                Demander un devis
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
