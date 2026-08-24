import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { PageTransition, useCinematicVariants, cinematicEase } from "@/lib/animations";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ContactCTA } from "@/components/ContactCTA";

type Service = {
  id: string;
  title: string;
  description: string;
  image: string;
  benefits: string[];
  link: string;
  detailLink?: string;
  detailLabel?: string;
};

export default function Services() {
  const { fadeUp } = useCinematicVariants();
  const shouldReduceMotion = useReducedMotion();

  const services: Service[] = [
    {
      id: "nettoyage",
      title: "Nettoyage Automobile Complet",
      description: "Une remise à neuf spectaculaire de votre habitacle et de l'extérieur. Nous utilisons des techniques de detailing avancées : nettoyage vapeur, extraction par injection, pinceaux spécifiques pour aérateurs et cuirs.",
      image: "service-nettoyage.webp",
      benefits: ["Nettoyage vapeur antibactérien", "Soin et nutrition des cuirs", "Décontamination de la carrosserie", "Dressing des plastiques intérieurs et extérieurs"],
      link: "/realisations?service=nettoyage"
    },
    {
      id: "polissage",
      title: "Polissage & Traitement Céramique",
      description: "Correction des micro-rayures et hologrammes suivie de l'application d'une protection céramique. Offre une brillance miroir, facilite l'entretien et protège contre les UV, fientes et sèves.",
      image: "service-polissage.webp",
      benefits: ["Correction des défauts jusqu'à 95%", "Effet hydrophobe extrême", "Brillance profonde (effet miroir)", "Protection longue durée (jusqu'à 5 ans)"],
      link: "/realisations?service=polissage"
    },
    {
      id: "covering",
      title: "Covering (Total ou Partiel)",
      description: "Changez l'apparence de votre véhicule de manière réversible. Des centaines de finitions (mat, satin, brillant, texturé) posées avec une précision chirurgicale sans abîmer la peinture d'origine.",
      image: "service-covering.webp",
      benefits: ["Large choix de couleurs et finitions", "Totalement réversible", "Protège la peinture sous-jacente", "Finition sans raccords visibles"],
      link: "/realisations?service=covering"
    },
    {
      id: "ppf",
      title: "Protection PPF (Paint Protection Film)",
      description: "Le bouclier ultime pour votre carrosserie. Un film polyuréthane transparent et auto-cicatrisant, posé sur mesure par notre équipe, qui protège contre les impacts de pierres, les rayures et les agressions chimiques sans altérer l'esthétique d'origine.",
      image: "service-ppf-pose.jpg",
      benefits: ["Film transparent auto-cicatrisant", "Protection contre les impacts et rayures", "Barrière contre les UV et agressions chimiques", "Pose sur mesure, quasi invisible"],
      link: "/realisations?service=ppf",
      detailLink: "/ppf",
      detailLabel: "En savoir plus sur le PPF"
    }
  ];

  return (
    <PageTransition className="flex flex-col w-full">
      <SEO 
        title="Nos Services de Detailing" 
        description="Découvrez nos prestations haut de gamme : nettoyage complet, polissage & traitement céramique, covering et protection PPF." 
      />

      <div className="container px-4 py-16 max-w-6xl mx-auto relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16 relative"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tighter text-foreground mb-4">L'Art du <span className="text-gradient-chrome">Detailing</span></h1>
          <p className="text-base md:text-lg font-sans text-muted-foreground leading-relaxed">
            Chaque prestation est réalisée avec une minutie obsessionnelle, en utilisant les meilleurs produits du marché pour garantir un résultat exceptionnel.
          </p>
        </motion.div>

        <div className="space-y-20">
          {services.map((service, idx) => (
            <div key={service.id} className={`flex flex-col ${idx % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 lg:gap-24 items-center`}>
              <motion.div 
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : (idx % 2 !== 0 ? 50 : -50), skewX: 0 }}
                whileInView={{ opacity: 1, x: 0, skewX: shouldReduceMotion ? 0 : -3 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: cinematicEase }}
                className="w-full md:w-1/2 relative"
              >
                <div className="absolute inset-0 bg-primary/20 transform translate-x-4 translate-y-4" />
                <div className="aspect-[4/3] overflow-hidden border border-border relative group bg-black shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-chrome opacity-0 group-hover:opacity-20 transition-opacity duration-700 mix-blend-overlay z-10 pointer-events-none" />
                  <img 
                    src={`${import.meta.env.BASE_URL}images/${service.image}`} 
                    alt={service.title} 
                    width="800"
                    height="600"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out opacity-80 group-hover:opacity-100"
                  />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : (idx % 2 !== 0 ? -50 : 50) }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2, ease: cinematicEase }}
                className="w-full md:w-1/2 space-y-8"
              >
                <h2 className="text-2xl lg:text-3xl font-heading font-bold uppercase tracking-tighter text-foreground border-l-4 border-primary pl-5 leading-tight">{service.title}</h2>
                <p className="font-sans text-lg text-muted-foreground leading-relaxed">{service.description}</p>
                
                <ul className="space-y-4 pt-4 font-sans">
                  {service.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-4 text-base text-foreground/90 bg-card p-4 border border-border hover:border-primary/30 transition-colors shadow-sm">
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                      <span className="font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-8 flex flex-col sm:flex-row sm:items-center gap-6">
                  {service.detailLink && (
                    <Link href={service.detailLink} className="inline-flex items-center justify-center px-8 py-4 text-sm btn-chrome shadow-lg shadow-primary/20">
                      <span>{service.detailLabel ?? "En savoir plus"}</span>
                    </Link>
                  )}
                  <Link href={service.link} className="inline-flex items-center gap-3 text-primary font-heading font-bold uppercase tracking-widest hover:text-accent transition-colors group">
                    Voir les réalisations <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </Link>
                </div>
              </motion.div>
            </div>
          ))}

        </div>

        <ContactCTA />
      </div>
    </PageTransition>
  );
}
