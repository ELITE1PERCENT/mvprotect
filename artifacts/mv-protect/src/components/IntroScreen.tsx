import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function IntroScreen({ onDone }: { onDone?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const already = sessionStorage.getItem("mvp-intro-seen");
    if (already) return;
    sessionStorage.setItem("mvp-intro-seen", "1");
    setVisible(true);
    const t = setTimeout(() => {
      setExiting(true);
    }, 2400);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!exiting && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
          style={{ backgroundColor: "#05080f" }}
          exit={{ y: "-100%" }}
          transition={{ duration: 1, ease }}
        >
          {/* Top scan line */}
          <motion.div
            className="absolute top-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #0060B4, transparent)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, ease, delay: 0.2 }}
          />

          {/* Main monogram */}
          <div className="flex flex-col items-center">
            <div className="overflow-hidden">
              <motion.div
                className="font-heading font-bold text-white leading-none"
                style={{ fontSize: "clamp(7rem, 22vw, 22rem)", letterSpacing: "-0.04em" }}
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.85, ease, delay: 0.15 }}
              >
                MV
              </motion.div>
            </div>

            <div className="overflow-hidden">
              <motion.div
                className="font-heading font-bold leading-none"
                style={{
                  fontSize: "clamp(1.8rem, 5.5vw, 5.5rem)",
                  letterSpacing: "0.45em",
                  paddingRight: "0.45em", /* compensate tracking */
                  background: "linear-gradient(135deg, #0060B4 0%, #36ADFF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                initial={{ y: "105%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.75, ease, delay: 0.42 }}
              >
                PROTECT
              </motion.div>
            </div>
          </div>

          {/* Progress bar */}
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 w-40 h-px overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #0060B4, #36ADFF)" }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.75 }}
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="absolute bottom-12 font-heading uppercase"
            style={{ fontSize: "10px", letterSpacing: "0.4em", color: "rgba(255,255,255,0.25)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Detailing automobile · Grand Est
          </motion.p>

          {/* Bottom scan line */}
          <motion.div
            className="absolute bottom-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #36ADFF, transparent)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, ease, delay: 0.5 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
