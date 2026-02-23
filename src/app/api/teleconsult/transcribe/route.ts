import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        { ok: false, error: "Transcription not configured" },
        { status: 503 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let buffer: ArrayBuffer;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("audio") as File | null;
      if (!file) {
        return NextResponse.json(
          { ok: false, error: "No audio file" },
          { status: 400 }
        );
      }
      buffer = await file.arrayBuffer();
    } else {
      buffer = await request.arrayBuffer();
    }

    const blob = new Blob([buffer], { type: "audio/webm" });
    const file = new File([blob], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
    });

    const text = transcription.text?.trim() || "";
    return NextResponse.json({
      ok: true,
      text,
    });
  } catch (e) {
    console.error("Transcribe error:", e);
    return NextResponse.json(
      { ok: false, error: "Transcription failed" },
      { status: 500 }
    );
  }
}
