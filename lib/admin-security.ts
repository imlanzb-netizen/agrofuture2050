import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, error: "Authorization token inahitajika." },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, error: "Token haipo." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, error: "Session si halali." },
        { status: 401 }
      ),
    };
  }

  if (user.app_metadata?.role !== "admin") {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, error: "Admin pekee ndiye anayeruhusiwa." },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    error: null,
  };
}
