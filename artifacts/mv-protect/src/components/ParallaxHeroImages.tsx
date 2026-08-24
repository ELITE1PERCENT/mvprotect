/**
 * ParallaxHeroImages — deux images superposées animées via rAF loop.
 *
 * Le fond (hero-bg.jpg) suit la souris doucement (amplitude ×10).
 * La voiture (hero-car.png) suit la souris beaucoup plus vite (amplitude ×28),
 * créant un effet de profondeur 3D. Les deux flottent légèrement en idle.
 * Au scroll, les deux images zooment progressivement.
 *
 * Adapté du composant QL du démo MV PROTECT (build minifié).
 */
import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";

interface ParallaxHeroImagesProps {
  bgSrc: string;
  carSrc: string;
  className?: string;
}

export function ParallaxHeroImages({ bgSrc, carSrc, className = "" }: ParallaxHeroImagesProps) {
  const reducedMotion = useReducedMotion();

  // Background motion values
  const bgX = useMotionValue(0);
  const bgY = useMotionValue(0);
  const bgScale = useMotionValue(1.12);

  // Car motion values
  const carX = useMotionValue(0);
  const carY = useMotionValue(0);
  const carScale = useMotionValue(1.12);

  useEffect(() => {
    // Smoothing factor (reduced motion = half amplitude)
    const motionFactor = reducedMotion ? 0.5 : 1;
    const bgAmplitude = 10 * motionFactor;   // bg moves ±10px
    const carAmplitude = 28 * motionFactor;  // car moves ±28px (2.8× bg)
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

      // Background — slower parallax + subtle idle
      bgX.set(-smoothed.x * bgAmplitude + idleX * 0.35);
      bgY.set(-smoothed.y * (bgAmplitude * 0.8) + idleY * 0.35);
      bgScale.set(1.12 + scrollProgress * 0.1);

      // Car — faster parallax + more idle float
      carX.set(-smoothed.x * carAmplitude + idleX);
      carY.set(-smoothed.y * (carAmplitude * 0.8) + idleY);
      carScale.set(1.12 + scrollProgress * 0.17);

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
  }, [reducedMotion, bgX, bgY, bgScale, carX, carY, carScale]);

  return (
    <div className={className}>
      {/* Background layer — moves slowly */}
      <motion.img
        src={bgSrc}
        alt="Studio de detailing MV Protect"
        draggable={false}
        style={{ x: bgX, y: bgY, scale: bgScale }}
        className="absolute inset-0 w-full h-full object-cover object-center will-change-transform"
      />
      {/* Car layer — moves faster, creating depth */}
      <motion.img
        src={carSrc}
        alt=""
        aria-hidden
        draggable={false}
        style={{ x: carX, y: carY, scale: carScale }}
        className="absolute inset-0 w-full h-full object-cover object-center will-change-transform pointer-events-none"
      />
    </div>
  );
}
