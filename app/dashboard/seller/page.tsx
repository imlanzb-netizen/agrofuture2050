"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  location: string;
  phone: string;
  description: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
};

const categories = [
  "Pembejeo za Kilimo",
  "Pembejeo za Ufugaji",
  "Vifaa vya Kilimo",
  "Vifaa vya Ufugaji",
  "Nyingine",
];

export default function SellerDashboardPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("seller_products")
      .select(
        "id, name, category, price, quantity, location, phone, description, image_url, status, created_at"
      )
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Seller products error:", error);
      setMessage(`Bidhaa hazijasomeka: ${error.message}`);
    }

    setProducts((data ?? []) as Product[]);
    setLoading(false);
  }

  function resetForm() {
    setName("");
    setCategory("");
    setPrice("");
    setQuantity("");
    setLocation("");
    setPhone("");
    setDescription("");
    setImageUrl("");
  }

  async function addProduct() {
    if (
      !name ||
      !category ||
      !price ||
      !quantity ||
      !location ||
      !phone ||
      saving
    ) {
      setMessage("Jaza taarifa zote muhimu za bidhaa.");
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      setSaving(false);
      return;
    }

    let uploadedImageUrl: string | null = imageUrl.trim() || null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop() || "jpg";
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("seller-product-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) {
        console.error("Seller product image upload error:", uploadError);
        setMessage(`Picha haijawekwa: ${uploadError.message}`);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("seller-product-images")
        .getPublicUrl(filePath);

      uploadedImageUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("seller_products")
      .insert({
        seller_id: user.id,
        name: name.trim(),
        category,
        price: Number(price),
        quantity: Number(quantity),
        location: location.trim(),
        phone: phone.trim(),
        description: description.trim() || null,
        image_url: uploadedImageUrl,
      })
      .select(
        "id, name, category, price, quantity, location, phone, description, image_url, status, created_at"
      )
      .single();

    if (error) {
      console.error("Seller product insert error:", error);
      setMessage(`Bidhaa haijawekwa: ${error.message}`);
      setSaving(false);
      return;
    }

    setProducts((items) => [data as Product, ...items]);
    resetForm();
    setShowForm(false);
    setMessage("Bidhaa imewekwa sokoni kikamilifu! 🛒");
    setSaving(false);
  }

  async function deleteProduct(id: string) {
    if (!window.confirm("Una uhakika unataka kufuta bidhaa hii pamoja na picha yake?")) {
      return;
    }

    setDeleting(id);
    setMessage("");

    const product = products.find((item) => item.id === id);

    if (product?.image_url) {
      try {
        const marker = "/seller-product-images/";
        const markerIndex = product.image_url.indexOf(marker);

        if (markerIndex !== -1) {
          const filePath = decodeURIComponent(
            product.image_url.substring(markerIndex + marker.length)
          );

          const { error: imageDeleteError } = await supabase.storage
            .from("seller-product-images")
            .remove([filePath]);

          if (imageDeleteError) {
            console.error(
              "Seller product image delete error:",
              imageDeleteError
            );
            setMessage(
              `Picha haikufutwa: ${imageDeleteError.message}`
            );
            setDeleting(null);
            return;
          }
        }
      } catch (imageError) {
        console.error("Seller product image delete error:", imageError);
        setMessage("Picha haikufutwa. Bidhaa haijafutwa.");
        setDeleting(null);
        return;
      }
    }

    const { error } = await supabase
      .from("seller_products")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(`Bidhaa haijafutwa: ${error.message}`);
      setDeleting(null);
      return;
    }

    setProducts((items) => items.filter((item) => item.id !== id));
    setMessage("Bidhaa na picha yake vimefutwa kikamilifu.");
    setDeleting(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF5] text-[#173B2A]">
        <div className="text-center">
          <div className="text-4xl">🧰</div>
          <p className="mt-3 font-bold">Inapakia Seller Center...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-6 text-[#173B2A]">
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="text-sm font-bold text-[#2F9E5B]"
        >
          ← Rudi Dashboard
        </button>

        <header className="mt-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
            AGROFUTURE 2050
          </p>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">Seller Center 🧰</h1>
              <p className="mt-2 text-sm leading-6 text-[#718578]">
                Uza pembejeo na vifaa vya kilimo au ufugaji.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF7ED] text-2xl">
              🧰
            </div>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-[#2F9E5B]">
              {products.length}
            </p>
            <p className="mt-1 text-xs font-bold text-[#718578]">Bidhaa</p>
          </div>

          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-[#2F9E5B]">
              {products.filter((p) => p.category.includes("Kilimo")).length}
            </p>
            <p className="mt-1 text-xs font-bold text-[#718578]">Kilimo</p>
          </div>

          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-[#2F9E5B]">
              {products.filter((p) => p.category.includes("Ufugaji")).length}
            </p>
            <p className="mt-1 text-xs font-bold text-[#718578]">Ufugaji</p>
          </div>
        </section>

        <button
          type="button"
          onClick={() => {
            setShowForm((value) => !value);
            setMessage("");
          }}
          className="mt-5 w-full rounded-[2rem] bg-[#173B2A] p-5 text-left text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9BE7B2]">
                SELLER CENTER
              </p>

              <p className="mt-2 text-2xl font-black">
                Ongeza Bidhaa ➕
              </p>

              <p className="mt-1 text-sm text-[#D7E8DC]">
                Weka pembejeo, vifaa au bidhaa nyingine.
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
              🛒
            </div>
          </div>
        </button>

        {message && (
          <div className="mt-4 rounded-2xl bg-[#EAF7ED] px-4 py-3 text-sm font-bold text-[#2F9E5B]">
            {message}
          </div>
        )}

        {showForm && (
          <section className="mt-5 rounded-[2rem] border border-[#DCE9DF] bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-black">Weka Bidhaa</h2>
              <p className="mt-1 text-sm text-[#718578]">
                Jaza taarifa za bidhaa unayouza.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold">Jina la bidhaa</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mfano: Mbegu za Mahindi"
                  className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 outline-none focus:border-[#2F9E5B]"
                />
              </div>

              <div>
                <label className="text-sm font-bold">Aina ya bidhaa</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 outline-none focus:border-[#2F9E5B]"
                >
                  <option value="">Chagua aina</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold">Bei (TSh)</label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="150000"
                    className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 outline-none focus:border-[#2F9E5B]"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold">Stock / Kiasi</label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="20"
                    className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 outline-none focus:border-[#2F9E5B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold">Eneo</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Mfano: Morogoro"
                  className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 outline-none focus:border-[#2F9E5B]"
                />
              </div>

              <div>
                <label className="text-sm font-bold">
                  Namba ya simu / WhatsApp
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 outline-none focus:border-[#2F9E5B]"
                />
              </div>

              <div>
                <label className="text-sm font-bold">Picha ya bidhaa</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm"
                />
                <p className="mt-1 text-xs text-[#819188]">
                  Chagua picha ya bidhaa kutoka kwenye simu yako.
                </p>
              </div>

              <div>
                <label className="text-sm font-bold">Maelezo</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mfano: Mbegu bora za mahindi, pakiti ya kilo 2..."
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 outline-none focus:border-[#2F9E5B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 text-sm font-black"
                >
                  Ghairi
                </button>

                <button
                  type="button"
                  onClick={addProduct}
                  disabled={saving}
                  className="rounded-2xl bg-[#2F9E5B] px-4 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  {saving ? "Inaweka..." : "Weka Bidhaa →"}
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mt-7 pb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Bidhaa Zangu 🛒</h2>
            <span className="text-xs font-bold text-[#819188]">
              {products.length} bidhaa
            </span>
          </div>

          {products.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-[#DCE9DF] bg-white p-5 text-sm text-[#718578]">
              Bado hujaweka bidhaa yoyote.
              <br />
              Bonyeza <b>Ongeza Bidhaa</b> kuanza.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {products.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#DCE9DF] bg-white p-4"
                >
                  <div className="flex gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#EAF7ED] text-3xl">
                        🛒
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#2F9E5B]">
                        {item.category}
                      </p>

                      <h3 className="mt-1 font-black">{item.name}</h3>

                      <p className="mt-1 text-sm text-[#718578]">
                        Stock: {item.quantity} • {item.location}
                      </p>

                      <p className="mt-2 font-black text-[#2F9E5B]">
                        TSh {Number(item.price).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {item.description && (
                    <p className="mt-3 text-sm leading-6 text-[#718578]">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-3 rounded-xl bg-[#F8FAF5] px-3 py-2 text-xs font-bold text-[#718578]">
                    📞 {item.phone}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteProduct(item.id)}
                    disabled={deleting === item.id}
                    className="mt-3 w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
                  >
                    {deleting === item.id ? "Inafuta..." : "Futa bidhaa"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
