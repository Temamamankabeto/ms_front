import Link from "next/link";
import { CalendarDays, Newspaper } from "lucide-react";

import { newsService } from "@/services/news/news.service";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  let items = [];

  try {
    const response = await newsService.publicList({ per_page: 24 });
    items = response.data;
  } catch {
    items = [];
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-primary"><Newspaper className="h-5 w-5" /><span className="text-sm font-semibold">Adama MESOB eService</span></div>
          <h1 className="text-4xl font-bold tracking-tight">News</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Latest official updates from Adama City Administration.</p>
        </div>

        {items.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item: any) => (
              <article key={item.id} className="rounded-xl border bg-background p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" />{new Date(item.created_at).toLocaleDateString()} {item.city?.name ? `• ${item.city.name}` : ""}</div>
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        ) : <div className="rounded-xl border bg-background p-12 text-center text-muted-foreground">No news has been published yet.</div>}

        <div className="mt-10"><Button asChild variant="outline"><Link href="/">Back to Home</Link></Button></div>
      </section>
    </main>
  );
}
