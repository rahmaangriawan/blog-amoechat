const baseUrl = new URL(process.argv[2] || "http://127.0.0.1:3011");
const extraPaths = [
  "/program/daftar",
  "/cara-pembayaran",
  "/cara-berlangganan",
  "/promo",
  "/checkout",
  "/packages",
  "/packages/free",
];

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function firstMatch(html, pattern) {
  return decodeHtml(html.match(pattern)?.[1] || "");
}

function metaContent(html, key, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const keyValue = firstMatch(tag, new RegExp(`${key}=["']([^"']+)["']`, "i"));
    if (keyValue.toLowerCase() !== value.toLowerCase()) continue;
    return firstMatch(tag, /content=["']([^"']*)["']/i);
  }
  return "";
}

function linkHref(html, rel) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const relation = firstMatch(tag, /rel=["']([^"']+)["']/i).toLowerCase().split(/\s+/);
    if (relation.includes(rel)) return firstMatch(tag, /href=["']([^"']+)["']/i);
  }
  return "";
}

function inspectJsonLd(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const types = new Set();
  const errors = [];

  for (const [index, match] of scripts.entries()) {
    try {
      const data = JSON.parse(match[1]);
      const visit = (value) => {
        if (!value || typeof value !== "object") return;
        if (Array.isArray(value)) return value.forEach(visit);
        if (value["@type"]) {
          for (const type of Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]]) types.add(type);
        }
        Object.values(value).forEach(visit);
      };
      visit(data);
    } catch (error) {
      errors.push(`script ${index + 1}: ${error.message}`);
    }
  }

  return { count: scripts.length, types: [...types].sort(), errors };
}

async function fetchChain(pathname) {
  let current = new URL(pathname, baseUrl);
  const chain = [];

  for (let hop = 0; hop < 6; hop += 1) {
    const response = await fetch(current, { redirect: "manual", headers: { accept: "text/html" } });
    const location = response.headers.get("location");
    chain.push({ url: current.toString(), status: response.status, location });
    if (response.status < 300 || response.status >= 400 || !location) {
      return { response, html: await response.text(), chain };
    }
    current = new URL(location, current);
    if (current.origin !== baseUrl.origin) {
      chain.push({ url: current.toString(), status: null, location: null });
      return { response, html: "", chain };
    }
  }

  throw new Error(`Redirect chain terlalu panjang untuk ${pathname}`);
}

const sitemapResponse = await fetch(new URL("/sitemap.xml", baseUrl));
if (!sitemapResponse.ok) throw new Error(`Sitemap gagal dimuat: ${sitemapResponse.status}`);
const sitemapXml = await sitemapResponse.text();
const sitemapUrls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decodeHtml(match[1]));
const sitemapPaths = sitemapUrls.map((value) => {
  const url = new URL(value);
  return `${url.pathname}${url.search}`;
});
const paths = [...new Set([...sitemapPaths, ...extraPaths])];
const rows = [];

for (const pathname of paths) {
  const { response, html, chain } = await fetchChain(pathname);
  const robots = metaContent(html, "name", "robots");
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const description = metaContent(html, "name", "description");
  const canonical = linkHref(html, "canonical");
  let selfCanonical = false;
  try {
    selfCanonical = new URL(canonical, baseUrl).pathname === new URL(pathname, baseUrl).pathname;
  } catch {
    selfCanonical = false;
  }
  const h1Values = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) =>
    decodeHtml(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")),
  );
  const imageTags = html.match(/<img\b[^>]*>/gi) || [];
  const missingAlt = imageTags.filter((tag) => !/\balt=["'][^"']+["']/i.test(tag)).length;
  const internalLinks = (html.match(/<a\b[^>]*href=["']\/(?!\/)/gi) || []).length;
  const jsonLd = inspectJsonLd(html);
  const initialStatus = chain[0].status;
  const inSitemap = sitemapPaths.includes(pathname);
  const classification =
    initialStatus >= 300 && initialStatus < 400
      ? "redirect"
      : /\bnoindex\b/i.test(robots)
        ? "noindex"
        : response.status === 200 && inSitemap
          ? "indexable"
          : response.status === 200
            ? "coverage-gap"
            : "error";

  rows.push({
    path: pathname,
    classification,
    inSitemap,
    status: initialStatus,
    finalStatus: response.status,
    redirectHops: chain.length - 1,
    finalUrl: chain.at(-1).url,
    canonical,
    selfCanonical,
    robots,
    title,
    description,
    h1Count: h1Values.length,
    h1: h1Values[0] || "",
    ogTitle: metaContent(html, "property", "og:title"),
    ogDescription: metaContent(html, "property", "og:description"),
    ogImage: metaContent(html, "property", "og:image"),
    twitterCard: metaContent(html, "name", "twitter:card"),
    jsonLdCount: jsonLd.count,
    jsonLdTypes: jsonLd.types.join("|"),
    jsonLdErrors: jsonLd.errors.join("|"),
    imageCount: imageTags.length,
    missingImageAlt: missingAlt,
    internalLinks,
  });
}

console.log(JSON.stringify({ baseUrl: baseUrl.toString(), sitemapUrls, rows }, null, 2));
