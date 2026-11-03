import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-security";
import { writeAdminAuditLog } from "@/lib/admin-audit";

const TABLES = {
  crop: {
    table: "crop_listings",
    title: "product",
    bucket: "crop-images",
  },
  livestock: {
    table: "livestock_listings",
    title: "animal",
    bucket: "livestock-images",
  },
  "seller-product": {
    table: "seller_products",
    title: "name",
    bucket: "seller-product-images",
  },
} as const;

type ListingType = keyof typeof TABLES;

function isListingType(value: unknown): value is ListingType {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(TABLES, value);
}

export async function GET(request: Request) {
  const { user, error: authError } = await requireAdmin(request);

  if (authError || !user) {
    return authError;
  }

  const results = await Promise.all(
    (Object.keys(TABLES) as ListingType[]).map(async (type) => {
      const config = TABLES[type];
      const { data, error } = await supabaseAdmin
        .from(config.table)
        .select("*")
        .order("created_at", { ascending: false });

      return {
        type,
        data: data?.map((listing) => ({
          ...listing,
          type,
          title: listing[config.title],
        })) ?? [],
        error,
      };
    })
  );

  const failed = results.find((result) => result.error);

  if (failed) {
    console.error("ADMIN LISTINGS LOAD ERROR:", failed.error);
    return NextResponse.json(
      { ok: false, error: "Imeshindikana kupata matangazo." },
      { status: 500 }
    );
  }

  const listings = results
    .flatMap((result) => result.data)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

  return NextResponse.json({ ok: true, listings });
}

export async function PATCH(request: Request) {
  const { user, error: authError } = await requireAdmin(request);

  if (authError || !user) {
    return authError;
  }

  let body: { id?: string; type?: ListingType; status?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Taarifa zilizotumwa si sahihi." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, error: "Taarifa zilizotumwa si sahihi." },
      { status: 400 }
    );
  }

  const { id, type, status } = body;

  if (
    typeof id !== "string" ||
    !id.trim() ||
    !isListingType(type) ||
    (status !== "active" && status !== "paused")
  ) {
    return NextResponse.json(
      { ok: false, error: "ID, aina au hali ya tangazo si sahihi." },
      { status: 400 }
    );
  }

  const config = TABLES[type];
  const { data, error } = await supabaseAdmin
    .from(config.table)
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("ADMIN LISTING UPDATE ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Imeshindikana kubadilisha hali ya tangazo." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Tangazo halijapatikana." },
      { status: 404 }
    );
  }

  await writeAdminAuditLog({
    adminUserId: user.id,
    action: status === "paused" ? "pause_listing" : "reactivate_listing",
    details: { listingId: id, listingType: type },
  });

  return NextResponse.json({ ok: true, listing: data });
}

export async function DELETE(request: Request) {
  const { user, error: authError } = await requireAdmin(request);

  if (authError || !user) {
    return authError;
  }

  let body: { id?: string; type?: ListingType };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Taarifa zilizotumwa si sahihi." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, error: "Taarifa zilizotumwa si sahihi." },
      { status: 400 }
    );
  }

  const { id, type } = body;

  if (typeof id !== "string" || !id.trim() || !isListingType(type)) {
    return NextResponse.json(
      { ok: false, error: "ID au aina ya tangazo si sahihi." },
      { status: 400 }
    );
  }

  const config = TABLES[type];

  const { data: listing, error: findError } = await supabaseAdmin
    .from(config.table)
    .select("id, image_url")
    .eq("id", id)
    .maybeSingle();

  if (findError) {
    console.error("ADMIN LISTING FIND ERROR:", findError);
    return NextResponse.json(
      { ok: false, error: "Imeshindikana kupata tangazo." },
      { status: 500 }
    );
  }

  if (!listing) {
    return NextResponse.json(
      { ok: false, error: "Tangazo halijapatikana." },
      { status: 404 }
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from(config.table)
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("ADMIN LISTING DELETE ERROR:", deleteError);
    return NextResponse.json(
      { ok: false, error: "Imeshindikana kufuta tangazo." },
      { status: 500 }
    );
  }

  let imageWarning: string | null = null;

  if (typeof listing.image_url === "string" && listing.image_url.trim()) {
    try {
      const imageUrl = new URL(listing.image_url);
      const prefix = `/storage/v1/object/public/${config.bucket}/`;

      if (
        imageUrl.hostname !== "lvuhbplwnjuhskygllqg.supabase.co" ||
        !imageUrl.pathname.startsWith(prefix)
      ) {
        imageWarning = "Picha haikufutwa kwa sababu URL yake haikuthibitishwa.";
      } else {
        const storagePath = decodeURIComponent(
          imageUrl.pathname.slice(prefix.length)
        );

        if (!storagePath || storagePath.includes("..")) {
          imageWarning = "Njia ya picha haikuthibitishwa.";
        } else {
          const { error: imageError } = await supabaseAdmin.storage
            .from(config.bucket)
            .remove([storagePath]);

          if (imageError) {
            console.error("ADMIN LISTING IMAGE DELETE ERROR:", imageError);
            imageWarning = "Tangazo limefutwa, lakini picha haikuweza kufutwa.";
          }
        }
      }
    } catch {
      imageWarning = "Tangazo limefutwa, lakini URL ya picha haikuweza kuchakatwa.";
    }
  }

  await writeAdminAuditLog({
    adminUserId: user.id,
    action: "delete_listing",
    details: { listingId: id, listingType: type },
  });

  return NextResponse.json({
    ok: true,
    warning: imageWarning,
  });
}
