"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Home, Menu, X } from "lucide-react";

const deckPath = "/presentations/application-workflow/workflow.pptx";

const slides = Array.from({ length: 22 }, (_, index) => {
  const page = index + 1;

  return {
    id: `slide-${page}`,
    image: `/presentations/application-workflow/slide-${page}.png`,
  };
});

function scrollToSlide(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export default function ApplicationWorkflowTrainingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <main className="h-screen overflow-hidden bg-black">
      <div className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full bg-black/50 p-2 backdrop-blur-md">
        <button
          type="button"
          aria-label={sidebarOpen ? "Hide slides" : "Show slides"}
          onClick={() => setSidebarOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full bg-black/50 p-2 backdrop-blur-md">
        <Link
          href="/"
          aria-label="Home"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <Home className="h-5 w-5" />
        </Link>

        <a
          href={deckPath}
          download
          aria-label="Download"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <Download className="h-5 w-5" />
        </a>
      </div>

      <aside
        className={[
          "fixed left-0 top-0 z-40 h-screen w-32 overflow-y-auto bg-black/80 p-3 pt-20 backdrop-blur-md transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="space-y-3">
          {slides.map((slide) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => scrollToSlide(slide.id)}
              className="block w-full overflow-hidden rounded-lg border border-white/15 bg-white/5 transition hover:border-white/60"
              aria-label={slide.id}
            >
              <img
                src={slide.image}
                alt=""
                className="aspect-video w-full object-cover"
              />
            </button>
          ))}
        </div>
      </aside>

      <section
        className={[
          "h-screen snap-y snap-mandatory overflow-y-auto scroll-smooth transition-[padding] duration-300",
          sidebarOpen ? "lg:pl-32" : "lg:pl-0",
        ].join(" ")}
      >
        {slides.map((slide) => (
          <section
            key={slide.id}
            id={slide.id}
            className="relative flex h-screen snap-start items-center justify-center bg-black"
          >
            <img
              src={slide.image}
              alt=""
              className="h-full w-full object-contain"
              draggable={false}
            />

            <Link
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Dashboard"
              className="absolute bottom-[4.8%] right-[2.2%] h-[7.6%] w-[14.5%] rounded-xl"
            />
          </section>
        ))}
      </section>
    </main>
  );
}
