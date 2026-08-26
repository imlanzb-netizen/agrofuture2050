"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SellerProduct = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: string;
  created_at: string;
};

type Listing = {
  id: string;
  title: string;
  price: number;
  quantity: string;
  status: string;
  created_at: string;
  kind: "product" | "crop" | "livestock";
};

export default function BusinessSummaryPage() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusiness() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const [sellerResult, cropResult, livestockResult] =
        await Promise.all([
          supabase
            .from("seller_products")
            .select("id, name, price, quantity, status, created_at")
            .eq("seller_id", user.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("crop_listings")
            .select("id, product, price, quantity, status, created_at")
            .eq("seller_id", user.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("livestock_listings")
            .select("id, animal, price, quantity, status, created_at")
            .eq("seller_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

      if (sellerResult.error) {
        console.error("Seller products error:", sellerResult.error);
      }

      if (cropResult.error) {
        console.error("Seller crops error:", cropResult.error);
      }

      if (livestockResult.error) {
        console.error(
          "Seller livestock error:",
          livestockResult.error
        );
      }

      const sellerProducts: Listing[] = (sellerResult.data ?? []).map(
        (item: SellerProduct) => ({
          id: item.id,
          title: item.name,
          price: Number(item.price || 0),
          quantity: String(item.quantity || 0),
          status: item.status,
          created_at: item.created_at,
          kind: "product",
        })
      );

      const crops: Listing[] = (cropResult.data ?? []).map(
        (item: any) => ({
          id: item.id,
          title: item.product || "Zao",
          price: Number(item.price || 0),
          quantity: String(item.quantity || "-"),
          status: item.status,
          created_at: item.created_at,
          kind: "crop",
        })
      );

      const livestock: Listing[] = (
        livestockResult.data ?? []
      ).map((item: any) => ({
        id: item.id,
        title: item.animal || "Mnyama",
        price: Number(item.price || 0),
        quantity: String(item.quantity || "-"),
        status: item.status,
        created_at: item.created_at,
        kind: "livestock",
      }));

      setListings(
        [...sellerProducts, ...crops, ...livestock].sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        )
      );

      setLoading(false);
    }

    loadBusiness();
  }, [router]);

  const activeListings = useMemo(
    () => listings.filter((item) => item.status === "active"),
    [listings]
  );

  const productListings = useMemo(
    () => listings.filter((item) => item.kind === "product"),
    [listings]
  );

  const cropListings = useMemo(
    () => listings.filter((item) => item.kind === "crop"),
    [listings]
  );

  const livestockListings = useMemo(
    () => listings.filter((item) => item.kind === "livestock"),
    [listings]
  );

  const estimatedValue = useMemo(
    () =>
      activeListings.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number.parseFloat(item.quantity || "0"),
        0
      ),
    [activeListings]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF5] text-[#173B2A]">
        <p className="font-bold">
          Inapakia muhtasari wa biashara...
        </p>
      </main>
    );
  }

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
            📊 Muhtasari wa Biashara
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#D7E8DC]">
            Muhtasari wa matangazo, bidhaa na thamani ya biashara yako.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-5">
            <p className="text-3xl">📋</p>
            <p className="mt-3 text-2xl font-black">
              {listings.length}
            </p>
            <p className="text-xs font-bold text-[#819188]">
              Matangazo yote
            </p>
          </div>

          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-5">
            <p className="text-3xl">🟢</p>
            <p className="mt-3 text-2xl font-black">
              {activeListings.length}
            </p>
            <p className="text-xs font-bold text-[#819188]">
              Active
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[#DCE9DF] bg-white p-5">
          <p className="text-sm font-black">
            💰 Thamani ya bidhaa active
          </p>

          <p className="mt-2 text-2xl font-black">
            TSh {estimatedValue.toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-[#819188]">
            Makadirio ya bei × kiasi kilichowekwa.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-center">
            <p className="text-2xl">🧰</p>
            <p className="mt-2 text-xl font-black">
              {productListings.length}
            </p>
            <p className="text-[10px] font-bold text-[#819188]">
              Bidhaa
            </p>
          </div>

          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-center">
            <p className="text-2xl">🌾</p>
            <p className="mt-2 text-xl font-black">
              {cropListings.length}
            </p>
            <p className="text-[10px] font-bold text-[#819188]">
              Mazao
            </p>
          </div>

          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-center">
            <p className="text-2xl">🐄</p>
            <p className="mt-2 text-xl font-black">
              {livestockListings.length}
            </p>
            <p className="text-[10px] font-bold text-[#819188]">
              Mifugo
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#DCE9DF] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black">
              🕒 Matangazo ya karibuni
            </h2>

            <button
              onClick={() => router.push("/dashboard/my-listings")}
              className="text-xs font-black text-[#2F9E5B]"
            >
              Yote →
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {listings.slice(0, 5).map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-[#F6FAF7] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {item.kind === "crop"
                      ? "🌾"
                      : item.kind === "livestock"
                        ? "🐄"
                        : "🧰"}{" "}
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs text-[#819188]">
                    {item.quantity}
                  </p>
                </div>

                <span className="shrink-0 text-xs font-black text-[#2F9E5B]">
                  {item.status}
                </span>
              </div>
            ))}

            {listings.length === 0 && (
              <p className="py-5 text-center text-sm text-[#819188]">
                Bado hujaweka tangazo.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/seller")}
          className="mt-5 w-full rounded-2xl bg-[#2F9E5B] py-4 text-sm font-black text-white"
        >
          📦 Simamia Bidhaa Zangu
        </button>
      </div>
    </main>
  );
}
