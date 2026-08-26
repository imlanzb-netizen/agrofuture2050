"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LivestockDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState<any>(null);

  function getWhatsAppNumber(phone: string) {
    const digits = String(phone || "").replace(/\D/g, "");

    if (digits.startsWith("255")) {
      return digits;
    }

    if (digits.startsWith("0")) {
      return `255${digits.slice(1)}`;
    }

    return digits;
  }

  useEffect(() => {
    async function loadListing() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (!id) return;

      const { data, error } = await supabase
        .from("livestock_listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Livestock detail error:", error);
        setErrorMessage("Tangazo halijapatikana.");
      } else {
        setListing(data);
      }

      setLoading(false);
    }

    loadListing();
  }, [id]);

  
  async function handleDeleteListing() {
    if (!listing?.id) return;

    const confirmed = window.confirm(
      "Una uhakika unataka kufuta tangazo hili?"
    );

    if (!confirmed) return;

    setDeleting(true);
    setErrorMessage("");

    const { data: deletedRows, error } = await supabase
      .from("livestock_listings")
      .delete()
      .eq("id", listing.id)
      .select("id");

    if (error) {
      console.error("Livestock delete error:", error);
      setErrorMessage(`Tangazo halijafutwa: ${error.message}`);
      setDeleting(false);
      return;
    }

    if (!deletedRows || deletedRows.length === 0) {
      console.error("Livestock delete affected 0 rows.");
      setErrorMessage(
        "Tangazo halijafutwa. Huenda huna ruhusa ya kulifuta."
      );
      setDeleting(false);
      return;
    }

    router.push("/dashboard/livestock");
  }

const isOwner = Boolean(
    listing?.seller_id &&
    user?.id &&
    listing.seller_id === user.id
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAF5] px-5 py-10 text-[#173B2A]">
        <div className="mx-auto max-w-md text-center">
          <p className="text-sm font-bold text-[#718578]">
            Inapakia tangazo...
          </p>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-[#F8FAF5] px-5 py-10 text-[#173B2A]">
        <div className="mx-auto max-w-md text-center">
          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <div className="text-5xl">🐄</div>

            <h1 className="mt-4 text-xl font-black">
              Tangazo halijapatikana
            </h1>

            <p className="mt-2 text-sm text-[#718578]">
              {errorMessage || "Tangazo hili huenda limeondolewa."}
            </p>

            <button
          type="button"
          onClick={() => router.push("/dashboard/livestock")}
          className="mt-5 w-full rounded-2xl border border-[#DCE9DF] bg-white py-4 text-sm font-black text-[#2F9E5B]"
        >
          ← Matangazo yote
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={handleDeleteListing}
            disabled={deleting}
            className="mt-5 w-full rounded-2xl border border-red-200 bg-white py-4 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "⏳ Inafuta tangazo..." : "🗑️ Futa tangazo"}
          </button>
        )}
          </div>
        </div>
      </main>
    );
  }

  const whatsappNumber = getWhatsAppNumber(listing.phone);

  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-black text-[#2F9E5B]"
          >
            ← Rudi
          </button>

          <p className="text-xs font-black text-[#2F9E5B]">
            AGROFUTURE 2050
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-md px-5 py-5">
        <div className="overflow-hidden rounded-3xl border border-[#DCE9DF] bg-white shadow-sm">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.animal}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-[#EAF7ED] text-8xl">
              🐄
            </div>
          )}

          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-full bg-[#EAF7ED] px-3 py-1 text-xs font-black text-[#2F9E5B]">
                  ✓ Inapatikana
                </div>

                <h1 className="mt-3 text-2xl font-black">
                  {listing.animal}
                </h1>

                <p className="mt-1 text-sm text-[#718578]">
                  📍 {listing.location}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-black text-[#2F9E5B]">
                  TSh {Number(listing.price).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[#F8FAF5] p-3">
                <p className="text-[10px] font-bold uppercase text-[#819188]">
                  Idadi
                </p>
                <p className="mt-1 text-sm font-black">
                  {listing.quantity}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8FAF5] p-3">
                <p className="text-[10px] font-bold uppercase text-[#819188]">
                  Jinsia
                </p>
                <p className="mt-1 text-sm font-black">
                  {listing.gender}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8FAF5] p-3">
                <p className="text-[10px] font-bold uppercase text-[#819188]">
                  Umri
                </p>
                <p className="mt-1 text-sm font-black">
                  {listing.age}
                </p>
              </div>
            </div>

            {listing.description && (
              <div className="mt-5 rounded-2xl bg-[#F8FAF5] p-4">
                <p className="text-xs font-black uppercase text-[#819188]">
                  Maelezo
                </p>

                <p className="mt-2 text-sm leading-6 text-[#687B70]">
                  {listing.description}
                </p>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-[#DCE9DF] p-4">
              <p className="text-xs font-black uppercase text-[#819188]">
                Mawasiliano
              </p>

              <p className="mt-2 text-base font-black">
                📞 {listing.phone}
              </p>
            </div>

            <a
              href={`tel:${listing.phone}`}
              className="mt-5 block w-full rounded-2xl bg-[#2F9E5B] py-4 text-center text-sm font-black text-white"
            >
              📞 Wasiliana na muuzaji
            </a>

            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                `Habari, nimeona tangazo lako la ${listing.animal} kwenye AGROFUTURE 2050.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-full rounded-2xl bg-[#2F9E5B] py-4 text-center text-sm font-black text-white"
            >
              💬 Wasiliana na muuzaji WhatsApp
            </a>

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${listing.animal} - AGROFUTURE 2050`,
                    text: `Angalia tangazo la ${listing.animal} huko ${listing.location}.`,
                    url: window.location.href,
                  });
                } else {
                  alert(
                    "Unaweza kunakili link hii na kuituma kwa wengine."
                  );
                }
              }}
              className="mt-3 w-full rounded-2xl border border-[#DCE9DF] bg-white py-4 text-sm font-black text-[#2F9E5B]"
            >
              📤 Shiriki tangazo
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/livestock")}
          className="mt-5 w-full rounded-2xl border border-[#DCE9DF] bg-white py-4 text-sm font-black text-[#2F9E5B]"
        >
          {isOwner && (
            <button
              type="button"
              onClick={handleDeleteListing}
              disabled={deleting}
              className="mt-5 w-full rounded-2xl border border-red-200 bg-white py-4 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "⏳ Inafuta tangazo..." : "🗑️ Futa tangazo"}
            </button>
          )}

                    ← Matangazo yote
        </button>
      </section>
    </main>
  );
}
