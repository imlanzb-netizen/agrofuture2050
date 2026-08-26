import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-security";
import { supabase } from "@/lib/supabase";
import { writeAdminAuditLog } from "@/lib/admin-audit";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (auth.error) {
      return auth.error;
    }

    const { data: articles, error } = await supabaseAdmin
      .from("articles")
      .select(
        "id, title, content, category, author_id, published, created_at, image_url, video_url, file_url, file_name"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      articles: articles || [],
    });
  } catch (error) {
    console.error("ADMIN ARTICLES ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Imeshindikana kupakia makala.",
      },
      { status: 500 }
    );
  }
}
export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const articleId = body.articleId;

    if (!articleId) {
      return NextResponse.json(
        { ok: false, error: "articleId inahitajika." },
        { status: 400 }
      );
    }

    const updateData: {
      published?: boolean;
      title?: string;
      content?: string;
      category?: string;
    } = {};

    if (typeof body.published === "boolean") {
      updateData.published = body.published;
    }

    if (typeof body.title === "string") {
      updateData.title = body.title.trim();
    }

    if (typeof body.content === "string") {
      updateData.content = body.content.trim();
    }

    if (typeof body.category === "string") {
      updateData.category = body.category.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Hakuna mabadiliko yaliyotumwa." },
        { status: 400 }
      );
    }

    const { data: article, error } = await supabaseAdmin
      .from("articles")
      .update(updateData)
      .eq("id", articleId)
      .select(
        "id, title, content, category, author_id, published, created_at, image_url, video_url, file_url, file_name"
      )
      .single();

    if (error) {
      console.error("ADMIN ARTICLE UPDATE ERROR:", error);

      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const auditSaved = await writeAdminAuditLog({
      adminUserId: auth.user.id,
      action: "update_article",
      details: {
        article_id: articleId,
        changed_fields: Object.keys(updateData),
      },
    });

    if (!auditSaved) {
      console.warn(
        "ADMIN ARTICLE AUDIT WARNING: Article update succeeded but audit log haiku-save."
      );
    }

    return NextResponse.json({
      ok: true,
      article,
      audit_logged: auditSaved,
    });
  } catch (error) {
    console.error("ADMIN ARTICLE PATCH ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Imeshindikana kubadilisha hali ya makala.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const articleId = body.articleId;

    if (!articleId) {
      return NextResponse.json(
        { ok: false, error: "articleId inahitajika." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("articles")
      .delete()
      .eq("id", articleId);

    if (error) {
      console.error("ADMIN ARTICLE DELETE ERROR:", error);

      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const auditSaved = await writeAdminAuditLog({
      adminUserId: auth.user.id,
      action: "delete_article",
      details: {
        article_id: articleId,
      },
    });

    if (!auditSaved) {
      console.warn(
        "ADMIN ARTICLE AUDIT WARNING: Article deletion succeeded but audit log haiku-save."
      );
    }

    return NextResponse.json({
      ok: true,
      articleId,
      audit_logged: auditSaved,
    });
  } catch (error) {
    console.error("ADMIN ARTICLE DELETE ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Imeshindikana kufuta makala.",
      },
      { status: 500 }
    );
  }
}
