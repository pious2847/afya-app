import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const MAX_CHARS = 500;
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Voice not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    let text: string = body.text || "";

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { ok: false, error: "Text required" },
        { status: 400 }
      );
    }

    text = text.trim().slice(0, MAX_CHARS);
    if (text.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Text too short" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("ElevenLabs error:", res.status, err);
      return NextResponse.json(
        { ok: false, error: "Voice generation failed" },
        { status: 502 }
      );
    }

    const audioBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      ok: true,
      audio: base64,
      format: "mp3",
      charsUsed: text.length,
      limit: MAX_CHARS,
    });
  } catch (e) {
    console.error("Voice error:", e);
    return NextResponse.json(
      { ok: false, error: "Voice failed" },
      { status: 500 }
    );
  }
}
