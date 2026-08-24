/**
 * TiltCard — 3D mouse-tilt wrapper with spring physics and optional glare overlay.
 * Matches the `qd` component in the demo build.
 * Usage: wrap any card content with <TiltCard>…</TiltCard>
 */
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum tilt angle in degrees (default 10) */
  max?: number;
  /** Show glare overlay (default true) */
  glare?: boolean;
}

export function TiltCard({ children, className = "", max = 10, glare = true }: TiltCardProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springRotX = useSpring(rotX, { stiffness: 220, damping: 18 });
  const springRotY = useSpring(rotY, { stiffness: 220, damping: 18 });

  const [hovering, setHovering] = useState(false);

  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.35), transparent 45%)`
  );

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;   // 0-1
    const ny = (e.clientY - rect.top) / rect.height;   // 0-1
    rotY.set((nx - 0.5) * max * 2);
    rotX.set((0.5 - ny) * max * 2);
    glareX.set(nx * 100);
    glareY.set(ny * 100);
  };

  const onLeave = () => {
    rotX.set(0);
    rotY.set(0);
    setHovering(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={onLeave}
      style={{
        rotateX: springRotX,
        rotateY: springRotY,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
      }}
      className={`relative ${className}`}
    >
      <div className="h-full w-full" style={{ transform: "translateZ(0.01px)" }}>{children}</div>
      {glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 mix-blend-overlay"
          style={{
            opacity: hovering ? 0.5 : 0,
            transition: "opacity 0.3s",
            background: glareBackground,
          }}
        />
      )}
    </motion.div>
  );
}
