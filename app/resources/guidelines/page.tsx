import { ArrowRight, CheckCircle2, ClipboardList, FileText, ShieldCheck } from "lucide-react";

const slides = [
  { title: "1. Select Service", text: "Choose City, Sub City, or Woreda service from the public portal.", icon: ClipboardList },
  { title: "2. Submit Application", text: "Fill the dynamic form and upload required documents securely.", icon: FileText },
  { title: "3. Track Progress", text: "Use your tracking number to follow approval, appointment, and payment status.", icon: ShieldCheck },
  { title: "4. Download Output", text: "Download approved certificates, letters, receipts, and official documents.", icon: CheckCircle2 },
];

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-[#08214a] md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <p className="font-bold text-emerald-600">Presentation Guide</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">How to Use Adama MESOB eService</h1>
          <p className="mt-4 max-w-3xl text-slate-600">A simple presentation-style guideline for citizens, officers, and service providers.</p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {slides.map((slide) => {
            const Icon = slide.icon;
            return (
              <article key={slide.title} className="rounded-3xl border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-2xl bg-emerald-100 p-4 text-emerald-700"><Icon className="h-9 w-9" /></span>
                  <ArrowRight className="h-6 w-6 text-slate-300" />
                </div>
                <h2 className="mt-8 text-3xl font-black">{slide.title}</h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">{slide.text}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
