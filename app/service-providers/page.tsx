// app/service-provider/page.tsx
import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    ClipboardCheck,
    Factory,
    FileText,
    Landmark,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Sparkles,
    Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import mesob from "@/app/mesob.jpg";

type ServiceProvider = {
    id: number;
    name: string;
};

type ServiceProviderPayload = {
    data?: ServiceProvider[];
};

const fallbackProviders: ServiceProvider[] = [
    "Mayor Office",
    "Municipality Office",
    "Finance Office",
    "Revenue Authority",
    "Land Management Office",
    "Trade & Industry Office",
    "Health Office",
    "Education Office",
    "Agriculture Office",
    "Women & Children Affairs Office",
    "Civil Service Office",
    "ICT Office",
    "Water & Sewerage Office",
    "Planning & Development Office",
    "Environmental Protection Office",
    "Peace & Security Office",
    "Court and Justice Offices",
    "Police Commission",
    "Fire & Emergency Office",
    "Culture & Tourism Office",
    "Youth & Sports Office",
    "Procurement & Property Administration Office",
    "Records & Archives Office",
    "Public Service & Human Resource Office",
].map((name, index) => ({ id: index + 1, name }));

function apiBaseUrl() {
    return (
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://127.0.0.1:8000/api"
    ).replace(/\/$/, "");
}

async function getServiceProviders(): Promise<ServiceProvider[]> {
    try {
        const response = await fetch(`${apiBaseUrl()}/public/service-providers`, {
            next: { revalidate: 60 },
        });

        if (!response.ok) {
            throw new Error("Unable to fetch service providers");
        }

        const payload = (await response.json()) as ServiceProviderPayload;
        return payload.data?.length ? payload.data : fallbackProviders;
    } catch {
        return fallbackProviders;
    }
}

const highlights = [
    "City-level and institution-level service ownership",
    "Clear responsibility for every citizen request",
    "Connected service delivery across offices",
    "Transparent digital workflow and reporting",
];

export default async function ServiceProviderPage() {
    const providers = await getServiceProviders();

    return (
        <main className="min-h-screen bg-[#ffffff] text-slate-800">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#ffffff] text-dark">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.35),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.45),transparent_28%)]" />
                <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
                    <div>
                        <Button
                            asChild
                            variant="ghost"
                            className="mb-8 h-auto rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/20"
                        >
                            <Link href="/" className="inline-flex items-center gap-3">
                                <Image src={mesob} alt="Adama MESOB" width={34} height={34} className="h-8 w-8 rounded-full object-cover" />
                                Adama MESOB eService
                            </Link>
                        </Button>

                        <Badge className="mb-4 bg-emerald-400/20 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-400/30 border-0">
                            Government Offices • Digital Service Providers
                        </Badge>

                        <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                            Service providers delivering modern public services for Adama.
                        </h1>

                        <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50">
                            These offices are the official service owners inside Adama MESOB eService. Each provider can publish services,
                            receive applications, assign responsible officers, review requests, and deliver public services through one
                            transparent digital workflow.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <Button asChild size="lg" className="rounded-xl bg-emerald-500 font-black text-white shadow-xl hover:bg-emerald-600">
                                <Link href="/services">
                                    View Digital Services <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="secondary" className="rounded-xl bg-white font-black text-[#062f6f] shadow-xl hover:bg-slate-100">
                                <Link href="/about">About MESOB</Link>
                            </Button>
                        </div>
                    </div>

                    <Card className="rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur">
                        <Card className="rounded-[1.5rem] border-0 bg-white p-5 shadow-none">
                            <CardContent className="p-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-slate-200 bg-[#f5f5f5] p-5 shadow-sm">
                                        <Landmark className="mb-4 h-8 w-8 text-emerald-600" />
                                        <div className="text-4xl font-black text-[#063d91]">1</div>
                                        <p className="mt-1 text-sm font-bold text-slate-600">City Administration</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-[#f5f5f5] p-5 shadow-sm">
                                        <Building2 className="mb-4 h-8 w-8 text-emerald-600" />
                                        <div className="text-4xl font-black text-[#063d91]">{providers.length}+</div>
                                        <p className="mt-1 text-sm font-bold text-slate-600">Service Providers</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-[#f5f5f5] p-5 shadow-sm">
                                        <Users className="mb-4 h-8 w-8 text-emerald-600" />
                                        <div className="text-4xl font-black text-[#063d91]">All</div>
                                        <p className="mt-1 text-sm font-bold text-slate-600">Citizens & Businesses</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-[#f5f5f5] p-5 shadow-sm">
                                        <ShieldCheck className="mb-4 h-8 w-8 text-emerald-600" />
                                        <div className="text-4xl font-black text-[#063d91]">24/7</div>
                                        <p className="mt-1 text-sm font-bold text-slate-600">Digital Access</p>
                                    </div>
                                </div>
                                <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#063d91] to-emerald-600 p-5 text-white">
                                    <p className="text-sm font-bold uppercase tracking-wider text-blue-100">Service Ownership</p>
                                    <h2 className="mt-2 text-2xl font-black">Every request is routed to the correct responsible office.</h2>
                                </div>
                            </CardContent>
                        </Card>
                    </Card>
                </div>
            </section>

            {/* Info Cards Section */}
            <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                        <CardContent className="p-0">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                                <Factory className="h-8 w-8 text-emerald-700" />
                            </div>
                            <h2 className="text-2xl font-black text-[#063d91]">Official Providers</h2>
                            <p className="mt-4 leading-7 text-slate-600">Each office represents an authorized government institution responsible for specific public services.</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                        <CardContent className="p-0">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                                <ClipboardCheck className="h-8 w-8 text-emerald-700" />
                            </div>
                            <h2 className="text-2xl font-black text-[#063d91]">Digital Workflow</h2>
                            <p className="mt-4 leading-7 text-slate-600">Applications move from submission to verification, review, approval, payment, and final delivery.</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                        <CardContent className="p-0">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                                <Sparkles className="h-8 w-8 text-emerald-700" />
                            </div>
                            <h2 className="text-2xl font-black text-[#063d91]">Better Governance</h2>
                            <p className="mt-4 leading-7 text-slate-600">MESOB improves accountability, visibility, reporting, and citizen satisfaction across service offices.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Provider Directory Section */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-7xl px-4 md:px-8">
                    <div className="mb-10 max-w-3xl">
                        <p className="text-sm font-black uppercase tracking-widest text-emerald-600">Provider Directory</p>
                        <h2 className="mt-3 text-3xl font-black text-[#063d91] md:text-4xl">Government offices connected to Adama MESOB eService</h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {providers.map((provider, index) => (
                            <Card key={provider.id} className="group rounded-3xl border border-slate-200 bg-[#f5f5f5] p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
                                <CardContent className="p-0">
                                    <div className="mb-5 flex items-center justify-between">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition group-hover:bg-[#063d91] group-hover:text-white">
                                            <Building2 className="h-7 w-7" />
                                        </div>
                                        <Badge variant="outline" className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
                                            {String(index + 1).padStart(2, "0")}
                                        </Badge>
                                    </div>
                                    <h3 className="text-lg font-black leading-7 text-[#063d91]">{provider.name}</h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        Provides digital public services, manages applications, and supports citizens through MESOB workflow.
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Providers Matter Section */}
            <section className="bg-[#08214a] py-16 text-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
                    <div>
                        <p className="text-sm font-black uppercase tracking-widest text-emerald-400">Why providers matter</p>
                        <h2 className="mt-3 text-3xl font-black md:text-4xl">One platform. Many responsible offices.</h2>
                        <p className="mt-5 leading-8 text-blue-50">
                            Service providers make the system practical by linking each digital service to the office that owns the work,
                            the officers who process it, and the citizens who need the result.
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {highlights.map((item) => (
                            <Card key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                                <CardContent className="flex items-start gap-3 p-0">
                                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-400" />
                                    <span className="font-bold leading-7">{item}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
                <Card className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl md:p-10 lg:grid-cols-3">
                    <CardContent className="p-0 lg:col-span-2">
                        <p className="text-sm font-black uppercase tracking-widest text-emerald-600">Adama MESOB Service Center</p>
                        <h2 className="mt-3 text-3xl font-black text-[#063d91] md:text-4xl">A coordinated provider network for faster public service delivery.</h2>
                        <Separator className="my-6" />
                        <p className="mt-5 leading-8 text-slate-600">
                            By organizing service providers in one digital directory, MESOB helps citizens identify the correct office,
                            submit the correct request, and track progress without unnecessary movement between institutions.
                        </p>
                    </CardContent>

                    <Card className="rounded-3xl border border-slate-200 bg-[#f5f5f5] p-6 shadow-sm">
                        <CardContent className="space-y-4 p-0">
                            <FileText className="h-10 w-10 text-emerald-600" />
                            <h3 className="text-xl font-black text-[#063d91]">Need Support?</h3>
                            <div className="space-y-3">
                                <p className="flex gap-3 text-sm text-slate-600">
                                    <MapPin className="h-5 w-5" />Adama, Oromia, Ethiopia
                                </p>
                                <p className="flex gap-3 text-sm text-slate-600">
                                    <Phone className="h-5 w-5" />+251 9141
                                </p>
                                <p className="flex gap-3 text-sm text-slate-600">
                                    <Mail className="h-5 w-5" />temamaman156@gmail.com
                                </p>
                            </div>
                            <Button className="w-full rounded-xl bg-emerald-500 font-bold text-white hover:bg-emerald-600">
                                Contact Support
                            </Button>
                        </CardContent>
                    </Card>
                </Card>
            </section>
        </main>
    );
}