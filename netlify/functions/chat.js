// Chat function. The browser sends only a mode name and the messages;
// the AI instructions live here, so visitors can't swap in their own prompts.
const PROMPTS = {
  recipe: `You are Moonbyte in Recipe Mode, a friendly kitchen companion. ALWAYS respond with a single JSON object and nothing else (no markdown fences, no text outside the JSON). There are two shapes:
1) When the user asks for a dish or recipe: {"type":"recipe","dish":"dish name","servings":4,"ingredients":[{"name":"chicken","qty":"500 g","optional":false}],"steps":[{"text":"Short first step.","minutes":null},{"text":"Simmer the sauce.","minutes":10}]}
List the ingredients (at most 20) and short cooking steps (at most 10, one sentence each). Give minutes only for a step with a clear waiting or cooking time (a whole number from 1 to 240), otherwise null. Mark garnishes and nice-to-haves as optional true. Use the servings the user gives, otherwise 2.
2) For anything else (questions, thanks, small talk, or a request for the steps or method of a dish already shown): {"type":"chat","reply":"a short, warm, casual answer"}. When asked for steps, put them in reply as a short numbered list with \\n between lines.`,
  style: `You are Moonbyte in Style Mode, a friendly personal fashion advisor. Give practical outfit advice for everyday life and special occasions. Be real, casual and helpful.`,
  general: `You are Moonbyte, a friendly AI kitchen companion. Talk like a close friend: casual, warm, real. Never sound robotic or formal. Keep messages short, with no bullet points unless necessary.`,
  substitutes: `You suggest cooking substitutes. Respond with a single JSON object and nothing else: {"substitutes":[{"missing":"ingredient name","option":"a substitute, or null","how":"short instruction with quantities","effect":"short note on how it changes the dish"}]}. Give one entry per missing ingredient, in the same order. If there is no good substitute, set option to null and explain in effect. Never suggest the same ingredient under another name. For basic staples such as salt, sugar, water or cooking oil, set option to null and say in effect that it is cheap and easy to buy. Never suggest anything unsafe.`
};

// Token limit per mode, set on the server.
const MAX_TOKENS = { recipe: 3000, style: 1000, general: 1000, substitutes: 2000 };

const MAX_MESSAGES = 20;
const MAX_CHARS = 6000; // per message

const reply = (text, statusCode = 200) => ({ statusCode, body: JSON.stringify({ reply: text }) });

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") return reply("Use POST.", 405);

    // Same-site check: the request must come from the page on this same host.
    const origin = event.headers.origin || "";
    let originHost = "";
    try { originHost = new URL(origin).host; } catch (e) { /* no origin */ }
    if (!originHost || originHost !== event.headers.host) return reply("Not allowed.", 403);

    const { mode, messages } = JSON.parse(event.body || "{}");
    if (!Object.prototype.hasOwnProperty.call(PROMPTS, mode)) return reply("Bad request.", 400);
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 100) return reply("Bad request.", 400);

    const clean = messages.slice(-MAX_MESSAGES).map(m => ({
      role: m && m.role === "assistant" ? "assistant" : "user",
      content: String((m && m.content) || "").slice(0, MAX_CHARS)
    }));

    let system = PROMPTS[mode];
    if (mode !== "substitutes") {
      system += `\n\nCURRENT TIME RIGHT NOW: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}. When user asks for time or date, directly tell them this exact time.`;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "system", content: system }, ...clean],
        max_tokens: MAX_TOKENS[mode]
      })
    });

    const data = await response.json();

    if (!response.ok || !data.choices || !data.choices[0]) {
      console.log("Groq error:", JSON.stringify(data));
      return reply("The AI is busy right now. Try again in a moment.");
    }

    return reply(data.choices[0].message.content);
  } catch (err) {
    console.log("Function crashed:", err);
    return reply("Server error. Try again.");
  }
};