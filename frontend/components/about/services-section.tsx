import Link from "next/link";
import {
    ArrowRight,
    Clock3,
    FileCheck2,
    ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { SectionTitle } from "./section-title";

export type PublicService = {
    id: number;
    name: string;
    description?: string | null;
};

interface ServicesSectionProps {
    services?: PublicService[] | null;
}

export function ServicesSection({
                                    services,
                                }: ServicesSectionProps) {
    // Ensure services is always an array
    const serviceList = Array.isArray(services) ? services : [];

    return (
        <section className="py-20">
            <div className="container mx-auto max-w-7xl px-4">
                <SectionTitle
                    eyebrow="Digital Services"
                    title="Services Designed for Citizens, Businesses and Government"
                    description="Apply, upload documents, track applications, receive notifications, and access public services through one secure digital platform."
                />

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {serviceList.length > 0 ? (
                        serviceList.map((service) => (
                            <Card
                                key={service.id ?? service.name}
                                className="group transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                            >
                                <CardHeader>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary">
                                        <FileCheck2 className="h-7 w-7 text-primary group-hover:text-primary-foreground" />
                                    </div>

                                    <CardTitle className="pt-4 text-xl">
                                        {service.name}
                                    </CardTitle>

                                    <CardDescription className="leading-7">
                                        {service.description ??
                                            "Submit requests, upload documents, track progress, and receive digital approval through the MESOB eService platform."}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock3 className="h-4 w-4" />
                                            Fast Digital Processing
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <ShieldCheck className="h-4 w-4" />
                                            Secure & Transparent Workflow
                                        </div>
                                    </div>

                                    <Button asChild className="mt-6 w-full">
                                        <Link href="/services">
                                            Apply Now
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="col-span-full">
                            <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
                                No services available.
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card className="mt-16 border-0 bg-primary text-primary-foreground shadow-xl">
                    <CardContent className="flex flex-col items-center justify-between gap-8 p-8 text-center lg:flex-row lg:text-left">
                        <div className="max-w-3xl">
                            <h2 className="text-3xl font-bold tracking-tight">
                                Start Your Digital Government Journey
                            </h2>

                            <p className="mt-4 leading-8 text-primary-foreground/80">
                                Apply for government services online, upload documents securely,
                                monitor application progress, receive notifications, and access
                                municipal services anytime from anywhere through the Adama MESOB
                                eService platform.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Button size="lg" variant="secondary" asChild>
                                <Link href="/services">
                                    Browse Services
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>

                            <Button size="lg" variant="outline" asChild>
                                <Link href="/track-application">
                                    Track Application
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}