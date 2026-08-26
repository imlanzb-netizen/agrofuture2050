"use client";

import { useState } from "react";

export default function AIPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  async function askAI() {
    if (!question.trim()) return;

    setAnswer("⏳ AI inafikiria...");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setAnswer(result.error || "Imeshindikana kupata jibu.");
        return;
      }

      setAnswer(result.answer);
    } catch (error) {
      console.error("AI REQUEST ERROR:", error);
      setAnswer("Kuna tatizo la kuwasiliana na AI. Jaribu tena.");
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-7 text-[#173B2A]">
      <div className="mx-auto flex min-h-[90vh] w-full max-w-md flex-col">

        <button
          onClick={() => window.history.back()}
          className="text-left text-sm font-bold text-[#2F9E5B]"
        >
          ← Rudi Dashboard
        </button>

        <div className="mt-7">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF7ED] text-3xl">
            🤖
          </div>

          <h1 className="mt-5 text-3xl font-black">
            AI Assistant
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#718578]">
            Uliza swali kuhusu kilimo, ufugaji au biashara ya
            kilimo.
          </p>
        </div>

        <div className="mt-7 flex-1">
          {answer && (
            <div className="rounded-3xl border border-[#DCE9DF] bg-white p-5">
              <p className="text-xs font-bold text-[#2F9E5B]">
                🤖 AI Assistant
              </p>

              <p className="mt-3 text-sm leading-6">
                {answer}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[#DCE9DF] bg-white p-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            placeholder="Andika swali lako hapa..."
            className="w-full resize-none bg-transparent p-2 text-sm outline-none"
          />

          <button
            onClick={askAI}
            disabled={!question.trim()}
            className="mt-3 w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg disabled:opacity-40"
          >
            Uliza AI →
          </button>
        </div>
      </div>
    </main>
  );
}
