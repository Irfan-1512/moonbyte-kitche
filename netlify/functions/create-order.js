// Creates a PayPal sandbox order. The browser sends only item ids and quantities;
// prices come from data/catalogue.json here on the server, so the total can't be tampered with.
const PAYPAL = "https://api-m.sandbox.paypal.com";

const reply = (statusCode, body) => ({ statusCode, body: JSON.stringify(body) });

async function getToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env;
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) throw new Error("PayPal keys are not set on the server.");
  const res = await fetch(`${PAYPAL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error("Could not sign in to PayPal.");
  return data.access_token;
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return reply(405, { error: "Use POST." });
  try {
    const { items } = JSON.parse(event.body || "{}");
    if (!Array.isArray(items) || items.length < 1 || items.length > 40) {
      return reply(400, { error: "Bad cart." });
    }

    const proto = event.headers["x-forwarded-proto"] || "http";
    const catRes = await fetch(`${proto}://${event.headers.host}/data/catalogue.json`);
    if (!catRes.ok) return reply(500, { error: "Could not load the demo store." });
    const catalogue = await catRes.json();

    let cents = 0;
    const seen = new Set();
    for (const it of items) {
      const qty = Number(it && it.qty);
      const product = catalogue.find(p => p.id === (it && it.id));
      if (!product || seen.has(product.id) || !Number.isInteger(qty) || qty < 1 || qty > 9) {
        return reply(400, { error: "Bad cart item." });
      }
      seen.add(product.id);
      cents += Math.round(product.price * 100) * qty;
    }
    const value = (cents / 100).toFixed(2);

    const token = await getToken();
    const res = await fetch(`${PAYPAL}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          description: "Moonbyte Kitchen demo order (sandbox)",
          amount: { currency_code: "USD", value }
        }]
      })
    });
    const data = await res.json();
    if (!res.ok || !data.id) {
      console.log("PayPal create error:", JSON.stringify(data));
      return reply(502, { error: "PayPal could not create the order." });
    }
    return reply(200, { id: data.id, total: value });
  } catch (err) {
    console.log("create-order crashed:", err);
    return reply(500, { error: "Server error. Try again." });
  }
};
