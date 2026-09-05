"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export type Toast = { id: string; message: string };

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-5 left-0 right-0 flex flex-col items-center gap-2 z-50 pointer-events-none px-5">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-lime text-ink text-sm font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 max-w-sm"
          >
            <CheckCircle2 size={16} />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
