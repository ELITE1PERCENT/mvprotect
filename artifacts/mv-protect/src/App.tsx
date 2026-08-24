import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { useEffect, Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IntroScreen } from "@/components/IntroScreen";
import { usePageTracking } from "@/hooks/usePageTracking";

// Admin pages — completely separate from public layout
const AdminLogin  = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));

const cinematicEase = [0.22, 1, 0.36, 1] as const;

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

// Pages — lazy loaded for code splitting
const Home        = lazy(() => import("@/pages/Home"));
const Services    = lazy(() => import("@/pages/Services"));
const PPF         = lazy(() => import("@/pages/PPF"));
const Tarifs      = lazy(() => import("@/pages/Tarifs"));
const Realisations= lazy(() => import("@/pages/Realisations"));
const News        = lazy(() => import("@/pages/News"));
const Article     = lazy(() => import("@/pages/Article"));
const Contact     = lazy(() => import("@/pages/Contact"));
const Legal       = lazy(() => import("@/pages/Legal"));
const Privacy     = lazy(() => import("@/pages/Privacy"));
const Cookies     = lazy(() => import("@/pages/Cookies"));
const NotFound    = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AnimatedRoutes() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {/* motion.div must be the direct child of AnimatePresence so it can animate out */}
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.42, ease: cinematicEase }}
        style={{ minHeight: "100%" }}
      >
        <Suspense fallback={null}>
          <Switch location={location}>
            <Route path="/" component={Home} />
            <Route path="/services" component={Services} />
            <Route path="/ppf" component={PPF} />
            <Route path="/tarifs" component={Tarifs} />
            <Route path="/realisations" component={Realisations} />
            <Route path="/actualites" component={News} />
            <Route path="/actualites/:slug" component={Article} />
            <Route path="/contact" component={Contact} />
            <Route path="/mentions-legales" component={Legal} />
            <Route path="/politique-confidentialite" component={Privacy} />
            <Route path="/politique-cookies" component={Cookies} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function PublicRouter() {
  return (
    <>
      <Layout>
        <ScrollToTop />
        <AnimatedRoutes />
      </Layout>
      <IntroScreen />
    </>
  );
}

function AdminRouter() {
  return (
    <Suspense fallback={null}>
      <Switch>
        <Route path="/maximeadmin" component={AdminLogin} />
        <Route path="/maximeadmin/:rest*" component={AdminLayout} />
      </Switch>
    </Suspense>
  );
}

/** Decides whether to render the admin or the public site based on the current path */
function AppContent() {
  const [location] = useLocation();
  usePageTracking();
  if (location === "/maximeadmin" || location.startsWith("/maximeadmin/")) {
    return <AdminRouter />;
  }
  return <PublicRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
