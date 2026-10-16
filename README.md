# Moonbyte Kitchen

An AI kitchen companion that turns "what do I want to cook?" into a checklist, smart substitutes and a cart, with a human approving every purchase.

Built for the **PayPal AI Hackathon**. It extends my earlier project, Moonbyte (a browser-based AI assistant), with a complete recipe-to-cart flow and a PayPal sandbox checkout.

**Live demo:** <https://moonbyte-kitchen.netlify.app>

## What it does

1. **Ask for a dish.** Type "butter chicken for 4". The AI returns a photo (when one is found), an ingredient checklist, short cooking steps, and a countdown timer for every step that has a time.
2. **Tick what you already have.** Optionally tick **Vegetarian** or **Nut-free**. If the recipe breaks your choice, a note tells you which ingredients to watch.
3. **Get substitutes.** For each missing ingredient the AI suggests a substitute that respects your dietary choice, explains how it changes the dish, and you accept or reject it. After a reject you can ask for **another** option (up to three). It says honestly when there is no good substitute.
4. **Build a cart.** Whatever is still missing is matched to a demo grocery store (74 items). Change quantities, remove items, or save the list for later. The cart stays in sync if you change your mind about a substitute.
5. **Approve and pay.** Nothing is ordered until you press **Approve and pay** and approve the payment in the PayPal window. Payment uses the **PayPal sandbox** (test money only).
6. **Order confirmation and history.** After a successful payment you see the items and total. The **cart button** in the header shows the cart and your past orders, each with a clearly labelled **simulated** delivery status.

There are also **Style** and **General** modes with their own look. Voice input, text-to-speech, dark and light themes and chat history (pin a chat, delete a chat permanently) carry over from the original Moonbyte.

## Status

| Area | State |
| --- | --- |
| Recipe checklist, steps and step timers | Working |
| AI substitutes with accept, reject and "suggest another" | Working |
| Dietary toggle (vegetarian, nut-free) | Working (the ingredient warning checks ingredient names only) |
| Demo grocery catalogue, matching and cart | Working |
| **PayPal sandbox payment** (create order, buyer approves, capture) | **Working** in the sandbox |
| Order confirmation, order history, simulated delivery status | Working (delivery is a simulation, nothing is shipped) |
| Dish photos | Working for dishes found on TheMealDB or Wikipedia, a placeholder otherwise |
| Chat server lock-down | Working (see Safety notes) |
| Style mode checkout (same cart, wardrobe catalogue) | Planned |

> This table is kept honest: anything marked "Planned" is not part of the working demo.

## How AI and PayPal are used

- **AI:** Groq (`openai/gpt-oss-120b`), called from a Netlify Function. It produces the recipe as structured JSON (ingredients, steps, optional timers), suggests substitutes, and handles chat. The replies are validated before they are shown, and bad or cut-off output is handled with a friendly message.
- **PayPal:** the Orders API in the free sandbox, using OAuth with a client ID and secret kept on the server. The flow is: the server creates the order, the buyer approves it with the PayPal button, the server captures it. The server works out the total itself from the catalogue, so the price cannot be changed from the browser.
- **Human in the loop:** the AI proposes and the user approves. There is no code path where the AI orders or pays by itself.

## What is new for this hackathon

The original Moonbyte already had the chat interface, the Groq function, voice, themes and history. The hackathon work is everything in the recipe flow: structured recipes, the checklist card, step timers, substitutes, dietary choices, dish photos, the demo store, matching, the cart, the shopping list, the PayPal sandbox checkout, order history, per-mode looks, chat pin and delete, and the removal of unrelated modes.

## Credits

- [Groq](https://groq.com) for the AI model.
- [PayPal Developer](https://developer.paypal.com) sandbox and Orders API for payments.
- [TheMealDB](https://www.themealdb.com) and [Wikipedia](https://www.wikipedia.org) for dish photos (credited on each photo). TheMealDB is used with its free test key.
- [Netlify](https://www.netlify.com) for hosting and functions.

## Run it yourself

You need Node 18 or newer, a free Groq API key from [console.groq.com](https://console.groq.com), and a free PayPal sandbox app from [developer.paypal.com](https://developer.paypal.com).

```
git clone https://github.com/Irfan-1512/moonbyte-kitche.git
cd moonbyte-kitche
```

Create a file named `.env` in the project folder (never commit it):

```
GROQ_API_KEY=your-groq-key
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_SECRET=your-sandbox-secret
```

Open `index.html`, find `PAYPAL_CLIENT_ID` near the top of the script, and put your **sandbox Client ID** there. The Client ID is public by design. The Secret must never go in `index.html`.

Then start it and open `http://localhost:8888`:

```
npx netlify-cli dev
```

To pay in the test, use a **Personal** sandbox account from your PayPal developer dashboard (Testing Tools, Sandbox Accounts).

| Variable | Needed for |
| --- | --- |
| `GROQ_API_KEY` | Chat, recipes and substitutes (required) |
| `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` | Sandbox payments (required for checkout) |

### Deploying on Netlify

Import the repo in Netlify, leave the build settings empty, and add the same three variables under **Environment variables**. Redeploy after changing a variable.

## Project structure

```
index.html                       The whole front end (UI, recipe card, timers, cart, orders)
netlify.toml                     Points Netlify at the functions folder
netlify/functions/chat.js        Server-side AI call with the prompts and safety checks
netlify/functions/create-order.js    Creates the PayPal sandbox order (total from the catalogue)
netlify/functions/capture-order.js   Takes the payment after the buyer approves
netlify/functions/dish-photo.js      Finds a dish photo (TheMealDB, then Wikipedia)
data/catalogue.json              The demo grocery store (made-up prices)
LICENSE                          MIT
```

## Safety and honesty notes

- **Demo store only.** Prices are made up and payments use the PayPal sandbox. No real purchase is ever made, and no delivery happens. The delivery status is a simulation and is labelled as one.
- **Keys stay on the server.** API keys and the PayPal Secret live in environment variables, never in the code or the repo.
- **Chat is locked down.** The browser sends only a mode name and the messages. The AI instructions live on the server, which checks the mode, the number and length of messages, token limits per mode, and that the request comes from the same site. This reduces misuse of the key but cannot fully prevent it.
- **Totals are computed on the server** from the catalogue, never trusted from the browser.
- **Output is shown as text.** Model replies are escaped, so odd output cannot inject code into the page.
- **Substitutes and dietary notes are suggestions.** Check labels and allergens yourself. The AI says when no good substitute exists.

## Known limits

- Only 74 demo products. Ingredients that are not in the store are listed and skipped.
- Not every dish has a photo. Dishes missing from TheMealDB and Wikipedia show a placeholder.
- Chat history, the shopping list, order history and timers live in your browser only, on the device you used.
- The cart panel shows the cart of the most recent recipe on screen, not one cart shared across recipes.
- The catalogue prices and sandbox payments are in US dollars.

## License

MIT. See [LICENSE](LICENSE).