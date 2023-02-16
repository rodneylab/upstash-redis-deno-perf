import { Redis } from "upstash/mod.ts";

const UPSTASH_REDIS_REST_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
if (typeof UPSTASH_REDIS_REST_TOKEN === "undefined") {
  console.error("env `UPSTASH_REDIS_REST_TOKEN` must be set");
}
const UPSTASH_REDIS_REST_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
if (typeof UPSTASH_REDIS_REST_URL === "undefined") {
  console.error("env `UPSTASH_REDIS_REST_URL` must be set");
}

const redis = new Redis({
  token: UPSTASH_REDIS_REST_TOKEN,
  url: UPSTASH_REDIS_REST_URL,
});

const WEBMENTION_DOMAIN = Deno.env.get("WEBMENTION_DOMAIN");
const WEBMENTION_TOKEN = Deno.env.get("WEBMENTION_TOKEN");

interface WebmentionAuthor {
  type: string;
  name: string;
  photo: string;
  url: string;
}

interface Webmention {
  type: string;
  author: WebmentionAuthor;
  url: string;
  published: null | string;
  "wm-received": string;
  "wm-id": number;
  "wm-source": string;
  "wm-target": string;
  "like-of"?: string;
  "wm-property": string;
  "wm-private": boolean;
}

export async function getWebmentionLikes(pathname: string): Promise<number> {
  try {
    if (typeof WEBMENTION_DOMAIN === "undefined") {
      throw new Error("env `WEBMENTION_DOMAIN` must be set");
    }
    if (typeof WEBMENTION_TOKEN === "undefined") {
      throw new Error("env `WEBMENTION_TOKEN` must be set");
    }

    const cachedCount = (await redis.get("like-count")) as number | null;

    if (cachedCount != null) {
      return cachedCount;
    }

    const MENTIONS_PER_PAGE = 50;
    let count = MENTIONS_PER_PAGE;
    let page = 0;

    while (count === MENTIONS_PER_PAGE) {
      const params = new URLSearchParams({
        domain: WEBMENTION_DOMAIN,
        token: WEBMENTION_TOKEN,
        "per-page": MENTIONS_PER_PAGE.toString(),
        page: page.toString(),
        target: `https://${WEBMENTION_DOMAIN}${pathname}`,
        "wm-property": "like-of",
      });
      const response = await fetch(
        `https://webmention.io/api/mentions.jf2?${params.toString()}`,
      );
      const { children } = (await response.json()) as {
        children: Webmention[];
      };
      count = children.length;
      page += 1;
    }

    if (typeof count === "number" && count > 0) {
      const CACHE_TTL_SECONDS = 14_400;
      await redis.set("view-count", count);
      await redis.expire("view-count", CACHE_TTL_SECONDS);
    }

    return count;
  } catch (error: unknown) {
    console.error(`Error in getWebmentionLikes: ${error as string}`);
    return -1;
  }
}
