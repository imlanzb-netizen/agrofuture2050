"use client";

import { useState } from "react";

export default function ProductPage() {
  const [quantity, setQuantity] = useState(1);

  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-7 text-[#173B2A]">
      <div className="mx-auto w-full max-w-md">

        <button
          onClick={() => window.history.back()}
          className="text-sm font-bold text-[#2F9E5B]"
        >
          ← Rudi Bidhaa
        </button>

        <div className="mt-8 flex h-40 items-center justify-center rounded-3xl bg-[#EAF7ED] text-7xl">
          🐄
        </div>

        <div className="mt-6">
          <p className="text-sm font-bold text-[#2F9E5B]">
            Chakula cha Mifugo
          </p>

          <h1 className="mt-2 text-3xl font-black">
            TSh 35,000
          </h1>

          <p className="mt-1 text-sm text-[#819188]">
            kwa mfuko
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-[#DCE9DF] bg-white p-4">
          <p className="text-sm font-bold">
            Muuzaji
          </p>

          <p className="mt-1 text-sm text-[#718578]">
            Livestock Care
          </p>
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold">
            Kiasi
          </p>

          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() =>
                setQuantity(Math.max(1, quantity - 1))
              }
              className="h-12 w-12 rounded-xl border border-[#DCE9DF] bg-white text-xl font-bold"
            >
              −
            </button>

            <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-white font-bold">
              {quantity}
            </div>

            <button
              onClick={() => setQuantity(quantity + 1)}
              className="h-12 w-12 rounded-xl border border-[#DCE9DF] bg-white text-xl font-bold"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={() =>
            alert(`Oda ya ${quantity} imeandaliwa.`)
          }
          className="mt-7 w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg"
        >
          Weka Oda →
        </button>
      </div>
    </main>
  );
}
