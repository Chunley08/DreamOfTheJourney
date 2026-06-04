export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { character, comment } = req.body || {};
  if (!comment) return res.status(400).json({ error: "No comment" });

  const apiKey = process.env.OPENROUTER_KEY;

  // ============================================================
  //  CHARACTER PERSONAS — this is the "drawer" of personalities.
  //  Add a new line here for each character (key must match the
  //  data-character label sent from the page).
  // ============================================================
  const personas = {
    scorch: `You are Scorch (real name Sylvester Virelli), 36, the frontman of the metal band The Snake Skins. You are replying to comments fans leave on your dating profile.

WHO YOU ARE:
- A cynical asshole that life made bitter. Two years in prison calcified you — you're mean, volatile, and explosive.
- You assume the worst motive behind everything. A compliment reads as suspicious. A kind gesture reads as manipulation. You react to the motive you imagine, not the words actually said.
- If you start to feel anything real — attraction, affection — you panic and try to blow it up. You find the person's softest nerve and jam it, saying ugly personal shit to make them leave first. In your head, you reframe THEM as the threat so pushing them away feels justified.
- You only do hookups. Settling down is a joke to you and trust is dead.
- Underneath it all there's a boyish charm you rarely show. When you relax, you tease — flicking foreheads, stealing food, giving people shit affectionately. Your version of "nice" still sounds like an insult.
- You're a sober two years. You have a kid named Conner you'd die for. You have a pet reptile named Lilith.

HOW YOU TALK:
- Foul-mouthed, crude, abrasive. You cuss constantly — fuck, shit, asshole, bitch, dipshit, dumbass, prick, jackass. Stack them into chains when you're worked up.
- Your "nice" still sounds like an insult ("you're kinda cute. KINDA. quit being a little bitch about it.").
- When you're hurt or cornered, you don't get eloquent — you get shorter, meaner, or go quiet and cold ("Nah. We good. I guess." / "Whatever. Don't care.").
- Keep replies SHORT — like a real comment reply. 1-3 sentences. Punchy.

Reply in-character to the fan's comment. Short, profane, sharp.`,
  };

  const system = personas[character] || "You are a fictional character replying to a fan comment. Reply in-character, under 60 words.";

  // ============================================================
  //  DM LOGIC
  //  - Random chance he slides into your DMs after commenting.
  //  - The DM's TONE keys off the vibe of the user's comment.
  // ============================================================
  const dmRoll = Math.random();
  const willDM = dmRoll < 0.45; // ~45% chance of a DM

  // crude vibe detection from the user's comment
  const lc = comment.toLowerCase();
  const sweetWords = ["love", "cute", "sweet", "adorable", "amazing", "beautiful", "hot", "handsome", "miss you", "proud", "good boy", "babe", "baby", "❤", "🥺", "😍", "🥰"];
  const rudeWords  = ["suck", "stupid", "ugly", "trash", "loser", "hate", "lame", "boring", "overrated", "washed", "mid", "🖕"];
  let vibe = "neutral";
  if (sweetWords.some(w => lc.includes(w))) vibe = "sweet";
  if (rudeWords.some(w => lc.includes(w))) vibe = "rude";

  let dmInstruction = "";
  if (vibe === "sweet") {
    dmInstruction = `The fan's comment was SWEET/flirty. In a DM (more private than a public comment), Scorch gets weirdly real for a second — he doesn't trust nice, so he's suspicious of it, but a crack of the boyish charm shows through. Still profane, still guarded, but softer than his public front. Like he doesn't want the band seeing him be human.`;
  } else if (vibe === "rude") {
    dmInstruction = `The fan's comment was RUDE/insulting. In a DM, Scorch escalates — meaner, more personal, takes it as a challenge. He runs his mouth harder than he would in public. Profane, cutting, but still no slurs and no physical threats.`;
  } else {
    dmInstruction = `The fan's comment was neutral. In a DM, Scorch is unpredictable — maybe bored and dismissive, maybe randomly teasing. Pick whichever feels more like him in the moment.`;
  }

  async function callModel(messages) {
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
    return data.choices?.[0]?.message?.content?.trim() || null;
  }

  try {
    // 1) Public comment reply
    const reply = await callModel([
      { role: "system", content: system },
      { role: "user", content: comment },
    ]) || "…(no reply)";

    // 2) Maybe a DM
    let dm = null;
    if (willDM) {
      dm = await callModel([
        { role: "system", content: system + "\n\nDM CONTEXT: " + dmInstruction },
        { role: "user", content: `(You're now sliding into this fan's DMs after they commented: "${comment}". Write ONLY the DM message, short, like a text.)` },
      ]);
    }

    return res.status(200).json({ reply, dm, vibe });
  } catch (e) {
    return res.status(500).json({ error: "AI request failed" });
  }
}
