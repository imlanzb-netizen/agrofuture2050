"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Question = {
  id: number;
  created_at: string;
  question: string | null;
  image_url: string | null;
  answer: string | null;
  status: string | null;
  user_id: string | null;
  target_role: string | null;
};

export default function OfficerPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] =
    useState<Question | null>(null);

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [role, setRole] = useState<
    "agriculture-officer" | "livestock-officer" | ""
  >("");

  async function loadQuestions() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    const userRole =
      user.app_metadata?.role ??
      user.user_metadata?.role ??
      "";

    console.log("OFFICER INBOX ROLE:", userRole);

    if (
      userRole !== "agriculture-officer" &&
      userRole !== "livestock-officer"
    ) {
      setMessage(
        `Akaunti hii haina role ya afisa. Role iliyopatikana: ${userRole || "HAIPO"}`
      );
      setLoading(false);
      return;
    }

    setRole(userRole);

    const { data, error } = await supabase
      .from("questions")
      .select(
        "id, created_at, question, image_url, answer, status, user_id, target_role"
      )
      .eq("target_role", userRole)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Officer questions error:", error);
      setMessage(`Maswali hayajasomeka: ${error.message}`);
      setQuestions([]);
    } else {
      setQuestions((data ?? []) as Question[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  const pendingQuestions = useMemo(
    () =>
      questions.filter(
        (item) =>
          !item.answer ||
          item.status === "pending" ||
          item.status === "unanswered"
      ),
    [questions]
  );

  const answeredQuestions = useMemo(
    () =>
      questions.filter(
        (item) =>
          !!item.answer &&
          item.status !== "pending" &&
          item.status !== "unanswered"
      ),
    [questions]
  );

  async function answerQuestion() {
    if (!selectedQuestion || !answer.trim() || saving) return;

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("questions")
      .update({
        answer: answer.trim(),
        status: "answered",
      })
      .eq("id", selectedQuestion.id)
      .select(
        "id, created_at, question, image_url, answer, status, user_id, target_role"
      )
      .single();

    if (error) {
      console.error("Officer answer error:", error);
      setMessage(`Jibu halijatumwa: ${error.message}`);
      setSaving(false);
      return;
    }

    setQuestions((items) =>
      items.map((item) =>
        item.id === selectedQuestion.id
          ? (data as Question)
          : item
      )
    );

    setSelectedQuestion(data as Question);
    setAnswer("");
    setMessage("Jibu limetumwa kwa muulizaji kikamilifu. ✅");
    setSaving(false);
  }

  function openQuestion(item: Question) {
    setSelectedQuestion(item);
    setAnswer("");
    setMessage("");
  }

  const officerName =
    role === "livestock-officer"
      ? "AFISA UFUGAJI"
      : "AFISA KILIMO";

  const officerIcon =
    role === "livestock-officer" ? "🐄" : "🌱";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6FAF7] text-[#173B2A]">
        <div className="text-center">
          <div className="text-5xl">{officerIcon}</div>
          <p className="mt-3 font-black">
            Inapakia Inbox ya Afisa...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6FAF7] px-5 py-6 text-[#173B2A]">
      <div className="mx-auto w-full max-w-5xl">

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="text-sm font-black text-[#2F9E5B]"
          >
            ← Rudi Dashboard
          </button>

          <button
            onClick={loadQuestions}
            className="rounded-xl border border-[#DCE9DF] bg-white px-4 py-2 text-xs font-black"
          >
            ↻ Refresh
          </button>
        </div>

        <section className="mt-5 overflow-hidden rounded-[2rem] bg-[#173B2A] p-6 text-white shadow-lg">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9BE7B2]">
            AGROFUTURE 2050
          </p>

          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black">
                {officerIcon} {officerName}
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#D7E8DC]">
                Simamia maswali kutoka kwa wakulima na wafugaji,
                kisha wape majibu ya kitaalamu moja kwa moja.
              </p>
            </div>

            <div className="hidden h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-4xl sm:flex">
              {officerIcon}
            </div>
          </div>
        </section>

        {message && (
          <div className="mt-4 rounded-2xl border border-[#BFE3C8] bg-[#EAF7ED] p-4 text-sm font-bold text-[#236B3D]">
            {message}
          </div>
        )}

        <section className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4">
            <p className="text-2xl">📥</p>
            <p className="mt-2 text-2xl font-black">
              {questions.length}
            </p>
            <p className="text-xs font-bold text-[#819188]">
              Maswali yote
            </p>
          </div>

          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4">
            <p className="text-2xl">🟡</p>
            <p className="mt-2 text-2xl font-black">
              {pendingQuestions.length}
            </p>
            <p className="text-xs font-bold text-[#819188]">
              Yanayosubiri
            </p>
          </div>

          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4">
            <p className="text-2xl">✅</p>
            <p className="mt-2 text-2xl font-black">
              {answeredQuestions.length}
            </p>
            <p className="text-xs font-bold text-[#819188]">
              Yamejibiwa
            </p>
          </div>
        </section>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_1.1fr]">

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  📥 Inbox ya Maswali
                </h2>
                <p className="text-xs text-[#819188]">
                  Maswali yaliyotumwa kwako
                </p>
              </div>

              <span className="rounded-full bg-[#EAF7ED] px-3 py-1 text-xs font-black text-[#2F9E5B]">
                {pendingQuestions.length} mapya
              </span>
            </div>

            <div className="space-y-3">
              {questions.map((item) => {
                const unanswered =
                  !item.answer ||
                  item.status === "pending" ||
                  item.status === "unanswered";

                return (
                  <div
                    key={item.id}
                    onClick={() => openQuestion(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        openQuestion(item);
                      }
                    }}
                    className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition ${
                      selectedQuestion?.id === item.id
                        ? "border-[#2F9E5B] bg-[#EAF7ED]"
                        : "border-[#DCE9DF] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#2F9E5B]">
                          SWALI #{item.id}
                        </p>

                        <p className="mt-2 line-clamp-3 text-sm font-bold">
                          {item.question || "Swali halina maandishi."}
                          <button
                            type="button"
                            onClick={async (event) => {
                              event.stopPropagation();

                              const confirmed = window.confirm(
                                "Una uhakika unataka kufuta swali hili?"
                              );

                              if (!confirmed) return;

                              const { error } = await supabase
                                .from("questions")
                                .delete()
                                .eq("id", item.id);

                              if (error) {
                                console.error("Officer delete error:", error);
                                setMessage(
                                  `Swali halijafutwa: ${error.message}`
                                );
                                return;
                              }

                              setQuestions((items) =>
                                items.filter(
                                  (question) => question.id !== item.id
                                )
                              );

                              if (selectedQuestion?.id === item.id) {
                                setSelectedQuestion(null);
                                setAnswer("");
                              }

                              setMessage("Swali limefutwa. 🗑️");
                            }}
                            className="mt-3 rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-600"
                          >
                            🗑️ Futa swali
                          </button>
                        </p>

                        <p className="mt-2 text-[11px] text-[#819188]">
                          {new Date(item.created_at).toLocaleString("sw-TZ")}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                          unanswered
                            ? "bg-[#FFF3CD] text-[#8A6500]"
                            : "bg-[#EAF7ED] text-[#237342]"
                        }`}
                      >
                        {unanswered ? "LINASUBIRI" : "LIMEJIBIWA"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {questions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#C9D9CE] bg-white p-8 text-center">
                  <div className="text-4xl">📭</div>
                  <p className="mt-3 font-black">
                    Hakuna maswali kwa sasa
                  </p>
                  <p className="mt-1 text-sm text-[#819188]">
                    Maswali mapya kutoka kwa watumiaji yataonekana hapa.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black">
              ✍️ Jibu Swali
            </h2>

            <p className="mt-1 text-xs text-[#819188]">
              Chagua swali upande wa kushoto ili kulijibu.
            </p>

            {!selectedQuestion ? (
              <div className="mt-3 rounded-3xl border border-dashed border-[#C9D9CE] bg-white p-10 text-center">
                <div className="text-5xl">💬</div>
                <p className="mt-4 font-black">
                  Chagua swali
                </p>
                <p className="mt-1 text-sm text-[#819188]">
                  Swali ulilochagua litaonekana hapa kwa ajili ya kulijibu.
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-3xl border border-[#DCE9DF] bg-white p-5 shadow-sm">

                <div className="rounded-2xl bg-[#F6FAF7] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-[#2F9E5B]">
                      SWALI #{selectedQuestion.id}
                    </p>

                    <span className="text-[10px] font-bold text-[#819188]">
                      {new Date(
                        selectedQuestion.created_at
                      ).toLocaleString("sw-TZ")}
                    </span>
                  </div>

                  <p className="mt-3 text-base font-bold leading-7">
                    {selectedQuestion.question}
                  </p>
                </div>

                {selectedQuestion.image_url && (
                  <img
                    src={selectedQuestion.image_url}
                    alt="Picha ya swali"
                    className="mt-4 max-h-72 w-full rounded-2xl object-cover"
                  />
                )}

                {selectedQuestion.answer && (
                  <div className="mt-4 rounded-2xl border border-[#BFE3C8] bg-[#EAF7ED] p-4">
                    <p className="text-xs font-black text-[#2F9E5B]">
                      ✓ JIBU LA AFISA
                    </p>

                    <p className="mt-2 text-sm leading-6">
                      {selectedQuestion.answer}
                    </p>
                  </div>
                )}

                <div className="mt-5">
                  <label className="text-xs font-black">
                    {selectedQuestion.answer
                      ? "Badilisha / ongeza jibu"
                      : "Andika jibu la kitaalamu"}
                  </label>

                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Andika ushauri au jibu lako hapa..."
                    rows={7}
                    className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#FAFCFA] p-4 text-sm outline-none focus:border-[#2F9E5B]"
                  />

                  <button
                    onClick={answerQuestion}
                    disabled={!answer.trim() || saving}
                    className="mt-3 w-full rounded-2xl bg-[#2F9E5B] py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "⏳ Inatuma jibu..."
                      : selectedQuestion.answer
                        ? "💾 Sasisha Jibu"
                        : "📤 Tuma Jibu"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
