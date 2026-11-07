"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { resolveProfileImageUrl } from "@/lib/profile-image-url";

type CurrentTicket = {
  ticket_number: string;
  status: "called" | "serving";
  window_name: string | null;
  window_title: string | null;
  
};
type CounterData = {
  officer_code: string;
  officer_photo_url: string | null;
  current_ticket: CurrentTicket | null;
  assigned_services?: Array<string | { name?: string | null; service_name?: string | null; title?: string | null }>;
};
type CounterResponse = {
  success: boolean;
  message: string;
  data: CounterData | null;
};

export default function OfficerCounterPage() {
  const params = useParams();
  const officerCode = typeof params.officerCode === "string" ? params.officerCode : "";
  const [counter, setCounter] = useState<CounterData | null>(null);
  const [error, setError] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    if (!officerCode) return;
    let active = true;
    let controller: AbortController | null = null;

    const refresh = async () => {
      if (controller) return;
      const request = new AbortController();
      controller = request;
      try {
        const response = await fetch(
          `/api/public/counter/${encodeURIComponent(officerCode)}`,
          { cache: "no-store", signal: request.signal }
        );
        const result = (await response.json()) as CounterResponse;
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "Unable to load counter.");
        }
        if (active) {
          setCounter(result.data);
          setError("");
        }
      } catch (cause) {
        if (active && !request.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Unable to load counter.");
        }
      } finally {
        if (controller === request) controller = null;
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
      controller?.abort();
    };
  }, [officerCode]);

  useEffect(() => setPhotoFailed(false), [counter?.officer_photo_url]);

  const ticket = counter?.current_ticket;
  const serviceNames = Array.from(new Set(
    (counter?.assigned_services ?? [])
      .map((service) => typeof service === "string" ? service : (service.name ?? service.service_name ?? service.title ?? ""))
      .map((name) => name.trim())
      .filter(Boolean)
  ));
  const marqueeText = serviceNames.join("     •     ");
  const officerPhotoUrl = resolveProfileImageUrl(counter?.officer_photo_url);

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-[#fafbfe] text-[#07145f] lg:h-dvh lg:overflow-hidden">
      <div className="mx-auto grid w-full max-w-[1920px] flex-1 grid-cols-1 gap-4 px-4 py-5 sm:px-6 sm:py-6 md:grid-cols-[minmax(0,35%)_minmax(0,1fr)] md:gap-6 lg:min-h-0 lg:grid-cols-[minmax(0,34%)_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-7 2xl:gap-10 2xl:px-10">
        <aside className="flex min-w-0 flex-col items-center justify-center gap-3 rounded-[24px] bg-white p-4 shadow-[0_10px_45px_rgba(20,40,90,0.08)] sm:gap-4 sm:p-5 lg:min-h-0 lg:gap-5 lg:p-6">
          <img
            src="/mesob-kiosk-logo.png"
            alt="MESOB office logo"
            className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14 lg:h-[clamp(3rem,7vh,5rem)] lg:w-[clamp(3rem,7vh,5rem)]"
          />
          {officerPhotoUrl && !photoFailed ? (
            <img
              src={officerPhotoUrl}
              alt="Officer portrait"
              onError={() => setPhotoFailed(true)}
              className="h-auto max-h-[52vh] w-full max-w-[420px] rounded-2xl object-contain sm:max-h-[58vh] md:max-h-[65vh] lg:min-h-0 lg:max-h-[min(70vh,calc(100dvh-12rem))]"
            />
          ) : (
            <div className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-2xl bg-slate-100 text-slate-400 lg:max-w-[360px]">
              <UserRound className="h-24 w-24 sm:h-32 sm:w-32" aria-label="Officer portrait unavailable" />
            </div>
          )}
        </aside>
        <section className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-5 py-2 sm:gap-7 lg:gap-8">
          <header className="w-full min-w-0 text-center">
            <h1 className="text-[clamp(1.5rem,3.6vw,4.5rem)] font-extrabold tracking-tight drop-shadow-md">
              LAKK. OOFISARAA
            </h1>
            <p className="mt-2 break-words text-center text-[clamp(2.8rem,7.3vw,9rem)] font-black leading-[1.05] tracking-tight drop-shadow-[0_10px_14px_rgba(7,20,95,0.20)]">
              {counter?.officer_code ?? officerCode.toUpperCase()}
            </p>
          </header>
          <div className="flex min-h-[210px] w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-[26px] bg-[#07145f] px-4 py-7 text-center text-white shadow-[0_15px_40px_rgba(7,20,95,0.20)] sm:min-h-[260px] lg:max-h-[48vh] lg:gap-5">
            <h2 className="text-xl font-bold tracking-wider sm:text-2xl lg:text-[clamp(1.5rem,2.5vw,3rem)]">CURRENT TICKET</h2>
            <p aria-live="polite" aria-atomic="true" className="max-w-full break-words text-[clamp(3.8rem,8vw,10rem)] font-black leading-none tracking-wider">
              {ticket?.ticket_number ?? "----"}
            </p>
            {ticket && (
              <p className="text-base font-semibold uppercase tracking-widest text-white/80 sm:text-xl lg:text-2xl">
                {ticket.status === "called" ? "NOW CALLING" : "SERVING"}
              </p>
            )}
          </div>
          {error && <p role="alert" className="text-center text-sm text-red-700">{error}</p>}
        </section>
      </div>
      {serviceNames.length > 0 && (
        <footer className="w-full shrink-0 overflow-hidden bg-[#07145f] py-3 text-white sm:py-4 lg:py-5" aria-label="Services assigned to this officer">
          <div className="counter-service-marquee flex w-max items-center whitespace-nowrap text-2xl font-extrabold tracking-wide sm:text-4xl lg:text-5xl" aria-label={serviceNames.join(", ")}>
            <span className="shrink-0 px-10" aria-hidden="true">{marqueeText}     •     </span>
            <span className="shrink-0 px-10" aria-hidden="true">{marqueeText}     •     </span>
          </div>
          <style jsx>{`
            .counter-service-marquee { animation: counter-service-scroll 30s linear infinite; }
            @keyframes counter-service-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
            @media (prefers-reduced-motion: reduce) { .counter-service-marquee { animation: none; } }
          `}</style>
        </footer>
      )}
    </main>
  );
}
