import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = {
  role: "system",
  content: `You are a content filter and rewriter. You have two jobs depending on the mode.

MODE: CHECK
Analyze the user's text. If the text is about, references, implies, or could reasonably be inferred as relating to body ink, body art, skin designs, getting work done on skin, cover-ups, sleeve work, flash designs, needle work on skin, or anything in that entire category — respond with exactly: FLAGGED
If the text is clean and not about that topic at all, respond with exactly: CLEAN
Only respond with one word: FLAGGED or CLEAN. Nothing else.

MODE: REWORD
The user's text is about a topic that needs to be reworded. Rewrite it to be about a generic "appointment" or "session" — keep the exact same tone, style, length, and all specific details (colors, sizes, placement descriptions become generic area references, style preferences become general preferences). Remove all references to the flagged topic. Make it sound like a generic scheduling request. Keep it natural and preserve the user's voice. Return ONLY the reworded text, nothing else.`,
};

export async function POST(request: NextRequest) {
  try {
    const { text, mode } = (await request.json()) as {
      text: string;
      mode: "check" | "reword";
    };

    if (!text || !mode) {
      return NextResponse.json(
        { error: "text and mode are required" },
        { status: 400 },
      );
    }

    const userMessage =
      mode === "check"
        ? `MODE: CHECK\n\n${text}`
        : `MODE: REWORD\n\n${text}`;

    const messages = [SYSTEM_PROMPT, { role: "user", content: userMessage }];

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.3,
          max_tokens: 1024,
        }),
      },
    );

    const status = res.status;
    const raw = await res.text();

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      console.error("Failed to parse AI response:", raw);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 502 },
      );
    }

    if (!res.ok) {
      console.error("AI provider error:", status, data);
      return NextResponse.json(
        { error: "AI provider error", providerStatus: status },
        { status: 502 },
      );
    }

    type GroqResponse = {
      choices?: { message?: { content?: string } }[];
    };
    const reply = (
      (data as GroqResponse).choices?.[0]?.message?.content ?? ""
    ).trim();

    if (mode === "check") {
      const flagged = reply.toUpperCase().includes("FLAGGED");
      return NextResponse.json({ flagged });
    }

    // mode === "reword"
    return NextResponse.json({ reworded: reply });
  } catch (err) {
    console.error("AI cleanser error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
