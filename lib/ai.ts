import { SkillMatrixSchema } from "@/lib/schema";
import { fallbackExtract } from "@/lib/fallback";

const SYSTEM_INSTRUCTIONS = `
Return STRICT JSON only, matching this TypeScript shape exactly (no extra fields):
{
  "title": string,
  "seniority": "junior"|"mid"|"senior"|"lead"|"unknown",
  "skills": {
    "frontend": string[],
    "backend": string[],
    "devops": string[],
    "web3": string[],
    "other": string[]
  },
  "mustHave": string[],
  "niceToHave": string[],
  "salary"?: { "currency": "USD"|"EUR"|"PLN"|"GBP", "min"?: number, "max"?: number },
  "summary": string
}
"web3" must include EVM terms if present. "summary" <= 60 words.
Only output the JSON—no prose, no markdown.
`;

export async function extractWithAIorFallback(jd: string) {
  const openaiKey = process.env.NEXT_OPENAI_API_KEY;
  if (!openaiKey) return fallbackExtract(jd);

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTIONS },
          { role: "user", content: jd },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    const data = await resp.json();
    if (!resp.ok || data?.error) {
      console.error("OpenAI request failed:", {
        status: resp.status,
        error: data?.error,
      });
      return fallbackExtract(jd);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) return fallbackExtract(jd);

    try {
      const parsed = JSON.parse(text);

      const check = SkillMatrixSchema.safeParse(parsed);
      if (check.success) {
        return check.data;
      }

      const hint = ` Zod errors: ${check.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
        .join("; ")}`;

      const fixResp = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_INSTRUCTIONS },
              {
                role: "user",
                content: `Fix this to match the schema strictly and return JSON only:${hint}\n\n${text}`,
              },
            ],
            temperature: 0,
            response_format: { type: "json_object" },
          }),
        }
      );

      const fixData = await fixResp.json();
      const fixedText =
        !fixResp.ok || fixData?.error
          ? null
          : fixData?.choices?.[0]?.message?.content;

      const finalParsed = fixedText ? JSON.parse(fixedText) : null;
      const finalCheck = finalParsed
        ? SkillMatrixSchema.safeParse(finalParsed)
        : null;
      return finalCheck?.success ? finalCheck.data : fallbackExtract(jd);
    } catch {
      return fallbackExtract(jd);
    }
  } catch (err) {
    return fallbackExtract(jd);
  }
}
