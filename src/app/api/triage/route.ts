import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { assessments } from "@/lib/db/schema";

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

type RiskLevel = "low" | "medium" | "high" | "emergency";

function ruleBasedTriage(
  symptoms: string[],
  severity: string,
  details: string
): { riskLevel: RiskLevel; recommendations: string[] } {
  const lower = details.toLowerCase();
  const symptomSet = new Set(symptoms.map((s) => s.toLowerCase()));

  // Emergency indicators
  if (
    severity === "critical" ||
    symptomSet.has("shortness of breath") ||
    symptomSet.has("chest pain") ||
    lower.includes("unconscious") ||
    lower.includes("severe bleeding") ||
    lower.includes("can't breathe")
  ) {
    return {
      riskLevel: "emergency",
      recommendations: [
        "Seek emergency care immediately.",
        "Call local emergency services if available.",
        "Do not delay—this may be life-threatening.",
      ],
    };
  }

  // High risk
  if (
    severity === "severe" ||
    symptomSet.has("fever") ||
    symptomSet.has("vomiting") ||
    symptomSet.has("diarrhea") ||
    symptomSet.has("dizziness")
  ) {
    return {
      riskLevel: "high",
      recommendations: [
        "Visit a clinic or hospital within 24–48 hours.",
        "Rest and stay hydrated.",
        "Monitor symptoms—seek care sooner if they worsen.",
      ],
    };
  }

  // Medium risk
  if (
    severity === "moderate" ||
    symptomSet.has("cough") ||
    symptomSet.has("headache") ||
    symptomSet.has("body aches")
  ) {
    return {
      riskLevel: "medium",
      recommendations: [
        "Consider visiting a clinic if symptoms persist beyond a few days.",
        "Rest and drink plenty of fluids.",
        "Use over-the-counter relief if appropriate and available.",
      ],
    };
  }

  // Low risk
  return {
    riskLevel: "low",
    recommendations: [
      "Monitor your symptoms at home.",
      "Rest and stay hydrated.",
      "Visit a clinic if symptoms persist or worsen.",
    ],
  };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { symptoms = [], details = "", severity = "", duration = "" } = body;

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { ok: false, error: "At least one symptom is required" },
        { status: 400 }
      );
    }

    const input = {
      symptoms,
      details,
      severity,
      duration,
    };

    let riskLevel: RiskLevel;
    let recommendations: string[];

    const openai = getOpenAI();
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert medical triage assistant for rural African communities. Your triage must be accurate and actionable.

CRITICAL RULES - follow strictly:
- EMERGENCY: chest pain, severe bleeding, unconscious, can't breathe, severe allergic reaction, stroke (sudden weakness/slurred speech), poisoning, major trauma, severe burns → riskLevel "emergency"
- HIGH: high fever (>39°C), persistent vomiting/diarrhea, dehydration, severe pain, mild breathing difficulty, pregnancy concerns, child under 5 with fever → riskLevel "high"
- MEDIUM: moderate symptoms 3+ days, fever responding to rest, cough, headache → riskLevel "medium"
- LOW: mild recent symptoms, no red flags → riskLevel "low"

Return ONLY valid JSON:
{"riskLevel":"low|medium|high|emergency","recommendations":["specific actionable rec 1","rec 2","rec 3"]}
Give 3-4 recommendations. Be specific (e.g. "Drink oral rehydration solution" not "Stay hydrated"). Consider limited clinic access. Use simple language.`,
            },
            {
              role: "user",
              content: `Symptoms: ${symptoms.join(", ")}. Severity: ${severity}. Duration: ${duration}. Details: ${details || "None"}`,
            },
          ],
          response_format: { type: "json_object" },
        });

        const text = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(text) as {
          riskLevel?: string;
          recommendations?: string[];
        };
        riskLevel = (parsed.riskLevel || "low") as RiskLevel;
        recommendations = Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : ruleBasedTriage(symptoms, severity, details).recommendations;
      } catch {
        const fallback = ruleBasedTriage(symptoms, severity, details);
        riskLevel = fallback.riskLevel;
        recommendations = fallback.recommendations;
      }
    } else {
      const fallback = ruleBasedTriage(symptoms, severity, details);
      riskLevel = fallback.riskLevel;
      recommendations = fallback.recommendations;
    }

    let assessmentId: string | null = null;
    if (db) {
      try {
        const [inserted] = await db
          .insert(assessments)
          .values({
            userId,
            symptoms: JSON.stringify(input),
            riskLevel,
            recommendations: JSON.stringify(recommendations),
          })
          .returning({ id: assessments.id });
        assessmentId = inserted?.id ?? null;
      } catch (e) {
        console.error("DB insert failed:", e);
      }
    }
    if (!assessmentId) {
      assessmentId = crypto.randomUUID();
    }

    return NextResponse.json({
      ok: true,
      assessmentId,
      riskLevel,
      recommendations,
    });
  } catch (e) {
    console.error("Triage error:", e);
    return NextResponse.json(
      { ok: false, error: "Assessment failed" },
      { status: 500 }
    );
  }
}
