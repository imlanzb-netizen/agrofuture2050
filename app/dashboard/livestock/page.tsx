"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LivestockDashboardPage() {
  const router = useRouter();

const [listings, setListings] = useState<any[]>([]);
const [loadingListings, setLoadingListings] = useState(true);
const [searchTerm, setSearchTerm] = useState("");
const [animalFilter, setAnimalFilter] = useState("");
const [locationFilter, setLocationFilter] = useState("");
const [maxPrice, setMaxPrice] = useState("");
const [listingDebug, setListingDebug] = useState("");
useEffect(() => {
  async function loadListings() {
    const { data, error } = await supabase
      .from("livestock_listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Livestock listings error:", error);
      setListings([]);
      setListingDebug(`ERROR: ${error.message}`);
    } else {
      console.log("LIVESTOCK DATA:", data);
      setListings(data || []);
      setListingDebug(
        `Supabase imerudisha: ${data?.length || 0} matangazo`
      );
    }

    setLoadingListings(false);
  }

  loadListings();
}, []);
const filteredListings = listings.filter((listing) => {
  const matchesSearch =
    !searchTerm ||
    listing.animal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.description?.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesAnimal =
    !animalFilter || listing.animal === animalFilter;

  const matchesLocation =
    !locationFilter ||
    listing.location?.toLowerCase().includes(locationFilter.toLowerCase());

  const matchesPrice =
    !maxPrice || Number(listing.price) <= Number(maxPrice);

  return (
    matchesSearch &&
    matchesAnimal &&
    matchesLocation &&
    matchesPrice
  );
});
  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-bold text-[#2F9E5B]">
            AGROFUTURE 2050
          </p>

          <h1 className="mt-1 text-2xl font-black">
            Dashboard ya Mfugaji 🐄
          </h1>

          <p className="mt-2 text-sm text-[#718578]">
            Ufugaji wako, fursa zako.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-md px-5 py-6">
        <div className="mb-5 rounded-[2rem] bg-[#173B2A] p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9BE7B2]">
                AGROFUTURE 2050
              </p>
              <h2 className="mt-2 text-2xl font-black">
                AgroMarket 🌍
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
              🛒
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-[#D7E8DC]">
            Soko la kizazi kijacho kwa wakulima, wafugaji na wanunuzi.
          </p>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/buy")}
              className="flex-1 rounded-xl bg-[#2F9E5B] px-3 py-3 text-sm font-black text-white"
            >
              🛒 Nunua
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/livestock/sell")}
              className="flex-1 rounded-xl bg-white px-3 py-3 text-sm font-black text-[#173B2A]"
            >
              🏪 Uza
            </button>
          </div>
        </div>

        <div className="mb-5">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔎 Tafuta mifugo au bidhaa..."
            className="w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 text-sm outline-none focus:border-[#2F9E5B]"
          />
        </div>

        <div className="rounded-3xl bg-[#EAF7ED] p-5">
          <p className="text-sm font-bold text-[#2F9E5B]">
            🐄 Kituo cha Ufugaji
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Simamia fursa zako za ufugaji
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#687B70]">
            Uza mifugo, pata huduma za ufugaji, uliza wataalamu na soma
            taarifa muhimu sehemu moja.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/dashboard/ask-officer")}
            className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
          >
            <span className="text-2xl">👨🏾‍🌾</span>
            <p className="mt-3 text-sm font-bold">Muulize Afisa</p>
            <p className="mt-1 text-xs text-[#819188]">
              Ushauri wa ufugaji
            </p>
          </button>

          <button
            onClick={() => router.push("/dashboard/articles")}
            className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
          >
            <span className="text-2xl">📚</span>
            <p className="mt-3 text-sm font-bold">Makala</p>
            <p className="mt-1 text-xs text-[#819188]">
              Maarifa ya ufugaji
            </p>
          </button>

          <button
            onClick={() => router.push("/dashboard/ai")}
            className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
          >
            <span className="text-2xl">🤖</span>
            <p className="mt-3 text-sm font-bold">AI Assistant</p>
            <p className="mt-1 text-xs text-[#819188]">
              Msaidizi wa ufugaji
            </p>
          </button>
        </div>

          <div className="mt-8">
            <h2 className="text-xl font-black">
              📢 Matangazo ya Mifugo
            </h2>

            <p className="mt-2 text-xs text-[#718578]">
              {listingDebug}
            </p>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔎 Tafuta mifugo..."
                    className="w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-3.5 pr-10 text-sm shadow-sm outline-none focus:border-[#2F9E5B]"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-[#718578]"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={animalFilter}
                    onChange={(e) => setAnimalFilter(e.target.value)}
                    className="rounded-2xl border border-[#DCE9DF] bg-white px-3 py-3 text-sm shadow-sm outline-none focus:border-[#2F9E5B]"
                  >
                    <option value="">🐄 Mifugo yote</option>
                    <option value="Ng'ombe">Ng'ombe</option>
                    <option value="Mbuzi">Mbuzi</option>
                    <option value="Kondoo">Kondoo</option>
                    <option value="Kuku">Kuku</option>
                    <option value="Nguruwe">Nguruwe</option>
                  </select>

                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="📍 Eneo"
                    className="rounded-2xl border border-[#DCE9DF] bg-white px-3 py-3 text-sm shadow-sm outline-none focus:border-[#2F9E5B]"
                  />
                </div>

                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="💰 Bei ya juu (TSh)"
                  className="w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-[#2F9E5B]"
                />

                <div className="flex items-center justify-between rounded-2xl bg-[#EAF7ED] px-4 py-3">
                  <p className="text-sm font-bold">
                    {filteredListings.length} matangazo
                  </p>

                  {(searchTerm || animalFilter || locationFilter || maxPrice) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setAnimalFilter("");
                        setLocationFilter("");
                        setMaxPrice("");
                      }}
                      className="text-xs font-black text-[#2F9E5B]"
                    >
                      Futa filters
                    </button>
                  )}
                </div>
              </div>
            {loadingListings && (
              <p className="mt-3 text-sm text-[#718578]">
                Inapakia matangazo...
              </p>
            )}

              {!loadingListings && filteredListings.length === 0 && (
                <div className="mt-3 rounded-2xl bg-white p-5 text-sm text-[#718578]">
                  Hakuna matangazo ya mifugo kwa sasa.
                </div>
              )}

          <div className="mt-4 space-y-4">
{filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="group overflow-hidden rounded-3xl border border-[#DCE9DF] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.animal}
                      className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                      <div className="flex h-56 w-full items-center justify-center bg-[#EAF7ED]">
                        <span className="text-7xl">
                          {listing.animal === "Ng'ombe"
                            ? "🐄"
                            : listing.animal === "Mbuzi"
                            ? "🐐"
                            : listing.animal === "Kondoo"
                            ? "🐑"
                            : listing.animal === "Nguruwe"
                            ? "🐖"
                            : listing.animal === "Kuku"
                            ? "🐔"
                            : listing.animal === "Bata"
                            ? "🦆"
                            : listing.animal === "Sungura"
                            ? "🐇"
                            : "🐾"}
                        </span>
                      </div>
                  )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="inline-flex rounded-full bg-[#EAF7ED] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#2F9E5B]">
                        ✓ Inapatikana
                      </div>

                      <h3 className="mt-2 text-xl font-black">
                        {listing.animal}
                      </h3>

                      <p className="mt-1 truncate text-sm text-[#718578]">
                        📍 {listing.location}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-black text-[#2F9E5B]">
                        TSh {Number(listing.price).toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold text-[#819188]">
                        kwa mnyama
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
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
                      <p className="mt-1 truncate text-sm font-black">
                        {listing.gender}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F8FAF5] p-3">
                      <p className="text-[10px] font-bold uppercase text-[#819188]">
                        Umri
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {listing.age}
                      </p>
                    </div>
                  </div>

                  {listing.description && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#687B70]">
                      {listing.description}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/dashboard/livestock/${listing.id}`)
                    }
                    className="mt-5 w-full rounded-2xl bg-[#2F9E5B] py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-[#258A4D] active:scale-[0.99]"
                  >
                    Angalia tangazo →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 w-full rounded-2xl border border-[#DCE9DF] bg-white py-4 text-sm font-bold text-[#2F9E5B]"
        >
          ← Dashboard kuu
        </button>
      </section>
    </main>
  );
}
