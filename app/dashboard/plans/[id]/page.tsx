"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FarmPlan = {
  id: string;
  user_id: string;
  name: string;
  activity_type: string;
  crop_or_livestock: string | null;
  season: string | null;
  start_date: string | null;
  end_date: string | null;
  expected_revenue: number;
  total_cost: number;
  expected_profit: number;
  notes: string | null;
};

type PlanItem = {
  id: string;
  title: string;
  description: string | null;
  item_type: string;
  planned_date: string | null;
  quantity: number | null;
  unit: string | null;
  unit_cost: number;
  total_cost: number;
  is_completed: boolean;
};

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<FarmPlan | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [unitCost, setUnitCost] = useState("");

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (planId) {
      loadPlan();
    }
  }, [planId]);

  async function loadPlan() {
    setLoading(true);
    setError("");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push("/auth");
        return;
      }

      const { data: planData, error: planError } =
        await supabase
          .from("farm_plans")
          .select(
            "id,user_id,name,activity_type,crop_or_livestock,season,start_date,end_date,expected_revenue,total_cost,expected_profit,notes"
          )
          .eq("id", planId)
          .eq("user_id", userData.user.id)
          .single();

      if (planError) {
        console.error("PLAN LOAD ERROR:", planError);
        throw planError;
      }

      const { data: itemData, error: itemError } =
        await supabase
          .from("farm_plan_items")
          .select(
            "id,title,description,item_type,planned_date,quantity,unit,unit_cost,total_cost,is_completed"
          )
          .eq("farm_plan_id", planId)
          .order("planned_date", {
            ascending: true,
            nullsFirst: false,
          });

      if (itemError) {
        console.error("PLAN ITEMS LOAD ERROR:", itemError);
        throw itemError;
      }

      setPlan(planData as FarmPlan);
      setItems((itemData ?? []) as PlanItem[]);
    } catch (err) {
      console.error("PLAN DETAIL ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kupakia mpango."
      );
    } finally {
      setLoading(false);
    }
  }

  async function addItem() {
    setError("");

    if (!title.trim()) {
      setError("Weka jina la shughuli.");
      return;
    }

    setSaving(true);

    try {
      const quantityValue =
        quantity.trim() === "" ? null : Number(quantity);

      const unitCostValue = Number(unitCost || 0);

      if (
        quantityValue !== null &&
        (Number.isNaN(quantityValue) || quantityValue < 0)
      ) {
        setError("Quantity si sahihi.");
        return;
      }

      if (Number.isNaN(unitCostValue) || unitCostValue < 0) {
        setError("Gharama si sahihi.");
        return;
      }

      const { error: insertError } = await supabase
        .from("farm_plan_items")
        .insert({
          farm_plan_id: planId,
          title: title.trim(),
          description: description.trim() || null,
          item_type: "activity",
          planned_date: plannedDate || null,
          quantity: quantityValue,
          unit: unit.trim() || null,
          unit_cost: unitCostValue,
        });

      if (insertError) {
        console.error("PLAN ITEM INSERT ERROR:", insertError);
        throw insertError;
      }

      setTitle("");
      setDescription("");
      setPlannedDate("");
      setQuantity("");
      setUnit("");
      setUnitCost("");

      await loadPlan();
    } catch (err) {
      console.error("ADD ITEM ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kuhifadhi shughuli."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditItem(item: PlanItem) {
    setError("");
    setEditingItemId(item.id);

    setTitle(item.title);
    setDescription(item.description || "");
    setPlannedDate(item.planned_date || "");
    setQuantity(item.quantity === null ? "" : String(item.quantity));
    setUnit(item.unit || "");
    setUnitCost(String(item.unit_cost || ""));
  }

  function cancelEditItem() {
    setEditingItemId(null);
    setTitle("");
    setDescription("");
    setPlannedDate("");
    setQuantity("");
    setUnit("");
    setUnitCost("");
    setError("");
  }

  async function updateItem() {
    if (!editingItemId) return;

    setError("");

    if (!title.trim()) {
      setError("Weka jina la shughuli.");
      return;
    }

    setEditSaving(true);

    try {
      const quantityValue =
        quantity.trim() === "" ? null : Number(quantity);

      const unitCostValue = Number(unitCost || 0);

      if (
        quantityValue !== null &&
        (Number.isNaN(quantityValue) || quantityValue < 0)
      ) {
        setError("Quantity si sahihi.");
        return;
      }

      if (Number.isNaN(unitCostValue) || unitCostValue < 0) {
        setError("Gharama si sahihi.");
        return;
      }

      const totalCost =
        quantityValue === null
          ? unitCostValue
          : quantityValue * unitCostValue;

      const { error: updateError } = await supabase
        .from("farm_plan_items")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          planned_date: plannedDate || null,
          quantity: quantityValue,
          unit: unit.trim() || null,
          unit_cost: unitCostValue,
          total_cost: totalCost,
        })
        .eq("id", editingItemId)
        .eq("farm_plan_id", planId);

      if (updateError) {
        console.error("PLAN ITEM UPDATE ERROR:", updateError);
        throw updateError;
      }

      cancelEditItem();
      await loadPlan();
    } catch (err) {
      console.error("EDIT ITEM ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kubadilisha shughuli."
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function toggleItem(item: PlanItem) {
    setError("");

    const { error: updateError } = await supabase
      .from("farm_plan_items")
      .update({
        is_completed: !item.is_completed,
      })
      .eq("id", item.id)
      .eq("farm_plan_id", planId);

    if (updateError) {
      console.error("PLAN ITEM UPDATE ERROR:", updateError);
      setError("Imeshindikana kubadilisha hali ya shughuli.");
      return;
    }

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              is_completed: !currentItem.is_completed,
            }
          : currentItem
      )
    );
  }

  async function deleteItem(itemId: string) {
    const confirmed = window.confirm(
      "Una uhakika unataka kufuta shughuli hii?"
    );

    if (!confirmed) return;

    setError("");

    const { error: deleteError } = await supabase
      .from("farm_plan_items")
      .delete()
      .eq("id", itemId)
      .eq("farm_plan_id", planId);

    if (deleteError) {
      console.error("PLAN ITEM DELETE ERROR:", deleteError);
      setError("Imeshindikana kufuta shughuli.");
      return;
    }

    setItems((current) =>
      current.filter((item) => item.id !== itemId)
    );
  }

  async function deletePlan() {
    if (!plan) return;

    const confirmed = window.confirm(
      `Una uhakika unataka kufuta mpango "${plan.name}"? Shughuli zake zote pia zitafutwa.`
    );

    if (!confirmed) return;

    setError("");
    setSaving(true);

    try {
      const { error: deleteItemsError } = await supabase
        .from("farm_plan_items")
        .delete()
        .eq("farm_plan_id", planId);

      if (deleteItemsError) {
        console.error("PLAN ITEMS DELETE ERROR:", deleteItemsError);
        throw deleteItemsError;
      }

      const { error: deletePlanError } = await supabase
        .from("farm_plans")
        .delete()
        .eq("id", planId)
        .eq("user_id", plan.user_id);

      if (deletePlanError) {
        console.error("PLAN DELETE ERROR:", deletePlanError);
        throw deletePlanError;
      }

      router.push("/dashboard/plans");
    } catch (err) {
      console.error("DELETE PLAN ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kufuta mpango."
      );
    } finally {
      setSaving(false);
    }
  }

  function money(value: number) {
    return new Intl.NumberFormat("sw-TZ").format(Number(value || 0));
  }

  const itemsTotal = items.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );

  const completedCount = items.filter(
    (item) => item.is_completed
  ).length;

  const progress =
    items.length === 0
      ? 0
      : Math.round((completedCount / items.length) * 100);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF5] text-[#173B2A]">
        <div className="text-center">
          <div className="text-4xl">📋</div>
          <p className="mt-3 font-bold">Inapakia mpango...</p>
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF5] p-5 text-[#173B2A]">
        <div className="rounded-3xl bg-white p-6 text-center">
          <p className="font-black">Mpango haujapatikana.</p>
          <button
            onClick={() => router.push("/dashboard/plans")}
            className="mt-4 rounded-2xl bg-[#2F9E5B] px-5 py-3 text-sm font-bold text-white"
          >
            Rudi kwenye Plans
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#2F9E5B]">
              AGROFUTURE 2050
            </p>

            <h1 className="mt-1 text-xl font-black">
              {plan.name}
            </h1>
          </div>

          <div className="text-3xl">
            {plan.activity_type === "livestock" ? "🐄" : "🌾"}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md px-5 py-6">
        <div className="rounded-3xl bg-[#173B2A] p-5 text-white shadow-lg">
          <p className="text-xs font-bold text-[#9BE7B2]">
            {plan.crop_or_livestock ||
              (plan.activity_type === "livestock"
                ? "Ufugaji"
                : "Kilimo")}
          </p>

          {plan.season && (
            <p className="mt-2 text-sm text-[#D7E8DC]">
              🌱 {plan.season}
            </p>
          )}

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] text-[#D7E8DC]">
                Mapato
              </p>
              <p className="mt-1 text-xs font-black">
                {money(plan.expected_revenue)}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] text-[#D7E8DC]">
                Gharama
              </p>
              <p className="mt-1 text-xs font-black">
                {money(plan.total_cost + itemsTotal)}
              </p>
            </div>

            <div className="rounded-xl bg-[#2F9E5B] p-3">
              <p className="text-[10px] text-white/80">
                Faida
              </p>
              <p className="mt-1 text-xs font-black">
                {money(
                  plan.expected_revenue -
                    (plan.total_cost + itemsTotal)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-[#DCE9DF] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">
                Maendeleo ya shughuli
              </p>
              <p className="mt-1 text-xs text-[#819188]">
                {completedCount} kati ya {items.length} zimekamilika
              </p>
            </div>

            <p className="text-lg font-black text-[#2F9E5B]">
              {progress}%
            </p>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#EAF7ED]">
            <div
              className="h-full rounded-full bg-[#2F9E5B]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-black">
            ➕ Ongeza Shughuli
          </h2>

          <div className="mt-3 space-y-3 rounded-3xl border border-[#DCE9DF] bg-white p-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Jina la shughuli"
              className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Maelezo ya shughuli"
              rows={3}
              className="w-full resize-none rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
            />

            <input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Quantity"
                className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
              />

              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit"
                className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
              />
            </div>

            <input
              type="number"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="Gharama kwa unit (TZS)"
              className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
            />

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={editingItemId ? updateItem : addItem}
              disabled={saving || editSaving}
              className="w-full rounded-2xl bg-[#2F9E5B] px-4 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {editingItemId
                ? editSaving
                  ? "Inabadilisha..."
                  : "✏️ Hifadhi Mabadiliko"
                : saving
                  ? "Inahifadhi..."
                  : "💾 Hifadhi Shughuli"}
            </button>

            {editingItemId && (
              <button
                type="button"
                onClick={cancelEditItem}
                disabled={editSaving}
                className="w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-3 text-sm font-bold disabled:opacity-50"
              >
                Ghairi Edit
              </button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">
              📋 Shughuli za Mpango
            </h2>

            <span className="text-xs font-bold text-[#2F9E5B]">
              Gharama: {money(itemsTotal)} TZS
            </span>
          </div>

          {items.length === 0 ? (
            <div className="mt-3 rounded-3xl border border-[#DCE9DF] bg-white p-6 text-center">
              <div className="text-3xl">📝</div>
              <p className="mt-2 text-sm font-bold">
                Hakuna shughuli bado
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-[#DCE9DF] bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleItem(item)}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black ${
                        item.is_completed
                          ? "border-[#2F9E5B] bg-[#EAF7ED] text-[#2F9E5B]"
                          : "border-[#DCE9DF] bg-white"
                      }`}
                    >
                      {item.is_completed ? "✓" : ""}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-black ${
                          item.is_completed
                            ? "text-[#819188] line-through"
                            : ""
                        }`}
                      >
                        {item.title}
                      </p>

                      {item.description && (
                        <p className="mt-1 text-sm leading-5 text-[#687B70]">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.planned_date && (
                          <span className="rounded-full bg-[#F8FAF5] px-3 py-1 text-xs">
                            📅 {item.planned_date}
                          </span>
                        )}

                        {item.quantity !== null && (
                          <span className="rounded-full bg-[#F8FAF5] px-3 py-1 text-xs">
                            {item.quantity} {item.unit || ""}
                          </span>
                        )}

                        <span className="rounded-full bg-[#EAF7ED] px-3 py-1 text-xs font-bold text-[#2F9E5B]">
                          {money(item.total_cost)} TZS
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditItem(item)}
                        className="rounded-xl border border-[#DCE9DF] bg-[#F8FAF5] px-3 py-2 text-sm"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/plans")}
          className="mt-6 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 text-sm font-bold"
        >
          ← Rudi kwenye Plans
        </button>

        <button
          type="button"
          onClick={deletePlan}
          disabled={saving}
          className="mt-3 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-black text-red-700 disabled:opacity-50"
        >
          {saving ? "Inafuta..." : "🗑️ Futa Mpango Mzima"}
        </button>
      </section>
    </main>
  );
}
