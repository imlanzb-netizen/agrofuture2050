"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAF5] text-[#173B2A]">
      <div className="relative flex min-h-screen items-center justify-center px-6">

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#B8E6C1]/40 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#D9F3DF]/60 blur-3xl" />
        </div>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 w-full max-w-md text-center"
        >

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-[#2F9E5B] shadow-xl shadow-[#2F9E5B]/20"
          >
            <span className="text-4xl">🌱</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-black tracking-tight"
          >
            AGRO<span className="text-[#2F9E5B]">FUTURE</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-2 text-sm font-semibold tracking-[0.35em] text-[#5B7766]"
          >
            2050
          </motion.div>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mx-auto mt-8 max-w-sm text-lg leading-7 text-[#52665A]"
          >
            The future of agriculture, livestock
            <br />
            and agribusiness.
          </motion.p>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-8 flex flex-wrap justify-center gap-2"
          >
            {[
              "🌱 Agriculture",
              "🐄 Livestock",
              "🛒 Marketplace",
              "🤖 AI",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#DCE9DF] bg-white/80 px-4 py-2 text-xs font-semibold text-[#486151] shadow-sm backdrop-blur"
              >
                {item}
              </span>
            ))}
          </motion.div>

<motion.button
  onClick={() => {
    window.location.href = "/auth";
  }}
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 1.3 }}
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  className="mt-10 w-full rounded-2xl bg-[#2F9E5B] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#2F9E5B]/25 transition hover:bg-[#27864D]"
>
  Anza na AGROFUTURE →
</motion.button>
          <p className="mt-5 text-xs text-[#789083]">
            Kilimo • Ufugaji • Biashara • Teknolojia
          </p>

        </motion.section>
      </div>
    </main>
  );
}
