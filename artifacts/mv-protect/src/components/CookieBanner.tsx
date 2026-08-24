import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cinematicEase } from "@/lib/animations";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  
  const [preferences, setPreferences] = useState({
    essential: true, // always true
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem("mvprotect-cookie-consent");
    if (!consent) {
      // Small delay to let page load first
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("mvprotect-cookie-consent", "all");
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem("mvprotect-cookie-consent", "essential");
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("mvprotect-cookie-consent", JSON.stringify(preferences));
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 100 }}
          transition={{ duration: 0.8, ease: cinematicEase }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none"
        >
          <div className="container mx-auto max-w-5xl pointer-events-auto">
            <div className="bg-card border-t-4 border-t-primary border border-border shadow-2xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
              
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rotate-45 pointer-events-none" />

              {!showPreferences ? (
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg md:text-xl font-heading font-bold uppercase tracking-widest text-foreground">Respect de votre vie privée</h3>
                    <p className="text-sm font-sans text-muted-foreground leading-relaxed max-w-3xl">
                      Nous utilisons des traceurs pour assurer le bon fonctionnement de notre site, analyser notre audience et améliorer nos services. 
                      Vous pouvez choisir d'accepter ou de personnaliser vos choix. 
                      <Link href="/politique-cookies" className="text-primary hover:text-accent transition-colors ml-1 font-medium">En savoir plus.</Link>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 shrink-0">
                    <button onClick={() => setShowPreferences(true)} className="px-5 py-2.5 text-sm btn-outline-skew">
                      <span>Personnaliser</span>
                    </button>
                    <button onClick={handleRejectAll} className="px-5 py-2.5 text-sm btn-outline-skew">
                      <span>Refuser</span>
                    </button>
                    <button onClick={handleAcceptAll} className="px-8 py-2.5 btn-chrome text-sm shadow-lg shadow-primary/20">
                      <span>Accepter tout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 relative z-10">
                  <div>
                    <h3 className="text-lg md:text-xl font-heading font-bold uppercase tracking-widest text-foreground mb-2">Préférences des cookies</h3>
                    <p className="text-sm font-sans text-muted-foreground">Sélectionnez les cookies que vous autorisez.</p>
                  </div>
                  
                  <div className="space-y-4 font-sans">
                    <div className="flex items-start justify-between gap-4 p-5 border border-border bg-background/50 hover:border-primary/30 transition-colors">
                      <div className="space-y-1.5">
                        <Label className="text-base font-bold text-foreground">Cookies essentiels</Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">Requis pour le fonctionnement du site. Ne peuvent être désactivés.</p>
                      </div>
                      <Switch checked={true} disabled className="mt-1" />
                    </div>
                    
                    <div className="flex items-start justify-between gap-4 p-5 border border-border bg-background/50 hover:border-primary/30 transition-colors">
                      <div className="space-y-1.5">
                        <Label className="text-base font-bold text-foreground cursor-pointer" htmlFor="analytics">Cookies analytiques</Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">Permettent de mesurer l'audience et d'améliorer nos services.</p>
                      </div>
                      <Switch 
                        id="analytics"
                        checked={preferences.analytics} 
                        onCheckedChange={(c) => setPreferences(prev => ({...prev, analytics: c}))} 
                        className="mt-1 data-[state=checked]:bg-primary"
                      />
                    </div>
                    
                    <div className="flex items-start justify-between gap-4 p-5 border border-border bg-background/50 hover:border-primary/30 transition-colors">
                      <div className="space-y-1.5">
                        <Label className="text-base font-bold text-foreground cursor-pointer" htmlFor="marketing">Cookies marketing</Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">Permettent d'afficher des publicités pertinentes.</p>
                      </div>
                      <Switch 
                        id="marketing"
                        checked={preferences.marketing} 
                        onCheckedChange={(c) => setPreferences(prev => ({...prev, marketing: c}))} 
                        className="mt-1 data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end pt-6 border-t border-border">
                    <button onClick={() => setShowPreferences(false)} className="px-5 py-2.5 text-sm btn-outline-skew">
                      <span>Retour</span>
                    </button>
                    <button onClick={handleSavePreferences} className="px-8 py-2.5 btn-chrome text-sm shadow-lg shadow-primary/20">
                      <span>Enregistrer mes choix</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
