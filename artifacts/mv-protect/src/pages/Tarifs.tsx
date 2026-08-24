import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { PageTransition, useCinematicVariants, cinematicEase } from "@/lib/animations";
import { FileText, Car, Settings, CheckCircle2 } from "lucide-react";
import { ContactCTA } from "@/components/ContactCTA";

const cards = [
  {
    icon: Car,
    title: "Gabarit",
    desc: "La surface à traiter influence le temps de travail et la quantité de matériaux (film PPF, céramique).",
  },
  {
    icon: Settings,
    title: "État Initial",
    desc: "Le niveau de micro-rayures et l'état du vernis déterminent le nombre de passes de polissage nécessaires.",
  },
  {
    icon: FileText,
    title: "Exigence",
    desc: "De l'embellissement à la quête de perfection absolue, nous ajustons notre temps à vos attentes.",
  },
];

export default function Tarifs() {
  const { fadeUp, staggerContainer, scaleUp } = useCinematicVariants();
  const shouldReduceMotion = useReducedMotion();

  return (
    <PageTransition className="flex flex-col w-full min-h-[calc(100vh-80px)] items-center justify-center py-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <SEO 
        title="Nos Tarifs" 
        description="Chez MV PROTECT, chaque véhicule est unique. Nos prestations de detailing, polissage et PPF sont réalisées sur devis personnalisé." 
      />

      <div className="container px-4 max-w-5xl mx-auto relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-20"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold uppercase tracking-tighter text-foreground mb-6">
            Tarifs <span className="text-gradient-chrome">Sur Mesure</span>
          </h1>
          <p className="text-xl md:text-2xl font-heading uppercase tracking-widest text-primary font-bold">L'excellence n'a pas de grille standard.</p>
        </motion.div>

        <motion.div
          className="bg-card border-t-4 border-t-primary border-x border-b border-border p-10 md:p-20 shadow-2xl relative"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: cinematicEase }}
        >
          <div className="relative z-10 space-y-16">
            <motion.p
              className="text-lg md:text-xl font-sans text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: cinematicEase }}
            >
              Chaque prestation chez MV PROTECT est <strong className="text-foreground">exclusive et sur mesure</strong>. 
              Nous ne proposons pas de forfaits pré-établis car l'état de chaque carrosserie, la taille du véhicule et le niveau d'exigence souhaité varient considérablement.
            </motion.p>

            {/* Criteria cards — stagger */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {cards.map((card) => (
                <motion.div
                  key={card.title}
                  variants={scaleUp}
                  whileHover={{ y: -6, borderColor: "hsl(var(--primary) / 0.5)", transition: { duration: 0.3 } }}
                  className="flex flex-col items-center text-center p-10 bg-background border border-border group transition-colors shadow-lg"
                >
                  <motion.div
                    className="w-20 h-20 bg-card border border-border flex items-center justify-center mb-8 shadow-sm"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <card.icon className="w-10 h-10 text-primary" />
                  </motion.div>
                  <h3 className="font-heading font-bold uppercase tracking-widest text-xl text-foreground mb-4">{card.title}</h3>
                  <p className="font-sans text-base text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA block */}
            <motion.div
              className="bg-background p-10 border-l-4 border-l-primary flex flex-col md:flex-row items-center justify-between gap-10 mt-16 shadow-inner border-y border-r border-y-border border-r-border"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: cinematicEase }}
            >
              <div className="space-y-3 text-center md:text-left flex-1">
                <h4 className="text-2xl font-heading font-bold uppercase tracking-widest text-foreground flex items-center justify-center md:justify-start gap-4">
                  <CheckCircle2 className="w-7 h-7 text-primary shrink-0" /> Étude gratuite de votre véhicule
                </h4>
                <p className="font-sans text-muted-foreground text-lg">Nous inspectons votre voiture sous nos lumières et discutons de vos besoins avant d'établir un devis ferme et définitif.</p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="shrink-0">
                <Link href="/contact" className="inline-flex px-10 py-5 text-sm btn-chrome shadow-xl shadow-primary/20">
                  <span>Obtenir un devis</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="container px-4 max-w-5xl mx-auto relative z-10 pb-16">
        <ContactCTA />
      </div>
    </PageTransition>
  );
}
