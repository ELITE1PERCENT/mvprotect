import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock, Phone, Mail, CalendarCheck } from "lucide-react";
import { useCinematicVariants, cinematicEase } from "@/lib/animations";

export function ContactCTA() {
  const { fadeUp } = useCinematicVariants();

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      className="mt-24 border-t-4 border-t-primary bg-card shadow-2xl relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 px-8 md:px-16 py-12 md:py-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-12">
          {/* Hours + contact info */}
          <div className="flex-1 space-y-6">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-tighter text-foreground">
              Prêt à donner rendez-vous ?
            </h2>

            <ul className="space-y-4 font-sans">
              <li className="flex items-center gap-4 text-base text-foreground/90">
                <div className="w-10 h-10 bg-background border border-border flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Horaires d'ouverture</span>
                  <p className="text-muted-foreground text-sm mt-0.5">Lun–Ven&nbsp;: 8h30 – 18h00&nbsp;&nbsp;·&nbsp;&nbsp;Sam&nbsp;: 9h00 – 17h00 <span className="italic">(sur RDV)</span></p>
                </div>
              </li>

              <li className="flex items-center gap-4 text-base text-foreground/90">
                <div className="w-10 h-10 bg-background border border-border flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <a
                  href="tel:+33382561062"
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  +33 3 82 56 10 62
                </a>
              </li>

              <li className="flex items-center gap-4 text-base text-foreground/90">
                <div className="w-10 h-10 bg-background border border-border flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <a
                  href="mailto:contact@mvprotect.fr"
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  contact@mvprotect.fr
                </a>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 px-10 py-5 text-sm btn-chrome shadow-xl shadow-primary/20"
              >
                <CalendarCheck className="w-5 h-5" />
                <span>Prendre rendez-vous</span>
              </Link>
            </motion.div>
            <p className="text-xs text-muted-foreground font-sans">Étude gratuite, sans engagement</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
