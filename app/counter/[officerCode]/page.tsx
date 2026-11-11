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
  assigned_services?: Array<
    string | {
      name?: string | null;
      service_name?: string | null;
      title?: string | null;
    }
  >;
};

type CounterResponse = {
  success: boolean;
  message: string;
  data: CounterData | null;
};

export default function OfficerCounterPage() {
  const params = useParams();
  const officerCode =
    typeof params.officerCode === "string" ? params.officerCode : "";

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

      const timeout = window.setTimeout(() => request.abort(), 10000);

      try {
        const response = await fetch(
          `/api/public/counter/${encodeURIComponent(officerCode)}`,
          {
            cache: "no-store",
            signal: request.signal,
          }
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
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load counter."
          );
        }
      } finally {
        window.clearTimeout(timeout);
        if (controller === request) controller = null;
      }
    };

    void refresh();

    const interval = window.setInterval(
      () => void refresh(),
      3000
    );

    return () => {
      active = false;
      window.clearInterval(interval);
      controller?.abort();
    };
  }, [officerCode]);

  useEffect(() => {
    setPhotoFailed(false);
  }, [counter?.officer_photo_url]);

  const ticket = counter?.current_ticket;

  const serviceNames = Array.from(
    new Set(
      (counter?.assigned_services ?? [])
        .map((service) =>
          typeof service === "string"
            ? service
            : (
                service.name ??
                service.service_name ??
                service.title ??
                ""
              )
        )
        .map((name) => name.trim())
        .filter(Boolean)
    )
  );

  const marqueeText = serviceNames.join("     •     ");

  const officerPhotoUrl = resolveProfileImageUrl(
    counter?.officer_photo_url
  );

  return (
    <main className="mesob-counter">
      <div className="mesob-counter-content">
        <aside className="mesob-counter-officer">
          {officerPhotoUrl && !photoFailed ? (
            <img
              src={officerPhotoUrl}
              alt="Officer portrait"
              onError={() => setPhotoFailed(true)}
              className="mesob-counter-photo"
            />
          ) : (
            <div className="mesob-counter-photo-fallback">
              <UserRound
                size={100}
                aria-label="Officer portrait unavailable"
              />
            </div>
          )}
        </aside>

        <section className="mesob-counter-information">
          <header className="mesob-counter-header">
            <h1>LAKK. OOFISARAA</h1>
            <p className="mesob-counter-code">
              {counter?.officer_code ??
                officerCode.toUpperCase()}
            </p>
          </header>

          <div className="mesob-counter-ticket">
            <h2>CURRENT TICKET</h2>

            <p
              className="mesob-counter-ticket-number"
              aria-live="polite"
              aria-atomic="true"
            >
              {ticket?.ticket_number ?? "----"}
            </p>

            {ticket && (
              <p className="mesob-counter-ticket-status">
                {ticket.status === "called"
                  ? "NOW CALLING"
                  : "SERVING"}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="mesob-counter-error">
              {error}
            </p>
          )}
        </section>
      </div>

      {serviceNames.length > 0 && (
        <footer
          className="mesob-counter-footer"
          aria-label="Services assigned to this officer"
        >
          <div
            className="mesob-counter-marquee"
            aria-label={serviceNames.join(", ")}
          >
            <span aria-hidden="true">
              {marqueeText}     •
            </span>
            <span aria-hidden="true">
              {marqueeText}     •
            </span>
          </div>
        </footer>
      )}

      <style jsx>{`
        .mesob-counter {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #fafbfe;
          color: #07145f;
          font-family: Arial, Helvetica, sans-serif;
          overflow-x: hidden;
        }

        .mesob-counter,
        .mesob-counter * {
          box-sizing: border-box;
        }

        .mesob-counter-content {
          width: 100%;
          max-width: 1920px;
          margin: 0 auto;
          padding: 12px;
          display: flex;
          flex: 1 0 auto;
          flex-direction: column;
          gap: 16px;
        }

        .mesob-counter-officer {
          width: 100%;
          padding: 16px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 10px 45px rgba(20, 40, 90, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mesob-counter-photo {
          display: block;
          width: auto;
          max-width: 100%;
          height: auto;
          max-height: 36vh;
          border-radius: 16px;
          object-fit: contain;
        }

        .mesob-counter-photo-fallback {
          width: 100%;
          max-width: 280px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #f1f5f9;
          color: #94a3b8;
        }

        .mesob-counter-information {
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 16px;
        }

        .mesob-counter-header {
          width: 100%;
          text-align: center;
        }

        .mesob-counter-header h1 {
          margin: 0;
          font-size: 30px;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .mesob-counter-code {
          margin: 8px 0 0;
          font-size: 56px;
          font-weight: 900;
          line-height: 1.1;
          overflow-wrap: anywhere;
        }

        .mesob-counter-ticket {
          width: 100%;
          min-height: 180px;
          padding: 24px 12px;
          border-radius: 26px;
          background: #07145f;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          text-align: center;
          box-shadow: 0 15px 40px rgba(7, 20, 95, 0.2);
        }

        .mesob-counter-ticket h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .mesob-counter-ticket-number {
          margin: 0;
          max-width: 100%;
          font-size: 76px;
          font-weight: 900;
          line-height: 1;
          overflow-wrap: anywhere;
        }

        .mesob-counter-ticket-status {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .mesob-counter-error {
          color: #b91c1c;
          text-align: center;
          font-size: 14px;
        }

        .mesob-counter-footer {
          width: 100%;
          flex-shrink: 0;
          padding: 12px 0;
          overflow: hidden;
          background: #07145f;
          color: #ffffff;
        }

        .mesob-counter-marquee {
          display: flex;
          width: max-content;
          white-space: nowrap;
          animation: mesob-counter-scroll 30s linear infinite;
          font-size: 30px;
          font-weight: 900;
        }

        .mesob-counter-marquee span {
          flex-shrink: 0;
          padding: 0 40px;
        }

        @keyframes mesob-counter-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @media (min-width: 900px) and (orientation: landscape) {
          .mesob-counter {
            height: 100vh;
            min-height: 0;
            overflow: hidden;
          }

          .mesob-counter-content {
            min-height: 0;
            flex: 1 1 auto;
            flex-direction: row;
            padding: 20px 24px;
            gap: 24px;
          }

          .mesob-counter-officer {
            width: 35%;
            flex: 0 0 35%;
            min-height: 0;
          }

          .mesob-counter-photo {
            max-height: 75vh;
          }

          .mesob-counter-photo-fallback {
            height: 65%;
          }

          .mesob-counter-information {
            width: 65%;
            flex: 1 1 0;
            min-height: 0;
            gap: 24px;
          }

          .mesob-counter-header h1 {
            font-size: 3vw;
          }

          .mesob-counter-code {
            font-size: 8vw;
          }

          .mesob-counter-ticket {
            min-height: 0;
            height: 45vh;
            flex-shrink: 1;
          }

          .mesob-counter-ticket h2 {
            font-size: 2.5vw;
          }

          .mesob-counter-ticket-number {
            font-size: 10vw;
          }

          .mesob-counter-footer {
            padding: 16px 0;
          }

          .mesob-counter-marquee {
            font-size: 3vw;
          }
        }

        @media (min-width: 1600px) and (orientation: landscape) {
          .mesob-counter-content {
            padding: 28px 36px;
            gap: 36px;
          }

          .mesob-counter-code {
            font-size: 110px;
          }

          .mesob-counter-ticket-number {
            font-size: 170px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mesob-counter-marquee {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
