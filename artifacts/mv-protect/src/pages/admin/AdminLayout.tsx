import { useEffect, Suspense, lazy } from "react";
import { useLocation, Switch, Route } from "wouter";
import { logout } from "@/lib/adminApi";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  LayoutDashboard,
  Images,
  FileText,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const AdminDashboard = lazy(() => import("./AdminDashboard"));
const AdminRealisations = lazy(() => import("./AdminRealisations"));
const AdminContent = lazy(() => import("./AdminContent"));
const AdminTestimonials = lazy(() => import("./AdminTestimonials"));

const NAV = [
  { href: "/maximeadmin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/maximeadmin/realisations", label: "Réalisations", icon: Images },
  { href: "/maximeadmin/contenus", label: "Contenus", icon: FileText },
  { href: "/maximeadmin/temoignages", label: "Témoignages", icon: MessageSquare },
];

export default function AdminLayout() {
  const authState = useAdminAuth();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (authState === "unauthenticated") navigate("/maximeadmin");
  }, [authState, navigate]);

  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <span className="text-white/40 font-sans text-sm">Chargement…</span>
      </div>
    );
  }

  async function handleLogout() {
    await logout().catch(() => {});
    navigate("/maximeadmin");
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-[#080c14] border-r border-white/5 shrink-0">
        <div className="p-6 border-b border-white/5">
          <span className="font-heading font-bold text-lg tracking-widest uppercase text-white">
            MV <span className="text-[#1e6fff]">PROTECT</span>
          </span>
          <p className="text-white/30 font-sans text-xs mt-1 uppercase tracking-widest">Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              onClick={() => navigate(href)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-sans transition-colors ${
                location.startsWith(href)
                  ? "bg-[#1e6fff]/15 text-[#1e6fff] border-l-2 border-[#1e6fff]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-sans text-white/40 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#080c14] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <span className="font-heading font-bold text-base tracking-widest uppercase text-white">
          MV <span className="text-[#1e6fff]">PROTECT</span>
        </span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/60">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <aside className="w-60 h-full bg-[#080c14] border-r border-white/5 flex flex-col pt-16" onClick={(e) => e.stopPropagation()}>
            <nav className="flex-1 p-4 space-y-1">
              {NAV.map(({ href, label, icon: Icon }) => (
                <button
                  key={href}
                  onClick={() => { navigate(href); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-sans transition-colors ${
                    location.startsWith(href)
                      ? "bg-[#1e6fff]/15 text-[#1e6fff]"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-white/5">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-sans text-white/40 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        <Suspense fallback={<div className="p-8 text-white/30 font-sans text-sm">Chargement…</div>}>
          <Switch>
            <Route path="/maximeadmin/dashboard" component={AdminDashboard} />
            <Route path="/maximeadmin/realisations" component={AdminRealisations} />
            <Route path="/maximeadmin/contenus" component={AdminContent} />
            <Route path="/maximeadmin/temoignages" component={AdminTestimonials} />
          </Switch>
        </Suspense>
      </main>
    </div>
  );
}
