import type { Handlers, PageProps } from "$fresh/server.ts";
import "$std/dotenv/load.ts";
import { Layout } from "@/components/Layout.tsx";
import { getTinybirdViews } from "@/utils/analytics.ts";
import { timeEvent } from "@/utils/performance.ts";
import { getWebmentionLikes } from "@/utils/webmentions.ts";

interface Data {
  likes: number;
  views: number;
}

export const handler: Handlers<Data> = {
  async GET(request, context) {
    const { url } = request;
    const { pathname } = new URL(url);

    const performanceMeasures: PerformanceMeasure[] = [];

    const [likes, views] = await Promise.all([
      timeEvent<number>(() => getWebmentionLikes(pathname), {
        description: "web-mention-likes",
        performanceMeasures,
      }),
      timeEvent<number>(() => getTinybirdViews({ days: 28 }), {
        description: "analytics-views",
        performanceMeasures,
      }),
    ]);

    // Replace with a serverless logging service for production
    console.log({ performanceMeasures });

    return context.render({ likes, views });
  },
};

export default function Home(context: PageProps<Data>) {
  const {
    data: { likes, views },
  } = context;

  return (
    <Layout
      description="Redis and the Performance API: measuring Upstash Redis performance gains with Web APIs to deploy the database optimally in your Deno app."
      title="Upstash Redis Deno Perf"
    >
      <main>
        <h1>Upstash Redis Deno Perf</h1>
        <pre>{JSON.stringify({ likes, views }, null, 2)}</pre>
      </main>
    </Layout>
  );
}
