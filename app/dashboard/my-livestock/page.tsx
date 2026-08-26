"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LivestockListing = {
  id: string;
  animal: string;
  quantity: number;
  gender?: string | null;
  age?: string | null;
  price: number;
  location?: string | null;
  phone?: string | null;
  description?: string | null;
  image_url?: string | null;
};

export default function MyLivestockPage() {
  const router = useRouter();

  const [listings, setListings] = useState<LivestockListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadListings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("livestock_listings")
        .select(
          "id, animal, quantity, gender, age, price, location, phone, description, image_url"
        )
        .eq("seller_id", user.id)
        .order("id", { ascending: false });

      if (error) {
        console.error("My livestock listings error:", error);
        setMessage(`Imeshindikana kupakia matangazo: ${error.message}`);
      } else {
        setListings((data ?? []) as LivestockListing[]);
      }

      setLoading(false);
    }

    loadListings();
  }, [router]);

  async function deleteListing(listing: LivestockListing) {
    if (
      !window.confirm(
        `Una uhakika unataka kufuta tangazo la ${listing.animal}?`
      )
    ) {
      return;
    }

    setDeleting(listing.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    const { error } = await supabase
      .from("livestock_listings")
      .delete()
      .eq("id", listing.id)
      .eq("seller_id", user.id);

    if (error) {
      console.error("Delete livestock listing error:", error);
      setMessage(`Tangazo halijafutwa: ${error.message}`);
      setDeleting(null);
      return;
    }

    setListings((current) =>
      current.filter((item) => item.id !== listing.id)
    );

    setMessage("Tangazo la mifugo limefutwa kikamilifu.");
    setDeleting(null);
  }

  return (
    <main className="min-h-screen bg-[#F6FAF7] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-5">
          <button
            onClick={() => router.back()}
            className="text-sm font-bold text-[#2F9E5B]"
          >
            ← Rudi
          </button>

          <p className="mt-5 text-sm font-black text-[#2F9E5B]">
            🐄 MFUGAJI
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Mifugo Yangu
          </h1>

          <p className="mt-2 text-sm text-[#718578]">
            Hapa ni matangazo ya mifugo yako pekee.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-6">
        {message && (
          <div className="mb-4 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-sm font-bold">
            {message}
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-[#DCE9DF] bg-white p-8 text-center">
            Inapakia mifugo yako...
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#C9D9CE] bg-white p-8 text-center">
            <div className="text-5xl">🐄</div>

            <h2 className="mt-4 text-xl font-black">
              Bado huna matangazo ya mifugo
            </h2>

            <p className="mt-2 text-sm text-[#718578]">
              Mifugo utakayoweka kwa ajili ya kuuza itaonekana hapa.
            </p>

            <button
              onClick={() => router.push("/dashboard/livestock/sell")}
              className="mt-5 rounded-2xl bg-[#2F9E5B] px-5 py-3 text-sm font-black text-white"
            >
              🐄 Uza Mifugo
            </button>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="overflow-hidden rounded-3xl border border-[#DCE9DF] bg-white shadow-sm"
              >
                <div className="h-44 overflow-hidden bg-[#EAF7ED]">
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.animal}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">
                      🐄
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs font-bold text-[#2F9E5B]">
                    🐄 Mifugo
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    {listing.animal}
                  </h2>

                  <p className="mt-3 text-lg font-black">
                    TSh {Number(listing.price || 0).toLocaleString()}
                  </p>

                  <div className="mt-3 space-y-1 text-sm text-[#718578]">
                    <p>📦 Idadi: {listing.quantity}</p>
                    {listing.gender && <p>⚥ Jinsia: {listing.gender}</p>}
                    {listing.age && <p>🎂 Umri: {listing.age}</p>}
                    {listing.location && (
                      <p className="font-bold text-[#173B2A]">
                        📍 {listing.location}
                      </p>
                    )}
                  </div>

                  {listing.description && (
                    <p className="mt-3 text-xs leading-5 text-[#718578]">
                      {listing.description}
                    </p>
                  )}

                  <button
                    onClick={() => deleteListing(listing)}
                    disabled={deleting === listing.id}
                    className="mt-5 w-full rounded-2xl bg-red-600 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    {deleting === listing.id
                      ? "Inafuta..."
                      : "🗑️ Futa Tangazo"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
