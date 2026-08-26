"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type TargetRole = "agriculture-officer" | "livestock-officer";

export default function AskOfficerPage() {
  const router = useRouter();

  const [role, setRole] = useState<TargetRole | null>(null);
  const [question, setQuestion] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [myQuestions, setMyQuestions] = useState<
    {
      id: number;
      created_at: string;
      question: string | null;
      image_url: string | null;
      answer: string | null;
      status: string | null;
    }[]
  >([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const userRole =
        user.user_metadata?.role ??
        user.app_metadata?.role ??
        "";

      if (
        userRole === "agriculture-officer" ||
        userRole === "livestock-officer"
      ) {
        router.push("/dashboard/officer");
        return;
      }

      const targetRole: TargetRole =
        userRole === "livestock"
          ? "livestock-officer"
          : "agriculture-officer";

      setRole(targetRole);
      setLoading(false);

      const { data: myData, error: myError } = await supabase
        .from("questions")
        .select(
          "id, created_at, question, image_url, answer, status"
        )
        .eq("user_id", user.id)
        .eq("target_role", targetRole)
        .order("created_at", { ascending: false });

      if (myError) {
        console.error("My questions error:", myError);
      } else {
        setMyQuestions(myData ?? []);
      }
    }

    loadUser();
  }, [router]);

  useEffect(() => {
    const refreshWhenVisible = async () => {
      if (document.visibilityState !== "visible") return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !role) return;

      const { data } = await supabase
        .from("questions")
        .select(
          "id, created_at, question, image_url, answer, status"
        )
        .eq("user_id", user.id)
        .eq("target_role", role)
        .order("created_at", { ascending: false });

      setMyQuestions(data ?? []);
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [role]);

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Tafadhali chagua picha tu. 📷");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Picha iwe chini ya 5MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage("");
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview("");
  }

  async function submitQuestion() {
    if (!question.trim() || !role || sending) return;

    setSending(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    let uploadedImageUrl: string | null = null;

    try {
      if (imageFile) {
        const extension =
          imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("question-images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          setMessage(
            `Picha haijapakiwa: ${uploadError.message}`
          );
          setSending(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("question-images")
          .getPublicUrl(filePath);

        uploadedImageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase
        .from("questions")
        .insert({
          question: question.trim(),
          image_url: uploadedImageUrl,
          answer: null,
          status: "pending",
          user_id: user.id,
          target_role: role,
        });

      if (error) {
        console.error("Question submit error:", error);
        setMessage(`Swali halijatumwa: ${error.message}`);
        setSending(false);
        return;
      }

      setQuestion("");
      removeImage();

      setMessage(
        "Swali lako limetumwa kwa Afisa. Tutakujibu hivi karibuni. ✅"
      );

      const { data: refreshedQuestions } = await supabase
        .from("questions")
        .select(
          "id, created_at, question, image_url, answer, status"
        )
        .eq("user_id", user.id)
        .eq("target_role", role)
        .order("created_at", { ascending: false });

      setMyQuestions(refreshedQuestions ?? []);
    } catch (error) {
      console.error("Submit question error:", error);
      setMessage("Kuna tatizo limetokea. Tafadhali jaribu tena.");
    }

    setSending(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6FAF7]">
        <div className="text-center">
          <div className="text-5xl">👨🏾‍🌾</div>
          <p className="mt-3 font-black text-[#173B2A]">
            Inafungua huduma ya Afisa...
          </p>
        </div>
      </main>
    );
  }

  const isLivestock = role === "livestock-officer";

  return (
    <main className="min-h-screen bg-[#F6FAF7] px-4 py-6 text-[#173B2A]">
      <div className="mx-auto w-full max-w-2xl">

        <button
          onClick={() => router.back()}
          className="mb-5 rounded-xl border border-[#DCE9DF] bg-white px-4 py-2 text-sm font-black"
        >
          ← Rudi
        </button>

        <section className="rounded-3xl bg-white p-6 shadow-sm">

          <div className="mb-6">
            <div className="text-4xl">
              {isLivestock ? "🐄" : "🌱"}
            </div>

            <h1 className="mt-3 text-2xl font-black">
              Muulize Afisa
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#687B70]">
              {isLivestock
                ? "Uliza swali kuhusu mifugo, magonjwa, lishe au ufugaji."
                : "Uliza swali kuhusu kilimo, mazao, magonjwa au uzalishaji."}
            </p>
          </div>

          <label className="text-sm font-black">
            Andika swali lako
          </label>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              isLivestock
                ? "Mfano: Ng'ombe wangu anakataa kula, nifanye nini?"
                : "Mfano: Mbolea gani inafaa kwa mahindi?"
            }
            rows={6}
            className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#FAFDFC] p-4 text-sm outline-none focus:border-[#2F9E5B]"
          />

          <div className="mt-5">
            <label className="block text-sm font-black">
              📷 Picha ya swali
            </label>

            <p className="mt-1 text-xs text-[#819188]">
              Unaweza kuchagua picha kutoka kwenye simu yako.
            </p>

            <label className="mt-3 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-[#BFDCC8] bg-[#F7FCF8] px-5 py-6 text-center">
              <div>
                <div className="text-3xl">📷</div>
                <p className="mt-2 text-sm font-black text-[#2F9E5B]">
                  Chagua picha
                </p>
                <p className="mt-1 text-xs text-[#819188]">
                  JPG, PNG au picha nyingine • Max 5MB
                </p>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {imagePreview && (
              <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#DCE9DF]">
                <img
                  src={imagePreview}
                  alt="Preview ya picha"
                  className="max-h-72 w-full object-cover"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-3 top-3 rounded-xl bg-black/70 px-3 py-2 text-xs font-black text-white"
                >
                  Ondoa picha ✕
                </button>
              </div>
            )}

            {imageFile && (
              <p className="mt-2 text-xs font-bold text-[#687B70]">
                📎 {imageFile.name}
              </p>
            )}
          </div>

          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">
                  {isLivestock ? "Maswali yangu ya Ufugaji" : "Maswali yangu ya Kilimo"}
                </h2>
                <p className="mt-1 text-xs text-[#819188]">
                  Hapa utaona majibu ya Afisa baada ya kujibiwa.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setLoadingQuestions(true);

                  const {
                    data: { user },
                  } = await supabase.auth.getUser();

                  if (user && role) {
                    const { data } = await supabase
                      .from("questions")
                      .select(
                        "id, created_at, question, image_url, answer, status"
                      )
                      .eq("user_id", user.id)
                      .eq("target_role", role)
                      .order("created_at", { ascending: false });

                    setMyQuestions(data ?? []);
                  }

                  setLoadingQuestions(false);
                }}
                className="rounded-xl border border-[#DCE9DF] px-3 py-2 text-xs font-black"
              >
                {loadingQuestions ? "..." : "🔄 Refresh"}
              </button>
            </div>

            {myQuestions.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-[#F7FCF8] p-5 text-center">
                <div className="text-3xl">💬</div>
                <p className="mt-2 text-sm font-bold text-[#687B70]">
                  Bado hujatuma swali.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {myQuestions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#DCE9DF] bg-[#FAFDFC] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black text-[#2F9E5B]">
                        {isLivestock ? "🐄 AFISA UFUGAJI" : "🌱 AFISA KILIMO"}
                      </span>

                      <span
                        className={
                          item.answer
                            ? "rounded-full bg-[#EAF7ED] px-3 py-1 text-xs font-black text-[#236B3B]"
                            : "rounded-full bg-[#FFF7DF] px-3 py-1 text-xs font-black text-[#8A6500]"
                        }
                      >
                        {item.answer ? "✅ Imejibiwa" : "⏳ Inasubiri jibu"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-bold leading-6 text-[#173B2A]">
                      {item.question || "Swali halina maandishi."}
                    </p>

                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt="Picha ya swali"
                        className="mt-3 max-h-64 w-full rounded-2xl object-cover"
                      />
                    )}

                    {item.answer ? (
                      <div className="mt-4 rounded-2xl bg-[#EAF7ED] p-4">
                        <p className="text-xs font-black text-[#236B3B]">
                          💬 Jibu la Afisa
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#173B2A]">
                          {item.answer}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs font-bold text-[#819188]">
                        Afisa bado hajajibu swali hili.
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-[#819188]">
                        {new Date(item.created_at).toLocaleString("sw-TZ")}
                      </p>

                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = window.confirm(
                            "Una uhakika unataka kufuta swali hili?"
                          );

                          if (!confirmed) return;

                          const { error } = await supabase
                            .from("questions")
                            .delete()
                            .eq("id", item.id)
                            .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "");

                          if (error) {
                            console.error("Delete question error:", error);
                            setMessage(`Swali halijafutwa: ${error.message}`);
                            return;
                          }

                          setMyQuestions((items) =>
                            items.filter((question) => question.id !== item.id)
                          );

                          setMessage("Swali limefutwa kikamilifu. 🗑️");
                        }}
                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-600"
                      >
                        🗑️ Futa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {message && (
            <div className="mt-4 rounded-2xl bg-[#EAF7ED] p-4 text-sm font-bold text-[#236B3B]">
              {message}
            </div>
          )}

          <button
            onClick={submitQuestion}
            disabled={!question.trim() || sending}
            className="mt-6 w-full rounded-2xl bg-[#2F9E5B] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
          >
            {sending
              ? imageFile
                ? "Inapakia picha na kutuma..."
                : "Inatuma..."
              : "📨 Tuma Swali kwa Afisa"}
          </button>

        </section>
      </div>
    </main>
  );
}
