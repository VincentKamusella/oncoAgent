"use client";

import { motion } from "motion/react";

type Props = {
  children: React.ReactNode;
};

export function FloatingOverlay({ children }: Props) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[520px] xl:block">
      <motion.div
        initial={{ opacity: 0, y: 12, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto absolute right-[-40px] top-[40px]"
      >
        {Array.isArray(children) ? children[0] : children}
      </motion.div>
      {Array.isArray(children) && children[1] && (
        <motion.div
          initial={{ opacity: 0, y: 16, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: 1.5 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute right-[20px] top-[260px]"
        >
          {children[1]}
        </motion.div>
      )}
    </div>
  );
}
