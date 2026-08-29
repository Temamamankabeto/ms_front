import Link from "next/link";
import {
    Building2,
    Mail,
    MapPin,
    Phone,
    Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

import { SectionTitle } from "./section-title";

interface ContactSectionProps {
    cityName: string;
    subcityCount: number;
    woredaCount: number;
}

export function ContactSection({
                                   cityName,
                                   subcityCount,
                                   woredaCount,
                               }: ContactSectionProps) {
    return (
        <section className="border-t bg-background py-20">
            <div className="container mx-auto max-w-7xl px-4">

                <SectionTitle
                    eyebrow="Contact Us"
                    title="Adama MESOB eService Center"
                    description="Connecting citizens, businesses and government offices through one modern digital public service platform."
                />

                <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">

                    {/* Organization Overview */}

                    <Card className="border-0 shadow-lg">

                        <CardContent className="p-8">

                            <Badge variant="secondary">
                                Public Digital Service Platform
                            </Badge>

                            <h2 className="mt-6 text-3xl font-bold tracking-tight">
                                {cityName}
                            </h2>

                            <p className="mt-6 leading-8 text-muted-foreground">
                                MESOB provides one integrated digital platform
                                for municipal service delivery. Citizens can
                                apply online, upload documents, track
                                applications, receive notifications and access
                                government services without unnecessary office
                                visits.
                            </p>

                            <div className="mt-10 space-y-6">

                                <div className="flex items-start gap-4">

                                    <div className="rounded-xl bg-primary/10 p-3">
                                        <MapPin className="h-6 w-6 text-primary" />
                                    </div>

                                    <div>

                                        <h3 className="font-semibold">
                                            Office Location
                                        </h3>

                                        <p className="text-muted-foreground">
                                            Adama City Administration
                                            <br />
                                            Oromia, Ethiopia
                                        </p>

                                    </div>

                                </div>

                                <div className="flex items-start gap-4">

                                    <div className="rounded-xl bg-primary/10 p-3">
                                        <Mail className="h-6 w-6 text-primary" />
                                    </div>

                                    <div>

                                        <h3 className="font-semibold">
                                            Email
                                        </h3>

                                        <p className="text-muted-foreground">
                                            support@mesob.gov.et
                                        </p>

                                    </div>

                                </div>

                                <div className="flex items-start gap-4">

                                    <div className="rounded-xl bg-primary/10 p-3">
                                        <Phone className="h-6 w-6 text-primary" />
                                    </div>

                                    <div>

                                        <h3 className="font-semibold">
                                            Support
                                        </h3>

                                        <p className="text-muted-foreground">
                                            Monday – Friday
                                            <br />
                                            8:30 AM – 5:30 PM
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="mt-10 flex flex-wrap gap-4">

                                <Button asChild>
                                    <Link href="/contact">
                                        Contact Us
                                    </Link>
                                </Button>

                                <Button
                                    variant="outline"
                                    asChild
                                >
                                    <Link href="/services">
                                        Browse Services
                                    </Link>
                                </Button>

                            </div>

                        </CardContent>

                    </Card>

                    {/* Statistics Card */}

                    <div className="space-y-6">
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-8">

                                <div className="mb-8 flex items-center gap-3">
                                    <Users className="h-7 w-7 text-primary" />

                                    <h3 className="text-2xl font-bold">
                                        Administrative Coverage
                                    </h3>
                                </div>

                                <div className="space-y-5">

                                    <div className="flex items-center justify-between rounded-xl bg-muted p-4">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            <span className="font-medium">
                        Sub Cities
                      </span>
                                        </div>

                                        <span className="text-2xl font-bold text-primary">
                      {subcityCount}
                    </span>
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl bg-muted p-4">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-5 w-5 text-primary" />
                                            <span className="font-medium">
                        Woredas
                      </span>
                                        </div>

                                        <span className="text-2xl font-bold text-primary">
                      {woredaCount}
                    </span>
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl bg-muted p-4">
                                        <div className="flex items-center gap-3">
                                            <Users className="h-5 w-5 text-primary" />
                                            <span className="font-medium">
                        Service Availability
                      </span>
                                        </div>

                                        <span className="text-lg font-bold text-emerald-600">
                      24 / 7
                    </span>
                                    </div>

                                </div>

                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-primary text-primary-foreground shadow-xl">
                            <CardContent className="p-8">

                                <Badge variant="secondary">
                                    Get Started
                                </Badge>

                                <h3 className="mt-5 text-2xl font-bold">
                                    Experience Digital Government Today
                                </h3>

                                <p className="mt-4 leading-7 text-primary-foreground/80">
                                    Apply online, upload documents, track your
                                    applications, and receive public services
                                    through the Adama MESOB eService platform.
                                </p>

                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="mt-8 w-full"
                                    asChild
                                >
                                    <Link href="/register">
                                        Create Account
                                    </Link>
                                </Button>

                            </CardContent>
                        </Card>

                    </div>

                </div>

            </div>
        </section>
    );
}