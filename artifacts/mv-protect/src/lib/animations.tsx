import { motion, useReducedMotion } from "framer-motion";
import type React from "react";

export const cinematicEase = [0.22, 1, 0.36, 1] as const;
export const smoothEase = [0.16, 1, 0.3, 1] as const;

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
} as const;

/**
 * Simple layout wrapper — page-level enter/exit is handled by AnimatedRoutes in App.tsx.
 * This component just provides a consistent container for page content.
 */
export function PageTransition({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function useCinematicVariants() {
  const shouldReduceMotion = useReducedMotion();
  return {
    fadeUp: {
      hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 48 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: cinematicEase } }
    } as const,
    fadeDown: {
      hidden: { opacity: 0, y: shouldReduceMotion ? 0 : -48 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: cinematicEase } }
    } as const,
    fadeLeft: {
      hidden: { opacity: 0, x: shouldReduceMotion ? 0 : 60 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: cinematicEase } }
    } as const,
    fadeRight: {
      hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -60 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: cinematicEase } }
    } as const,
    scaleUp: {
      hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: cinematicEase } }
    } as const,
    staggerContainer
  };
}
