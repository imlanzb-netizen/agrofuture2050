"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UserItem = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  region: string;
  role: string;
};

type ArticleItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  author_id: string;
  published: boolean;
  created_at: string;
  image_url: string | null;
  video_url: string | null;
  file_url: string | null;
  file_name: string | null;
};

type ListingItem = {
  id: string;
  type: "crop" | "livestock" | "seller-product";
  title: string;
  status: string;
  created_at: string;
  image_url?: string | null;
  [key: string]: unknown;
};

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [notificationPreferences, setNotificationPreferences] = useState({
    farmer_alerts: true,
    livestock_alerts: true,
    weather_alerts: true,
    market_alerts: true,
    calendar_reminders: true,
    regional_alerts: true,
    ai_recommendations: true,
    urgent_alerts: true,
  });

  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState("");

  const [activeSection, setActiveSection] = useState("overview");

  const [alertRecipient, setAlertRecipient] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("general");
  const [alertSending, setAlertSending] = useState(false);

  const [activeSetting, setActiveSetting] = useState("overview");
  const [intelligenceLoaded, setIntelligenceLoaded] = useState(false);

  const totalUsers = users.length;
  const admins = users.filter((user) => user.role === "admin").length;
  const agricultureOfficers = users.filter(
    (user) => user.role === "agriculture-officer"
  ).length;
  const livestockOfficers = users.filter(
    (user) => user.role === "livestock-officer"
  ).length;

  useEffect(() => {
    checkAdmin();
  }, []);

  async function getAccessToken() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return null;
    }

    return data.session.access_token;
  }

  async function loadListings() {
    setListingsLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/admin/listings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Imeshindikana kupata matangazo.");
      }

      setListings(result.listings || []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Hitilafu ya kupakia matangazo."
      );
    } finally {
      setListingsLoading(false);
    }
  }

  async function deleteListing(listing: ListingItem) {
    const confirmed = window.confirm(
      `Una uhakika unataka kufuta tangazo "${listing.title}" kabisa?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setSavingId(listing.id);

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/admin/listings", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: listing.id,
          type: listing.type,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Imeshindikana kufuta tangazo.");
      }

      setMessage(
        result.warning
          ? `Tangazo limefutwa. ${result.warning}`
          : "Tangazo na picha yake vimefutwa."
      );

      await loadListings();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Hitilafu wakati wa kufuta tangazo."
      );
    } finally {
      setSavingId("");
    }
  }

  async function updateListingStatus(listing: ListingItem) {
    setError("");
    setMessage("");
    setSavingId(listing.id);

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const status = listing.status === "active" ? "paused" : "active";

      const response = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: listing.id,
          type: listing.type,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Imeshindikana kubadilisha hali.");
      }

      setMessage(status === "paused" ? "Tangazo limesimamishwa." : "Tangazo limewezeshwa tena.");
      await loadListings();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Hitilafu ya kubadilisha hali.");
    } finally {
      setSavingId("");
    }
  }

  async function checkAdmin() {
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error("ADMIN SESSION ERROR:", sessionError);
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase.auth.getUser(
        sessionData.session.access_token
      );

      if (error || !data.user) {
        console.error("ADMIN USER ERROR:", error);
        router.replace("/auth");
        return;
      }

      const userRole =
        data.user.app_metadata?.role ||
        data.user.user_metadata?.role;

      if (userRole !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setLoading(false);
      await loadNotificationPreferences();
      await loadUsers();
    } catch (error) {
      console.error("ADMIN AUTH ERROR:", error);
      router.replace("/auth");
    }
  }

  async function sendAdminAlert() {
    setError("");
    setMessage("");

    if (!alertRecipient || !alertTitle.trim() || !alertMessage.trim()) {
      setError("Chagua mtumiaji, weka kichwa na ujumbe wa alert.");
      return;
    }

    setAlertSending(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_user_id: alertRecipient,
          title: alertTitle.trim(),
          message: alertMessage.trim(),
          alert_type: alertType,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Imeshindikana kutuma alert."
        );
      }

      setMessage("Alert imetumwa kikamilifu. 🔔");
      setAlertTitle("");
      setAlertMessage("");
      setAlertRecipient("");
      setAlertType("general");
    } catch (error) {
      console.error("ADMIN ALERT SEND:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Imeshindikana kutuma alert."
      );
    } finally {
      setAlertSending(false);
    }
  }

  async function loadNotificationPreferences() {
    setNotificationLoading(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/notifications/preferences", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Imeshindikana kupakia notification settings.");
      }

      setNotificationPreferences((current) => ({
        ...current,
        ...result.preferences,
      }));
    } catch (error) {
      console.error("NOTIFICATION PREFERENCES LOAD:", error);
    } finally {
      setNotificationLoading(false);
    }
  }

  async function updateNotificationPreference(
    key: keyof typeof notificationPreferences,
    value: boolean
  ) {
    setNotificationSaving(key);
    setError("");

    const previous = notificationPreferences[key];

    setNotificationPreferences((current) => ({
      ...current,
      [key]: value,
    }));

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [key]: value,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Imeshindikana kuhifadhi notification preference."
        );
      }

      setNotificationPreferences((current) => ({
        ...current,
        ...result.preferences,
      }));
    } catch (error) {
      console.error("NOTIFICATION PREFERENCE SAVE:", error);

      setNotificationPreferences((current) => ({
        ...current,
        [key]: previous,
      }));

      setError(
        error instanceof Error
          ? error.message
          : "Imeshindikana kuhifadhi notification preference."
      );
    } finally {
      setNotificationSaving("");
    }
  }

  async function deleteUser(userId: string, userName: string) {
    const confirmed = window.confirm(
      `Una uhakika unataka kufuta user "${userName}"? Hatua hii haiwezi kurudishwa.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Imeshindikana kufuta user."
        );
      }

      setUsers((current) =>
        current.filter((user) => user.id !== userId)
      );

      setMessage(result.message || "User amefutwa kikamilifu.");
    } catch (error) {
      console.error("DELETE USER ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Imeshindikana kufuta user."
      );
    }
  }

  async function loadUsers() {
    setError("");

    const token = await getAccessToken();

    if (!token) {
      router.replace("/auth");
      return;
    }

    const response = await fetch("/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      setError(result.error || "Imeshindikana kupakia users.");
      return;
    }

    setUsers(result.users || []);
    await loadArticles();
  }

  async function loadArticles() {
    const token = await getAccessToken();

    if (!token) {
      router.replace("/auth");
      return;
    }

    const response = await fetch("/api/admin/articles", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      setError(result.error || "Imeshindikana kupakia makala.");
      return;
    }

    setArticles(result.articles || []);
  }

  function startEditArticle(article: ArticleItem) {
    setEditingArticle(article);
    setEditTitle(article.title);
    setEditContent(article.content || "");
    setEditCategory(article.category || "Kilimo");
    setError("");
    setMessage("");
  }

  function cancelEditArticle() {
    setEditingArticle(null);
    setEditTitle("");
    setEditContent("");
    setEditCategory("");
  }

  async function saveArticleEdit() {
    if (!editingArticle) return;

    if (!editTitle.trim() || !editContent.trim()) {
      setError("Jaza kichwa na maudhui ya makala.");
      return;
    }

    setEditSaving(true);
    setError("");
    setMessage("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/admin/articles", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: editingArticle.id,
          title: editTitle.trim(),
          content: editContent.trim(),
          category: editCategory.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error || "Imeshindikana kuhifadhi mabadiliko.");
        return;
      }

      setArticles((current) =>
        current.map((item) =>
          item.id === editingArticle.id
            ? { ...item, ...result.article }
            : item
        )
      );

      setMessage("✓ Makala imehaririwa kikamilifu.");
      cancelEditArticle();
    } catch (error) {
      console.error("ARTICLE EDIT ERROR:", error);
      setError("Imeshindikana kuhifadhi mabadiliko ya makala.");
    } finally {
      setEditSaving(false);
    }
  }

  async function publishArticle(article: ArticleItem) {
    setSavingId(article.id);
    setError("");
    setMessage("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/admin/articles", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: article.id,
          published: !article.published,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(
          result.error || "Imeshindikana kubadilisha hali ya makala."
        );
        return;
      }

      setArticles((current) =>
        current.map((item) =>
          item.id === article.id
            ? {
                ...item,
                published: result.article.published,
              }
            : item
        )
      );

      setMessage(
        result.article.published
          ? "Makala imechapishwa."
          : "Makala imerudishwa kuwa draft."
      );
    } catch (error) {
      console.error("ARTICLE PUBLISH ERROR:", error);
      setError("Imeshindikana kubadilisha hali ya makala.");
    } finally {
      setSavingId("");
    }
  }

  async function deleteArticle(article: ArticleItem) {
    const confirmed = window.confirm(
      `Una uhakika unataka kufuta makala "${article.title}"?`
    );

    if (!confirmed) return;

    setSavingId(article.id);
    setError("");
    setMessage("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/admin/articles", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: article.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error || "Imeshindikana kufuta makala.");
        return;
      }

      setArticles((current) =>
        current.filter((item) => item.id !== article.id)
      );

      setMessage("Makala imefutwa.");
    } catch (error) {
      console.error("ARTICLE DELETE ERROR:", error);
      setError("Imeshindikana kufuta makala.");
    } finally {
      setSavingId("");
    }
  }

  async function updateRole(userId: string, role: string) {
    setSavingId(userId);
    setError("");
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      setSavingId("");
      router.replace("/auth");
      return;
    }

    const response = await fetch("/api/admin/role", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        role,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      setError(result.error || "Imeshindikana kubadilisha role.");
      setSavingId("");
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? { ...user, role: result.role || role }
          : user
      )
    );

    setMessage(
      `${result.email || "User"} sasa ni ${
        role === "livestock-officer"
          ? "Afisa Ufugaji"
          : "Afisa Kilimo"
      }.`
    );

    setSavingId("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF5] text-[#173B2A]">
        <div className="text-center">
          <div className="text-4xl">🔐</div>
          <p className="mt-3 font-bold">Inathibitisha Admin...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold text-[#2F9E5B]">
            AGROFUTURE 2050
          </p>

          <h1 className="mt-1 text-2xl font-black">
            Admin Panel 👑
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Simamia watumiaji na majukumu ya maafisa.
          </p>
        </div>
      </header>

      <div className="border-b border-[#DCE9DF] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          {[
            ["overview", "🏠", "Overview"],
            ["users", "👥", "Users"],
            ["content", "📚", "Content"],
            ["listings", "🛒", "Marketplace"],
            ["intelligence", "📊", "Intelligence"],
            ["reports", "📈", "Reports"],
            ["tanzania", "🇹🇿", "Tanzania"],
            ["settings", "⚙️", "Settings"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => {
                setActiveSection(id);
                if (id === "listings") void loadListings();
              }}
              className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition ${
                activeSection === id
                  ? "bg-[#2F9E5B] text-white shadow-sm"
                  : "bg-[#F8FAF5] text-[#173B2A] hover:bg-[#EAF7ED]"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-6">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-2xl border border-[#BFE3C9] bg-[#EAF7ED] p-4 text-sm font-bold text-[#2F9E5B]">
            ✓ {message}
          </div>
        )}

        {activeSection === "listings" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                  MARKETPLACE MANAGEMENT
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Matangazo ya Soko 🛒
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Angalia, simamisha, washa tena au futa matangazo.
                </p>
              </div>
              <button
                onClick={loadListings}
                disabled={listingsLoading}
                className="rounded-xl bg-[#2F9E5B] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {listingsLoading ? "Inapakia..." : "↻ Refresh"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-[#DCE9DF]">
                <p className="text-sm text-gray-500">Matangazo yote</p>
                <p className="mt-1 text-2xl font-black">{listings.length}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-[#DCE9DF]">
                <p className="text-sm text-gray-500">Yanayoonekana</p>
                <p className="mt-1 text-2xl font-black">
                  {listings.filter((item) => item.status === "active").length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-[#DCE9DF]">
                <p className="text-sm text-gray-500">Yaliyosimamishwa</p>
                <p className="mt-1 text-2xl font-black">
                  {listings.filter((item) => item.status === "paused").length}
                </p>
              </div>
            </div>

            {listingsLoading ? (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-500">
                Inapakia matangazo...
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-500 ring-1 ring-[#DCE9DF]">
                Hakuna matangazo yaliyopatikana.
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => (
                  <div
                    key={`${listing.type}-${listing.id}`}
                    className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#DCE9DF] sm:flex-row sm:items-center"
                  >
                    {listing.image_url && (
                      <img
                        src={listing.image_url}
                        alt={listing.title}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black">{listing.title || "Bila jina"}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {listing.type} • {new Date(listing.created_at).toLocaleDateString()}
                      </p>
                      <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                        listing.status === "active"
                          ? "bg-green-100 text-green-700"
                          : listing.status === "paused"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}>
                        {listing.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateListingStatus(listing)}
                        disabled={savingId === listing.id || !["active", "paused"].includes(listing.status)}
                        className="rounded-xl bg-[#EAF7ED] px-3 py-2 text-sm font-bold text-[#173B2A] disabled:opacity-40"
                      >
                        {savingId === listing.id
                          ? "Inasubiri..."
                          : listing.status === "active"
                            ? "⏸ Simamisha"
                            : listing.status === "paused"
                              ? "▶ Washa tena"
                              : "Hali maalum"}
                      </button>
                      <button
                        onClick={() => deleteListing(listing)}
                        disabled={savingId === listing.id}
                        className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-40"
                      >
                        🗑 Futa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === "overview" && (
          <>
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                2050 COMMAND CENTER
              </p>

          <h2 className="mt-1 text-2xl font-black">
            Muhtasari wa Mfumo 🚀
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Muhtasari wa watumiaji na majukumu ya mfumo kwa wakati huu.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
            <div className="text-3xl">👥</div>
            <p className="mt-4 text-sm font-bold text-gray-500">
              Watumiaji Wote
            </p>
            <p className="mt-1 text-3xl font-black">{totalUsers}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
            <div className="text-3xl">👑</div>
            <p className="mt-4 text-sm font-bold text-gray-500">
              Admin
            </p>
            <p className="mt-1 text-3xl font-black">{admins}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
            <div className="text-3xl">🌱</div>
            <p className="mt-4 text-sm font-bold text-gray-500">
              Afisa Kilimo
            </p>
            <p className="mt-1 text-3xl font-black">{agricultureOfficers}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
            <div className="text-3xl">🐄</div>
            <p className="mt-4 text-sm font-bold text-gray-500">
              Afisa Ufugaji
            </p>
            <p className="mt-1 text-3xl font-black">{livestockOfficers}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
            <div className="text-3xl">📚</div>
            <p className="mt-4 text-sm font-bold text-gray-500">
              Makala
            </p>
            <p className="mt-1 text-3xl font-black">{articles.length}</p>
          </div>
        </div>
          </>
        )}

        {activeSection === "intelligence" && (
          <section className="mb-8 space-y-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                AGRO INTELLIGENCE • 2050
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Mfumo wa Uelewa wa Kilimo 📊
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Taarifa za mfumo zinazosaidia kuelewa matumizi ya AgroFuture 2050.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <p className="text-3xl">👥</p>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Watumiaji
                </p>
                <p className="mt-1 text-3xl font-black">
                  {users.length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <p className="text-3xl">👑</p>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Admin
                </p>
                <p className="mt-1 text-3xl font-black">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <p className="text-3xl">🌱</p>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Afisa Kilimo
                </p>
                <p className="mt-1 text-3xl font-black">
                  {users.filter((u) => u.role === "agriculture-officer").length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <p className="text-3xl">🐄</p>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Afisa Ufugaji
                </p>
                <p className="mt-1 text-3xl font-black">
                  {users.filter((u) => u.role === "livestock-officer").length}
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <h3 className="font-black">
                  👥 Mgawanyo wa Watumiaji
                </h3>

                <div className="mt-5 space-y-3">
                  {[
                    ["Admin", users.filter((u) => u.role === "admin").length],
                    ["Afisa Kilimo", users.filter((u) => u.role === "agriculture-officer").length],
                    ["Afisa Ufugaji", users.filter((u) => u.role === "livestock-officer").length],
                    ["Wengine", users.filter(
                      (u) =>
                        !["admin", "agriculture-officer", "livestock-officer"].includes(u.role)
                    ).length],
                  ].map(([label, count]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl bg-[#F8FAF5] p-4"
                    >
                      <span className="font-bold">{label}</span>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-black">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <h3 className="font-black">
                  🇹🇿 Activity ya Mikoa
                </h3>

                <div className="mt-5 space-y-3">
                  {Object.entries(
                    users.reduce<Record<string, number>>((acc, user) => {
                      const region = user.region || "Haijawekwa";
                      acc[region] = (acc[region] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([region, count]) => (
                      <div
                        key={region}
                        className="flex items-center justify-between rounded-2xl bg-[#F8FAF5] p-4"
                      >
                        <span className="font-bold">{region}</span>
                        <span className="font-black text-[#2F9E5B]">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#173B2A] p-6 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#BFE3C9]">
                2050 INSIGHT
              </p>

              <h3 className="mt-2 text-xl font-black">
                Tanzania Agro Digital Intelligence
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Mfumo huu utaendelea kukusanya takwimu za matumizi ya platform
                ili kusaidia kuelewa mahitaji ya wakulima, wafugaji, maafisa,
                wanunuzi na wauzaji kwa kila mkoa.
              </p>
            </div>
          </section>
        )}

        {activeSection === "reports" && (
          <section className="mb-8 space-y-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                REPORTS • AGROFUTURE 2050
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Ripoti za Mfumo 📈
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Muhtasari wa data halisi ya watumiaji, majukumu, mikoa na maudhui.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <p className="text-3xl">👥</p>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Watumiaji
                </p>
                <p className="mt-1 text-3xl font-black">
                  {users.length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <p className="text-3xl">👑</p>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Admin
                </p>
                <p className="mt-1 text-3xl font-black">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <p className="text-3xl">📚</p>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Makala
                </p>
                <p className="mt-1 text-3xl font-black">
                  {articles.length}
                </p>
              </div>

              <div className="rounded-3xl bg-[#173B2A] p-5 text-white shadow-sm">
                <p className="text-3xl">🇹🇿</p>
                <p className="mt-3 text-sm font-bold text-white/70">
                  Mikoa yenye watumiaji
                </p>
                <p className="mt-1 text-3xl font-black">
                  {new Set(users.map((u) => u.region).filter(Boolean)).size}
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <h3 className="font-black">
                  👥 Mgawanyo wa Majukumu
                </h3>

                <div className="mt-5 space-y-3">
                  {[
                    ["Admin", "admin"],
                    ["Afisa Kilimo", "agriculture-officer"],
                    ["Afisa Ufugaji", "livestock-officer"],
                    ["Wengine", "other"],
                  ].map(([label, role]) => {
                    const count =
                      role === "other"
                        ? users.filter(
                            (u) =>
                              ![
                                "admin",
                                "agriculture-officer",
                                "livestock-officer",
                              ].includes(u.role)
                          ).length
                        : users.filter((u) => u.role === role).length;

                    return (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-2xl bg-[#F8FAF5] p-4"
                      >
                        <span className="font-bold">{label}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-black">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <h3 className="font-black">
                  🇹🇿 Watumiaji kwa Mkoa
                </h3>

                <div className="mt-5 space-y-3">
                  {Object.entries(
                    users.reduce<Record<string, number>>((acc, user) => {
                      const region = user.region || "Haijawekwa";
                      acc[region] = (acc[region] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([region, count]) => (
                      <div
                        key={region}
                        className="flex items-center justify-between rounded-2xl bg-[#F8FAF5] p-4"
                      >
                        <span className="font-bold">{region}</span>
                        <span className="font-black text-[#2F9E5B]">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
              <h3 className="font-black">
                📚 Content Report
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#F8FAF5] p-4">
                  <p className="text-sm font-bold text-gray-500">Makala zote</p>
                  <p className="mt-1 text-2xl font-black">{articles.length}</p>
                </div>

                <div className="rounded-2xl bg-[#F8FAF5] p-4">
                  <p className="text-sm font-bold text-gray-500">Published</p>
                  <p className="mt-1 text-2xl font-black">
                    {articles.filter((a) => a.published).length}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F8FAF5] p-4">
                  <p className="text-sm font-bold text-gray-500">Drafts</p>
                  <p className="mt-1 text-2xl font-black">
                    {articles.filter((a) => !a.published).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#173B2A] p-6 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#BFE3C9]">
                2050 REPORTING
              </p>

              <h3 className="mt-2 text-xl font-black">
                Tanzania Agro Digital Reporting
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Reports hizi zinatumia data inayopatikana kwenye mfumo kwa sasa.
                Kadri AgroFuture 2050 inavyokua, tutajenga analytics za muda,
                activity na export za ripoti.
              </p>
            </div>
          </section>
        )}

        {activeSection === "settings" && (
          <section className="mb-8 space-y-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                CONTROL CENTER • 2050
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Settings & Control ⚙️
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Simamia usalama, watumiaji, mfumo na mipangilio ya AgroFuture 2050.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setActiveSection("settings-users")}
                className="rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-[#DCE9DF] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">👥</div>
                <h3 className="mt-3 font-black">User Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Simamia accounts, roles na status za watumiaji.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("security")}
                className="rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-[#DCE9DF] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">🔐</div>
                <h3 className="mt-3 font-black">Security Center</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Dhibiti usalama na access ya Admin.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("notifications")}
                className="rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-[#DCE9DF] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">🔔</div>
                <h3 className="mt-3 font-black">Notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Dhibiti alerts na taarifa muhimu za mfumo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("calendar")}
                className="rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-[#DCE9DF] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">📅</div>
                <h3 className="mt-3 font-black">Smart Agro Calendar</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Simamia misimu, ratiba za kilimo, mifugo na vikumbusho.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("farmer-alerts")}
                className="rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-[#DCE9DF] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">🌾</div>
                <h3 className="mt-3 font-black">Farmer Alerts</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tahadhari za mazao, wadudu, magonjwa, mvua na msimu.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("livestock-alerts")}
                className="rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-[#DCE9DF] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">🐄</div>
                <h3 className="mt-3 font-black">Livestock Alerts</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vikumbusho vya chanjo, afya, lishe na ratiba za mifugo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("tanzania")}
                className="rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-[#DCE9DF] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">🇹🇿</div>
                <h3 className="mt-3 font-black">Tanzania Configuration</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Mipangilio ya mikoa na mfumo wa Tanzania.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("ai")}
                className="rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-[#DCE9DF] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">🤖</div>
                <h3 className="mt-3 font-black">AI & Intelligence</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Controls za future AI na Agro Intelligence.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("audit")}
                className="rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-[#DCE9DF] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-3xl">🧾</div>
                <h3 className="mt-3 font-black">Audit & Activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fuatilia actions muhimu zinazofanyika ndani ya Admin.
                </p>
              </button>
            </div>

            <div className="rounded-3xl bg-[#173B2A] p-6 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#BFE3C9]">
                AGROFUTURE 2050
              </p>

              <h3 className="mt-2 text-xl font-black">
                Future-ready Administration
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Settings hizi zitakuwa kitovu cha usimamizi wa mfumo,
                usalama, data, AI na huduma za AgroFuture 2050.
              </p>
            </div>

            <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
                DANGER ZONE
              </p>

              <h3 className="mt-2 font-black text-red-800">
                Hatua hatarishi za mfumo
              </h3>

              <p className="mt-1 text-sm text-red-700">
                Actions kama kufuta user au kubadilisha data muhimu
                zitawekwa hapa na confirmation maalum.
              </p>
            </div>
          </section>
        )}

        {activeSection === "settings-users" && (
          <section className="mb-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                  SETTINGS • USER MANAGEMENT
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  User Management 👥
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Simamia accounts, roles na hali za watumiaji bila kuondoka kwenye Settings.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSection("settings")}
                className="rounded-xl border border-[#DCE9DF] bg-white px-4 py-2 text-sm font-bold"
              >
                ← Settings
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <div className="text-3xl">👥</div>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Watumiaji
                </p>
                <p className="mt-1 text-3xl font-black">
                  {users.length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <div className="text-3xl">👑</div>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Admin
                </p>
                <p className="mt-1 text-3xl font-black">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <div className="text-3xl">🛡️</div>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Officers
                </p>
                <p className="mt-1 text-3xl font-black">
                  {users.filter(
                    (u) =>
                      u.role === "agriculture-officer" ||
                      u.role === "livestock-officer"
                  ).length}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black">
                    Accounts & Roles
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Badili majukumu ya maafisa kutoka hapa.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadUsers}
                  className="rounded-xl border border-[#DCE9DF] bg-white px-4 py-2 text-sm font-bold"
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl bg-[#F8FAF5] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black">
                          {user.full_name || "Jina halijawekwa"}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {user.email}
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black">
                        {user.role || "Haijawekwa"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                      📍 {user.region || "Mkoa haujawekwa"}
                    </p>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() =>
                          deleteUser(
                            user.id,
                            user.full_name || user.email || "User"
                          )
                        }
                        className="w-full rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                      >
                        🗑️ Futa User
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateRole(user.id, "agriculture-officer")
                        }
                        disabled={savingId === user.id}
                        className="rounded-xl border border-[#BFD8C5] bg-white py-2 text-sm font-bold text-[#2F9E5B] disabled:opacity-50"
                      >
                        🌱 Afisa Kilimo
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateRole(user.id, "livestock-officer")
                        }
                        disabled={savingId === user.id}
                        className="rounded-xl bg-[#2F9E5B] py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        🐄 Afisa Ufugaji
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeSection === "security" && (
          <section className="mb-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                  SETTINGS • SECURITY
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Security Center 🔐
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Kituo cha usalama wa Admin na udhibiti wa access ya mfumo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSection("settings")}
                className="rounded-xl border border-[#DCE9DF] bg-white px-4 py-2 text-sm font-bold"
              >
                ← Settings
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <div className="text-3xl">🔐</div>
                <h3 className="mt-3 font-black">
                  Admin Access
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Udhibiti wa akaunti zenye mamlaka ya Admin.
                </p>
                <span className="mt-4 inline-block rounded-full bg-[#EAF7ED] px-3 py-1 text-xs font-black text-[#2F9E5B]">
                  Protected
                </span>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <div className="text-3xl">🛡️</div>
                <h3 className="mt-3 font-black">
                  Role Protection
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Majukumu ya Admin na maafisa yanadhibitiwa kupitia mfumo.
                </p>
                <span className="mt-4 inline-block rounded-full bg-[#EAF7ED] px-3 py-1 text-xs font-black text-[#2F9E5B]">
                  Enabled
                </span>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <div className="text-3xl">📋</div>
                <h3 className="mt-3 font-black">
                  Security Activity
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Actions muhimu za Admin zitafuatiliwa kwenye Audit & Activity.
                </p>
                <span className="mt-4 inline-block rounded-full bg-[#EAF7ED] px-3 py-1 text-xs font-black text-[#2F9E5B]">
                  Monitoring
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-[#173B2A] p-6 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#BFE3C9]">
                SECURITY CENTER • 2050
              </p>
              <h3 className="mt-2 text-xl font-black">
                Future-ready Admin Security
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Hapa ndipo tutaunganisha baadaye login security,
                session controls, access monitoring na hatua za
                usalama za kiwango cha juu.
              </p>
            </div>
          </section>
        )}

        {activeSection === "content" && (
          <div className="mb-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                  CONTENT COMMAND
                </p>
              <h2 className="mt-1 text-xl font-black">
                Makala 📚
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Simamia taarifa na maarifa yanayochapishwa kwenye AgroFuture 2050.
              </p>
            </div>

            <button
              onClick={loadArticles}
              className="rounded-xl border border-[#DCE9DF] bg-white px-4 py-2 text-sm font-bold"
            >
              ↻ Refresh
            </button>
          </div>

          {articles.length === 0 ? (
            <div className="rounded-2xl bg-[#F8FAF5] p-6 text-center">
              <div className="text-3xl">📭</div>
              <p className="mt-2 font-bold">
                Hakuna makala bado.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Makala zitakapoanzishwa zitaonekana hapa.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-black">
                        {article.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {article.category || "Bila category"}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        {new Date(article.created_at).toLocaleString("sw-TZ")}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                        article.published
                          ? "bg-[#EAF7ED] text-[#2F9E5B]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {article.published ? "Published" : "Draft"}
                    </span>
                  </div>

                  {article.image_url && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-[#DCE9DF] bg-white">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="h-56 w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="mt-4 space-y-4">
                    {article.image_url && (
                      <div className="overflow-hidden rounded-2xl border border-[#DCE9DF] bg-white">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="h-64 w-full object-cover"
                        />
                        <div className="px-4 py-2 text-xs font-bold text-gray-500">
                          🖼️ Picha ya makala
                        </div>
                      </div>
                    )}

                    {article.video_url && (
                      <div className="overflow-hidden rounded-2xl border border-[#DCE9DF] bg-black">
                        <video
                          src={article.video_url}
                          controls
                          preload="metadata"
                          className="max-h-80 w-full"
                        />
                        <div className="bg-white px-4 py-2 text-xs font-bold text-gray-500">
                          🎥 Video ya makala
                        </div>
                      </div>
                    )}

                    {article.file_url && (
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#DCE9DF] bg-white p-4">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-wide text-gray-400">
                            📎 Nyaraka
                          </p>
                          <p className="mt-1 truncate font-bold">
                            {article.file_name || "Nyaraka ya makala"}
                          </p>
                        </div>

                        <a
                          href={article.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-xl bg-[#173B2A] px-4 py-2 text-sm font-black text-white"
                        >
                          Fungua
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[#DCE9DF]">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {article.content}
                    </p>
                  </div>

                  {article.image_url && (
                    <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-[#DCE9DF]">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="max-h-[420px] w-full object-cover"
                      />
                    </div>
                  )}

                  {article.video_url && (
                    <div className="mt-4 overflow-hidden rounded-2xl bg-black ring-1 ring-[#DCE9DF]">
                      <video
                        src={article.video_url}
                        controls
                        preload="metadata"
                        className="max-h-[420px] w-full"
                      />
                    </div>
                  )}

                  {article.file_url && (
                    <div className="mt-4">
                      <a
                        href={article.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#173B2A] px-4 py-3 text-sm font-black text-white"
                      >
                        📎 Fungua {article.file_name || "Nyaraka"}
                      </a>
                    </div>
                  )}

                  {editingArticle?.id === article.id && (
                    <div className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-[#DCE9DF]">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                        EDIT ARTICLE
                      </p>

                      <h4 className="mt-1 text-lg font-black">
                        Hariri Makala ✏️
                      </h4>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="text-sm font-black">
                            Kichwa
                          </label>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2F9E5B]"
                            placeholder="Kichwa cha makala"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-black">
                            Category
                          </label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2F9E5B]"
                          >
                            <option value="Kilimo">Kilimo</option>
                            <option value="Ufugaji">Ufugaji</option>
                            <option value="Masoko">Masoko</option>
                            <option value="Teknolojia">Teknolojia</option>
                            <option value="Mazingira">Mazingira</option>
                            <option value="Habari">Habari</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-black">
                            Maudhui
                          </label>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={10}
                            className="mt-1 w-full rounded-xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-[#2F9E5B]"
                            placeholder="Maudhui ya makala"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={saveArticleEdit}
                            disabled={editSaving}
                            className="rounded-xl bg-[#2F9E5B] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                          >
                            {editSaving
                              ? "Inahifadhi..."
                              : "💾 Hifadhi Mabadiliko"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditArticle}
                            disabled={editSaving}
                            className="rounded-xl border border-[#DCE9DF] bg-white px-5 py-3 text-sm font-black disabled:opacity-50"
                          >
                            ❌ Ghairi
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditArticle(article)}
                      disabled={editSaving}
                      className="rounded-xl bg-[#173B2A] px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      disabled={savingId === article.id}
                      onClick={() => publishArticle(article)}
                      className="rounded-xl bg-[#2F9E5B] px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                    >
                      {savingId === article.id
                        ? "Inahifadhi..."
                        : article.published
                          ? "↩ Rudisha Draft"
                          : "✓ Publish"}
                    </button>

                    <button
                      type="button"
                      disabled={savingId === article.id}
                      onClick={() => deleteArticle(article)}
                      className="rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-700 disabled:opacity-50"
                    >
                      🗑️ Futa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}

        {activeSection === "users" && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Watumiaji 👥
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Weka Afisa Kilimo au Afisa Ufugaji kupitia Admin.
            </p>
          </div>

          <button
            onClick={loadUsers}
            className="rounded-xl border border-[#DCE9DF] bg-white px-4 py-2 text-sm font-bold"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF7ED] text-2xl">
                  {user.role === "livestock-officer"
                    ? "🐄"
                    : user.role === "agriculture-officer"
                    ? "🌱"
                    : "👤"}
                </div>

                <div className="min-w-0">
                  <h3 className="font-black">
                    {user.full_name || "Jina halijawekwa"}
                  </h3>

                  <p className="truncate text-sm text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl bg-[#F8FAF5] p-4 text-sm">
                <p>
                  <span className="font-bold">📍 Mkoa:</span>{" "}
                  {user.region || "Haijawekwa"}
                </p>

                <p>
                  <span className="font-bold">🏷️ Role:</span>{" "}
                  {user.role || "Haijawekwa"}
                </p>
              </div>

              <div className="mt-4 grid gap-2">
                <button
                  onClick={() =>
                    updateRole(user.id, "agriculture-officer")
                  }
                  disabled={savingId === user.id}
                  className="rounded-2xl border border-[#BFD8C5] bg-white py-3 text-sm font-bold text-[#2F9E5B] disabled:opacity-50"
                >
                  🌱 Weka Afisa Kilimo
                </button>

                <button
                  onClick={() =>
                    updateRole(user.id, "livestock-officer")
                  }
                  disabled={savingId === user.id}
                  className="rounded-2xl bg-[#2F9E5B] py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  🐄 Weka Afisa Ufugaji
                </button>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-[#DCE9DF]">
            <div className="text-4xl">👥</div>
            <p className="mt-3 font-bold">
              Hakuna users walioonekana.
            </p>
          </div>
        )}
      </div>
    )}
        {activeSection === "notifications" && (
          <section className="space-y-5">

            <div className="rounded-3xl border border-[#DCE9DF] bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-[#2F9E5B]">
                ADMIN ALERTS
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#173B2A]">
                Tuma Alert 🔔
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#687B70]">
                Tuma taarifa moja kwa moja kwa mkulima, mfugaji au mtumiaji mwingine.
              </p>

              <div className="mt-5 space-y-4">

                <div>
                  <label className="text-sm font-bold text-[#173B2A]">
                    Mtumiaji
                  </label>

                  <select
                    value={alertRecipient}
                    onChange={(e) => setAlertRecipient(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Chagua mtumiaji
                    </option>

                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email} — {user.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-[#173B2A]">
                    Aina ya Alert
                  </label>

                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
                  >
                    <option value="general">General</option>
                    <option value="weather">Weather 🌧️</option>
                    <option value="farmer">Kilimo 🌾</option>
                    <option value="livestock">Ufugaji 🐄</option>
                    <option value="market">Market 🛒</option>
                    <option value="urgent">Urgent 🚨</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-[#173B2A]">
                    Kichwa
                  </label>

                  <input
                    value={alertTitle}
                    onChange={(e) => setAlertTitle(e.target.value)}
                    placeholder="Mfano: Tahadhari ya mvua"
                    className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#173B2A]">
                    Ujumbe
                  </label>

                  <textarea
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    placeholder="Andika ujumbe wa alert..."
                    rows={5}
                    className="mt-2 w-full resize-none rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={sendAdminAlert}
                  disabled={alertSending}
                  className="w-full rounded-2xl bg-[#2F9E5B] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  {alertSending
                    ? "Inatuma..."
                    : "🔔 Tuma Alert"}
                </button>

              </div>
            </div>

          </section>
        )}

        {activeSection === "notifications" && (
          <section className="mb-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                  SETTINGS • NOTIFICATIONS
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Notification Preferences 🔔
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Chagua aina za taarifa ambazo mfumo utume kwa wakulima,
                  wafugaji na watumiaji wengine.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSection("settings")}
                className="rounded-xl border border-[#DCE9DF] bg-white px-4 py-2 text-sm font-bold"
              >
                ← Settings
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["🌾", "Farmer Alerts", "Mazao, wadudu, magonjwa na misimu.", "farmer_alerts"],
                ["🐄", "Livestock Alerts", "Afya, chanjo, lishe na magonjwa ya mifugo.", "livestock_alerts"],
                ["🌧️", "Weather & Seasonal", "Mvua, ukame na taarifa za msimu.", "weather_alerts"],
                ["🏪", "Market Alerts", "Taarifa za masoko na fursa za biashara.", "market_alerts"],
                ["📅", "Calendar Reminders", "Vikumbusho vya shughuli zilizopangwa.", "calendar_reminders"],
                ["📍", "Regional Alerts", "Alerts zinazohusiana na eneo la mtumiaji.", "regional_alerts"],
                ["🤖", "AI Recommendations", "Mapendekezo yanayotokana na taarifa za mfumo.", "ai_recommendations"],
                ["🚨", "Urgent System Alerts", "Tahadhari muhimu zinazohitaji umakini.", "urgent_alerts"],
              ].map(([icon, title, description, key]) => {
                const preferenceKey =
                  key as keyof typeof notificationPreferences;

                const enabled = notificationPreferences[preferenceKey];

                return (
                  <div
                    key={title}
                    className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="text-3xl">{icon}</div>

                      <div className="min-w-0">
                        <p className="font-black">{title}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {description}
                        </p>
                        <p
                          className={`mt-2 text-xs font-black ${
                            enabled
                              ? "text-[#2F9E5B]"
                              : "text-gray-400"
                          }`}
                        >
                          {enabled ? "IMEWASHWA" : "IMEZIMWA"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={
                        notificationLoading ||
                        notificationSaving === preferenceKey
                      }
                      onClick={() =>
                        updateNotificationPreference(
                          preferenceKey,
                          !enabled
                        )
                      }
                      aria-label={`Toggle ${title}`}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        enabled ? "bg-[#2F9E5B]" : "bg-gray-300"
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                          enabled ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="rounded-3xl bg-[#173B2A] p-6 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#BFE3C9]">
                AGROFUTURE 2050 • SMART ALERTS
              </p>
              <h3 className="mt-2 text-xl font-black">
                Mfumo wa taarifa mahiri
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Preferences hizi zitatumika kudhibiti alerts za wakulima,
                wafugaji, hali ya hewa, masoko, kalenda na mapendekezo ya AI.
              </p>
            </div>
          </section>
        )}

        {activeSection === "calendar" && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                SMART AGRO CALENDAR
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Kalenda ya Kilimo na Ufugaji 📅
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Ratiba za misimu, shughuli za mashambani na vikumbusho vya mifugo.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#DCE9DF]">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[#F8FAF5] p-4">
                  <p className="text-2xl">🌱</p>
                  <p className="mt-2 font-black">Mazao</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Ratiba za kupanda, kutunza na kuvuna.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F8FAF5] p-4">
                  <p className="text-2xl">🐄</p>
                  <p className="mt-2 font-black">Mifugo</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Chanjo, afya, lishe na huduma muhimu.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F8FAF5] p-4">
                  <p className="text-2xl">🌧️</p>
                  <p className="mt-2 font-black">Misimu</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Matukio ya msimu na vikumbusho.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "farmer-alerts" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#DCE9DF]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
              FARMER ALERTS
            </p>
            <h2 className="mt-1 text-2xl font-black">
              Tahadhari za Wakulima 🌾
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Mfumo wa kusimamia tahadhari za mazao, wadudu, magonjwa, mvua na misimu.
            </p>
          </div>
        )}

        {activeSection === "livestock-alerts" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#DCE9DF]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
              LIVESTOCK ALERTS
            </p>
            <h2 className="mt-1 text-2xl font-black">
              Tahadhari za Wafugaji 🐄
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Mfumo wa kusimamia chanjo, afya, lishe na ratiba za mifugo.
            </p>
          </div>
        )}

        {activeSection === "tanzania" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#DCE9DF]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
              TANZANIA CONFIGURATION
            </p>
            <h2 className="mt-1 text-2xl font-black">
              Tanzania Configuration 🇹🇿
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Mipangilio ya mikoa, maeneo na huduma za AgroFuture 2050 nchini Tanzania.
            </p>
          </div>
        )}

        {activeSection === "ai" && (
          <div className="space-y-5">
            <div className="rounded-3xl bg-[#173B2A] p-6 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#BFE3C9]">
                AGRO AI • 2050
              </p>
              <h2 className="mt-1 text-2xl font-black">
                AI & Intelligence 🤖
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Kitovu cha AI kitakachosaidia kuchambua data, kutambua patterns,
                kutoa insights na kusaidia maamuzi ya kilimo na ufugaji.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <div className="text-3xl">🧠</div>
                <h3 className="mt-3 font-black">Smart Insights</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Uchambuzi wa data ya mfumo.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <div className="text-3xl">🔮</div>
                <h3 className="mt-3 font-black">Predictions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Future-ready forecasting ya kilimo.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
                <div className="text-3xl">💡</div>
                <h3 className="mt-3 font-black">Recommendations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Mapendekezo yanayolenga mtumiaji.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "audit" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#DCE9DF]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
              AUDIT & ACTIVITY
            </p>
            <h2 className="mt-1 text-2xl font-black">
              Audit & Activity 🧾
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Fuatilia actions muhimu zinazofanyika ndani ya Admin.
            </p>
          </div>
        )}

      </section>
    </main>
  );
}
