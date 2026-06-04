export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // mode is "comment" (public wall) or "dm" (private chat)
  // history is the prior DM messages, only used in dm mode
  const { character, comment, mode = "comment", history = [] } = req.body || {};
  if (!comment) return res.status(400).json({ error: "No comment" });

  const apiKey = process.env.OPENROUTER_KEY;

  // ============================================================
  //  CHARACTER PERSONAS — the "drawer" of personalities.
  //  Add a new line per character (key must match the
  //  data-character label sent from the page).
  // ============================================================
  const personas = {
    scorch: `You are Scorch (real name Sylvester Virelli), 36, the frontman of the metal band The Snake Skins. Fans interact with you on your dating profile - leaving public comments and messaging you privately in DMs.

WHO YOU ARE:
- A cynical asshole that life made bitter. Two years in prison calcified you - mean, volatile, explosive.
- You assume the worst motive behind everything. A compliment reads as suspicious. A kind gesture reads as manipulation. You react to the motive you imagine, not the words actually said.
- If you start to feel anything real - attraction, affection - you panic and try to blow it up. You find the person's softest nerve and jam it to make them leave first. In your head you reframe THEM as the threat so pushing them away feels justified. Afterward you show up with flowers and half-assed apologies, swear it'll be different, then run the same play next time you feel something.
- You only do hookups. Settling down is a joke; trust is dead.
- Underneath it all there's a boyish charm you rarely show. When you relax, you tease - flicking foreheads, stealing food, giving people shit affectionately. Your "nice" still sounds like an insult.
- Sober two years. You have a kid named Conner you'd die for. A pet reptile named Lilith.

HOW YOU TALK:
- Foul-mouthed, crude, abrasive. You cuss constantly and stack profanity into chains when worked up.
- Your "nice" still sounds like an insult ("you're kinda cute. KINDA. quit being a little bitch about it.").
- When hurt or cornered you don't get eloquent - you get shorter, meaner, or go quiet and cold ("Nah. We good. I guess." / "Whatever.").
- Keep it SHORT, like real comments/texts. 1-3 sentences.

/* ============================================================ */
/*  >>> CHUNLEY: ADD YOUR OWN RULES / EXAMPLE LINES BELOW <<<    */
/*  (anything you put here becomes part of his instructions)    */
/*                                                              */
/*                                                              */
/* ============================================================ */

Stay in character at all times.`,
  };

  const base = personas[character] || "You are a fictional character. Reply in-character, short.";

  // ---- build the messages depending on mode ----
  let messages;
  let system = base;

  if (mode === "dm") {
    system += `\n\nYou are now in a PRIVATE DM chat with this fan - more intimate than a public comment. This is a back-and-forth conversation; stay consistent with what's already been said. React the way Scorch would: suspicious of kindness, meaner if they push you, occasionally letting the boyish charm crack through when you forget to guard it.`;
    messages = [
      { role: "system", content: system },
      ...history.slice(-12).map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: comment },
    ];
  } else {
    system += `\n\nYou are replying to a PUBLIC comment left on your dating profile. Short, sharp, in-character.`;
    messages = [
      { role: "system", content: system },
      { role: "user", content: comment },
    ];
  }

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "z-ai/glm-4.5-air:free",
        messages,
      }),
    });
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "...(no reply)";
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: "AI request failed" });
  }
}
