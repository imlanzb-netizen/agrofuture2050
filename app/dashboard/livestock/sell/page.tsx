"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LivestockSellPage() {
  const router = useRouter();

  const [animal, setAnimal] = useState("");
  const [quantity, setQuantity] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isReady =
    animal &&
    quantity &&
    gender &&
    age &&
    price &&
    location &&
    phone;

async function handleSubmit() {
  if (!isReady || saving) return;

  setSaving(true);
  setMessage("");

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Tafadhali ingia kwenye akaunti kwanza.");
      return;
    }

    let imageUrl: string | null = null;

    // Upload picha kama imechaguliwa
    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("livestock-images")
        .upload(filePath, image, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        setMessage(`Picha haijawekwa: ${uploadError.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("livestock-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    // Weka tangazo kwenye database
    const { error } = await supabase
      .from("livestock_listings")
      .insert({
        seller_id: user.id,
        animal,
        quantity: Number(quantity),
        gender,
        age,
        price: Number(price),
        location,
        phone,
        description: description || null,
        image_url: imageUrl,
      });

    if (error) {
      console.error("Livestock insert error:", error);
      setMessage(`Tangazo halijawekwa: ${error.message}`);
      return;
    }

    setMessage("Tangazo lako limewekwa kikamilifu! 🐄");
      setTimeout(() => router.push("/dashboard/livestock"), 800);

    setAnimal("");
    setQuantity("");
    setGender("");
    setAge("");
    setPrice("");
    setLocation("");
    setPhone("");
    setDescription("");
    setImage(null);
  } finally {
    setSaving(false);
  }
}
  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-7 text-[#173B2A]">
      <div className="mx-auto w-full max-w-md">

        <button
          onClick={() => router.back()}
          className="text-sm font-bold text-[#2F9E5B]"
        >
          ← Rudi Dashboard
        </button>

        <div className="mt-7">
          <p className="text-sm font-bold text-[#2F9E5B]">
            🐄 AGROFUTURE 2050
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Uza Mifugo
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#718578]">
            Weka taarifa kamili za mifugo unayotaka kuuza.
          </p>
        </div>

        <div className="mt-8 space-y-5">

          <div>
            <label className="text-sm font-bold">
              Picha ya mnyama
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImage(e.target.files?.[0] || null)
              }
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4"
            />

            {image && (
              <p className="mt-2 text-xs text-[#718578]">
                Picha imechaguliwa: {image.name}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-bold">
              Aina ya mnyama
            </label>

            <select
              value={animal}
              onChange={(e) => setAnimal(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4"
            >
              <option value="">Chagua mnyama</option>
              <option value="Ng'ombe">🐄 Ng'ombe</option>
              <option value="Mbuzi">🐐 Mbuzi</option>
              <option value="Kondoo">🐑 Kondoo</option>
              <option value="Nguruwe">🐖 Nguruwe</option>
              <option value="Kuku">🐔 Kuku</option>
              <option value="Bata">🦆 Bata</option>
              <option value="Sungura">🐇 Sungura</option>
              <option value="Nyingine">Mnyama mwingine</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-bold">
              Idadi ya mifugo
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Mfano: 5"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Jinsia
            </label>

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4"
            >
              <option value="">Chagua jinsia</option>
              <option value="Madume">Madume</option>
              <option value="Majike">Majike</option>
              <option value="Mchanganyiko">
                Mchanganyiko
              </option>
            </select>
          </div>

          <div>
            <label className="text-sm font-bold">
              Umri
            </label>

            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Mfano: Miaka 2"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Bei kwa mnyama
            </label>

            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Mfano: 1500000"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4"
            />

            <p className="mt-1 text-xs text-[#819188]">
              Weka bei kwa TSh kwa mnyama mmoja.
            </p>
          </div>

          <div>
            <label className="text-sm font-bold">
              Eneo la mifugo
            </label>

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Mfano: Arusha, Monduli"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Namba ya simu
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mfano: 07XXXXXXXX"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Maelezo ya ziada
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mfano: Ng'ombe wenye afya, chanjo zipo..."
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4"
            />
          </div>

          {message && (
            <div className="rounded-2xl bg-white p-4 text-center text-sm font-bold">
              {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isReady || saving}
            className="w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg disabled:opacity-40"
          >
            {saving
              ? "Inaweka tangazo..."
              : "Weka Tangazo la Mifugo →"}
          </button>

        </div>
      </div>
    </main>
  );
}
