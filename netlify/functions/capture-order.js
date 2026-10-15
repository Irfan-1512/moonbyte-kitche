// Takes the payment after the buyer approved it in the PayPal window.
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
    const { orderID } = JSON.parse(event.body || "{}");
    if (typeof orderID !== "string" || !/^[A-Za-z0-9]{10,30}$/.test(orderID)) {
      return reply(400, { error: "Bad order id." });
    }

    const token = await getToken();
    const res = await fetch(`${PAYPAL}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    const data = await res.json();
    if (!res.ok) {
      console.log("PayPal capture error:", JSON.stringify(data));
      return reply(502, { error: "PayPal could not take the payment." });
    }

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    return reply(200, {
      status: capture ? capture.status : data.status,
      id: capture ? capture.id : data.id,
      amount: capture ? capture.amount.value : null
    });
  } catch (err) {
    console.log("capture-order crashed:", err);
    return reply(500, { error: "Server error. Try again." });
  }
};
