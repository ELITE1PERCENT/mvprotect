import { webpUrl } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useSearch, useLocation } from "wouter";
import { SEO } from "@/components/SEO";
import { PageTransition, cinematicEase } from "@/lib/animations";
import { useListRealisations } from "@workspace/api-client-react";
import type { ListRealisationsParams } from "@workspace/api-client-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Loader2, Images } from "lucide-react";

type ExtraImage = { id: number; url: string };
/** Réalisation with the runtime `images` field the API attaches (not in the Zod schema). */
type RealisationRuntime = {
  id: number;
  title: string;
  service: string;
  imageUrl: string;
  description: string;
  vehicle?: string | null;
  sortOrder?: number;
  images?: ExtraImage[];
};

function getPhotos(r: RealisationRuntime): string[] {
  return [r.imageUrl, ...(r.images ?? []).map((i) => i.url)];
}

const VALID_SERVICES = ["nettoyage", "polissage", "ppf", "covering"] as const;

export default function Realisations() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const serviceParam = new URLSearchParams(search).get("service");
  const initialFilter = VALID_SERVICES.includes(serviceParam as (typeof VALID_SERVICES)[number]) ? serviceParam! : "all";

  const [filter, setFilterState] = useState<string>(initialFilter);
  const [selectedReal, setSelectedReal] = useState<number | null>(null); // réalisation index
  const [selectedPhoto, setSelectedPhoto] = useState<number>(0);         // photo index within réalisation
  const shouldReduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Keep selectedImage alias for legacy references
  const selectedImage = selectedReal;

  const setFilter = (id: string) => {
    setFilterState(id);
    setSelectedReal(null);
    navigate(id === "all" ? "/realisations" : `/realisations?service=${id}`, { replace: true });
  };

  const params: ListRealisationsParams | undefined =
    filter !== "all" ? { service: filter as ListRealisationsParams["service"] } : undefined;
  const { data: realisations, isLoading } = useListRealisations(params);

  const filters = [
    { id: "all", label: "Tout voir" },
    { id: "nettoyage", label: "Nettoyage" },
    { id: "polissage", label: "Polissage & Céramique" },
    { id: "ppf", label: "PPF" },
    { id: "covering", label: "Covering" },
  ];

  const filteredRealisations = realisations?.filter(r => filter === "all" || r.service === filter) || [];

  const openLightbox = (index: number) => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setSelectedReal(index);
    setSelectedPhoto(0);
  };
  const closeLightbox = () => {
    setSelectedReal(null);
    setSelectedPhoto(0);
    lastFocusedRef.current?.focus();
  };

  const currentReal = selectedReal !== null ? (filteredRealisations[selectedReal] as unknown as RealisationRuntime) : null;
  const currentPhotos = currentReal ? getPhotos(currentReal) : [];

  /** Navigate photos; when exhausted, move to next/prev réalisation */
  const goNext = () => {
    if (selectedReal === null) return;
    if (selectedPhoto < currentPhotos.length - 1) {
      setSelectedPhoto((p) => p + 1);
    } else if (selectedReal < filteredRealisations.length - 1) {
      setSelectedReal((i) => (i ?? 0) + 1);
      setSelectedPhoto(0);
    }
  };
  const goPrev = () => {
    if (selectedReal === null) return;
    if (selectedPhoto > 0) {
      setSelectedPhoto((p) => p - 1);
    } else if (selectedReal > 0) {
      const prevReal = filteredRealisations[selectedReal - 1] as unknown as RealisationRuntime;
      const prevPhotos = getPhotos(prevReal);
      setSelectedReal((i) => (i ?? 1) - 1);
      setSelectedPhoto(prevPhotos.length - 1);
    }
  };

  const isAtFirst = selectedReal === 0 && selectedPhoto === 0;
  const isAtLast  = selectedReal === filteredRealisations.length - 1 && selectedPhoto === currentPhotos.length - 1;

  const isOpen = selectedImage !== null;
  const totalCount = filteredRealisations.length;
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft")  { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedReal, selectedPhoto, totalCount]);

  return (
    <PageTransition className="flex flex-col w-full min-h-screen">
      <SEO 
        title="Nos Réalisations" 
        description="Galerie de nos projets de detailing automobile : polissage, protection PPF, covering et traitement céramique." 
      />

      <div className="container px-4 py-32 mx-auto max-w-[1600px]">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: cinematicEase }}
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold uppercase tracking-tighter text-foreground mb-6">La <span className="text-gradient-chrome">Galerie</span></h1>
          <p className="font-sans text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl">
            Découvrez une sélection de véhicules passés entre nos mains. L'avant/après de la perfection.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: cinematicEase }}
        >
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-8 py-3.5 font-heading font-bold uppercase tracking-widest text-sm transition-all duration-300 border-2 skew-x-[-10deg] ${
                filter === f.id 
                  ? "bg-primary text-white border-primary shadow-[0_8px_20px_rgba(0,96,180,0.5)]" 
                  : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-background"
              }`}
            >
              <span className="block skew-x-[10deg]">{f.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div 
            layout 
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredRealisations.map((item, index) => (
                <motion.button
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 }}
                  transition={{ duration: 0.5, ease: cinematicEase }}
                  key={item.id}
                  className="group cursor-pointer relative aspect-[4/3] w-full block text-left overflow-hidden border border-border hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors bg-black shadow-lg"
                  onClick={() => openLightbox(index)}
                  aria-label={`Agrandir : ${item.title}`}
                >
                  <img 
                    src={webpUrl(item.imageUrl)} 
                    alt={item.title} 
                    width="800"
                    height="800"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover opacity-90 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-100"
                  />
                  {/* Badge photo count */}
                  {((item as unknown as RealisationRuntime).images?.length ?? 0) > 0 && (
                    <span className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 text-white text-xs font-sans font-semibold rounded backdrop-blur-sm pointer-events-none">
                      <Images className="w-3.5 h-3.5 shrink-0" />
                      {1 + ((item as unknown as RealisationRuntime).images?.length ?? 0)}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                    <div className="transform translate-y-6 group-hover:translate-y-0 group-focus-visible:translate-y-0 transition-transform duration-500 ease-out">
                      <p className="text-primary font-heading font-bold uppercase tracking-widest text-sm mb-3">{item.service}</p>
                      <h3 className="text-white font-heading font-bold uppercase text-3xl leading-tight mb-2">{item.title}</h3>
                      {item.vehicle && <p className="text-gray-300 font-sans text-base">{item.vehicle}</p>}
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
            
            {filteredRealisations.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-32 text-center font-sans text-muted-foreground border-2 border-dashed border-border bg-card/50 text-lg"
              >
                Aucune réalisation trouvée pour cette catégorie.
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedReal !== null && currentReal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 backdrop-blur-xl"
            onClick={closeLightbox}
            onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartXRef.current;
              touchStartXRef.current = null;
              if (Math.abs(dx) < 40) return;
              if (dx < 0) goNext(); else goPrev();
            }}
            role="dialog"
            aria-modal="true"
            aria-label={`${currentReal.title} — visionneuse d'images`}
          >
            <button ref={closeButtonRef} aria-label="Fermer la visionneuse" className="absolute top-6 right-6 text-white/50 hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors z-20" onClick={closeLightbox}>
              <X className="w-12 h-12" />
            </button>

            <button
              aria-label="Précédent"
              className={`absolute left-4 md:left-8 p-4 bg-white/5 text-white hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors z-20 rounded-full backdrop-blur-sm ${isAtFirst ? 'opacity-0 pointer-events-none' : ''}`}
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              disabled={isAtFirst}
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.4, ease: cinematicEase }}
              className="relative max-w-7xl max-h-[90vh] w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Photo principale */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${selectedReal}-${selectedPhoto}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  src={webpUrl(currentPhotos[selectedPhoto] ?? currentReal.imageUrl)}
                  alt={`${currentReal.title} — photo ${selectedPhoto + 1}`}
                  className="max-w-full max-h-[65vh] object-contain border border-white/10 shadow-2xl"
                />
              </AnimatePresence>

              {/* Vignettes si plusieurs photos */}
              {currentPhotos.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto max-w-full pb-1">
                  {currentPhotos.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setSelectedPhoto(idx); }}
                      className={`shrink-0 w-14 h-14 border-2 transition-colors overflow-hidden ${idx === selectedPhoto ? 'border-primary' : 'border-white/10 hover:border-white/40'}`}
                      aria-label={`Photo ${idx + 1}`}
                    >
                      <img src={webpUrl(url)} alt={`${currentReal.title} — vignette ${idx + 1}`} width="56" height="56" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Légende */}
              <div className="mt-4 md:mt-6 text-center w-full max-w-3xl">
                <p className="text-primary font-heading font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">
                  {currentReal.service}
                  {currentPhotos.length > 1 && (
                    <span className="ml-3 text-white/30 font-sans font-normal normal-case tracking-normal text-xs">
                      {selectedPhoto + 1} / {currentPhotos.length}
                    </span>
                  )}
                </p>
                <h3 className="text-white font-heading font-bold uppercase text-xl sm:text-2xl md:text-4xl mb-2 md:mb-3">{currentReal.title}</h3>
                <p className="text-gray-400 font-sans text-sm sm:text-base md:text-lg leading-relaxed hidden sm:block">{currentReal.description}</p>
              </div>
            </motion.div>

            <button
              aria-label="Suivant"
              className={`absolute right-4 md:right-8 p-4 bg-white/5 text-white hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors z-20 rounded-full backdrop-blur-sm ${isAtLast ? 'opacity-0 pointer-events-none' : ''}`}
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              disabled={isAtLast}
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
