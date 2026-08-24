import { webpUrl } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { PageTransition, cinematicEase } from "@/lib/animations";
import { motion, useReducedMotion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, ChevronRight, Eye, Loader2 } from "lucide-react";
import { useListArticles, getListArticlesQueryKey } from "@workspace/api-client-react";

export default function News() {
  const { data: articles, isLoading } = useListArticles({ query: { queryKey: getListArticlesQueryKey(), refetchInterval: 60_000 } });
  const shouldReduceMotion = useReducedMotion();

  return (
    <PageTransition className="flex flex-col w-full min-h-screen">
      <SEO 
        title="Actualités & Conseils Detailing" 
        description="Retrouvez nos derniers articles, conseils d'entretien et nouveautés de notre studio de detailing." 
      />

      <div className="container px-4 py-32 mx-auto max-w-7xl">
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: cinematicEase }}
          aria-label="Fil d'Ariane" 
          className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-widest text-muted-foreground mb-12 bg-card/80 backdrop-blur px-5 py-2.5 border border-border w-fit shadow-sm"
        >
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-border" />
          <span className="text-primary">Actualités</span>
        </motion.nav>

        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: cinematicEase }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold uppercase tracking-tighter text-foreground mb-6">Actualités & <span className="text-primary">Conseils</span></h1>
          <p className="font-sans text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Plongez dans l'univers du detailing. Astuces d'entretien, explications techniques et vie de l'atelier.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
            {articles?.map((article, index) => (
              <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 + (index * 0.1), ease: cinematicEase }}
                key={article.id}
                className="group flex flex-col bg-card border border-border overflow-hidden hover:border-primary/50 transition-colors shadow-xl hover:shadow-primary/5"
              >
                <Link href={`/actualites/${article.slug}`} className="block aspect-[16/10] overflow-hidden relative bg-black">
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay z-10" />
                  <img 
                    src={webpUrl(article.coverImageUrl)} 
                    alt={article.title} 
                    width="800"
                    height="533"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                  />
                </Link>
                <div className="p-8 md:p-10 flex flex-col flex-grow relative bg-card">
                  {/* Decorative diagonal accent */}
                  <div className="absolute top-0 right-10 w-16 h-1 bg-primary transform -translate-y-full" />
                  
                  <div className="flex items-center justify-between mb-5">
                    <time className="font-heading font-bold tracking-widest uppercase text-xs text-primary block">
                      {format(new Date(article.publishedAt), "d MMMM yyyy", { locale: fr })}
                    </time>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
                      <Eye className="w-3.5 h-3.5" />
                      {formatViews(article.viewCount)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">
                    <Link href={`/actualites/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <p className="font-sans text-muted-foreground text-base line-clamp-3 mb-8 flex-grow leading-relaxed">
                    {article.excerpt}
                  </p>
                  <Link href={`/actualites/${article.slug}`} className="inline-flex items-center gap-2 text-sm font-heading font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors mt-auto group/link">
                    Lire l'article <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1.5 transition-transform duration-300" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function formatViews(count: number): string {
  return count.toLocaleString("fr-FR") + " lecture" + (count > 1 ? "s" : "");
}
