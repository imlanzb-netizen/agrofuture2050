import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY haijapatikana kwenye server." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });
    let question = "";
    let image: File | null = null;
    let audio: File | null = null;

    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const questionValue = formData.get("question");
      const imageValue = formData.get("image");
      const audioValue = formData.get("audio");

      question = typeof questionValue === "string" ? questionValue.trim() : "";
      image = imageValue instanceof File && imageValue.size > 0 ? imageValue : null;
      audio = audioValue instanceof File && audioValue.size > 0 ? audioValue : null;
    } else {
      const body = await request.json();
      question = typeof body.question === "string" ? body.question.trim() : "";
    }

    if (!question && !image && !audio) {
      return NextResponse.json(
        { ok: false, error: "Andika swali, rekodi sauti au chagua picha." },
        { status: 400 }
      );
    }

    if (image) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type)) {
        return NextResponse.json(
          { ok: false, error: "Picha lazima iwe JPG, PNG, WEBP au GIF." },
          { status: 400 }
        );
      }
      if (image.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { ok: false, error: "Picha imezidi ukubwa wa MB 10." },
          { status: 400 }
        );
      }
    }

    if (audio) {
      if (!audio.type.startsWith("audio/")) {
        return NextResponse.json(
          { ok: false, error: "Faili la sauti halijatambulika." },
          { status: 400 }
        );
      }
      if (audio.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { ok: false, error: "Sauti imezidi ukubwa wa MB 25." },
          { status: 400 }
        );
      }

      const transcription = await openai.audio.transcriptions.create({
        file: audio,
        model: "whisper-1",
        language: "sw",
      });

      question = [question, transcription.text].filter(Boolean).join("\n\n");
    }

    if (!question && !image) {
      return NextResponse.json(
        { ok: false, error: "Sijaweza kupata swali kutoka kwenye sauti." },
        { status: 400 }
      );
    }

    const instructions =
      "Wewe ni AgroFuture 2050 AI Assistant. Jibu kwa Kiswahili rahisi. Saidia kuhusu kilimo, ufugaji, masoko na biashara ya kilimo. Usibuni taarifa unapokuwa hujui.";

    let input: string | Array<{
      role: "user";
      content: Array<
        | { type: "input_text"; text: string }
        | { type: "input_image"; image_url: string; detail: "auto" }
      >;
    }> = question;

    if (image) {
      const bytes = Buffer.from(await image.arrayBuffer());
      const imageUrl = `data:${image.type};base64,${bytes.toString("base64")}`;

      input = [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: question || "Angalia picha hii na unisaidie kuielewa kuhusu kilimo au ufugaji.",
            },
            { type: "input_image", image_url: imageUrl, detail: "auto" },
          ],
        },
      ];
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      instructions,
      input,
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
