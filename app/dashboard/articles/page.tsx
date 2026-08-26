"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Article = {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  video_url: string | null;
  file_url: string | null;
  file_name: string | null;
  author_id: string;
  published: boolean;
  created_at: string;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Zote");

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, title, content, category, image_url, video_url, file_url, file_name, author_id, published, created_at"
      )
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setArticles(data || []);
    setLoading(false);
  }

  const filteredArticles = useMemo(() => {
    const term = search.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesCategory =
        category === "Zote" || article.category === category;

      const matchesSearch =
        !term ||
        article.title.toLowerCase().includes(term) ||
        article.content.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [articles, search, category]);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("sw-TZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF5] text-[#173B2A]">
        <div className="text-center">
          <div className="text-4xl">📚</div>
          <p className="mt-3 font-bold">Inapakia makala...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-7 text-[#173B2A]">
      <div className="mx-auto w-full max-w-md">

        <button
          onClick={() => window.history.back()}
          className="text-sm font-bold text-[#2F9E5B]"
        >
          ← Rudi Dashboard
        </button>

        <div className="mt-7">
          <p className="text-sm font-bold text-[#2F9E5B]">
            📚 AGROFUTURE 2050
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Kituo cha Maarifa
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#718578]">
            Soma maarifa ya kilimo na ufugaji kutoka kwa
            maafisa wetu.
          </p>
        </div>

        <div className="mt-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔎 Tafuta makala..."
            className="w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {["Zote", "Kilimo", "Ufugaji"].map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                category === item
                  ? "bg-[#2F9E5B] text-white"
                  : "border border-[#DCE9DF] bg-white text-[#52665B]"
              }`}
            >
              {item === "Zote"
                ? "📚 Zote"
                : item === "Kilimo"
                  ? "🌱 Kilimo"
                  : "🐄 Ufugaji"}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold text-[#819188]">
            {filteredArticles.length}{" "}
            {filteredArticles.length === 1 ? "Makala" : "Makala"}
          </p>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-[#DCE9DF] bg-white p-6 text-center">
            <div className="text-4xl">🔎</div>

            <h2 className="mt-3 font-black">
              Hakuna makala iliyopatikana
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#718578]">
              Jaribu neno jingine au chagua aina nyingine ya
              makala.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                className="overflow-hidden rounded-3xl border border-[#DCE9DF] bg-white shadow-sm"
              >
                {article.image_url ? (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-[#EAF7ED] text-5xl">
                    {article.category === "Ufugaji" ? "🐄" : "🌱"}
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-[#2F9E5B]">
                      {article.category === "Ufugaji"
                        ? "🐄 UFUGAJI"
                        : "🌱 KILIMO"}
                    </p>

                    <p className="text-[11px] text-[#819188]">
                      {formatDate(article.created_at)}
                    </p>
                  </div>

                  <h2 className="mt-2 text-lg font-black">
                    {article.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#718578]">
                    {article.content.length > 130
                      ? `${article.content.substring(0, 130)}...`
                      : article.content}
                  </p>

                  <button
                    onClick={() => setSelectedArticle(article)}
                    className="mt-4 w-full rounded-2xl bg-[#2F9E5B] py-3 text-sm font-bold text-white"
                  >
                    Soma Makala →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {selectedArticle && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-5 py-8">
            <div className="mx-auto max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

              {selectedArticle.image_url && (
                <img
                  src={selectedArticle.image_url}
                  alt={selectedArticle.title}
                  className="h-52 w-full object-cover"
                />
              )}

              {selectedArticle.video_url && (
                <video
                  src={selectedArticle.video_url}
                  controls
                  preload="metadata"
                  className="h-60 w-full bg-black object-contain"
                >
                  Browser yako haiwezi kucheza video hii.
                </video>
              )}

              {selectedArticle.file_url && (
                <div className="mx-5 mt-4 rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] p-4">
                  <p className="text-sm font-bold">📎 Nyaraka ya Makala</p>
                  <p className="mt-1 truncate text-xs text-[#718578]">
                    {selectedArticle.file_name || "Nyaraka"}
                  </p>
                  <a
                    href={selectedArticle.file_url}
                    className="mt-3 block w-full rounded-2xl bg-[#2F9E5B] py-3 text-center text-sm font-bold text-white"
                  >
                    Fungua Nyaraka →
                  </a>
                </div>
              )}

              <div className="p-6">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-sm font-bold text-[#2F9E5B]"
                >
                  ← Funga
                </button>

                <p className="mt-6 text-xs font-bold text-[#2F9E5B]">
                  {selectedArticle.category}
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {selectedArticle.title}
                </h2>

                <p className="mt-2 text-xs text-[#819188]">
                  Imechapishwa {formatDate(selectedArticle.created_at)}
                </p>

                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#52665B]">
                  {selectedArticle.content}
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
