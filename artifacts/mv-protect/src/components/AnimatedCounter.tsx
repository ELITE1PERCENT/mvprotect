/**
 * AnimatedCounter — counts from `from` to `to` when the element enters the viewport.
 * Matches the `kL` component in the demo build.
 */
import { useRef, useState, useEffect } from "react";
import { useInView, animate, useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({
  to,
  from = 0,
  duration = 2,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [value, setValue] = useState(from);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setValue(to);
      return;
    }
    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, to, from, duration, reducedMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
