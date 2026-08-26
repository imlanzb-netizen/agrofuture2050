"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OfficerArticlesPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Kilimo");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [articleFile, setArticleFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [role, setRole] = useState("");
  const [myArticles, setMyArticles] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    checkOfficer();
  }, []);

  async function checkOfficer() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.push("/auth");
      return;
    }

    const userRole =
      data.user.app_metadata?.role ||
      data.user.user_metadata?.role ||
      "";

    if (
      userRole !== "agriculture-officer" &&
      userRole !== "livestock-officer"
    ) {
      router.push("/dashboard");
      return;
    }

    setRole(userRole);

    if (userRole === "livestock-officer") {
      setCategory("Ufugaji");
    }

    setLoading(false);
    loadMyArticles();
  }

  async function uploadArticleImage(userId: string) {
    if (!imageFile) return null;

    setUploadingImage(true);

    const fileExt = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("article-images")
      .upload(fileName, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setUploadingImage(false);
      throw new Error(`Picha haikupakiwa: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("article-images")
      .getPublicUrl(fileName);

    setUploadingImage(false);

    return publicUrl;
  }

  async function uploadArticleVideo(userId: string) {
    if (!videoFile) return null;

    setUploadingVideo(true);

    const fileExt = videoFile.name.split(".").pop()?.toLowerCase() || "mp4";
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("article-videos")
      .upload(fileName, videoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setUploadingVideo(false);
      throw new Error(`Video haikupakiwa: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("article-videos")
      .getPublicUrl(fileName);

    setUploadingVideo(false);

    return publicUrl;
  }

  async function uploadArticleFile(userId: string) {
    if (!articleFile) return null;

    setUploadingFile(true);

    const fileExt =
      articleFile.name.split(".").pop()?.toLowerCase() || "file";
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("article-files")
      .upload(fileName, articleFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setUploadingFile(false);
      throw new Error(`File haikupakiwa: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("article-files")
      .getPublicUrl(fileName);

    setUploadingFile(false);

    return {
      url: publicUrl,
      name: articleFile.name,
    };
  }

  async function loadMyArticles() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return;

    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, title, category, created_at, image_url, video_url, file_url, file_name"
      )
      .eq("author_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setMyArticles(data || []);
    }
  }

  function getStoragePath(url: string | null, bucket: string) {
    if (!url) return null;

    const marker = `/storage/v1/object/public/${bucket}/`;

    const index = url.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(
      url.substring(index + marker.length)
    );
  }

  async function deleteArticle(id: string) {
    const confirmed = window.confirm(
      "Una uhakika unataka kufuta makala hii pamoja na picha, video na nyaraka zake?"
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      const { data: article, error: fetchError } = await supabase
        .from("articles")
        .select("id, image_url, video_url, file_url")
        .eq("id", id)
        .single();

      if (fetchError) {
        throw new Error(
          `Imeshindikana kupata makala: ${fetchError.message}`
        );
      }

      const imagePath = getStoragePath(
        article.image_url,
        "article-images"
      );

      const videoPath = getStoragePath(
        article.video_url,
        "article-videos"
      );

      const filePath = getStoragePath(
        article.file_url,
        "article-files"
      );

      if (imagePath) {
        const { error } = await supabase.storage
          .from("article-images")
          .remove([imagePath]);

        if (error) {
          console.warn("Picha haikufutwa:", error.message);
        }
      }

      if (videoPath) {
        const { error } = await supabase.storage
          .from("article-videos")
          .remove([videoPath]);

        if (error) {
          console.warn("Video haikufutwa:", error.message);
        }
      }

      if (filePath) {
        const { error } = await supabase.storage
          .from("article-files")
          .remove([filePath]);

        if (error) {
          console.warn("Nyaraka haikufutwa:", error.message);
        }
      }

      const { error: deleteError } = await supabase
        .from("articles")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error(
          `Makala haikufutwa: ${deleteError.message}`
        );
      }

      setMyArticles((current) =>
        current.filter((article) => article.id !== id)
      );

      alert("✓ Makala, picha, video na nyaraka zimefutwa.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Kuna tatizo wakati wa kufuta makala."
      );
    } finally {
      setDeletingId("");
    }
  }

  async function publishArticle() {
    if (!title.trim() || !content.trim()) {
      alert("Jaza kichwa na maudhui ya makala.");
      return;
    }

    setSaving(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        alert("Tafadhali ingia tena.");
        router.push("/auth");
        return;
      }

      const imageUrl = await uploadArticleImage(userData.user.id);
      const videoUrl = await uploadArticleVideo(userData.user.id);
      const uploadedFile = await uploadArticleFile(userData.user.id);

      const { error } = await supabase.from("articles").insert({
        title: title.trim(),
        content: content.trim(),
        category,
        image_url: imageUrl,
        video_url: videoUrl,
        file_url: uploadedFile?.url || null,
        file_name: uploadedFile?.name || null,
        author_id: userData.user.id,
        published: true,
      });

      if (error) {
        alert(`Makala haikuchapishwa: ${error.message}`);
        return;
      }

      alert("✓ Makala imechapishwa!");

      setTitle("");
      setContent("");
      setImageFile(null);
      setVideoFile(null);
      setArticleFile(null);

      router.push("/dashboard/articles");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Kuna tatizo wakati wa kupakia picha."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF5] text-[#173B2A]">
        <div className="text-center">
          <div className="text-4xl">🌱</div>
          <p className="mt-3 font-bold">Inapakia...</p>
        </div>
      </main>
    );
  }

  const isLivestockOfficer = role === "livestock-officer";

  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-7 text-[#173B2A]">
      <div className="mx-auto w-full max-w-md">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm font-bold text-[#2F9E5B]"
        >
          ← Rudi Dashboard
        </button>

        <div className="mt-7">
          <p className="text-sm font-bold text-[#2F9E5B]">
            {isLivestockOfficer ? "🐄 AFISA UFUGAJI" : "🌱 AFISA KILIMO"}
          </p>

          <h1 className="mt-2 text-3xl font-black">Andika Makala</h1>

          <p className="mt-2 text-sm leading-6 text-[#718578]">
            Shiriki maarifa na taarifa muhimu na wakulima na wafugaji kupitia
            makala.
          </p>
        </div>

        <div className="mt-7 rounded-3xl border border-[#DCE9DF] bg-white p-5">
          <div>
            <label className="text-sm font-bold">Kichwa cha Makala</label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mfano: Njia bora za kutunza mahindi"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-4 outline-none focus:border-[#2F9E5B]"
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-bold">Aina ya Makala</label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-4 outline-none focus:border-[#2F9E5B]"
            >
              <option value="Kilimo">🌱 Kilimo</option>
              <option value="Ufugaji">🐄 Ufugaji</option>
            </select>
          </div>

          <div className="mt-5">
            <label className="text-sm font-bold">Maudhui ya Makala</label>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="Andika makala yako hapa..."
              className="mt-2 w-full resize-none rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] p-4 leading-6 outline-none focus:border-[#2F9E5B]"
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-bold">
              🖼️ Picha ya Makala
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setImageFile(e.target.files?.[0] || null);
              }}
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] p-3"
            />

            {imageFile && (
              <p className="mt-2 text-sm text-[#718578]">
                Picha iliyochaguliwa: {imageFile.name}
              </p>
            )}
          </div>

          <div className="mt-5">
            <label className="text-sm font-bold">
              🎥 Video ya Makala
            </label>

            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                setVideoFile(e.target.files?.[0] || null);
              }}
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] p-3"
            />

            {videoFile && (
              <p className="mt-2 text-sm text-[#718578]">
                Video iliyochaguliwa: {videoFile.name}
              </p>
            )}
          </div>

          <div className="mt-5">
            <label className="text-sm font-bold">
              📎 File ya Makala
            </label>

            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) => {
                setArticleFile(e.target.files?.[0] || null);
              }}
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] p-3"
            />

            {articleFile && (
              <p className="mt-2 text-sm text-[#718578]">
                File iliyochaguliwa: {articleFile.name}
              </p>
            )}
          </div>

          <button
            onClick={publishArticle}
            disabled={
              saving ||
              uploadingImage ||
              uploadingVideo ||
              uploadingFile ||
              !title.trim() ||
              !content.trim()
            }
            className="mt-5 w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg disabled:opacity-40"
          >
            {uploadingImage
              ? "Inapakia picha..."
              : uploadingVideo
              ? "Inapakia video..."
              : uploadingFile
              ? "Inapakia file..."
              : saving
              ? "Inachapisha..."
              : "📢 Chapisha Makala"}
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-black">📚 Makala Zangu</h2>
          <p className="mt-1 text-sm text-[#718578]">
            Hapa utaona makala ulizoandika.
          </p>

          <div className="mt-4 space-y-3">
            {myArticles.length === 0 ? (
              <div className="rounded-2xl border border-[#DCE9DF] bg-white p-5 text-center text-sm text-[#718578]">
                Bado hujaandika makala.
              </div>
            ) : (
              myArticles.map((article) => (
                <div
                  key={article.id}
                  className="rounded-2xl border border-[#DCE9DF] bg-white p-4"
                >
                  <p className="font-black">{article.title}</p>

                  <p className="mt-1 text-xs text-[#718578]">
                    {article.category}
                  </p>

                  <button
                    onClick={() => deleteArticle(article.id)}
                    disabled={deletingId === article.id}
                    className="mt-3 w-full rounded-2xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {deletingId === article.id
                      ? "Inafuta..."
                      : "🗑️ Futa Makala"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#DCE9DF] bg-white p-4">
          <p className="text-sm font-bold">💡 Kumbuka</p>

          <p className="mt-2 text-sm leading-6 text-[#718578]">
            Andika taarifa zilizo wazi, zenye manufaa na zinazohusiana na
            kilimo au ufugaji.
          </p>
        </div>
      </div>
    </main>
  );
}
