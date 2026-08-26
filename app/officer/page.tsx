"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Question = {
  id: number;
  question: string | null;
  answer: string | null;
  status: string | null;
  created_at: string;
};

export default function OfficerDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answered, setAnswered] = useState(false);

  async function loadQuestions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("questions")
      .select("id, question, answer, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Questions load error:", error);
      setLoading(false);
      return;
    }

    const rows = (data || []) as Question[];
    setQuestions(rows);

    if (selectedId !== null) {
      const selected = rows.find((item) => item.id === selectedId);

      if (selected) {
        setAnswer(selected.answer || "");
      }
    } else {
      const firstPending = rows.find(
        (item) => (item.status || "pending") === "pending"
      );

      if (firstPending) {
        setSelectedId(firstPending.id);
        setAnswer(firstPending.answer || "");
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  const selectedQuestion = questions.find(
    (item) => item.id === selectedId
  );

  const pendingCount = questions.filter(
    (item) => (item.status || "pending") === "pending"
  ).length;

  async function submitAnswer() {
    if (!answer.trim() || !selectedQuestion) return;

    setSaving(true);
    setAnswered(false);

    const { error } = await supabase
      .from("questions")
      .update({
        answer: answer.trim(),
        status: "answered",
      })
      .eq("id", selectedQuestion.id);

    if (error) {
      console.error("Answer update error:", error);
      alert(`Imeshindikana: ${error.message}`);
      setSaving(false);
      return;
    }

    setAnswered(true);
    setSaving(false);
    await loadQuestions();
  }

  function selectQuestion(item: Question) {
    setSelectedId(item.id);
    setAnswer(item.answer || "");
    setAnswered(false);
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black tracking-widest text-[#2F9E5B]">
            AGROFUTURE 2050
          </p>

          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black">
                Dashboard ya Afisa
              </h1>

              <p className="mt-1 text-sm text-[#718578]">
                Kituo cha ushauri kwa wakulima na wafugaji.
              </p>
            </div>

            <button
              type="button"
              onClick={loadQuestions}
              className="rounded-xl border border-[#DCE9DF] bg-white px-3 py-2 text-sm font-bold text-[#2F9E5B] hover:bg-[#F8FAF5]"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[340px_1fr]">
        <aside className="rounded-3xl border border-[#DCE9DF] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black">Maswali</p>
              <p className="mt-1 text-xs text-[#819188]">
                Maswali ya watumiaji
              </p>
            </div>

            <span className="rounded-full bg-[#EAF7ED] px-3 py-1 text-xs font-black text-[#2F9E5B]">
              {pendingCount} mapya
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="rounded-2xl bg-[#F8FAF5] p-4 text-sm text-[#718578]">
                Inapakia maswali...
              </div>
            ) : questions.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FAF5] p-4 text-sm text-[#718578]">
                Hakuna maswali kwa sasa.
              </div>
            ) : (
              questions.map((item) => {
                const isSelected = item.id === selectedId;
                const isPending =
                  (item.status || "pending") === "pending";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectQuestion(item)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#2F9E5B] bg-[#EAF7ED]"
                        : "border-[#DCE9DF] bg-white hover:bg-[#F8FAF5]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black text-[#718578]">
                        SWALI #{item.id}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black ${
                          isPending
                            ? "bg-[#FFF4D6] text-[#8A6500]"
                            : "bg-[#EAF7ED] text-[#2F9E5B]"
                        }`}
                      >
                        {isPending ? "PENDING" : "ANSWERED"}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm font-bold">
                      {item.question || "Swali bila maandishi"}
                    </p>

                    <p className="mt-2 text-[11px] text-[#819188]">
                      {new Date(item.created_at).toLocaleString("sw-TZ")}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="rounded-3xl border border-[#DCE9DF] bg-white p-5 shadow-sm sm:p-7">
          {!selectedQuestion ? (
            <div className="flex min-h-[400px] items-center justify-center text-center">
              <div>
                <div className="text-5xl">💬</div>
                <h2 className="mt-4 text-xl font-black">
                  Chagua swali
                </h2>
                <p className="mt-2 text-sm text-[#718578]">
                  Chagua swali upande wa kushoto ili kulijibu.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF7ED] text-2xl">
                  👨🏾‍🌾
                </div>

                <div>
                  <p className="text-xs font-black text-[#2F9E5B]">
                    SWALI LA MTUMIAJI
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Swali #{selectedQuestion.id}
                  </h2>

                  <p className="mt-1 text-xs text-[#819188]">
                    {new Date(
                      selectedQuestion.created_at
                    ).toLocaleString("sw-TZ")}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#F8FAF5] p-5">
                <p className="text-base leading-7">
                  {selectedQuestion.question ||
                    "Swali bila maandishi."}
                </p>
              </div>

              <div className="mt-5">
                <label className="text-sm font-black">
                  Jibu la kitaalamu
                </label>

                <textarea
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setAnswered(false);
                  }}
                  rows={7}
                  placeholder="Andika ushauri wa kitaalamu kwa mkulima au mfugaji..."
                  className="mt-3 w-full resize-none rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] p-4 text-sm leading-6 outline-none focus:border-[#2F9E5B]"
                />

                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={!answer.trim() || saving}
                  className="mt-3 w-full rounded-2xl bg-[#2F9E5B] py-4 font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "⏳ Inatuma..." : "Tuma Jibu →"}
                </button>
              </div>

              {answered && (
                <div className="mt-4 rounded-2xl bg-[#EAF7ED] p-4">
                  <p className="font-black text-[#2F9E5B]">
                    ✓ Jibu limetumwa
                  </p>

                  <p className="mt-1 text-sm text-[#718578]">
                    Swali limewekwa kama limejibiwa.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}
