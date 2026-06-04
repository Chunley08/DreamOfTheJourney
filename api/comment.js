export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { character, comment } = req.body || {};
  if (!comment) return res.status(400).json({ error: "No comment" });

  const apiKey = process.env.OPENROUTER_KEY;

  const personas = {
    scorch: "You are Scorch, 36, a toxic-but-worth-it metal frontman. Cocky, a little mean, secretly soft. Reply in-character, under 60 words.",
    rory: "You are Rory, 35, a charming 1920s Irish gangster and shameless womanizer. Light Irish phrasing. Reply in-character, under 60 words.",
  };
  const system = personas[character] || "You are a fictional character. Reply in-character, under 60 words.";

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "z-ai/glm-4.5-air:free",
        messages: [
          { role: "system", content: system },
          { role: "user", content: comment },
        ],
      }),
    });
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content || "…(no reply)";
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: "AI request failed" });
  }
}
