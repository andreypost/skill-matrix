import { NextResponse } from "next/server";
import { extractWithAIorFallback } from "@/lib/ai";
import { SkillMatrixSchema } from "@/lib/schema";

export async function POST(req: Request) {
  try {
    const { jd } = await req.json();
    if (typeof jd !== "string" || jd.trim().length < 5) {
      return NextResponse.json(
        { error: "Provide a non-empty job description." },
        { status: 400 }
      );
    }

    const result = await extractWithAIorFallback(jd);

    const validated = SkillMatrixSchema.parse(result);
    return NextResponse.json(validated, { status: 200 });
  } catch (e: any) {
    const message =
      e?.issues?.map((i: any) => i.message).join("; ") ||
      e?.message ||
      "Unknown error";
    return NextResponse.json(
      { error: `Validation or extraction failed: ${message}` },
      { status: 422 }
    );
  }
}
