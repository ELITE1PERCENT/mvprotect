import { webpUrl } from "@/lib/utils";
import { useRoute, Link, useLocation } from "wouter";
import { useCallback } from "react";
import { SEO } from "@/components/SEO";
import { PageTransition, useCinematicVariants, cinematicEase } from "@/lib/animations";
import { motion, useReducedMotion } from "framer-motion";
import { useGetArticle, getGetArticleQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, ChevronRight, Eye, Loader2 } from "lucide-react";

export default function Article() {
  const [, params] = useRoute("/actualites/:slug");
  const slug = params?.slug || "";
  const [, navigate] = useLocation();
  const { fadeUp, staggerContainer } = useCinematicVariants();
  const shouldReduceMotion = useReducedMotion();

  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest("a");
    if (!target) return;
    const href = target.getAttribute("href");
    if (!href) return;
    // Let external links, mailto, tel, anchors open normally
    if (/^(https?:\/\/|mailto:|tel:|#)/.test(href)) return;
    // Internal link: prevent full reload and navigate via wouter
    e.preventDefault();
    navigate(href);
  }, [navigate]);
  
  const { data: article, isLoading, error } = useGetArticle(slug, { 
    query: { enabled: !!slug, queryKey: getGetArticleQueryKey(slug), refetchInterval: 60_000 } 
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container px-4 py-40 text-center">
        <h1 className="text-5xl font-heading font-bold uppercase text-foreground mb-6">Article introuvable</h1>
        <Link href="/actualites" className="text-primary font-heading font-bold uppercase tracking-widest hover:text-accent transition-colors">Retour aux actualités</Link>
      </div>
    );
  }

  return (
    <PageTransition className="flex flex-col w-full pb-32">
      <SEO 
        title={article.title} 
        description={article.excerpt}
        datePublished={article.publishedAt}
        dateModified={article.updatedAt}
        imageUrl={`${import.meta.env.BASE_URL}${article.coverImageUrl}`}
        authorName="Maxime Viraud"
      />

      {/* Hero image — cinematic entry */}
      <motion.div
        className="w-full h-[65vh] min-h-[500px] relative overflow-hidden bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: cinematicEase }}
      >
        <motion.img 
          src={webpUrl(article.coverImageUrl)} 
          alt={article.title} 
          className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: cinematicEase }}
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </motion.div>

      <div className="container px-4 max-w-4xl mx-auto -mt-48 relative z-10">
        {/* Breadcrumb */}
        <motion.nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-widest text-muted-foreground mb-6 bg-card/90 backdrop-blur-md px-5 py-3 border border-border w-fit shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: cinematicEase }}
        >
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-border" />
          <Link href="/actualites" className="hover:text-primary transition-colors">Actualités</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-border" />
          <span className="text-primary truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: cinematicEase }}
        >
          <Link href="/actualites" className="inline-flex items-center gap-2 text-sm font-heading font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-10 bg-card/90 backdrop-blur-md px-5 py-3 border border-border shadow-lg">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
        </motion.div>
        
        {/* Article card */}
        <motion.div
          className="bg-card border-t-4 border-t-primary border border-border p-8 md:p-16 shadow-2xl mb-24 relative"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.4 } as any}
        >
          <time className="font-heading font-bold uppercase tracking-widest text-sm text-primary mb-8 block border-b border-border pb-4">
            {format(new Date(article.publishedAt), "d MMMM yyyy", { locale: fr })}
          </time>
          <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase tracking-tighter text-foreground mb-12 leading-tight">
            {article.title}
          </h1>
          
          <div
            className="prose prose-lg md:prose-xl max-w-none font-sans text-muted-foreground prose-headings:font-heading prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-ul:list-disc prose-ol:list-decimal prose-p:leading-relaxed prose-img:rounded-none prose-img:border prose-img:border-border prose-hr:border-border"
            dangerouslySetInnerHTML={{ __html: article.content }}
            onClick={handleContentClick}
          />
        </motion.div>

        {/* Related articles — stagger */}
        {article.related && article.related.length > 0 && (
          <motion.div
            className="border-t-2 border-border pt-20 mt-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              className="text-4xl font-heading font-bold uppercase tracking-tighter text-foreground mb-12"
              variants={fadeUp}
            >
              À lire <span className="text-primary">aussi</span>
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {article.related.map((rel) => (
                <motion.div
                  key={rel.id}
                  variants={{ hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: cinematicEase } } }}
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                >
                  <Link href={`/actualites/${rel.slug}`} className="group block bg-card border border-border hover:border-primary/50 transition-colors overflow-hidden shadow-lg">
                    <div className="flex flex-col sm:flex-row h-full">
                      <div className="w-full sm:w-2/5 aspect-[4/3] sm:aspect-square bg-black overflow-hidden relative shrink-0">
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay z-10" />
                        <img 
                          src={webpUrl(rel.coverImageUrl)} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out" 
                          alt={rel.title}
                          width="400"
                          height="267"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="flex flex-col justify-center p-6 w-full sm:w-3/5">
                        <p className="font-heading font-bold uppercase tracking-widest text-xs text-primary mb-3">{format(new Date(rel.publishedAt), "d MMM yyyy", { locale: fr })}</p>
                        <h3 className="text-foreground font-heading font-bold uppercase text-lg group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-4">{rel.title}</h3>
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-sans mt-auto">
                          <Eye className="w-3.5 h-3.5" />
                          {rel.viewCount.toLocaleString("fr-FR")} lecture{rel.viewCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
