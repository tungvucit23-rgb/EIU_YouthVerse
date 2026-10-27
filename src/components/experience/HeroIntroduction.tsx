"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Compass } from "lucide-react";

export function HeroIntroduction({ onStart }: { onStart: () => void }) {
  const reduced = useReducedMotion();
  return (
    <motion.section className="hero-introduction" aria-labelledby="hero-title" initial={{ opacity: 0, y: reduced ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -15 }} transition={{ duration: reduced ? 0 : 0.6 }}>
      <p className="eyebrow">EIU YOUTHVERSE</p>
      <h1 id="hero-title">Hoist the <em>Sails</em></h1>
      <svg className="hero-flourish" viewBox="0 0 550 42" fill="none" aria-hidden="true"><path d="M4 22C110-2 206 12 310 24C423 37 496 25 545 3C493 44 418 43 310 30C205 14 112 3 4 22Z" fill="currentColor" /></svg>
      <p className="hero-subtitle">Khơi buồm hành trình sinh viên</p>
      <PrimaryCTA onClick={onStart} />
    </motion.section>
  );
}

export function PrimaryCTA({ onClick }: { onClick: () => void }) {
  return <button className="primary-button" onClick={onClick}><Compass size={19} strokeWidth={1.4} /><span>Bắt đầu hành trình</span><ArrowRight size={18} /></button>;
}
