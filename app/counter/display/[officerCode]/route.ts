import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CounterTicket {
  ticket_number?: string | null;
  status?: string | null;
}

interface CounterData {
  officer_code?: string | null;
  officer_photo_url?: string | null;
  assigned_services?: Array<
    string | {
      name?: string | null;
      service_name?: string | null;
      title?: string | null;
    }
  >;
  current_ticket?: CounterTicket | null;
}

interface CounterResponse {
  success?: boolean;
  message?: string;
  data?: CounterData;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replaceElementText(
  html: string,
  elementId: string,
  value: string,
): string {
  const expression = new RegExp(
    '(<div id="' + elementId + '"[^>]*>)[\\s\\S]*?(</div>)',
  );

  return html.replace(expression, (_match, opening, closing) => {
    return opening + escapeHtml(value) + closing;
  });
}

function normalizePhotoUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const url = value.trim();
  const storagePosition = url.indexOf("/storage/");

  if (storagePosition >= 0) {
    const storagePath = url.substring(storagePosition);

    if (/^\/storage\/[A-Za-z0-9/_.,%-]+(?:\?v=[A-Za-z0-9%:._-]+)?$/.test(storagePath)) {
      return storagePath;
    }
  }

  return "";
}

function renderCounter(
  template: string,
  data: CounterData,
  requestedCode: string,
): string {
  const officerCode = data.officer_code || requestedCode;
  const ticket = data.current_ticket;

  const serviceNames: string[] = [];

  for (const service of data.assigned_services || []) {
    const name =
      typeof service === "string"
        ? service
        : service.name || service.service_name || service.title || "";

    if (name && !serviceNames.includes(name)) {
      serviceNames.push(name);
    }
  }

  const servicesText = serviceNames.length
    ? serviceNames.join("     \u2022     ")
    : "No assigned services";

  let html = template;

  html = replaceElementText(html, "officer-code", officerCode);

  html = replaceElementText(
    html,
    "ticket-number",
    ticket?.ticket_number || "----",
  );

  html = replaceElementText(
    html,
    "ticket-status",
    ticket
      ? ticket.status === "called"
        ? "NOW CALLING"
        : "SERVING"
      : "",
  );

  html = replaceElementText(html, "services", servicesText);

  if (serviceNames.length) {
    html = html.replace(
      '<div id="services">',
      '<div id="services" class="scrolling">',
    );
  }

  const photoUrl = normalizePhotoUrl(data.officer_photo_url);

  if (photoUrl) {
    html = html.replace(
      '<img id="photo" alt="Officer portrait" style="display:none">',
      '<img id="photo" alt="Officer portrait" style="display:inline" src="' +
        escapeHtml(photoUrl) +
        '">',
    );

    html = html.replace(
      '<div id="photo-fallback">',
      '<div id="photo-fallback" style="display:none">',
    );
  }

  return html;
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ officerCode: string }> },
): Promise<Response> {
  const { officerCode } = await context.params;

  if (!/^[A-Za-z0-9_-]{1,50}$/.test(officerCode)) {
    return htmlResponse("Invalid officer code.", 400);
  }

  const templatePath = path.join(
    process.cwd(),
    "public",
    "counter-legacy",
    "index.html",
  );

  let template: string;

  try {
    template = await readFile(templatePath, "utf8");
  } catch {
    return htmlResponse("Counter template unavailable.", 503);
  }

  const defaultApiUrl =
    process.env.NODE_ENV === "production"
      ? "https://mesobbackend.adamacity.gov.et/api"
      : "http://127.0.0.1:8000/api";

  const apiUrl = (
    process.env.BACKEND_API_URL?.trim() || defaultApiUrl
  ).replace(/\/+$/, "");

  try {
    const response = await fetch(
      apiUrl +
        "/public/counter/" +
        encodeURIComponent(officerCode),
      {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      return htmlResponse(
        replaceElementText(
          template,
          "error",
          "Counter information temporarily unavailable.",
        ),
        503,
      );
    }

    const payload = (await response.json()) as CounterResponse;

    if (!payload.success || !payload.data) {
      return htmlResponse(
        replaceElementText(
          template,
          "error",
          payload.message || "Counter information unavailable.",
        ),
        503,
      );
    }

    return htmlResponse(
      renderCounter(template, payload.data, officerCode),
    );
  } catch {
    return htmlResponse(
      replaceElementText(
        template,
        "error",
        "Connection unavailable. Retrying...",
      ),
      503,
    );
  }
}