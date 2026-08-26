"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LanguagePage() {
  const router = useRouter();
  const [language, setLanguage] = useState("");

  function chooseLanguage(value: "sw" | "en") {
    setLanguage(value);

    localStorage.setItem("agrofuture_language", value);

    setTimeout(() => {
      router.push("/auth");
    }, 250);
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-8 text-[#173B2A]">
      <div className="mx-auto flex min-h-[90vh] w-full max-w-md items-center">
        <section className="w-full text-center">

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[#2F9E5B] shadow-xl">
            <span className="text-4xl">🌱</span>
          </div>

          <h1 className="mt-7 text-3xl font-black">
            AGRO<span className="text-[#2F9E5B]">FUTURE</span>
          </h1>

          <p className="mt-2 text-xs font-bold tracking-[0.35em] text-[#718578]">
            2050
          </p>

          <div className="mt-10">
            <h2 className="text-2xl font-black">
              Chagua lugha
            </h2>

            <p className="mt-2 text-sm text-[#718578]">
              Choose your language
            </p>
          </div>

          <div className="mt-8 space-y-3">

            <button
              onClick={() => chooseLanguage("sw")}
              className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition active:scale-[0.98] ${
                language === "sw"
                  ? "border-[#2F9E5B] bg-[#EAF7ED]"
                  : "border-[#DCE9DF]"
              }`}
            >
              <span className="text-3xl">🇹🇿</span>

              <div className="flex-1">
                <p className="font-bold">Kiswahili</p>
                <p className="text-xs text-[#819188]">
                  Endelea kwa Kiswahili
                </p>
              </div>

              {language === "sw" && (
                <span className="font-black text-[#2F9E5B]">✓</span>
              )}
            </button>

            <button
              onClick={() => chooseLanguage("en")}
              className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition active:scale-[0.98] ${
                language === "en"
                  ? "border-[#2F9E5B] bg-[#EAF7ED]"
                  : "border-[#DCE9DF]"
              }`}
            >
              <span className="text-3xl">🇬🇧</span>

              <div className="flex-1">
                <p className="font-bold">English</p>
                <p className="text-xs text-[#819188]">
                  Continue in English
                </p>
              </div>

              {language === "en" && (
                <span className="font-black text-[#2F9E5B]">✓</span>
              )}
            </button>

          </div>

          <p className="mt-8 text-xs text-[#8A9B91]">
            Kilimo • Ufugaji • Biashara • Teknolojia
          </p>

        </section>
      </div>
    </main>
  );
}
