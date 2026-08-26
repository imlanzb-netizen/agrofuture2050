"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MarketplaceListingPage() {
  const params = useParams();
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [type, setType] = useState<"crop" | "livestock" | "seller-product" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListing() {
      const id = String(params.id);

      const [cropResult, livestockResult, sellerProductResult] =
        await Promise.all([
          supabase
            .from("crop_listings")
            .select("*")
            .eq("id", id)
            .eq("status", "active")
            .maybeSingle(),

          supabase
            .from("livestock_listings")
            .select("*")
            .eq("id", id)
            .eq("status", "active")
            .maybeSingle(),

          supabase
            .from("seller_products")
            .select("*")
            .eq("id", id)
            .eq("status", "active")
            .maybeSingle(),
        ]);

      if (cropResult.data) {
        setItem(cropResult.data);
        setType("crop");
      } else if (livestockResult.data) {
        setItem(livestockResult.data);
        setType("livestock");
      } else if (sellerProductResult.data) {
        setItem(sellerProductResult.data);
        setType("seller-product");
      }

      setLoading(false);
    }

    loadListing();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6FAF7] p-6 text-[#173B2A]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-bold">Inapakia tangazo...</p>
        </div>
      </main>
    );
  }

  if (!item || !type) {
    return (
      <main className="min-h-screen bg-[#F6FAF7] p-6 text-[#173B2A]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-4xl">🔎</p>
          <h1 className="mt-3 text-xl font-black">
            Tangazo halipatikani
          </h1>

          <button
            onClick={() => router.push("/dashboard/marketplace")}
            className="mt-5 rounded-2xl bg-[#2F9E5B] px-5 py-3 font-bold text-white"
          >
            ← Rudi AgroMarket
          </button>
        </div>
      </main>
    );
  }

  const title =
    type === "crop"
      ? item.product || "Zao"
      : type === "livestock"
        ? item.animal || "Mnyama"
        : item.name || "Bidhaa";

  const category =
    type === "crop"
      ? "Mazao"
      : type === "livestock"
        ? "Mifugo"
        : item.category || "Nyingine";

  const phone = String(item.phone || "").trim();

  const whatsappNumber = phone.replace(/\D/g, "");

  return (
    <main className="min-h-screen bg-[#F6FAF7] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <button
            onClick={() => router.back()}
            className="text-sm font-bold text-[#2F9E5B]"
          >
            ← Rudi AgroMarket
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-5 py-6">
        <div className="overflow-hidden rounded-3xl border border-[#DCE9DF] bg-white shadow-sm">
          <div className="h-64 overflow-hidden bg-[#EAF7ED]">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">
                {type === "crop" ? "🌾" : "🐄"}
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#2F9E5B]">
                  {category}
                </p>

                <h1 className="mt-1 text-2xl font-black">
                  {title}
                </h1>
              </div>

              <span className="rounded-full bg-[#EAF7ED] px-3 py-1 text-xs font-black text-[#2F9E5B]">
                {type === "crop"
                  ? "🌾 Mkulima"
                  : type === "livestock"
                    ? "🐄 Mfugaji"
                    : "🧰 Muuzaji"}
              </span>
            </div>

            <p className="mt-5 text-2xl font-black">
              TSh {Number(item.price || 0).toLocaleString()}
            </p>

            <div className="mt-5 space-y-3 border-t border-[#EEF3EF] pt-5">
              <p className="text-sm">
                <span className="font-black">📦 Kiasi:</span>{" "}
                {item.quantity || "-"}
              </p>

              <p className="text-sm">
                <span className="font-black">📍 Eneo:</span>{" "}
                {item.location || "-"}
              </p>

              {item.gender && (
                <p className="text-sm">
                  <span className="font-black">⚥ Jinsia:</span>{" "}
                  {item.gender}
                </p>
              )}

              {item.age && (
                <p className="text-sm">
                  <span className="font-black">🎂 Umri:</span>{" "}
                  {item.age}
                </p>
              )}
            </div>

            {item.description && (
              <div className="mt-5 rounded-2xl bg-[#F6FAF7] p-4">
                <p className="text-xs font-black text-[#718578]">
                  MAELEZO
                </p>

                <p className="mt-2 text-sm leading-6">
                  {item.description}
                </p>
              </div>
            )}

            {phone && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <a
                  href={`tel:${phone}`}
                  className="rounded-2xl border border-[#DCE9DF] py-4 text-center text-sm font-black text-[#2F9E5B]"
                >
                  📞 Piga simu
                </a>

                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-[#2F9E5B] py-4 text-center text-sm font-black text-white"
                >
                  💬 WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
