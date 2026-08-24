/**
 * PageLoadingScreen — overlay de transition entre chaque page.
 *
 * Déclenché automatiquement par useLocation() (wouter).
 * Une voiture de sport SVG traverse l'écran de gauche à droite avec
 * des traînées de vitesse. L'overlay disparaît en fade-out après
 * un court délai.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ── Hook : se déclenche sur chaque changement de route (pas au premier mount) ──
function useNavigationLoading(durationMs = 680) {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const prevRef = useRef(location);
  const firstMount = useRef(true);

  useEffect(() => {
    // Ignore the very first render (intro animation already handles that)
    if (firstMount.current) {
      firstMount.current = false;
      prevRef.current = location;
      return;
    }
    if (location === prevRef.current) return;
    prevRef.current = location;

    setVisible(true);
    const t = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(t);
  }, [location, durationMs]);

  return visible;
}

// ── SVG voiture de sport vue de profil (épurée, bleue) ─────────────────────
function SportCarSVG() {
  return (
    <svg
      viewBox="0 0 220 90"
      width="180"
      height="74"
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Carrosserie principale */}
      <path
        d="M12 62
           C12 62 18 62 22 62
           L30 62 30 54
           Q32 42 48 32
           Q60 22 80 20
           L138 20
           Q158 20 170 30
           L186 44 190 54 190 62
           L196 62
           C196 62 200 62 202 62"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="0"
      />
      {/* Body fill */}
      <path
        d="M30 62 L30 54
           Q32 42 50 32
           Q63 22 82 20
           L138 20
           Q160 20 172 31
           L188 46 190 55 190 62 Z"
        fill="#1d4ed8"
      />
      {/* Toit / habitacle */}
      <path
        d="M82 20
           Q85 8 100 6
           L135 6
           Q152 6 160 20 Z"
        fill="#1e40af"
      />
      {/* Vitre */}
      <path
        d="M87 18
           Q89 9 102 8
           L133 8
           Q147 9 155 18 Z"
        fill="#93c5fd"
        opacity="0.55"
      />
      {/* Bande chromée latérale */}
      <line x1="32" y1="45" x2="188" y2="45" stroke="#60a5fa" strokeWidth="1.2" opacity="0.6" />
      {/* Phare avant */}
      <path d="M188 47 L194 44 L194 50 L188 52 Z" fill="#fef08a" opacity="0.9" />
      {/* Feu arrière */}
      <ellipse cx="32" cy="49" rx="3" ry="5" fill="#f87171" opacity="0.8" />
      {/* Bas de caisse */}
      <rect x="32" y="60" width="158" height="4" rx="2" fill="#1e3a8a" />

      {/* Roue arrière */}
      <circle cx="62" cy="66" r="16" fill="#0f172a" />
      <circle cx="62" cy="66" r="10" fill="#1e3a8a" />
      <circle cx="62" cy="66" r="4"  fill="#60a5fa" />
      {[0,60,120,180,240,300].map(deg => (
        <line
          key={deg}
          x1={62 + 5 * Math.cos(deg * Math.PI / 180)}
          y1={66 + 5 * Math.sin(deg * Math.PI / 180)}
          x2={62 + 10 * Math.cos(deg * Math.PI / 180)}
          y2={66 + 10 * Math.sin(deg * Math.PI / 180)}
          stroke="#60a5fa"
          strokeWidth="1.5"
        />
      ))}

      {/* Roue avant */}
      <circle cx="160" cy="66" r="16" fill="#0f172a" />
      <circle cx="160" cy="66" r="10" fill="#1e3a8a" />
      <circle cx="160" cy="66" r="4"  fill="#60a5fa" />
      {[0,60,120,180,240,300].map(deg => (
        <line
          key={deg}
          x1={160 + 5 * Math.cos(deg * Math.PI / 180)}
          y1={66 + 5 * Math.sin(deg * Math.PI / 180)}
          x2={160 + 10 * Math.cos(deg * Math.PI / 180)}
          y2={66 + 10 * Math.sin(deg * Math.PI / 180)}
          stroke="#60a5fa"
          strokeWidth="1.5"
        />
      ))}

      {/* Ailerons / becquet arrière */}
      <path d="M28 38 L18 30 L32 32 Z" fill="#1d4ed8" />
      <line x1="18" y1="30" x2="18" y2="40" stroke="#1d4ed8" strokeWidth="2" />
    </svg>
  );
}

// ── Traînées de vitesse (lignes horizontales animées) ────────────────────────
function SpeedLines() {
  const lines = [
    { y: 30, w: 55, opacity: 0.6, delay: 0 },
    { y: 38, w: 80, opacity: 0.8, delay: 0.04 },
    { y: 45, w: 65, opacity: 0.7, delay: 0.02 },
    { y: 52, w: 90, opacity: 0.9, delay: 0 },
    { y: 58, w: 45, opacity: 0.5, delay: 0.06 },
    { y: 65, w: 70, opacity: 0.6, delay: 0.03 },
  ];

  return (
    <div
      className="absolute pointer-events-none"
      style={{ right: "100%", top: 0, bottom: 0, width: 110 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 110 90" width="110" height="74" overflow="visible">
        {lines.map((l, i) => (
          <motion.line
            key={i}
            x1={110 - l.w}
            y1={l.y}
            x2={108}
            y2={l.y}
            stroke="#3b82f6"
            strokeWidth={i === 3 ? 2 : 1.2}
            strokeLinecap="round"
            opacity={l.opacity}
            animate={{ scaleX: [0.4, 1, 0.6], opacity: [l.opacity * 0.5, l.opacity, l.opacity * 0.3] }}
            transition={{ duration: 0.4, repeat: Infinity, delay: l.delay, ease: "easeInOut" }}
            style={{ transformOrigin: "right center" }}
          />
        ))}
      </svg>
    </div>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────
export function PageLoadingScreen() {
  const isVisible = useNavigationLoading(680);
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      {/* Inject keyframe animation for the car drive */}
      <style>{`
        @keyframes mvDrive {
          from { transform: translateX(-200px); }
          to   { transform: translateX(calc(100vw + 200px)); }
        }
        .mv-car-drive {
          animation: mvDrive 1.3s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .mv-car-drive { animation-duration: 2.6s; }
        }
      `}</style>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="page-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
            style={{
              zIndex: 200,
              background: "hsl(var(--background))",
            }}
            aria-hidden="true"
          >
            {/* Grille de fond subtile */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(var(--primary)/0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.2) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Ligne de route */}
            <div
              className="absolute w-full"
              style={{
                bottom: "calc(50% - 48px)",
                borderBottom: "1px solid hsl(var(--primary)/0.15)",
              }}
            />

            {/* Voiture + traînée */}
            {!shouldReduceMotion && (
              <div className="mv-car-drive relative" style={{ top: -8 }}>
                <SpeedLines />
                <SportCarSVG />
              </div>
            )}

            {/* Logo centré en fond (réduit, subtil) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img
                src={`${import.meta.env.BASE_URL}images/logo.webp`}
                alt=""
                className="h-12 opacity-[0.06]"
                draggable={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
