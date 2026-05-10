"use client";

import { motion } from "framer-motion";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 1.02, 0.73, 1] }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">قيد التطوير — سيتم إضافة الوظائف قريباً</p>
      </div>
    </motion.div>
  );
}
