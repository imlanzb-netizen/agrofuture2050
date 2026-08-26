"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SellPage() {
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isReady =
    product && quantity && price && location && phone;

  async function handleSubmit() {
    if (!isReady || saving) return;

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Tafadhali ingia kwenye akaunti kwanza.");
      setMessage("Tafadhali ingia kwenye akaunti kwanza.");
      setSaving(false);
      return;
    }

    let imageUrl: string | null = null;

    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("crop-images")
        .upload(filePath, image, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Crop image upload error:", uploadError);
        setMessage(`Picha haijawekwa: ${uploadError.message}`);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("crop-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from("crop_listings")
      .insert({
        seller_id: user.id,
        product,
        quantity,
        price: Number(
          price.replace(/[^0-9.]/g, "")
        ),
        location,
        phone,
        description: description || null,
        image_url: imageUrl,
      });

    if (error) {
      console.error("Crop insert error:", error);
      setMessage(`Tangazo halijawekwa: ${error.message}`);
      setSaving(false);
      return;
    }

    setMessage("Tangazo lako limewekwa kikamilifu! 🌾");
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-7 text-[#173B2A]">
      <div className="mx-auto w-full max-w-md">
        <button
          onClick={() => window.history.back()}
          className="text-sm font-bold text-[#2F9E5B]"
        >
          ← Rudi Dashboard
        </button>

        <div className="mt-7">
          <p className="text-sm font-bold text-[#2F9E5B]">
            🌾 AGROFUTURE 2050
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Uza Mazao
          </h1>

          <p className="mt-2 text-sm text-[#718578]">
            Weka taarifa za zao unalotaka kuuza.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-bold">
              Jina la zao
            </label>

            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Mfano: Mahindi"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Kiasi
            </label>

            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Mfano: 100 kg"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Bei
            </label>

            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Mfano: 1,500 kwa kg"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Eneo
            </label>

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Mfano: Morogoro"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Namba ya simu / WhatsApp
            </label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="Mfano: 0712345678"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Maelezo ya zao
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mfano: Mahindi safi, yamekaushwa vizuri..."
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Picha ya zao
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 text-sm"
            />

            {image && (
              <p className="mt-2 text-xs text-[#718578]">
                📷 {image.name}
              </p>
            )}
          </div>

          {message && (
            <div className="rounded-2xl bg-[#EAF7ED] px-4 py-3 text-sm font-bold text-[#2F9E5B]">
              {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isReady || saving}
            className="w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg disabled:opacity-40"
          >
            {saving ? "Inaweka tangazo..." : "Weka Tangazo →"}
          </button>
        </div>
      </div>
    </main>
  );
}
