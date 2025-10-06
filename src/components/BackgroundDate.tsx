// src/components/BackgroundDate.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";

export function BackgroundDate({ dateString }: { dateString: string }) {
  if (!dateString) return null;

  const [month, year] = dateString.split(" ");

  return (
    <div className="fixed inset-0 flex items-center justify-center -z-10 pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={dateString}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="text-[20vw] font-black text-gray-800/50 dark:text-gray-800 opacity-50 select-none"
        >
          <span className="block -mb-[5vw]">{month}</span>
          <span className="block">{year}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}