/**
 * ParallaxHeroImages — image unique animée via rAF loop.
 *
 * L'image suit la souris (parallax léger) et flotte doucement en idle.
 * Au scroll, l'image zoome progressivement.
 *
 * Adapté du composant QL du démo MV PROTECT (build minifié).
 */
import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";

interface ParallaxHeroImagesProps {
  src: string;
  /** CSS object-position, ex. "50% 50%" — cadrage réglé depuis l'admin. */
  position?: string;
  className?: string;
}

export function ParallaxHeroImages({
  src,
  position = "50% 50%",
  className = "",
}: ParallaxHeroImagesProps) {
  const reducedMotion = useReducedMotion();

  const imgX = useMotionValue(0);
  const imgY = useMotionValue(0);
  const imgScale = useMotionValue(1.12);

  useEffect(() => {
    // Smoothing factor (reduced motion = half amplitude)
    const motionFactor = reducedMotion ? 0.5 : 1;
    const amplitude = 16 * motionFactor; // image moves ±16px
    const idleAmplitude = reducedMotion ? 3 : 8; // idle float amplitude

    // Raw mouse position (normalised -1..+1)
    const target = { x: 0, y: 0 };
    // Smoothed/lerped position
    const smoothed = { x: 0, y: 0 };

    let scrollProgress = 0;
    let rafId = 0;
    let startTime = 0;

    const onMouseMove = (e: MouseEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onScroll = () => {
      const h = window.innerHeight || 1;
      scrollProgress = Math.min(1, Math.max(0, window.scrollY / h));
    };

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const t = (ts - startTime) * 0.001; // seconds

      // Lerp toward target (0.06 = smooth but responsive)
      smoothed.x += (target.x - smoothed.x) * 0.06;
      smoothed.y += (target.y - smoothed.y) * 0.06;

      // Idle float (sin/cos at different frequencies)
      const idleX = Math.sin(t * 0.5) * idleAmplitude;
      const idleY = Math.cos(t * 0.37) * idleAmplitude * 0.55;

      imgX.set(-smoothed.x * amplitude + idleX * 0.6);
      imgY.set(-smoothed.y * (amplitude * 0.8) + idleY * 0.6);
      imgScale.set(1.12 + scrollProgress * 0.13);

      rafId = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reducedMotion, imgX, imgY, imgScale]);

  return (
    <div className={className}>
      <motion.img
        src={src}
        alt="Studio de detailing MV Protect"
        draggable={false}
        style={{ x: imgX, y: imgY, scale: imgScale, objectPosition: position }}
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
      />
    </div>
  );
}
