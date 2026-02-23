import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { assessments, assessmentTurns, clinics } from "@/lib/db/schema";
import { eq, asc, and, isNotNull } from "drizzle-orm";

const SYSTEM_PROMPT = `You are a warm, professional medical triage assistant for rural African communities. Your role is to:
1. Ask clear, simple questions to understand symptoms
2. Show empathy and avoid medical jargon
3. Consider limited healthcare access and resource constraints
4. Adapt your questions based on what the user has already shared
5. When you have enough information, provide a triage assessment

CRITICAL triage rules (ALWAYS follow):
- EMERGENCY: chest pain, severe bleeding, unconscious, can't breathe, severe allergic reaction, stroke signs (sudden weakness, slurred speech), suspected poisoning, major trauma → say "EMERGENCY" and recommend immediate care
- HIGH: high fever (>39°C), persistent vomiting/diarrhea, dehydration, severe pain, difficulty breathing (mild), pregnancy concerns, child under 5 with fever → recommend clinic within 24-48 hours
- MEDIUM: moderate symptoms lasting days, fever that responds to rest, cough, headache → recommend clinic if persists
- LOW: mild symptoms, recent onset, no red flags → home care advice

Response format: Use ONLY one of these exactly when giving final assessment:
ASSESSMENT: low|medium|high|emergency
RECOMMENDATIONS: bullet point 1
RECOMMENDATIONS: bullet point 2
RECOMMENDATIONS: bullet point 3

Before final assessment, just ask follow-up questions conversationally. After 2-4 exchanges with enough info, provide the ASSESSMENT block.`;

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

    const body = await request.json();
    const { message, assessmentId, bodyRegions, history = [], userLat, userLng } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { ok: false, error: "Message required" },
        { status: 400 }
      );
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        { ok: false, error: "AI not configured" },
        { status: 503 }
      );
    }

    let currentAssessmentId = assessmentId;

    if (!currentAssessmentId) {
      if (db) {
        const [inserted] = await db
          .insert(assessments)
          .values({
            userId,
            symptoms: JSON.stringify({ conversation: true }),
            riskLevel: "low",
          })
          .returning({ id: assessments.id });
        currentAssessmentId = inserted?.id;
      } else {
        currentAssessmentId = crypto.randomUUID();
      }
    }

    if (db && currentAssessmentId && String(currentAssessmentId).length === 36) {
      await db.insert(assessmentTurns).values({
        assessmentId: currentAssessmentId,
        role: "user",
        content: message,
        metadata: bodyRegions ? JSON.stringify({ bodyRegions }) : null,
      });
    }

    const bodyContext = bodyRegions?.length
      ? ` User indicated symptoms in these body areas: ${bodyRegions.join(", ")}.`
      : "";

    let messages: { role: "user" | "assistant" | "system"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT + bodyContext },
    ];

    if (db && currentAssessmentId && String(currentAssessmentId).length === 36) {
      const turns = await db
        .select()
        .from(assessmentTurns)
        .where(eq(assessmentTurns.assessmentId, currentAssessmentId))
        .orderBy(asc(assessmentTurns.createdAt));

      for (const t of turns) {
        messages.push({
          role: t.role as "user" | "assistant",
          content: t.content,
        });
      }
    } else if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        if (h.role && h.content) {
          messages.push({ role: h.role as "user" | "assistant", content: String(h.content) });
        }
      }
    } else {
      messages.push({ role: "user", content: message });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as Parameters<typeof openai.chat.completions.create>[0]["messages"],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I didn't get that. Could you tell me more about your symptoms?";

    if (db && currentAssessmentId) {
      await db.insert(assessmentTurns).values({
        assessmentId: currentAssessmentId,
        role: "assistant",
        content: reply,
      });
    }

    const assessmentMatch = reply.match(/ASSESSMENT:\s*(low|medium|high|emergency)/i);
    const recMatches = reply.matchAll(/RECOMMENDATIONS?:\s*(.+)/gi);

    if (assessmentMatch) {
      const riskLevel = assessmentMatch[1].toLowerCase();
      const recommendations = Array.from(recMatches, (m) => m[1].trim()).filter(Boolean);
      const isValidUuid = currentAssessmentId && /^[0-9a-f-]{36}$/i.test(String(currentAssessmentId));

      if (db && isValidUuid) {
        await db
          .update(assessments)
          .set({
            riskLevel,
            recommendations: JSON.stringify(recommendations),
            conversationSummary: JSON.stringify(
              messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }))
            ),
          })
          .where(eq(assessments.id, currentAssessmentId));
      }

      let emergencyHospitals: { name: string; address: string; phone: string | null; distanceText: string }[] = [];
      if (riskLevel === "emergency" && db && userLat != null && userLng != null) {
        const lat = Number(userLat);
        const lng = Number(userLng);
        if (!isNaN(lat) && !isNaN(lng)) {
          const hospitalRows = await db
            .select()
            .from(clinics)
            .where(
              and(
                eq(clinics.isActive, true),
                isNotNull(clinics.latitude),
                isNotNull(clinics.longitude)
              )
            )
            .limit(50);
          const hospitals = hospitalRows.filter(
            (r) => r.type === "hospital" || r.type === "health_center"
          );
          const R = 6371;
          const haversine = (la1: number, ln1: number, la2: number, ln2: number) => {
            const dLat = ((la2 - la1) * Math.PI) / 180;
            const dLng = ((ln2 - ln1) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos((la1 * Math.PI) / 180) * Math.cos((la2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          };
          const withDist = hospitals
            .map((r) => ({
              ...r,
              distanceKm: haversine(lat, lng, r.latitude!, r.longitude!),
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 5);
          emergencyHospitals = withDist.map((c) => ({
            name: c.name,
            address: c.address,
            phone: c.phone,
            distanceText:
              c.distanceKm < 1
                ? `${Math.round(c.distanceKm * 1000)} m away`
                : `${c.distanceKm.toFixed(1)} km away`,
          }));
        }
      }

      return NextResponse.json({
        ok: true,
        reply,
        assessmentId: currentAssessmentId,
        complete: true,
        riskLevel,
        recommendations,
        emergencyHospitals: emergencyHospitals.length ? emergencyHospitals : undefined,
      });
    }

    return NextResponse.json({
      ok: true,
      reply,
      assessmentId: currentAssessmentId,
      complete: false,
    });
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json(
      { ok: false, error: "Assessment failed" },
      { status: 500 }
    );
  }
}
