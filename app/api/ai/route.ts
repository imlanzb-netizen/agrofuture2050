import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY haijapatikana kwenye server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const question = body.question;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { ok: false, error: "Swali linahitajika." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey,
    });

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      instructions:
        "Wewe ni AgroFuture 2050 AI Assistant. Jibu kwa Kiswahili rahisi. Saidia kuhusu kilimo, ufugaji, masoko na biashara ya kilimo. Usibuni taarifa unapokuwa hujui.",
      input: question.trim(),
    });

    return NextResponse.json({
      ok: true,
      answer: response.output_text,
    });
  } catch (error) {
    console.error("AI API ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Kuna tatizo kwenye OpenAI API.",
      },
      { status: 500 }
    );
  }
}
