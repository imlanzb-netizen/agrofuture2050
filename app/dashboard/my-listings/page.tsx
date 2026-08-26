"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  category?: string | null;
  price: number;
  quantity: number;
  location?: string | null;
  phone?: string | null;
  description?: string | null;
  image_url?: string | null;
  status?: string | null;
  created_at?: string;
};

export default function MyListingsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadMyProducts() {
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
        console.error("My seller products error:", error);
        setMessage(`Imeshindikana kupakia bidhaa zako: ${error.message}`);
      } else {
        setProducts((data ?? []) as Product[]);
      }

      setLoading(false);
    }

    loadMyProducts();
  }, [router]);

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Una uhakika unataka kufuta "${product.name}"?\n\nBidhaa hii itaondolewa pia kwenye AgroMarket.`
    );

    if (!confirmed) return;

    setDeleting(product.id);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    // Hakikisha seller anafuta bidhaa yake mwenyewe tu.
    const { error } = await supabase
      .from("seller_products")
      .delete()
      .eq("id", product.id)
      .eq("seller_id", user.id);

    if (error) {
      console.error("Delete seller product error:", error);
      setMessage(`Bidhaa haijafutwa: ${error.message}`);
      setDeleting(null);
      return;
    }

    // Ondoa picha ya bidhaa kwenye Storage ikiwa ni picha ya Supabase.
    if (product.image_url) {
      try {
        const marker = "/seller-product-images/";
        const index = product.image_url.indexOf(marker);

        if (index !== -1) {
          const filePath = product.image_url.slice(
            index + marker.length
          );

          if (filePath) {
            const { error: storageError } = await supabase.storage
              .from("seller-product-images")
              .remove([filePath]);

            if (storageError) {
              console.error(
                "Seller product image delete error:",
                storageError
              );
            }
          }
        }
      } catch (storageError) {
        console.error(
          "Seller product image cleanup error:",
          storageError
        );
      }
    }

    setProducts((current) =>
      current.filter((item) => item.id !== product.id)
    );

    setMessage(
      "Bidhaa na tangazo lake vimefutwa kikamilifu kutoka AgroMarket."
    );

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

          <h1 className="mt-5 text-3xl font-black">
            Bidhaa Zangu 📦
          </h1>

          <p className="mt-2 text-sm text-[#718578]">
            Hapa unaona bidhaa ulizoweka kupitia Seller Center pekee.
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
            <p className="font-bold">
              Inapakia bidhaa zako...
            </p>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#C9D9CE] bg-white p-8 text-center">
            <div className="text-5xl">📦</div>

            <h2 className="mt-4 text-xl font-black">
              Bado huna bidhaa
            </h2>

            <p className="mt-2 text-sm text-[#718578]">
              Bidhaa utakazoweka kupitia Seller Center zitaonekana hapa.
            </p>

            <button
              onClick={() => router.push("/dashboard/seller")}
              className="mt-5 rounded-2xl bg-[#2F9E5B] px-5 py-3 text-sm font-black text-white"
            >
              🧰 Fungua Seller Center
            </button>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-3xl border border-[#DCE9DF] bg-white shadow-sm"
              >
                <div className="h-44 overflow-hidden bg-[#EAF7ED]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">
                      🧰
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#2F9E5B]">
                        {product.category || "Bidhaa"}
                      </p>

                      <h2 className="mt-1 text-lg font-black">
                        {product.name}
                      </h2>
                    </div>

                    <span className="rounded-full bg-[#EAF7ED] px-2 py-1 text-[10px] font-black text-[#2F9E5B]">
                      {product.status || "active"}
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-black">
                    TSh{" "}
                    {Number(product.price || 0).toLocaleString()}
                  </p>

                  <p className="mt-1 text-xs text-[#819188]">
                    📦 Kiasi: {product.quantity}
                  </p>

                  {product.location && (
                    <p className="mt-2 text-sm font-bold">
                      📍 {product.location}
                    </p>
                  )}

                  {product.description && (
                    <p className="mt-2 text-xs leading-5 text-[#718578]">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/marketplace/${product.id}`
                        )
                      }
                      className="rounded-2xl border border-[#DCE9DF] py-3 text-sm font-black text-[#2F9E5B]"
                    >
                      👁️ Angalia
                    </button>

                    <button
                      onClick={() => deleteProduct(product)}
                      disabled={deleting === product.id}
                      className="rounded-2xl bg-red-600 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      {deleting === product.id
                        ? "Inafuta..."
                        : "🗑️ Futa"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
