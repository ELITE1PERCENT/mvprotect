import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { PageTransition, useCinematicVariants, cinematicEase } from "@/lib/animations";
import { ArrowRight, ShieldCheck, Sun, Recycle, Droplet } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function PPF() {
  const { fadeUp, staggerContainer, scaleUp } = useCinematicVariants();
  const shouldReduceMotion = useReducedMotion();
  
  const benefits = [
    { icon: ShieldCheck, title: "Protection Extrême", desc: "Contre les impacts de gravillons, insectes, sel et micro-rayures." },
    { icon: Recycle, title: "Auto-cicatrisant", desc: "Les micro-rayures disparaissent d'elles-mêmes sous l'effet de la chaleur." },
    { icon: Sun, title: "Anti-UV & Oxydation", desc: "Empêche la peinture de ternir, jaunir ou s'oxyder avec le temps." },
    { icon: Droplet, title: "Entretien Facilité", desc: "Surface lisse et hydrophobe, la saleté n'adhère plus à la carrosserie." },
  ];

  return (
    <PageTransition className="flex flex-col w-full">
      <SEO 
        title="Pose de Film PPF" 
        description="Le Paint Protection Film (PPF) est la meilleure protection pour votre carrosserie. Film transparent, auto-cicatrisant contre les rayures et impacts." 
      />

      {/* Hero Diagonal */}
      <section className="relative h-[70vh] min-h-[600px] flex items-center bg-background diagonal-slice overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full z-0 bg-black">
          <motion.img 
            src={`${import.meta.env.BASE_URL}images/service-ppf.webp`} 
            alt="Installation PPF" 
            className="w-full h-full object-cover object-center mix-blend-luminosity"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 1.5, ease: cinematicEase }}
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
        </div>
        <div className="container relative z-10 px-4">
          <motion.div
            className="max-w-2xl border-l-4 border-primary pl-8"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: cinematicEase }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold uppercase tracking-tighter text-foreground mb-6 leading-tight">
              Le Bouclier <br/><span className="text-gradient-chrome">Invisible</span>
            </h1>
            <p className="text-xl md:text-2xl font-sans text-muted-foreground leading-relaxed">
              Préservez la peinture d'origine et la valeur de votre véhicule avec notre film de protection PPF haut de gamme.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-32 bg-background relative z-10">
        <div className="container px-4 max-w-6xl mx-auto">
          
          {/* What is PPF */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center mb-40">
            <motion.div
              className="space-y-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
            >
              <h2 className="text-5xl font-heading font-bold uppercase tracking-tighter text-foreground">Qu'est-ce que le <span className="text-primary">PPF</span> ?</h2>
              <div className="space-y-6 font-sans text-muted-foreground leading-relaxed text-lg">
                <p>
                  Le Paint Protection Film (PPF) est un film polyuréthane ultra-résistant de l'ordre de 150 à 200 microns d'épaisseur. Totalement transparent, il agit comme une seconde peau sacrificielle sur votre carrosserie.
                </p>
                <p>
                  Posé avec précision dans notre atelier, il épouse parfaitement les courbes de votre véhicule sans modifier son esthétique. C'est le seul traitement capable d'absorber physiquement les impacts de pierres.
                </p>
              </div>
            </motion.div>

            {/* Benefits cards — stagger */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
            >
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  variants={scaleUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-card border border-border border-b-4 border-b-primary/50 p-8 shadow-xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <b.icon className="w-12 h-12 text-primary mb-6" />
                  <h3 className="text-foreground font-heading font-bold uppercase tracking-wider mb-3 text-lg">{b.title}</h3>
                  <p className="text-sm font-sans text-muted-foreground leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Before / After */}
          <div className="mb-40">
            <motion.h2
              className="text-5xl font-heading font-bold uppercase tracking-tighter text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
            >
              L'Épreuve de la <span className="text-gradient-chrome">Route</span>
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, ease: cinematicEase }}
              >
                <div className="aspect-[4/3] overflow-hidden border border-border bg-black skew-x-[-2deg] shadow-xl">
                  <img src={`${import.meta.env.BASE_URL}images/ppf-avant.webp`} alt="Avant PPF" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="bg-card p-6 text-center border-l-4 border-destructive shadow-sm">
                  <p className="font-heading font-bold uppercase tracking-widest text-foreground text-lg mb-1">Sans protection</p>
                  <p className="font-sans text-sm text-muted-foreground">Impacts, micro-rayures, ternissement</p>
                </div>
              </motion.div>
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: 0.2, ease: cinematicEase }}
              >
                <div className="aspect-[4/3] overflow-hidden border-2 border-primary relative shadow-2xl shadow-primary/20 skew-x-[-2deg]">
                  <img src={`${import.meta.env.BASE_URL}images/ppf-apres.webp`} alt="Après PPF" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-primary/10 mix-blend-overlay pointer-events-none" />
                </div>
                <div className="bg-card p-6 text-center border-l-4 border-primary shadow-sm">
                  <p className="font-heading font-bold uppercase tracking-widest text-primary text-lg mb-1">Avec PPF</p>
                  <p className="font-sans text-sm text-muted-foreground">Brillance absolue, surface parfaite et protégée</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* FAQ */}
          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <h2 className="text-5xl font-heading font-bold uppercase tracking-tighter text-center mb-16">Questions <span className="text-primary">Fréquentes</span></h2>
            <div className="bg-card border border-border p-4 shadow-xl">
              <Accordion type="single" collapsible className="w-full font-sans">
                <AccordionItem value="item-1" className="border-border px-4 py-2">
                  <AccordionTrigger className="text-foreground hover:text-primary font-bold text-left text-lg">Le film va-t-il jaunir avec le temps ?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base pt-2">
                    Non, nous utilisons uniquement des films PPF de dernière génération dotés de couches anti-UV avancées garanties contre le jaunissement et le craquellement.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-border px-4 py-2">
                  <AccordionTrigger className="text-foreground hover:text-primary font-bold text-left text-lg">Comment fonctionne l'auto-cicatrisation ?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base pt-2">
                    La couche supérieure du film contient des polymères élastomériques qui reprennent leur forme initiale lorsqu'ils sont exposés à la chaleur (soleil ou eau chaude), faisant disparaître les micro-rayures.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-border px-4 py-2">
                  <AccordionTrigger className="text-foreground hover:text-primary font-bold text-left text-lg">Peut-on poser une céramique sur du PPF ?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base pt-2">
                    Absolument. C'est même la combinaison ultime. Le PPF offre la protection physique contre les impacts, et la céramique apporte un effet déperlant extrême et facilite encore plus les lavages.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border-border px-4 py-2 border-b-0">
                  <AccordionTrigger className="text-foreground hover:text-primary font-bold text-left text-lg">Quelle est la durée d'intervention ?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base pt-2">
                    La pose nécessite entre 2 et 5 jours selon qu'il s'agisse d'un bloc avant (pare-chocs, capot, ailes, rétroviseurs) ou d'un véhicule complet, préparation et décontamination incluses.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            <motion.div
              className="mt-20 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: cinematicEase }}
            >
              <Link href="/contact" className="inline-flex px-12 py-5 text-sm btn-chrome shadow-xl shadow-primary/20">
                <span>Demander un devis pour votre véhicule</span>
              </Link>

              {/* Coordonnées directes */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm font-sans text-muted-foreground">
                <a href="tel:+33382561062" className="flex items-center gap-2 hover:text-primary transition-colors group">
                  <span className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center group-hover:border-primary transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-primary"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.95 9.93 19.79 19.79 0 01.88 1.27 2 2 0 012.86.09h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0121.94 14l-.02 2.92z"/></svg>
                  </span>
                  +33 3 82 56 10 62
                </a>
                <span className="hidden sm:block text-border">·</span>
                <a href="mailto:contact@mvprotect.fr" className="flex items-center gap-2 hover:text-primary transition-colors group">
                  <span className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center group-hover:border-primary transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-primary"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
                  </span>
                  contact@mvprotect.fr
                </a>
                <span className="hidden sm:block text-border">·</span>
                <span className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-primary"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </span>
                  Lun–Ven 8h30–18h · Sam 9h–17h
                </span>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>
    </PageTransition>
  );
}
