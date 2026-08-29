import { Building2, Landmark, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { SectionTitle } from "@/components/about/section-title";

type Subcity = {
    id: number;
    name: string;
};

type Woreda = {
    id: number;
    name: string;
};

interface CoverageSectionProps {
    cityName: string;
    subcities?: Subcity[];
    woredas?: Woreda[];
}

export function CoverageSection({
                                    cityName,
                                    subcities = [],
                                    woredas = [],
                                }: CoverageSectionProps) {
    return (
        <section className="py-20">
            <div className="container mx-auto max-w-7xl px-4">

                <SectionTitle
                    eyebrow="Administrative Coverage"
                    title="One Digital Platform for the Entire City Administration"
                    description="MESOB connects city offices, sub-city administrations, and woreda service centers through one unified digital government platform."
                />

                <div className="mt-12 grid gap-8 lg:grid-cols-[420px_1fr]">

                    {/* City Information */}

                    <Card className="border-0 bg-primary text-primary-foreground shadow-xl">

                        <CardHeader>

                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
                                <Landmark className="h-9 w-9" />
                            </div>

                            <Badge
                                variant="secondary"
                                className="mt-6 w-fit"
                            >
                                City Administration
                            </Badge>

                            <CardTitle className="mt-3 text-3xl">
                                {cityName}
                            </CardTitle>

                        </CardHeader>

                        <CardContent>

                            <p className="leading-8 text-primary-foreground/80">
                                MESOB provides a centralized digital service
                                platform for city-level government offices,
                                allowing departments to publish services,
                                receive applications, assign officers,
                                monitor workflows, approve requests,
                                and generate performance reports.
                            </p>

                            <div className="mt-8 space-y-4">

                                <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-emerald-300" />
                                    <span>
                    {subcities.length} Sub Cities
                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <MapPin className="h-5 w-5 text-emerald-300" />
                                    <span>
                    {woredas.length} Woredas
                  </span>
                                </div>

                            </div>

                        </CardContent>

                    </Card>

                    {/* Sub Cities */}

                    <div>

                        <div className="mb-6 flex items-center gap-3">

                            <Building2 className="h-6 w-6 text-primary" />

                            <h2 className="text-2xl font-bold">
                                Sub City Administrations
                            </h2>

                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">

                            {subcities.map((subcity, index) => (

                                <Card
                                    key={subcity.id}
                                    className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >

                                    <CardContent className="p-6">

                                        <div className="flex items-start gap-4">

                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">

                                                {String(index + 1).padStart(2, "0")}

                                            </div>

                                            <div>

                                                <h3 className="text-lg font-semibold">
                                                    {subcity.name}
                                                </h3>

                                                <p className="mt-2 text-sm text-muted-foreground leading-6">
                                                    Manage public services, citizen
                                                    applications, officer assignments,
                                                    approvals, and service monitoring
                                                    through the MESOB platform.
                                                </p>

                                            </div>

                                        </div>

                                    </CardContent>

                                </Card>

                            ))}

                        </div>

                    </div>

                </div>
                {/* Woreda Service Points */}
                <div className="mt-10">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-6 w-6 text-primary" />

                                <div>
                                    <CardTitle>Woreda Service Centers</CardTitle>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {woredas.length} Woreda administrative offices
                                        connected to the MESOB digital platform.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                                {woredas.map((woreda, index) => (
                                    <Card
                                        key={woreda.id}
                                        className="transition-all hover:shadow-md"
                                    >
                                        <CardContent className="flex items-center gap-3 p-4">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                                {index + 1}
                                            </div>

                                            <div>
                                                <h4 className="font-medium">
                                                    {woreda.name}
                                                </h4>

                                                <p className="text-xs text-muted-foreground">
                                                    Service Point
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}