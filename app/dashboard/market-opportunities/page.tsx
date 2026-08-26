"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  category?: string | null;
  location?: string | null;
  price?: number | null;
  quantity?: number | string | null;
  status?: string | null;
  created_at?: string | null;
};

export default function MarketOpportunitiesPage() {
  const router = useRouter();

  const [sellerProducts, setSellerProducts] = useState<Listing[]>([]);
  const [cropListings, setCropListings] = useState<Listing[]>([]);
  const [livestockListings, setLivestockListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarketData() {
      setLoading(true);

      const [sellerResult, cropResult, livestockResult] =
        await Promise.all([
          supabase
            .from("seller_products")
            .select("id, category, location, price, quantity, status, created_at")
            .eq("status", "active"),

          supabase
            .from("crop_listings")
            .select("id, location, price, quantity, status, created_at")
            .eq("status", "active"),

          supabase
            .from("livestock_listings")
            .select("id, location, price, quantity, status, created_at")
            .eq("status", "active"),
        ]);

      if (sellerResult.error) {
        console.error("Market opportunities seller error:", sellerResult.error);
      }

      if (cropResult.error) {
        console.error("Market opportunities crop error:", cropResult.error);
      }

      if (livestockResult.error) {
        console.error(
          "Market opportunities livestock error:",
          livestockResult.error
        );
      }

      setSellerProducts((sellerResult.data ?? []) as Listing[]);
      setCropListings((cropResult.data ?? []) as Listing[]);
      setLivestockListings((livestockResult.data ?? []) as Listing[]);

      setLoading(false);
    }

    loadMarketData();
  }, []);

  const allListings = useMemo(
    () => [...sellerProducts, ...cropListings, ...livestockListings],
    [sellerProducts, cropListings, livestockListings]
  );

  const totalListings = allListings.length;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    sellerProducts.forEach((item) => {
      const category = item.category?.trim() || "Nyingine";
      counts[category] = (counts[category] || 0) + 1;
    });

    if (cropListings.length > 0) {
      counts["Mazao"] = (counts["Mazao"] || 0) + cropListings.length;
    }

    if (livestockListings.length > 0) {
      counts["Mifugo"] = (counts["Mifugo"] || 0) + livestockListings.length;
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [sellerProducts, cropListings, livestockListings]);

  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    allListings.forEach((item) => {
      const location = item.location?.trim();

      if (location) {
        counts[location] = (counts[location] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [allListings]);

  const latestListings = useMemo(
    () =>
      [...allListings]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        )
        .slice(0, 5),
    [allListings]
  );

  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-6 text-[#173B2A]">
      <div className="mx-auto w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="text-sm font-bold text-[#2F9E5B]"
        >
          ← Rudi Dashboard
        </button>

        <div className="mt-5 rounded-[2rem] bg-[#173B2A] p-6 text-white shadow-lg">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9BE7B2]">
            AGROFUTURE 2050
          </p>

          <h1 className="mt-2 text-2xl font-black">
            📈 Fursa za Soko
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#D7E8DC]">
            Angalia hali halisi ya soko na maeneo yenye shughuli nyingi.
          </p>
        </div>

        {loading ? (
          <div className="mt-5 rounded-3xl border border-[#DCE9DF] bg-white p-8 text-center">
            <div className="text-4xl">📊</div>
            <p className="mt-3 font-bold">
              Inapakia taarifa za soko...
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#DCE9DF] bg-white p-5">
                <p className="text-3xl">🛒</p>
                <p className="mt-3 text-2xl font-black">
                  {totalListings}
                </p>
                <p className="text-xs font-bold text-[#819188]">
                  Matangazo active
                </p>
              </div>

              <div className="rounded-2xl border border-[#DCE9DF] bg-white p-5">
                <p className="text-3xl">📍</p>
                <p className="mt-3 text-2xl font-black">
                  {locationCounts.length}
                </p>
                <p className="text-xs font-bold text-[#819188]">
                  Maeneo yenye bidhaa
                </p>
              </div>
            </div>

            <section className="mt-5 rounded-2xl border border-[#DCE9DF] bg-white p-5">
              <h2 className="font-black">🔥 Categories zenye shughuli</h2>

              {categoryCounts.length === 0 ? (
                <p className="mt-3 text-sm text-[#819188]">
                  Bado hakuna matangazo active.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {categoryCounts.slice(0, 6).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between rounded-xl bg-[#F6FAF7] px-4 py-3"
                    >
                      <span className="text-sm font-bold">
                        {category}
                      </span>

                      <span className="rounded-full bg-[#EAF7ED] px-3 py-1 text-xs font-black text-[#2F9E5B]">
                        {count} bidhaa
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-3 rounded-2xl border border-[#DCE9DF] bg-white p-5">
              <h2 className="font-black">📍 Maeneo yenye fursa</h2>

              {locationCounts.length === 0 ? (
                <p className="mt-3 text-sm text-[#819188]">
                  Hakuna eneo lililopatikana bado.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {locationCounts.map(([location, count]) => (
                    <div
                      key={location}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-bold">
                        {location}
                      </span>

                      <span className="text-xs font-black text-[#2F9E5B]">
                        {count} listings
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-3 rounded-2xl border border-[#DCE9DF] bg-white p-5">
              <h2 className="font-black">🆕 Matangazo mapya</h2>

              {latestListings.length === 0 ? (
                <p className="mt-3 text-sm text-[#819188]">
                  Bado hakuna matangazo mapya.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {latestListings.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-[#F6FAF7] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold">
                          {item.category || "Bidhaa ya soko"}
                        </span>

                        <span className="text-xs font-black text-[#2F9E5B]">
                          TSh {Number(item.price || 0).toLocaleString()}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-[#819188]">
                        📍 {item.location || "Eneo halijawekwa"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <button
              onClick={() => router.push("/dashboard/marketplace")}
              className="mt-5 w-full rounded-2xl bg-[#2F9E5B] py-4 text-sm font-black text-white"
            >
              🛒 Fungua AgroMarket
            </button>

            <button
              onClick={() => router.push("/dashboard/seller")}
              className="mt-3 w-full rounded-2xl border border-[#DCE9DF] bg-white py-4 text-sm font-black text-[#2F9E5B]"
            >
              🧰 Rudi Seller Center
            </button>
          </>
        )}
      </div>
    </main>
  );
}
