import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Globe2,
  Landmark,
  LockKeyhole,
  MapPin,
  MessageSquare,
  MonitorSmartphone,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import mesob from "@/app/mesob.jpg";

type City = {
  id: number;
  name: string;
  code?: string | null;
};

type Subcity = {
  id: number;
  city_id?: number | null;
  name: string;
};

type Woreda = {
  id: number;
  city_id?: number | null;
  subcity_id?: number | null;
  name: string;
};

type PublicService = {
  id: number;
  name: string;
  description?: string | null;
};

type AboutData = {
  cities: City[];
  subcities: Subcity[];
  woredas: Woreda[];
  services: PublicService[];
};

const fallbackSubCities = [
  "Abdi Jilo Sub City",
  "Bokku Sub City",
  "Dabe Sub City",
  "Geda Sub City",
  "Melka Adama Sub City",
  "Hidhabu Abote Sub City",
];

const fallbackWoredas = Array.from(
  { length: 19 },
  (_, index) => `Woreda ${String(index + 1).padStart(2, "0")}`
);

const fallbackServices = [
  "Civil registration and certificates",
  "Business licensing and renewal",
  "Land and construction services",
  "Payment and finance services",
  "Appointment and notification services",
  "Document verification and tracking",
];

const objectives = [
  "Improve public service delivery and processing time.",
  "Reduce paperwork, manual movement, and unnecessary office visits.",
  "Increase transparency, accountability, and service traceability.",
  "Provide accessible online services at any time and from any device.",
  "Strengthen communication between citizens and government offices.",
  "Support accurate reporting and data-driven decision making.",
];

const portalFeatures = [
  { title: "Secure authentication", icon: LockKeyhole },
  { title: "Online applications", icon: FileCheck2 },
  { title: "Application tracking", icon: ClipboardCheck },
  { title: "Digital documents", icon: FileText },
  { title: "Role-based workflows", icon: Network },
  { title: "Public news and resources", icon: Globe2 },
  { title: "Citizen feedback", icon: MessageSquare },
  { title: "Responsive access", icon: MonitorSmartphone },
];

const workflow = [
  "Citizen submits an application",
  "Front Office receives the request",
  "Back Office reviews and verifies",
  "Application is approved or returned",
  "Citizen receives a status update",
  "Service is completed and delivered",
];

function apiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://mesobbackend.adamacity.gov.et/api"
  ).replace(/\/$/, "");
}

async function getAboutData(): Promise<AboutData> {
  const baseUrl = apiBaseUrl();

  try {
    const [locationsResponse, servicesResponse] = await Promise.all([
      fetch(`${baseUrl}/public/locations`, {
        next: { revalidate: 60 },
      }),
      fetch(`${baseUrl}/public/services/featured`, {
        next: { revalidate: 60 },
      }),
    ]);

    if (!locationsResponse.ok) {
      throw new Error("Unable to fetch public locations");
    }

    const locationsPayload = await locationsResponse.json();
    const servicesPayload = servicesResponse.ok
      ? await servicesResponse.json()
      : null;

    return {
      cities: locationsPayload?.data?.cities ?? [],
      subcities: locationsPayload?.data?.subcities ?? [],
      woredas: locationsPayload?.data?.woredas ?? [],
      services: servicesPayload?.data ?? [],
    };
  } catch {
    return {
      cities: [],
      subcities: fallbackSubCities.map((name, index) => ({
        id: index + 1,
        name,
      })),
      woredas: fallbackWoredas.map((name, index) => ({
        id: index + 1,
        name,
      })),
      services: fallbackServices.map((name, index) => ({
        id: index + 1,
        name,
        description: null,
      })),
    };
  }
}

export default async function AboutPage() {
  const { cities,
    subcities,
    woredas,
    services }
      = await getAboutData();

  const cityName = cities[0]?.name ?? "Adama City Administration";

  const displayedSubcities =
    subcities.length > 0
      ? subcities
      : fallbackSubCities.map((name, index) => ({ id: index + 1, name }));
  const displayedWoredas =
    woredas.length > 0
      ? woredas
      : fallbackWoredas.map((name, index) => ({ id: index + 1, name }));
  const displayedServices =
    services.length > 0
      ? services
      : fallbackServices.map((name, index) => ({
          id: index + 1,
          name,
          description: null,
        }));



  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-20">
          <div className="max-w-4xl">
            <Link href="/" className="mb-8 inline-flex items-center gap-3 rounded-full border bg-background px-4 py-2 text-sm font-bold transition hover:bg-muted">
              <Image src={mesob} alt="Adama MESOB" width={34} height={34} className="h-8 w-8 rounded-full object-cover" />
              Adama MESOB eService
            </Link>
            <p className="mb-4 text-sm font-bold text-primary">
              About Our Digital Public Service Platform
            </p>
            <h1 className="text-4xl font-black leading-tight text-foreground md:text-6xl">
              Fast, transparent, and citizen-centered public services.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Adama MESOB eService is a unified digital platform developed to connect citizens, businesses, and government institutions with secure and reliable public services across {cityName}, {displayedSubcities.length} sub cities, and {displayedWoredas.length} woredas.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/services">Explore Services <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/track-application">Track Application</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <InfoCard icon={ShieldCheck} title="Our Vision" text="To become a leading digital government platform that provides accessible, secure, transparent, and high-quality public services for every citizen." />
          <InfoCard icon={ClipboardCheck} title="Our Mission" text="To deliver efficient and citizen-centered public services through digital technology while improving accessibility, accountability, and operational excellence." />
          <InfoCard icon={Sparkles} title="Our Values" text="Transparency, accountability, security, inclusion, responsiveness, integrity, and reliable service delivery at every administrative level." />
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionTitle eyebrow="Our Objectives" title="What the platform is designed to achieve" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {objectives.map((objective) => (
              <div key={objective} className="flex gap-3 rounded-2xl border bg-slate-50 p-5 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                <p className="font-semibold leading-7 text-slate-700">{objective}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <SectionTitle eyebrow="Services We Provide" title="Online access to essential government services" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayedServices.map((service) => (
            <Card key={service.id} className="rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <CardContent className="p-6">
                <FileCheck2 className="mb-5 h-9 w-9 text-emerald-600" />
                <h3 className="text-lg font-black text-[#063d91]">{service.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {service.description || "Submit requests, upload documents, track progress, and receive services through a clear digital workflow."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionTitle eyebrow="Key Features" title="Secure tools that support the complete service journey" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {portalFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <Icon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="font-black">{feature.title}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionTitle eyebrow="Administrative Coverage" title="One digital gateway for the full city structure" />
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
            <div className="rounded-3xl border bg-card p-8 shadow-sm">
              <Landmark className="h-12 w-12 text-primary" />
              <h3 className="mt-6 text-3xl font-black text-foreground">{cityName}</h3>
              <p className="mt-4 leading-7 text-muted-foreground">
                City-level offices can publish services, assign officers, manage workflows, receive applications, approve requests, and monitor service performance from one system.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {displayedSubcities.map((subcity, index) => (
                <div key={subcity.id} className="rounded-2xl border bg-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-700">{index + 1}</div>
                  <h4 className="text-lg font-black text-[#063d91]">{subcity.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Sub-city service delivery, officer assignment, application review, and citizen support.</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 rounded-3xl border bg-slate-50 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <MapPin className="h-7 w-7 text-emerald-600" />
              <h3 className="text-2xl font-black text-[#063d91]">{displayedWoredas.length} Woreda Service Points</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {displayedWoredas.map((woreda) => (
                <div key={woreda.id} className="rounded-xl border bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">{woreda.name}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <SectionTitle eyebrow="Service Workflow" title="A simple and transparent application journey" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflow.map((step, index) => (
            <div key={step} className="flex gap-4 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-lg font-black text-white">{index + 1}</div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Step {index + 1}</p>
                <h3 className="mt-1 font-black text-[#063d91]">{step}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionTitle eyebrow="Benefits" title="Better service for citizens and government offices" />
          <div className="grid gap-6 lg:grid-cols-2">
            <BenefitCard
              icon={Users}
              title="For Citizens and Businesses"
              items={["Access services anytime", "Submit applications online", "Track application progress", "Receive timely updates", "Reduce travel and waiting time"]}
            />
            <BenefitCard
              icon={Building2}
              title="For Government Offices"
              items={["Faster application processing", "Improved record management", "Clear approval workflows", "Greater transparency", "Accurate reports and analytics"]}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-8 rounded-[2rem] border bg-card p-7 shadow-sm md:p-10 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-primary">Transparency & Accountability</p>
            <h2 className="mt-3 text-3xl font-black text-foreground md:text-4xl">Every application has a visible and accountable history.</h2>
            <p className="mt-5 leading-8 text-muted-foreground">
              The platform tracks application movement, processing history, workflow decisions, status updates, and responsible offices while protecting user information through secure authentication and role-based access control.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Application tracking", "Approval history", "Audit trails", "Real-time status", "Secure access", "Management reports"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border bg-background p-4 font-bold">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-600">Our Commitment</p>
            <h2 className="mt-3 text-3xl font-black text-[#063d91] md:text-4xl">Continuous improvement of digital public services.</h2>
            <p className="mt-5 max-w-3xl leading-8 text-slate-600">
              We are committed to providing secure, efficient, transparent, and citizen-focused services that meet the needs of our communities. The platform will continue to evolve through public feedback, institutional learning, and responsible use of technology.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-xl font-bold"><Link href="/#contact">Contact Us</Link></Button>
              <Button asChild variant="outline" className="rounded-xl font-bold"><Link href="/resources/guidelines">View Guidelines</Link></Button>
            </div>
          </div>
          <Card className="rounded-3xl bg-slate-50 shadow-sm">
            <CardContent className="p-6">
              <Clock3 className="h-10 w-10 text-emerald-600" />
              <h3 className="mt-4 text-xl font-black text-[#063d91]">Contact & Support</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Adama, Oromia, Ethiopia<br />
                Digital service support center<br />
                Use the contact form on the home page for assistance.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

type InfoCardProps = { icon: LucideIcon; title: string; text: string };

function InfoCard({ icon: Icon, title, text }: InfoCardProps) {
  return (
    <Card className="rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <CardContent className="p-7">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
          <Icon className="h-8 w-8 text-emerald-700" />
        </div>
        <h2 className="text-2xl font-black text-[#063d91]">{title}</h2>
        <p className="mt-4 leading-7 text-slate-600">{text}</p>
      </CardContent>
    </Card>
  );
}

type BenefitCardProps = { icon: LucideIcon; title: string; items: string[] };

function BenefitCard({ icon: Icon, title, items }: BenefitCardProps) {
  return (
    <Card className="rounded-3xl border bg-slate-50 shadow-sm">
      <CardContent className="p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <Icon className="h-8 w-8 text-emerald-700" />
          </div>
          <h3 className="text-2xl font-black text-[#063d91]">{title}</h3>
        </div>
        <div className="mt-6 grid gap-3">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl bg-white p-4 font-semibold text-slate-700">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

type SectionTitleProps = { eyebrow: string; title: string };

function SectionTitle({ eyebrow, title }: SectionTitleProps) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="text-sm font-black uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black text-foreground md:text-4xl">{title}</h2>
    </div>
  );
}
