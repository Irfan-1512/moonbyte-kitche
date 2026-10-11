exports.handler = async function (event) {
  try {
    const { messages, systemPrompt, maxTokens } = JSON.parse(event.body || "{}");

    if (!Array.isArray(messages) || typeof systemPrompt !== "string") {
      return { statusCode: 400, body: JSON.stringify({ reply: "Bad request." }) };
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20)
        ],
        max_tokens: Math.min(Number(maxTokens) || 1000, 4000)
      })
    });

    const data = await response.json();

    if (!response.ok || !data.choices || !data.choices[0]) {
      console.log("Groq error:", JSON.stringify(data));
      return {
        statusCode: 200,
        body: JSON.stringify({ reply: `Groq failed: ${data.error?.message || "unknown Groq error"}` })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: data.choices[0].message.content })
    };
  } catch (err) {
    console.log("Function crashed:", err);
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: `Server error: ${err.message}` })
    };
  }
};