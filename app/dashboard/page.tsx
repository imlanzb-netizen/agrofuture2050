"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UpcomingReminders from "@/components/UpcomingReminders";
import { supabase } from "@/lib/supabase";

type Role =
  | "farmer"
  | "livestock"
  | "agriculture-officer"
  | "livestock-officer"
  | "buyer"
  | "seller";

export default function DashboardPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.push("/auth");
      return;
    }

    const userRole = (data.user.app_metadata?.role ?? data.user.user_metadata?.role) as Role | undefined;

    if (userRole) {
      setRole(userRole);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF5] text-[#173B2A]">
        <div className="text-center">
          <div className="text-4xl">🌱</div>
          <p className="mt-3 font-bold">
            Inapakia dashboard...
          </p>
        </div>
      </main>
    );
  }

  const isAgricultureOfficer = role === "agriculture-officer";
  const isLivestockOfficer = role === "livestock-officer";
  const isOfficer =
    isAgricultureOfficer || isLivestockOfficer;

  const isLivestock = role === "livestock";
  const isSeller = role === "seller";
  const isBuyer = role === "buyer";

  const title = isAgricultureOfficer
    ? "Afisa Kilimo 🌱"
    : isLivestockOfficer
      ? "Afisa Ufugaji 🐄"
      : isLivestock
        ? "Dashboard ya Mfugaji 🐄"
        : role === "buyer"
          ? "Dashboard ya Mnunuzi 🛒"
          : role === "seller"
            ? "Dashboard ya Muuzaji 🧰"
            : "Dashboard ya Mkulima 🌾";

  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#2F9E5B]">
              AGROFUTURE 2050
            </p>

            <h1 className="mt-1 text-xl font-black">
              {title}
            </h1>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF7ED] text-xl">
            {isAgricultureOfficer
              ? "🌱"
              : isLivestockOfficer || isLivestock
                ? "🐄"
                : role === "buyer"
                  ? "🛒"
                  : role === "seller"
                    ? "🧰"
                    : "🌾"}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md px-5 py-6">

        {/* INTRO */}
        <div className="rounded-3xl bg-[#EAF7ED] p-5">
          <p className="text-sm font-bold text-[#2F9E5B]">
            {isOfficer ? "Panel ya Afisa" : "Dashboard yako"}
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {isAgricultureOfficer
              ? "Huduma za Kilimo 🌱"
              : isLivestockOfficer
                ? "Huduma za Ufugaji 🐄"
                : isLivestock
                  ? "Ufugaji wako, fursa zako 🐄"
                  : "Kilimo chako, fursa zako 🌱"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#687B70]">
            {isAgricultureOfficer
              ? "Jibu maswali na shiriki maarifa ya kilimo kupitia makala."
              : isLivestockOfficer
                ? "Jibu maswali ya ufugaji na shiriki maarifa kupitia makala."
                : isLivestock
                  ? "Simamia mifugo yako, uza mifugo, pata ushauri na maarifa ya ufugaji."
                  : "Uza, nunua, uliza wataalamu na pata taarifa muhimu sehemu moja."}
          </p>
        </div>

        {/* OFFICER */}
        {isOfficer ? (
          <div className="mt-6 grid grid-cols-2 gap-3">

            <button
              onClick={() => router.push("/dashboard/officer")}
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">💬</span>
              <p className="mt-3 text-sm font-bold">
                Maswali
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Jibu maswali
              </p>
            </button>

            <button
              onClick={() =>
                router.push("/dashboard/officer/articles")
              }
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">✍️</span>
              <p className="mt-3 text-sm font-bold">
                Andika Makala
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Shiriki maarifa
              </p>
            </button>

            <button
              onClick={() => router.push("/dashboard/articles")}
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📚</span>
              <p className="mt-3 text-sm font-bold">
                Makala
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Soma makala
              </p>
            </button>

            <button
              onClick={() => router.push("/dashboard/ai")}
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">🤖</span>
              <p className="mt-3 text-sm font-bold">
                AI Assistant
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Msaidizi wa AI
              </p>
            </button>

            
            <button
              type="button"
              onClick={() => router.push("/dashboard/calendar")}
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📅</span>
              <p className="mt-3 text-sm font-bold">
                Kalenda
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Panga shughuli
              </p>
            </button>

          </div>

        ) : isBuyer ? (
          /* BUYER — MODERN SHOPPING DASHBOARD */
          <div className="mt-6 space-y-4">

            <button
              type="button"
              onClick={() => router.push("/dashboard/marketplace")}
              className="w-full overflow-hidden rounded-[2rem] bg-[#173B2A] p-6 text-left text-white shadow-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9BE7B2]">
                    AGROFUTURE 2050
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    AgroMarket 🌍
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#D7E8DC]">
                    Nunua mazao, mifugo na bidhaa bora kutoka kwa wakulima,
                    wafugaji na wauzaji.
                  </p>
                </div>

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                  🛒
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-[#2F9E5B] px-4 py-3 text-center text-sm font-black">
                Fungua AgroMarket →
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => router.push("/dashboard/marketplace")}
                className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left shadow-sm"
              >
                <span className="text-2xl">🔎</span>
                <p className="mt-3 text-sm font-black">Tafuta Bidhaa</p>
                <p className="mt-1 text-xs leading-5 text-[#819188]">
                  Tafuta unachohitaji sokoni
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard/marketplace")}
                className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left shadow-sm"
              >
                <span className="text-2xl">📍</span>
                <p className="mt-3 text-sm font-black">Nunua Karibu</p>
                <p className="mt-1 text-xs leading-5 text-[#819188]">
                  Angalia bidhaa kutoka kwa wauzaji
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard/marketplace")}
                className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left shadow-sm"
              >
                <span className="text-2xl">🧺</span>
                <p className="mt-3 text-sm font-black">Mazao Mapya</p>
                <p className="mt-1 text-xs leading-5 text-[#819188]">
                  Gundua bidhaa mpya sokoni
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard/marketplace")}
                className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left shadow-sm"
              >
                <span className="text-2xl">🐄</span>
                <p className="mt-3 text-sm font-black">Mifugo</p>
                <p className="mt-1 text-xs leading-5 text-[#819188]">
                  Tafuta mifugo inayouzwa
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard/ai")}
                className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left shadow-sm"
              >
                <span className="text-2xl">🤖</span>
                <p className="mt-3 text-sm font-black">AI Assistant</p>
                <p className="mt-1 text-xs leading-5 text-[#819188]">
                  Msaada wa kuchagua bidhaa
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard/buyer-plans")}
                className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left shadow-sm"
              >
                <span className="text-2xl">📋</span>
                <p className="mt-3 text-sm font-black">Mipango</p>
                <p className="mt-1 text-xs leading-5 text-[#819188]">
                  Fuatilia shughuli zako
                </p>
              </button>

            </div>
          </div>

        ) : isSeller ? (
          <div className="mt-6 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => router.push("/dashboard/seller")}
              className="col-span-2 rounded-[2rem] bg-[#173B2A] p-5 text-left text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9BE7B2]">
                    AGROFUTURE 2050
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    Seller Center 🧰
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                  🧰
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#D7E8DC]">
                Simamia matangazo yako, mazao na mifugo unayouza.
              </p>

              <div className="mt-4 rounded-xl bg-[#2F9E5B] px-4 py-3 text-center text-sm font-black">
                Fungua Seller Center →
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/my-listings")}
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📋</span>
              <p className="mt-3 text-sm font-bold">
                Matangazo Yangu
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Simamia matangazo yako
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/seller")}
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📦</span>
              <p className="mt-3 text-sm font-bold">
                Bidhaa Zangu
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Simamia bidhaa zako
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/business-summary")}
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📊</span>
              <p className="mt-3 text-sm font-bold">
                Muhtasari wa Biashara
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Angalia takwimu zako
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/market-opportunities")}
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📈</span>
              <p className="mt-3 text-sm font-bold">
                Fursa za Soko
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Tafuta fursa za biashara
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/marketplace")}
              className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">🛒</span>
              <p className="mt-3 text-sm font-bold">
                AgroMarket
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Angalia soko
              </p>
            </button>

          </div>

        ) : isLivestock ? (

          /* LIVESTOCK */
          <div className="mt-6 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => router.push("/dashboard/plans")}
              className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📋</span>
              <p className="mt-3 text-sm font-bold">
                Mipango yangu
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Panga shughuli, gharama na maendeleo
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/my-livestock")}
              className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">🐄</span>
              <p className="mt-3 text-sm font-black">
                Mifugo Yangu
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Simamia matangazo ya mifugo yako pekee
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/marketplace")}
              className="col-span-2 rounded-[2rem] bg-[#173B2A] p-5 text-left text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9BE7B2]">
                    AGROFUTURE 2050
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    AgroMarket 🌍
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                  🛒
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#D7E8DC]">
                Soko la kizazi kijacho kwa wakulima, wafugaji na wanunuzi.
              </p>

              <div className="mt-4 rounded-xl bg-[#2F9E5B] px-4 py-3 text-center text-sm font-black">
                🛒 Fungua AgroMarket →
              </div>
            </button>



            

            

            <button
              onClick={() => router.push("/dashboard/ask-officer")}
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">👨🏾‍🌾</span>
              <p className="mt-3 text-sm font-bold">
                Muulize Afisa
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Ushauri wa ufugaji
              </p>
            </button>

            <button
              onClick={() =>
                router.push("/dashboard/articles")
              }
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📚</span>
              <p className="mt-3 text-sm font-bold">
                Makala
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Maarifa ya ufugaji
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/alerts")}
              className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">🔔</span>
              <p className="mt-3 text-sm font-bold">
                Alerts
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Taarifa kutoka kwa Admin na Afisa
              </p>
            </button>

            <button
              onClick={() => router.push("/dashboard/ai")}
              className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">🤖</span>
              <p className="mt-3 text-sm font-bold">
                AI Assistant
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Msaidizi wa ufugaji
              </p>
            </button>

            
            <button
              type="button"
              onClick={() => router.push("/dashboard/calendar")}
              className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📅</span>
              <p className="mt-3 text-sm font-bold">
                Kalenda ya Ufugaji
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Panga ratiba na vikumbusho
              </p>
            </button>

          </div>

        ) : (

          /* FARMER / OTHER */
          <div className="mt-6 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => router.push("/dashboard/plans")}
              className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📋</span>
              <p className="mt-3 text-sm font-bold">
                Mipango yangu
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Panga shughuli, gharama na maendeleo
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/marketplace")}
              className="col-span-2 rounded-[2rem] bg-[#173B2A] p-5 text-left text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9BE7B2]">
                    AGROFUTURE 2050
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    AgroMarket 🌍
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                  🛒
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#D7E8DC]">
                Soko la kizazi kijacho kwa wakulima, wafugaji na wanunuzi.
              </p>

              <div className="mt-4 rounded-xl bg-[#2F9E5B] px-4 py-3 text-center text-sm font-black">
                🛒 Fungua AgroMarket →
              </div>
            </button>



            

            

            <button
              onClick={() => router.push("/dashboard/ask-officer")}
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">👨🏾‍🌾</span>
              <p className="mt-3 text-sm font-bold">
                Muulize Afisa
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Ask Officer
              </p>
            </button>

            <button
              onClick={() =>
                router.push("/dashboard/articles")
              }
              className="rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📚</span>
              <p className="mt-3 text-sm font-bold">
                Makala
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Articles
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/alerts")}
              className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">🔔</span>
              <p className="mt-3 text-sm font-bold">
                Alerts
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Taarifa kutoka kwa Admin na Afisa
              </p>
            </button>

            <button
              onClick={() => router.push("/dashboard/ai")}
              className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">🤖</span>
              <p className="mt-3 text-sm font-bold">
                AI Assistant
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Msaidizi wa AI
              </p>
            </button>

            
            <button
              type="button"
              onClick={() => router.push("/dashboard/calendar")}
              className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4 text-left"
            >
              <span className="text-2xl">📅</span>
              <p className="mt-3 text-sm font-bold">
                Kalenda ya Kilimo
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                Panga shughuli na vikumbusho
              </p>
            </button>

          </div>
        )}

        <UpcomingReminders />
      </section>
    </main>
  );
}
