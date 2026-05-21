import React from "react";
import { motion } from "motion/react";
import { X, Award, ShieldCheck, Cpu, Layers, Sparkles, Scale } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

export function FounderSignatureModal() {
  const isFounderPortalOpen = useUIStore((state) => state.isFounderPortalOpen);
  const setFounderPortalOpen = useUIStore((state) => state.setFounderPortalOpen);

  if (!isFounderPortalOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFounderPortalOpen(false)}
            className="absolute inset-0 bg-navy-950/80 backdrop-blur-md"
          />

          {/* Modal Card with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/40"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -left-20 -top-20 -z-10 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 -z-10 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />

            {/* Close Button */}
            <button
              onClick={() => setFounderPortalOpen(false)}
              className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/15 active:scale-95"
            >
              <X size={18} className="text-white/80" />
            </button>

            {/* Content Container */}
            <div className="flex flex-col items-center text-center space-y-6 pt-4">
              {/* Badge/Icon Container */}
              <motion.div
                initial={{ rotate: -15, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent-500 to-amber-400 p-0.5 shadow-lg shadow-accent-500/30"
              >
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-navy-900">
                  <Scale size={42} className="text-accent-500" />
                </div>
                <div className="absolute -right-2 -top-2 animate-bounce">
                  <Sparkles size={20} className="text-amber-300" />
                </div>
              </motion.div>

              {/* Founder Header */}
              <div className="space-y-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-accent-400 uppercase"
                >
                  <Award size={12} /> Certificate of Vision & Sovereignty
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-accent-300 bg-clip-text text-transparent"
                >
                  محمد الحسيني المحامي
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm font-medium text-accent-300/90 font-mono tracking-widest uppercase"
                >
                  Architect, Founder & Visionary
                </motion.p>
              </div>

              {/* Divider */}
              <div className="h-[1px] w-3/4 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Statement Body */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="max-w-md text-slate-200 text-sm md:text-base leading-relaxed space-y-4 font-sans"
              >
                <p>
                  "تأسست منصة <span className="font-bold text-accent-400">مَلَف</span> لتكون الرائدة في التحول الرقمي للعدالة والمحاماة في جمهورية مصر العربية. تم هندسة وتصميم هذا الصرح التقني لربط القانون بالتكنولوجيا الفائقة، وتأمين وحماية أسرار الموكلين بأحدث التقنيات."
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  All rights reserved. Designed & Engineered with precision under the sovereignty of the founder.
                </p>
              </motion.div>

              {/* Technical badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-3 pt-4 text-xs text-slate-300"
              >
                <div className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 backdrop-blur-md">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>عزل RLS محمي</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 backdrop-blur-md">
                  <Cpu size={14} className="text-accent-400" />
                  <span>تشفير AES-256</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 backdrop-blur-md">
                  <Layers size={14} className="text-blue-400" />
                  <span>SaaS Architecture v1.0</span>
                </div>
              </motion.div>

              {/* Footer Signature */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="pt-6 font-serif italic text-accent-300 text-lg opacity-85 select-none"
              >
                M. Al-Hosainy
              </motion.div>
            </div>
          </motion.div>
        </div>
  );
}
