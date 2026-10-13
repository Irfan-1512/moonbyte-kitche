# Moonbyte Kitchen

An AI kitchen companion that turns "what do I want to cook?" into a checklist, smart substitutes and a cart, with a human approving every purchase.

Built for the **PayPal AI Hackathon**. It extends my earlier project, Moonbyte (a browser-based AI assistant), with a complete recipe-to-cart flow.

**Live demo:** https://moonbyte-kitchen.netlify.app

## What it does

1. **Ask for a dish.** Type "butter chicken for 4". The AI returns an ingredient checklist, short cooking steps, and a countdown timer for every step that has a time.
2. **Tick what you already have.**
3. **Get substitutes.** For each missing ingredient the AI suggests a substitute, explains how it changes the dish, and you accept or reject it. It says honestly when there is no good substitute.
4. **Build a cart.** Whatever is still missing is matched to a demo grocery store (74 items). Change quantities, remove items, or save the list for later. The cart stays in sync if you change your mind about a substitute.
5. **Approve and pay.** Nothing is ordered until you press **Approve**. The payment step uses the PayPal sandbox (see Status below).

There are also **Style** and **General** modes with their own look. Voice input, text-to-speech, dark and light themes and chat history carry over from the original Moonbyte.

## Status

| Area | State |
| --- | --- |
| Recipe checklist, steps and step timers | Working |
| AI substitutes with accept and reject | Working |
| Demo grocery catalogue, matching and cart | Working |
| Approve button and order object | Working (builds the order and hands it to `checkout()`) |
| **PayPal sandbox payment** (create order, buyer approves, capture) | **In progress.** `checkout()` in `index.html` is the placeholder where it plugs in. |
| Dish photos, dietary toggle, second-option suggestion | Planned |
| Style mode checkout (same cart, wardrobe catalogue) | Planned |

> This table is kept honest: anything marked "In progress" or "Planned" is not part of the working demo.

## How AI and PayPal are used

- **AI:** Groq (`openai/gpt-oss-120b`), called from a Netlify Function. It produces the recipe as structured JSON (ingredients, steps, optional timers), suggests substitutes, and handles chat. The replies are validated before they are shown, and bad or cut-off output is handled with a friendly message.
- **PayPal:** the Orders API in the free sandbox, using OAuth with a client ID and secret kept on the server. The flow is create order, buyer approves, capture.
- **Human in the loop:** the AI proposes and the user approves. There is no code path where the AI orders or pays by itself.

## What is new for this hackathon

The original Moonbyte already had the chat interface, the Groq function, voice, themes and history. The hackathon work is everything in the recipe flow: structured recipes, the checklist card, step timers, substitutes, the demo store, matching, the cart, the shopping list, per-mode looks, and the removal of unrelated modes.

## Run it yourself

You need Node 18 or newer and a free Groq API key from [console.groq.com](https://console.groq.com).

```bash
git clone https://github.com/Irfan-1512/moonbyte-kitche.git
cd moonbyte-kitche
```

Create a file named `.env` in the project folder:

```
GROQ_API_KEY=your-groq-key
```

Then start it and open `http://localhost:8888`:

```bash
npx netlify-cli dev
```

When the PayPal sandbox is connected, add these two as well (from your sandbox app at [developer.paypal.com](https://developer.paypal.com)):

```
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_SECRET=your-sandbox-secret
```

| Variable | Needed for |
| --- | --- |
| `GROQ_API_KEY` | Chat, recipes and substitutes (required) |
| `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` | Sandbox payments (once checkout is connected) |

### Deploying on Netlify

Import the repo in Netlify, leave the build settings empty, and add the same variables under **Environment variables**. Redeploy after changing a variable.

## Project structure

```
index.html                 The whole front end (UI, recipe card, timers, cart)
netlify.toml               Points Netlify at the functions folder
netlify/functions/chat.js  Server-side AI call (keeps the key off the browser)
data/catalogue.json        The demo grocery store (made-up prices)
LICENSE                    MIT
```

## Safety and honesty notes

- **Demo store only.** Prices are made up and payments use the PayPal sandbox. No real purchase is ever made.
- **Keys stay on the server.** API keys live in environment variables, never in the code or the repo.
- **Output is shown as text.** Model replies are escaped, so odd output cannot inject code into the page.
- **Substitutes are suggestions.** Check labels and allergens yourself. The AI says when no good substitute exists and does not suggest renaming the same ingredient.

## Known limits

- Only 74 demo products. Ingredients that are not in the store are listed and skipped.
- Chat history, the shopping list and timers live in your browser only.
- The catalogue prices are in US dollars.

## License

MIT. See [LICENSE](LICENSE).
