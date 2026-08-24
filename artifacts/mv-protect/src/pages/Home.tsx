import { webpUrl } from "@/lib/utils";
import { useContentBlock } from "@/hooks/useContentBlock";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform, useSpring } from "framer-motion";
import type { Variants } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Eye, Star, Shield, Sparkles, Car, Clock } from "lucide-react";
import { useListTestimonials, useListArticles, getListArticlesQueryKey } from "@workspace/api-client-react";
import { PageTransition, useCinematicVariants, cinematicEase } from "@/lib/animations";
import { TiltCard } from "@/components/TiltCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { ParallaxHeroImages } from "@/components/ParallaxHeroImages";

type FeaturedRealisation = {
  id: number;
  title: string;
  service: string;
  imageUrl: string;
  description: string;
  vehicle: string | null;
  category: string | null;
  images: { id: number; url: string }[];
};

function useFeaturedRealisations() {
  return useQuery<FeaturedRealisation[]>({
    queryKey: ["realisations", "featured"],
    queryFn: () =>
      fetch("/api/realisations/featured")
        .then((r) => r.json())
        .then((d) => (Array.isArray(d) ? d : [])),
    staleTime: 60_000,
  });
}

function usePhotoCount() {
  return useQuery<{ total: number }>({
    queryKey: ["realisations", "photo-count"],
    queryFn: () => fetch("/api/realisations/photo-count").then((r) => r.json()),
    staleTime: 60_000,
  });
}
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Google reviews badge (hero) ─────────────────────────────────────────────
const GOOGLE_LOGO = (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

function HeroReviews({ testimonials }: { testimonials: Array<{ name: string; comment: string; rating: number }> | undefined }) {
  const [idx, setIdx] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!testimonials || testimonials.length <= 1) return;
    const timer = setInterval(() => setIdx(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, [testimonials]);

  const current = testimonials?.[idx];

  return (
    <div className="pt-5 border-t border-white/10 max-w-lg">
      <a
        href="https://www.google.com/maps/search/MV+Protect+Basse-Ham"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mb-3 group"
        aria-label="Voir nos avis Google"
      >
        {GOOGLE_LOGO}
        <span className="flex gap-0.5">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
        </span>
        <span className="font-heading font-bold text-white text-sm">5,0</span>
        <span className="text-white/40 font-sans text-xs">· Avis Google</span>
        <ArrowRight className="w-3 h-3 text-white/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
      </a>
      {current && (
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -14 }}
            transition={{ duration: 0.4, ease: cinematicEase }}
            className="text-white/50 font-sans text-sm italic leading-relaxed"
          >
            "{current.comment.length > 100 ? current.comment.slice(0, 100) + "\u2026" : current.comment}"
            {" "}<span className="text-white/70 not-italic font-heading font-bold text-xs">{current.name}</span>
          </motion.p>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Réalisations preview ─────────────────────────────────────────────────────
// Rotation sur le wrapper — contrôlée avec un z-index explicite par carte pour
// que la priorité de rendu soit définie (pas d'ordre DOM par défaut).
// Les grandes cartes (idx 0 et 5) sont en avant (z:4), les petites derrière (z:2/3).
const ROTATIONS = ["-1.5deg", "1.2deg", "-0.9deg", "1.8deg", "-1.2deg", "0.8deg"];
const Z_INDICES =  [4,         2,         3,         3,         2,         4];

function RealisationsCard({
  r, idx, className = "",
}: {
  r: FeaturedRealisation;
  idx: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const rotate = ROTATIONS[idx % ROTATIONS.length]!;
  const zIndex = Z_INDICES[idx % Z_INDICES.length]!;

  return (
    <motion.div
      className={`relative min-w-0 ${className}`}
      style={shouldReduceMotion ? { zIndex } : { rotate, zIndex }}
      whileHover={{ zIndex: 10 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: idx * 0.07, ease: cinematicEase }}
    >
      <Link
        href="/realisations"
        className="group block relative w-full h-full overflow-hidden bg-black
          border border-white/10 hover:border-primary/40
          shadow-[0_6px_28px_rgba(0,0,0,0.65)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.8)]
          transition-[border-color,box-shadow] duration-300"
      >
        <img
          src={webpUrl(r.imageUrl)}
          alt={r.title}
          loading="lazy" decoding="async"
          className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out"
        />
        {r.images.length > 0 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white/60 font-sans text-[10px] px-1.5 py-0.5 pointer-events-none">
            <Eye className="w-3 h-3" /> {r.images.length + 1}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-primary font-heading font-bold uppercase tracking-widest text-[10px] mb-1">{r.service}</p>
          <p className="text-white font-heading font-bold uppercase text-sm leading-tight line-clamp-2">{r.title}</p>
        </div>
      </Link>
    </motion.div>
  );
}

function RealisationsPreview() {
  const { fadeUp } = useCinematicVariants();
  const { data: featured } = useFeaturedRealisations();
  const { data: countData } = usePhotoCount();

  const items = featured ?? [];

  return (
    <section className="py-24 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
        >
          <div>
            <p className="text-primary font-heading font-bold uppercase tracking-widest text-xs mb-2">Portfolio</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tighter">
              Nos <span className="text-gradient-chrome">Réalisations</span>
            </h2>
            {countData && countData.total > 0 && (
              <p className="text-muted-foreground font-sans text-sm mt-1">
                {countData.total} photo{countData.total > 1 ? "s" : ""} au total
              </p>
            )}
          </div>
          <Link
            href="/realisations"
            className="hidden md:flex items-center gap-2 text-primary font-heading font-bold uppercase tracking-widest text-sm hover:text-accent transition-colors group shrink-0"
          >
            Voir toutes les réalisations <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
        </motion.div>

        {items.length > 0 ? (
          <>
            {/* Ligne 1 : grande gauche (65%) | 2 petites droite empilées (35%) */}
            <div className="isolate flex gap-8 md:gap-10 h-64 md:h-80 mb-8 md:mb-10">
              <RealisationsCard r={items[0]!} idx={0} className="w-[65%]" />
              <div className="w-[35%] flex flex-col gap-8 md:gap-10">
                <RealisationsCard r={items[1]!} idx={1} className="flex-1" />
                <RealisationsCard r={items[2]!} idx={2} className="flex-1" />
              </div>
            </div>

            {/* Ligne 2 : 2 petites gauche empilées (35%) | grande droite (65%) */}
            <div className="isolate flex gap-8 md:gap-10 h-64 md:h-80">
              <div className="w-[35%] flex flex-col gap-8 md:gap-10">
                <RealisationsCard r={items[3]!} idx={3} className="flex-1" />
                <RealisationsCard r={items[4]!} idx={4} className="flex-1" />
              </div>
              <RealisationsCard r={items[5]!} idx={5} className="w-[65%]" />
            </div>
          </>
        ) : (
          /* Placeholders loading */
          <>
            <div className="flex gap-5 md:gap-6 h-64 md:h-80 mb-5 md:mb-6">
              <div className="w-[65%] bg-white/5 animate-pulse" />
              <div className="w-[35%] flex flex-col gap-5 md:gap-6">
                <div className="flex-1 bg-white/5 animate-pulse" />
                <div className="flex-1 bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-5 md:gap-6 h-64 md:h-80">
              <div className="w-[35%] flex flex-col gap-5 md:gap-6">
                <div className="flex-1 bg-white/5 animate-pulse" />
                <div className="flex-1 bg-white/5 animate-pulse" />
              </div>
              <div className="w-[65%] bg-white/5 animate-pulse" />
            </div>
          </>
        )}

        <div className="mt-8 flex justify-center md:hidden">
          <Link href="/realisations" className="flex items-center gap-2 text-primary font-heading font-bold uppercase tracking-widest text-sm hover:text-accent transition-colors">
            Voir toutes les réalisations <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Articles section ─────────────────────────────────────────────────────────
function ArticlesSection() {
  const { data: articles } = useListArticles({ query: { queryKey: getListArticlesQueryKey(), refetchInterval: 60_000 } });
  const latest = articles ?? [];
  const { fadeUp } = useCinematicVariants();
  const shouldReduceMotion = useReducedMotion();

  if (latest.length === 0) return null;

  return (
    <section className="py-20 bg-card border-t border-border overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12"
        >
          <div>
            <p className="font-heading font-bold uppercase tracking-widest text-primary text-xs mb-2">Le blog</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tighter">
              Conseils & <span className="text-gradient-chrome">Actualités</span>
            </h2>
          </div>
          <Link href="/actualites" className="hidden md:flex items-center gap-2 text-primary font-heading font-bold uppercase tracking-widest text-sm hover:text-accent transition-colors group shrink-0">
            Tous les articles <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latest.slice(0, 3).map((article, index) => (
            <motion.div
              key={article.id}
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              variants={{ hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: index * 0.15, ease: cinematicEase } } }}
              className="group flex flex-col bg-background border border-border hover:border-primary/50 transition-colors overflow-hidden shadow-xl"
            >
              <Link href={`/actualites/${article.slug}`} className="block aspect-[16/10] overflow-hidden relative bg-black">
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay z-10" />
                <img src={webpUrl(article.coverImageUrl)} alt={article.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100" />
              </Link>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-3">
                  <time className="font-heading font-bold tracking-widest uppercase text-xs text-primary">
                    {format(new Date(article.publishedAt), "d MMMM yyyy", { locale: fr })}
                  </time>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
                    <Eye className="w-3.5 h-3.5" />
                    {article.viewCount.toLocaleString("fr-FR")} lecture{article.viewCount > 1 ? "s" : ""}
                  </span>
                </div>
                <h3 className="text-lg font-heading font-bold uppercase text-foreground mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  <Link href={`/actualites/${article.slug}`}>{article.title}</Link>
                </h3>
                <p className="font-sans text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow leading-relaxed">{article.excerpt}</p>
                <Link href={`/actualites/${article.slug}`} className="inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors mt-auto group/link">
                  Lire l'article <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1.5 transition-transform duration-300" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-10 md:hidden">
          <Link href="/actualites" className="flex items-center gap-2 text-primary font-heading font-bold uppercase tracking-widest text-sm hover:text-accent transition-colors">
            Tous les articles <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Hero section with parallax ───────────────────────────────────────────────
function HeroSection({
  staggerContainer, fadeUp, heroSubtitle, testimonials, shouldReduceMotion,
}: {
  staggerContainer: Variants;
  fadeUp: Variants;
  heroSubtitle: string;
  testimonials: Array<{ name: string; comment: string; rating: number }> | undefined;
  shouldReduceMotion: boolean | null;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const rawY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroY = useSpring(rawY, { stiffness: 80, damping: 30 });

  return (
    <section ref={heroRef} className="relative h-[calc(100dvh-116px)] md:h-[95vh] min-h-[500px] md:min-h-[700px] flex items-start md:items-center bg-background diagonal-slice overflow-hidden">
      {/* Desktop — parallax fond + voiture (mouse tracking) */}
      <motion.div
        className="absolute top-0 right-0 w-[65%] h-full diagonal-slice-reverse z-0 hidden lg:block bg-black overflow-hidden"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.8, ease: cinematicEase }}
      >
        <ParallaxHeroImages
          bgSrc={`${import.meta.env.BASE_URL}images/hero-bg.jpg`}
          carSrc={`${import.meta.env.BASE_URL}images/hero-car.png`}
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/20 to-background pointer-events-none" />
      </motion.div>

      {/* Mobile/Tablette — vue aérienne atelier detailing */}
      <div className="absolute inset-0 z-0 lg:hidden bg-[#030810] overflow-hidden">
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.78, scale: 1 }}
          transition={{ duration: 2.5, ease: cinematicEase }}
          src={`${import.meta.env.BASE_URL}images/hero-aerial.jpg`}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-top"
          decoding="async"
        />
        {/* Overlay sombre semi-transparent pour contraste texte */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        {/* Overlay bleu profond pour cohérence charte */}
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply pointer-events-none" />
        {/* Gradient gauche léger pour lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent pointer-events-none" />
        {/* Gradient bas pour transition douce */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
        {/* Logo MV PROTECT watermark bas droite */}
        <img
          src={`${import.meta.env.BASE_URL}images/logo.webp`}
          alt="MV PROTECT"
          aria-hidden
          className="absolute bottom-4 right-4 w-20 opacity-30 pointer-events-none select-none"
        />
      </div>

      {/* Mobile: flex-col + justify-between pour remplir toute la hauteur du hero */}
      <div className="container relative z-10 px-4 flex flex-col h-full pt-10 pb-6 md:flex-none md:h-auto md:py-0 md:block">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col justify-between flex-1 md:flex-none md:block md:max-w-2xl md:space-y-8 lg:ml-[4%]"
        >
          {/* Bloc haut : titre + sous-titre */}
          <div className="space-y-4">
            <motion.h1
              variants={fadeUp}
              className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-heading font-bold uppercase tracking-tighter leading-[1.2]"
            >
              MV PROTECT : <br />
              DETAILING AUTOMOBILE, <br />
              <span className="text-gradient-chrome">PPF, COVERING & TRAITEMENT CÉRAMIQUE</span> <br />
              DANS LE GRAND EST
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed font-sans"
            >
              {heroSubtitle}
            </motion.p>
          </div>

          {/* Bloc bas : boutons + avis (boutons en premier) */}
          <div className="space-y-5 md:space-y-8">
            <motion.div
              variants={fadeUp}
              className="flex flex-col md:flex-row items-center md:justify-start gap-3 md:gap-5"
            >
              <Link href="/contact" className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 btn-chrome group text-sm text-center whitespace-nowrap shadow-xl shadow-primary/20">
                <span className="flex items-center justify-center gap-1.5">Demander un devis <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" /></span>
              </Link>
              <Link href="/services" className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 btn-outline-skew text-sm text-center">
                <span>Découvrir nos services</span>
              </Link>
            </motion.div>

            {/* Avis Google */}
            <motion.div variants={fadeUp}>
              <HeroReviews testimonials={testimonials} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats strip ───────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { icon: Car,     to: 200, suffix: "+", label: "Véhicules traités" },
    { icon: Shield,  to: 5,   suffix: " ans", label: "D'expérience" },
    { icon: Star,    to: 5,   suffix: ",0", label: "Note Google" },
    { icon: Clock,   to: 100, suffix: "%", label: "Satisfaction client" },
  ];
  const { fadeUp } = useCinematicVariants();

  return (
    <section className="py-12 bg-primary/5 border-y border-primary/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map(({ icon: Icon, to, suffix, label }, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeUp}
              className="flex flex-col items-center text-center"
            >
              <Icon className="w-6 h-6 text-primary mb-3 opacity-70" />
              <div className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                <AnimatedCounter to={to} suffix={suffix} duration={1.8} />
              </div>
              <p className="text-muted-foreground font-sans text-xs uppercase tracking-widest mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: testimonials } = useListTestimonials();
  const { staggerContainer, fadeUp } = useCinematicVariants();
  const shouldReduceMotion = useReducedMotion();

  // Seuls les avis Google vérifiés (source === "google") sont affichés dans le
  // hero, car ils y sont étiquetés « Avis Google ».
  const googleReviews = testimonials?.filter((t) => t.source === "google");

  // Editable content blocks
  const heroSubtitle      = useContentBlock("home.hero.subtitle", "Studio de detailing haut de gamme. Protection, correction et brillance absolue pour véhicules d'exception.");
  const servicesHeadingRaw = useContentBlock("home.services.heading", "L'ART DU SOIN AUTOMOBILE");
  const testimonialHeadingRaw = useContentBlock("home.testimonials.heading", "Ils nous font confiance");

  // Split last word for gradient highlight
  const servicesWords      = servicesHeadingRaw.trim().split(" ");
  const servicesHighlight  = servicesWords.pop() ?? "AUTOMOBILE";
  const servicesPrefix     = servicesWords.join(" ");
  const testimonialWords   = testimonialHeadingRaw.trim().split(" ");
  const testimonialHighlight = testimonialWords.pop() ?? "confiance";
  const testimonialPrefix  = testimonialWords.join(" ");

  return (
    <PageTransition className="flex flex-col w-full">
      <SEO
        title="Accueil"
        description="MV PROTECT : Studio de detailing automobile haut de gamme. Nettoyage, polissage, traitement céramique et pose de film PPF."
      />

      {/* Hero with parallax */}
      <HeroSection
        staggerContainer={staggerContainer}
        fadeUp={fadeUp}
        heroSubtitle={heroSubtitle}
        testimonials={googleReviews}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* Stats strip */}
      <StatsStrip />

      {/* Section explicative — Votre véhicule mérite le meilleur */}
      <section className="py-20 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="max-w-3xl mx-auto text-center mb-14"
          >
            <p className="text-primary font-heading font-bold uppercase tracking-widest text-xs mb-3">Studio MV PROTECT — Basse-Ham (57)</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tighter mb-5">
              Votre véhicule mérite <span className="text-gradient-chrome">le meilleur</span>
            </h2>
            <p className="text-muted-foreground font-sans text-base md:text-lg leading-relaxed">
              Chez MV PROTECT, chaque véhicule est traité comme une œuvre d'art. Basés à Basse-Ham en Moselle, 
              nous intervenons sur tous types de véhicules — berlines, SUV, sportives, et véhicules de collection — 
              avec des produits professionnels haut de gamme et un souci du détail absolu.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: "🛡️",
                title: "Protection longue durée",
                text: "Nos films PPF et traitements céramique protègent durablement votre carrosserie contre les rayures, UV et projections de gravier. Une protection invisible, garantie plusieurs années.",
              },
              {
                icon: "✨",
                title: "Résultats visibles dès le premier regard",
                text: "Polissage machine, décontamination et correction de peinture : nous éliminons les défauts pour révéler l'éclat d'origine de votre véhicule, voire le sublimer au-delà.",
              },
              {
                icon: "🤝",
                title: "Une équipe à votre écoute",
                text: "Notre équipe vous reçoit en atelier sur rendez-vous, évalue votre véhicule et vous propose un devis personnalisé. Transparence et rigueur à chaque étape.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: cinematicEase }}
                className="bg-background border border-border p-7 md:p-8 flex flex-col gap-4"
              >
                <span className="text-3xl" aria-hidden>{item.icon}</span>
                <h3 className="font-heading font-bold uppercase tracking-widest text-sm text-foreground">{item.title}</h3>
                <p className="text-muted-foreground font-sans text-sm leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="mt-10 text-center"
          >
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 btn-chrome group text-sm shadow-xl shadow-primary/20">
              <span className="flex items-center gap-1.5">Demander un devis gratuit <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" /></span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services — grille 2×2 avec TiltCard */}
      <section className="py-20 bg-background relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end mb-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tighter mb-3">{servicesPrefix} <span className="text-gradient-chrome">{servicesHighlight}</span></h2>
              <p className="text-muted-foreground font-sans text-base lg:text-lg max-w-xl">Notre expertise se décline en quatre disciplines exigeantes.</p>
            </div>
            <Link href="/services" className="hidden md:flex items-center gap-2 text-primary font-heading font-bold uppercase tracking-widest hover:text-accent transition-colors group shrink-0">
              Tous nos services <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {[
              { title: "Nettoyage", img: "service-nettoyage.webp", desc: "Rénovation intérieure et extérieure minutieuse.", href: "/services" },
              { title: "Polissage", img: "service-polissage.webp", desc: "Correction des défauts et lustre parfait.", href: "/services" },
              { title: "Film PPF", img: "service-ppf.webp", desc: "Bouclier transparent auto-cicatrisant.", href: "/ppf" },
              { title: "Covering", img: "service-covering.webp", desc: "Personnalisation esthétique totale.", href: "/services" },
            ].map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40, scale: shouldReduceMotion ? 1 : 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.65, delay: idx * 0.12, ease: cinematicEase }}
              >
                <TiltCard max={6} className="aspect-[4/3]">
                  <Link href={service.href} className="group block relative overflow-hidden w-full h-full bg-black shadow-xl border border-border hover:border-primary/50 transition-colors duration-300">
                    <img
                      src={`${import.meta.env.BASE_URL}images/${service.img}`}
                      alt={service.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <h3 className="font-heading font-bold uppercase tracking-widest text-white text-base md:text-lg group-hover:text-primary transition-colors duration-300">{service.title}</h3>
                      <p className="text-white/60 font-sans text-xs md:text-sm mt-1 hidden sm:block">{service.desc}</p>
                    </div>
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />
                  </Link>
                </TiltCard>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 md:hidden flex justify-center">
            <Link href="/services" className="flex items-center gap-2 text-primary font-heading font-bold uppercase tracking-widest hover:text-accent transition-colors">
              Tous nos services <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Réalisations */}
      <RealisationsPreview />

      {/* Testimonials */}
      <section className="py-32 bg-background overflow-hidden relative">
        <div className="container mx-auto px-4 mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={fadeUp}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tighter">{testimonialPrefix} <br /><span className="text-gradient-chrome">{testimonialHighlight}</span></h2>
          </motion.div>
          <motion.a
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: cinematicEase }}
            href="https://www.google.com/maps/search/MV+Protect+Basse-Ham"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 bg-card border border-border hover:border-primary/60 transition-colors px-8 py-5 shadow-lg"
          >
            <svg className="w-10 h-10 flex-shrink-0" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-heading font-bold uppercase tracking-wider text-base">Avis Google</span>
                <span className="font-heading font-bold text-primary text-lg">5,0</span>
                <span className="flex gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-sans mt-1 group-hover:text-primary transition-colors">Voir tous nos avis sur Google →</p>
            </div>
          </motion.a>
        </div>
        
        {testimonials && testimonials.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative flex overflow-x-hidden group mt-16"
          >
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-24 md:w-64 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-24 md:w-64 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            
            <div className="animate-marquee flex gap-8 px-4 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
              {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="flex-shrink-0 w-[300px] sm:w-[450px] p-6 sm:p-10 bg-card border-l-4 border-l-primary shadow-xl skew-x-[-5deg]">
                  <div className="skew-x-[5deg]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex text-primary gap-1">
                        {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                      </div>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-heading font-bold flex items-center gap-2">
                        {t.source === "google" ? (
                          <>
                            <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
                            </svg>
                            Avis Google
                          </>
                        ) : (
                          "Témoignage client"
                        )}
                      </span>
                    </div>
                    <p className="text-muted-foreground font-sans text-base italic mb-8 leading-relaxed">"{t.comment}"</p>
                    <div className="mt-auto border-t border-border pt-5">
                      <p className="font-heading font-bold uppercase tracking-wider text-foreground">{t.name}</p>
                      {t.vehicle && <p className="text-sm text-primary font-sans mt-1">{t.vehicle}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>
      
      {/* Articles & Conseils */}
      <ArticlesSection />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
          }
        }
      `}} />
    </PageTransition>
  );
}
