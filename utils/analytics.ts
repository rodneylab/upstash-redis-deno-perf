import { Temporal } from "js-temporal/";
import { Redis } from "upstash/mod.ts";

const TINYBIRD_PIPE_NAME = Deno.env.get("TINYBIRD_PIPE_NAME");
const TINYBIRD_TOKEN = Deno.env.get("TINYBIRD_TOKEN");

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

export async function getTinybirdViews({
  days,
}: {
  days: number;
}): Promise<number> {
  try {
    if (typeof TINYBIRD_PIPE_NAME === "undefined") {
      throw new Error("env `TINYBIRD_PIPE_NAME` must be set");
    }
    if (typeof TINYBIRD_TOKEN === "undefined") {
      throw new Error("env `TINYBIRD_TOKEN` must be set");
    }

    const cachedCount = (await redis.get("view-count")) as number | null;

    if (cachedCount != null) {
      return cachedCount;
    }

    const endDatetime = Temporal.Now.zonedDateTimeISO("UTC");
    const endDate = endDatetime.toString().split("T")[0];
    const startDate = endDatetime.subtract({ days }).toString().split("T")[0];

    const params = {
      start_datetime: `${startDate} 00:00:00`,
      end_datetime: `${endDate} 00:00:00`,
    };

    const response = await fetch(
      `https://api.tinybird.co/v0/pipes/${TINYBIRD_PIPE_NAME}.json?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${TINYBIRD_TOKEN}`,
        },
      },
    );

    const {
      data: [{ count_sessions: count = -1 }],
    } = await response.json();

    if (typeof count === "number" && count > 0) {
      const CACHE_TTL_SECONDS = 14_400;
      await redis.set("view-count", count);
      await redis.expire("view-count", CACHE_TTL_SECONDS);
    }

    return count;
  } catch (error: unknown) {
    console.error(`Error in getTinybirdViews: ${error as string}`);
    return -1;
  }
}
