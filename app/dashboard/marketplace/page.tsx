"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category =
  | "Yote"
  | "Mazao"
  | "Mifugo"
  | "Pembejeo"
  | "Vifaa"
  | "Huduma";

const categories: { name: Category; icon: string }[] = [
  { name: "Yote", icon: "🌍" },
  { name: "Mazao", icon: "🌾" },
  { name: "Mifugo", icon: "🐄" },
  { name: "Pembejeo", icon: "🌱" },
  { name: "Vifaa", icon: "🚜" },
  { name: "Huduma", icon: "🛠️" },
];



function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<Category>("Yote");
  const [search, setSearch] = useState("");
  const [livestockListings, setLivestockListings] = useState<any[]>([]);
  const [cropListings, setCropListings] = useState<any[]>([]);
  const [sellerListings, setSellerListings] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    async function loadListings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role =
          user.user_metadata?.role ||
          user.app_metadata?.role ||
          "";

        setUserRole(role);
      }

      const [livestockResult, cropResult, sellerResult] =
        await Promise.all([
          supabase
            .from("livestock_listings")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false }),

          supabase
            .from("crop_listings")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false }),

          supabase
            .from("seller_products")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false }),
        ]);

      if (livestockResult.error) {
        console.error(
          "Marketplace livestock error:",
          livestockResult.error
        );
      }

      if (cropResult.error) {
        console.error(
          "Marketplace crop error:",
          cropResult.error
        );
      }

      setLivestockListings(livestockResult.data || []);
      setCropListings(cropResult.data || []);
      setSellerListings(sellerResult.data || []);
    }

    loadListings();
  }, []);

  useEffect(() => {
    const query = searchParams.get("search") || "";
    setSearch(query);
  }, [searchParams]);

  const marketplaceListings = useMemo(() => {
    const livestock = livestockListings.map((item) => ({
      ...item,
      type: "livestock",
      title: item.animal || "Mnyama",
      category: "Mifugo" as Category,
      unit: "mnyama",
      seller: "Mfugaji",
      icon: "🐄",
    }));

    const crops = cropListings.map((item) => ({
      ...item,
      type: "crop",
      title: item.product || "Zao",
      category: "Mazao" as Category,
      unit: item.quantity || "zao",
      seller: "Mkulima",
      icon: "🌾",
    }));

    const sellerProducts = sellerListings.map((item) => ({
      ...item,
      type: "seller-product",
      title: item.name || "Bidhaa",
      category:
        item.category === "Vifaa vya Kilimo" ||
        item.category === "Vifaa vya Ufugaji"
          ? "Vifaa"
          : item.category === "Pembejeo za Kilimo" ||
              item.category === "Pembejeo za Ufugaji"
            ? "Pembejeo"
            : "Vifaa",
      unit: item.quantity || "bidhaa",
      seller: "Muuzaji",
      icon: "🧰",
    }));

    return [...livestock, ...crops, ...sellerProducts].sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );
  }, [livestockListings, cropListings, sellerListings]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return marketplaceListings.filter((item) => {
      const matchesCategory =
        category === "Yote" || item.category === category;

      const searchable = [
        item.title,
        item.location,
        item.seller,
        item.phone,
        item.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [marketplaceListings, category, search]);

  return (
    <main className="min-h-screen bg-[#F6FAF7] text-[#173B2A]">
      <header className="sticky top-0 z-20 border-b border-[#DCE9DF] bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <button
            onClick={() => router.back()}
            className="text-sm font-bold text-[#2F9E5B]"
          >
            ← Rudi
          </button>

          <div className="mt-5">
            <p className="text-xs font-black tracking-widest text-[#2F9E5B]">
              AGROFUTURE 2050
            </p>

            <h1 className="mt-1 text-3xl font-black">
              AgroMarket 🌍
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#718578]">
              Soko la kizazi kijacho kwa wakulima, wafugaji,
              wauzaji na wanunuzi.
            </p>
          </div>

          <div className="mt-5">
            <div className="flex items-center rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4">
              <span className="text-lg">🔎</span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tafuta bidhaa, mifugo au eneo..."
                className="w-full bg-transparent px-3 py-4 text-sm outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-6">
        <div className="rounded-3xl bg-[#173B2A] p-6 text-white shadow-sm">
          <p className="text-sm font-bold text-[#BDE8CA]">
            Future commerce
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Nunua na uza kutoka sehemu moja.
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#D7E9DC]">
            AgroMarket inaunganisha bidhaa za kilimo,
            mifugo, pembejeo, vifaa na huduma katika soko moja.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/dashboard/buy")}
              className="rounded-2xl bg-white px-4 py-4 text-left font-black text-[#173B2A]"
            >
              🛒
              <span className="mt-2 block">Nunua</span>
              <span className="mt-1 block text-xs font-normal text-[#718578]">
                Tafuta bidhaa
              </span>
            </button>

            {(userRole === "farmer" || userRole === "livestock") && (
              <button
                onClick={() => {
                  if (userRole === "farmer") {
                    router.push("/dashboard/sell");
                  } else if (userRole === "livestock") {
                    router.push("/dashboard/livestock/sell");
                  }
                }}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-left font-black text-white"
              >
                🏪
                <span className="mt-2 block">Uza</span>
                <span className="mt-1 block text-xs font-normal text-[#D7E9DC]">
                  {userRole === "farmer"
                    ? "Weka tangazo la zao"
                    : "Weka tangazo la mifugo"}
                </span>
              </button>
            )}

            {(userRole === "farmer" || userRole === "livestock") && (
              <button
                onClick={() =>
                  router.push(
                    userRole === "farmer"
                      ? "/dashboard/my-crops"
                      : "/dashboard/my-livestock"
                  )
                }
                className="col-span-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-left font-black text-white"
              >
                📋
                <span className="mt-2 block">Matangazo Yangu</span>
                <span className="mt-1 block text-xs font-normal text-[#D7E9DC]">
                  Angalia matangazo yako yote
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">
              Vinavyopatikana
            </h2>

            <span className="text-xs font-bold text-[#718578]">
              {filteredListings.length} matangazo
            </span>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item.name}
                onClick={() => setCategory(item.name)}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold ${
                  category === item.name
                    ? "bg-[#2F9E5B] text-white"
                    : "border border-[#DCE9DF] bg-white text-[#52665A]"
                }`}
              >
                {item.icon} {item.name}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {filteredListings.map((item) => (
              <article
                key={`${item.type}-${item.id}`}
                className="overflow-hidden rounded-3xl border border-[#DCE9DF] bg-white shadow-sm"
              >
                <div className="h-44 overflow-hidden bg-[#EAF7ED]">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">
                      {item.type === "crop" ? "🌾" : "🐄"}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#2F9E5B]">
                        {item.category}
                      </p>

                      <h3 className="mt-1 font-black">
                        {item.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-[#EAF7ED] px-2 py-1 text-[10px] font-black text-[#2F9E5B]">
                      {item.type === "crop"
                        ? "🌾 Mkulima"
                        : item.type === "seller-product"
                          ? "🛒 Muuzaji"
                          : "🐄 Mfugaji"}
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-black">
                    TSh {Number(item.price || 0).toLocaleString()}
                  </p>

                  <p className="mt-1 text-xs text-[#819188]">
                    📦 {item.quantity}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-[#EEF3EF] pt-4">
                    <p className="text-sm font-bold">
                      📍 {item.location}
                    </p>

                    {item.description && (
                      <p className="text-xs leading-5 text-[#718578]">
                        {item.description}
                      </p>
                    )}

                    {item.phone && (
                      <div className="flex gap-2">
                        <a
                          href={`tel:${item.phone}`}
                          className="flex-1 rounded-xl border border-[#DCE9DF] py-2.5 text-center text-xs font-black text-[#2F9E5B]"
                        >
                          📞 Piga simu
                        </a>

                        <a
                          href={`https://wa.me/${String(item.phone).replace(/\\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 rounded-xl bg-[#2F9E5B] py-2.5 text-center text-xs font-black text-white"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    )}
                  </div>

                    <button
                      onClick={() =>
                        router.push(`/dashboard/marketplace/${item.id}`)
                      }
                      className="mt-4 w-full rounded-2xl bg-[#2F9E5B] py-3.5 text-sm font-black text-white"
                    >
                      Angalia bidhaa →
                    </button>
                </div>
              </article>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="mt-5 rounded-3xl border border-dashed border-[#C9D9CE] bg-white p-8 text-center">
              <div className="text-4xl">🔎</div>

              <p className="mt-3 font-black">
                Hakuna bidhaa zilizopatikana
              </p>

              <p className="mt-1 text-sm text-[#718578]">
                Jaribu jina jingine au category nyingine.
              </p>
            </div>
          )}
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4">
            <p className="text-xl">📍</p>
            <p className="mt-2 text-xs font-black">Eneo</p>
            <p className="mt-1 text-[10px] text-[#819188]">
              Tafuta karibu
            </p>
          </div>

          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4">
            <p className="text-xl">🛡️</p>
            <p className="mt-2 text-xs font-black">Uaminifu</p>
            <p className="mt-1 text-[10px] text-[#819188]">
              Verified sellers
            </p>
          </div>

          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4">
            <p className="text-xl">🚚</p>
            <p className="mt-2 text-xs font-black">Delivery</p>
            <p className="mt-1 text-[10px] text-[#819188]">
              Coming soon
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[#F6FAF7] text-[#173B2A]">
        <p className="font-bold">Inapakia AgroMarket...</p>
      </main>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
