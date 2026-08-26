"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Category =
  | "Yote"
  | "Mazao"
  | "Mifugo"
  | "Pembejeo"
  | "Vifaa";

type Listing = {
  id: string;
  title: string;
  category: Category;
  location: string;
  price: string;
  unit: string;
  icon: string;
  seller: string;
  verified: boolean;
};

const categories: { name: Category; icon: string }[] = [
  { name: "Yote", icon: "🌍" },
  { name: "Mazao", icon: "🌾" },
  { name: "Mifugo", icon: "🐄" },
  { name: "Pembejeo", icon: "🌱" },
  { name: "Vifaa", icon: "🚜" },
];

function formatPrice(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Bei haijawekwa";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `TSh ${number.toLocaleString("en-TZ")}`;
}

export default function BuyPage() {
  const router = useRouter();

  const [category, setCategory] = useState<Category>("Yote");
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadMarket() {
      setLoadingListings(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("livestock_listings")
        .select("*")
        .limit(50);

      if (error) {
        console.error("BUYER MARKET LOAD ERROR:", error);
        setLoadError("Imeshindikana kupakia bidhaa kwa sasa.");
        setListings([]);
        setLoadingListings(false);
        return;
      }

      const mapped: Listing[] = (data ?? []).map((item: any) => ({
        id: String(item.id),
        title:
          item.title ??
          item.name ??
          item.animal_name ??
          "Bidhaa ya mifugo",
        category: "Mifugo",
        location:
          item.location ??
          item.region ??
          item.district ??
          "Tanzania",
        price: formatPrice(item.price),
        unit: item.unit ?? "mnyama",
        icon: "🐄",
        seller:
          item.seller_name ??
          item.seller ??
          "Muuzaji wa AgroMarket",
        verified: Boolean(
          item.verified ??
          item.is_verified ??
          false
        ),
      }));

      setListings(mapped);
      setLoadingListings(false);
    }

    loadMarket();
  }, []);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings.filter((item) => {
      const matchesCategory =
        category === "Yote" ||
        item.category === category;

      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.seller.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, search, listings]);

  return (
    <main className="min-h-screen bg-[#F5FAF6] text-[#123524]">
      <header className="sticky top-0 z-30 border-b border-[#DCE9DF] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-black text-[#278B50]"
          >
            ← Rudi
          </button>

          <div className="mt-5">
            <p className="text-xs font-black tracking-[0.22em] text-[#278B50]">
              AGROFUTURE 2050
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#173B2A] text-2xl">
                🌍
              </div>

              <div>
                <h1 className="text-3xl font-black">
                  AgroMarket
                </h1>

                <p className="text-xs font-bold text-[#718578]">
                  Mnunuzi wa Tanzania ya 2050
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#718578]">
              Tafuta mazao, mifugo na bidhaa za kilimo
              zinazopatikana karibu yako.
            </p>
          </div>

          <div className="mt-5 flex items-center rounded-2xl border border-[#DCE9DF] bg-[#F8FBF8] px-4">
            <span className="text-lg">🔎</span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tafuta bidhaa, mifugo au eneo..."
              className="w-full bg-transparent px-3 py-4 text-sm outline-none"
            />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-6">
        <div className="overflow-hidden rounded-[2rem] bg-[#173B2A] p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-widest text-[#BDE8CA]">
                BUYER 2050
              </p>

              <h2 className="mt-2 text-2xl font-black leading-tight">
                Nunua kwa akili.
                <br />
                Nunua karibu.
              </h2>
            </div>

            <div className="rounded-2xl bg-white/10 px-3 py-2 text-2xl">
              🇹🇿
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#D7E9DC]">
            AgroMarket inakusaidia kugundua bidhaa za kilimo
            na mifugo kutoka maeneo mbalimbali ya Tanzania.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xl">📍</p>
              <p className="mt-2 text-[11px] font-black">
                Karibu
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xl">🛡️</p>
              <p className="mt-2 text-[11px] font-black">
                Verified
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xl">🚚</p>
              <p className="mt-2 text-[11px] font-black">
                Delivery
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black tracking-widest text-[#278B50]">
                MARKET
              </p>

              <h2 className="mt-1 text-xl font-black">
                Tafuta unachohitaji
              </h2>
            </div>

            <span className="rounded-full bg-[#E8F5EC] px-3 py-1 text-xs font-black text-[#278B50]">
              {filteredListings.length}
            </span>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setCategory(item.name)}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-black transition ${
                  category === item.name
                    ? "bg-[#278B50] text-white shadow-sm"
                    : "border border-[#DCE9DF] bg-white text-[#52665A]"
                }`}
              >
                {item.icon} {item.name}
              </button>
            ))}
          </div>

          {loadingListings ? (
            <div className="mt-5 rounded-[2rem] border border-[#DCE9DF] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-3xl bg-[#E8F6EC] text-3xl">
                🌾
              </div>

              <h3 className="mt-4 font-black">
                Tunatafuta bidhaa...
              </h3>

              <p className="mt-2 text-sm text-[#718578]">
                Tunakagua AgroMarket kwa ajili yako.
              </p>
            </div>
          ) : loadError ? (
            <div className="mt-5 rounded-[2rem] border border-[#F0D6D6] bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">⚠️</div>

              <h3 className="mt-3 font-black">
                Soko halijapatikana
              </h3>

              <p className="mt-2 text-sm text-[#718578]">
                {loadError}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-2xl bg-[#278B50] px-5 py-3 text-sm font-black text-white"
              >
                Jaribu tena
              </button>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="mt-5 rounded-[2rem] border border-dashed border-[#C9D9CE] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#E8F6EC] text-4xl">
                🌱
              </div>

              <h3 className="mt-5 text-lg font-black">
                Bado hakuna bidhaa hapa
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#718578]">
                Hakuna matangazo yanayolingana na utafutaji wako
                kwa sasa. Bidhaa mpya zitaonekana hapa
                zinapowekwa na wauzaji.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("Yote");
                }}
                className="mt-5 rounded-2xl border border-[#DCE9DF] bg-white px-5 py-3 text-sm font-black text-[#278B50]"
              >
                Angalia soko lote
              </button>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {filteredListings.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[2rem] border border-[#DCE9DF] bg-white shadow-sm"
                >
                  <div className="flex h-40 items-center justify-center bg-[#E8F6EC] text-7xl">
                    {item.icon}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-[#278B50]">
                          {item.category}
                        </p>

                        <h3 className="mt-1 font-black">
                          {item.title}
                        </h3>
                      </div>

                      {item.verified && (
                        <span className="rounded-full bg-[#E8F6EC] px-2 py-1 text-[10px] font-black text-[#278B50]">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-xl font-black">
                      {item.price}
                    </p>

                    <p className="mt-1 text-xs text-[#819188]">
                      kwa {item.unit}
                    </p>

                    <div className="mt-4 border-t border-[#EEF3EF] pt-4">
                      <p className="text-sm font-black">
                        {item.seller}
                      </p>

                      <p className="mt-1 text-xs text-[#819188]">
                        📍 {item.location}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          `${item.title}\n${item.price}\n${item.location}`
                        )
                      }
                      className="mt-4 w-full rounded-2xl bg-[#278B50] py-3.5 text-sm font-black text-white"
                    >
                      Angalia bidhaa →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="mt-7 rounded-[2rem] border border-[#DCE9DF] bg-white p-5 shadow-sm">
          <p className="text-xs font-black tracking-widest text-[#278B50]">
            TANZANIA 2050
          </p>

          <h2 className="mt-2 text-lg font-black">
            Soko lenye akili kwa mnunuzi
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#718578]">
            Lengo ni kufanya ununuzi wa mazao na mifugo uwe
            rahisi, wa uwazi na unaounganisha mnunuzi na
            muuzaji kutoka eneo linalofaa.
          </p>
        </div>
      </section>
    </main>
  );
}
