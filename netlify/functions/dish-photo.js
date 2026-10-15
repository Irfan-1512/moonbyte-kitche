// Finds a dish photo from the server, so the browser never calls these sites itself.
// 1) TheMealDB (free test key "1", no signup), 2) Wikipedia (no key) as a fallback.
const reply = (statusCode, body) => ({
  statusCode,
  headers: { "Cache-Control": "public, max-age=86400" },
  body: JSON.stringify(body)
});

const norm = s => String(s).toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
const matches = (title, key) => {
  const got = norm(title);
  return got.length >= 4 && (got === key || got.includes(key) || key.includes(got));
};
const okHost = (u, hosts) => u.protocol === "https:" && hosts.some(h => u.hostname === h || u.hostname.endsWith("." + h));
const getJson = async url => {
  const res = await fetch(url, {
    headers: { "User-Agent": "MoonbyteKitchen/1.0 (hackathon demo)" },
    signal: AbortSignal.timeout(6000)
  });
  return res.ok ? res.json() : null;
};

async function fromMealDb(dish, key) {
  const data = await getJson("https://www.themealdb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(dish));
  const meals = data && Array.isArray(data.meals) ? data.meals : [];
  const hit = meals.find(m => matches(m.strMeal || "", key));
  if (!hit || typeof hit.strMealThumb !== "string") return null;
  const u = new URL(hit.strMealThumb);
  return okHost(u, ["themealdb.com"]) ? { url: u.href, source: "TheMealDB" } : null;
}

async function fromWikipedia(dish, key) {
  const api = "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=5"
    + "&prop=pageimages&piprop=thumbnail&pithumbsize=600&gsrsearch=" + encodeURIComponent(dish);
  const data = await getJson(api);
  const pages = data && data.query && data.query.pages ? Object.values(data.query.pages) : [];
  pages.sort((a, b) => (a.index || 99) - (b.index || 99));
  // Accept a page only if its title really matches the dish and it has a real picture.
  const hit = pages.find(p => p.thumbnail && typeof p.thumbnail.source === "string"
    && !/\.svg/i.test(p.thumbnail.source) && matches(p.title || "", key));
  if (!hit) return null;
  const u = new URL(hit.thumbnail.source);
  return okHost(u, ["wikimedia.org"]) ? { url: u.href, source: "Wikipedia" } : null;
}

exports.handler = async function (event) {
  const dish = String((event.queryStringParameters || {}).dish || "").trim();
  if (!dish || dish.length > 80) return reply(400, { url: null });
  const key = norm(dish);
  if (!key) return reply(400, { url: null });

  for (const lookup of [fromMealDb, fromWikipedia]) {
    try {
      const found = await lookup(dish, key);
      if (found) return reply(200, found);
    } catch (err) {
      console.log("dish-photo lookup failed:", lookup.name, err.message);
    }
  }
  return reply(200, { url: null });
};