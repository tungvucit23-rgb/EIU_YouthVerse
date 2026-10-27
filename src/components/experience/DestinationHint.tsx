"use client";

import { motion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";

export function DestinationHint() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  return <motion.div className="destination-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.5 }}><p className="eyebrow">MỖI HÒN ĐẢO, MỘT KHỞI ĐẦU</p><h1>Bạn muốn đi đâu hôm nay?</h1><p>Chạm vào một hòn đảo để căng buồm khám phá.</p></motion.div>;
}
