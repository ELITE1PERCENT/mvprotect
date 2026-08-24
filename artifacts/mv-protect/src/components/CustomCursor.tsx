/**
 * Custom magnetic cursor — dot (fast spring) + ring (slow spring, mixBlendMode:difference)
 * Only on desktop pointer:fine devices. Respects prefers-reduced-motion.
 * The ring enlarges when hovering interactive elements.
 */
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export function CustomCursor() {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [isHover, setIsHover] = useState(false);

  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);

  // Dot — fast
  const dotX = useSpring(rawX, { stiffness: 500, damping: 40, mass: 0.3 });
  const dotY = useSpring(rawY, { stiffness: 500, damping: 40, mass: 0.3 });

  // Ring — laggy
  const ringX = useSpring(rawX, { stiffness: 150, damping: 20, mass: 0.5 });
  const ringY = useSpring(rawY, { stiffness: 150, damping: 20, mass: 0.5 });

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    setVisible(true);

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      const el = e.target as Element | null;
      setIsHover(
        !!el?.closest("a, button, [data-cursor], input, textarea, select, [role='button']")
      );
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion, rawX, rawY]);

  if (!visible) return null;

  return (
    <>
      {/* Dot */}
      <motion.div
        aria-hidden
        className="cursor-glow pointer-events-none fixed top-0 left-0 z-[70] rounded-full"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          width: 8,
          height: 8,
          background: "hsl(var(--primary))",
          boxShadow: "0 0 12px hsl(var(--primary))",
        }}
      />
      {/* Ring */}
      <motion.div
        aria-hidden
        className="cursor-glow pointer-events-none fixed top-0 left-0 z-[70] rounded-full border border-primary/60"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          width: isHover ? 56 : 34,
          height: isHover ? 56 : 34,
          opacity: isHover ? 0.9 : 0.45,
          transition: "width 0.25s ease, height 0.25s ease, opacity 0.25s ease",
          mixBlendMode: "difference",
        }}
      />
    </>
  );
}

/**
 * Thin scroll progress bar pinned to the top of the viewport.
 */
import { useScroll } from "framer-motion";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left bg-gradient-chrome"
      style={{ scaleX }}
    />
  );
}
