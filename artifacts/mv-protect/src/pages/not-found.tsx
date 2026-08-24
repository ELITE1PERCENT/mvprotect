import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { PageTransition, cinematicEase } from "@/lib/animations";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <PageTransition className="flex flex-col items-center justify-center min-h-[85vh] w-full text-center px-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-luminosity pointer-events-none" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero.webp)` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
      
      <SEO 
        title="Page introuvable" 
        description="La page que vous cherchez n'existe pas ou a été déplacée." 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: cinematicEase }}
        className="space-y-10 max-w-xl relative z-10 bg-card/80 backdrop-blur-xl p-16 border-t-4 border-t-primary border border-border shadow-2xl"
      >
        <h1 className="text-8xl md:text-[150px] leading-none font-heading font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-chrome filter drop-shadow-lg">
          404
        </h1>
        <div className="space-y-6 font-sans">
          <h2 className="text-4xl font-heading font-bold uppercase tracking-widest text-foreground">Hors <span className="text-primary">Piste</span></h2>
          <p className="text-muted-foreground leading-relaxed text-xl">
            Il semblerait que vous ayez quitté la trajectoire idéale. La page que vous recherchez n'existe pas ou n'est plus disponible.
          </p>
        </div>
        <div className="pt-10">
          <Link href="/" className="inline-flex px-12 py-5 text-sm btn-chrome shadow-xl shadow-primary/20">
            <span>Retour aux stands</span>
          </Link>
        </div>
      </motion.div>
    </PageTransition>
  );
}
