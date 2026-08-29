import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    Building2,
    Globe2,
    Landmark,
    MapPin,
} from "lucide-react";

import mesob from "@/app/mesob.jpg";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

type Stat = {
    label: string;
    value: string;
};

interface HeroSectionProps {
    cityName: string;
    subcityCount: number;
    woredaCount: number;
    stats?: Stat[];
}

const icons = [
    Landmark,
    Building2,
    MapPin,
    Globe2,
];

export function HeroSection({
                                cityName,
                                subcityCount,
                                woredaCount,
                                stats = [],
                            }: HeroSectionProps) {
    return (
        <section className="relative overflow-hidden bg-primary text-primary-foreground">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,.30),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,.35),transparent_30%)]" />

            <div className="container relative mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-24">

                <div className="grid items-center gap-12 lg:grid-cols-2">

                    {/* LEFT */}

                    <div>

                        <Link
                            href="/"
                            className="inline-flex items-center gap-3"
                        >
                            <Image
                                src={mesob}
                                alt="MESOB"
                                width={42}
                                height={42}
                                className="rounded-full"
                            />

                            <span className="text-lg font-bold">
                Adama MESOB eService
              </span>
                        </Link>

                        <Badge
                            className="mt-8"
                            variant="secondary"
                        >
                            City • Sub City • Woreda Digital Services
                        </Badge>

                        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
                            Modern Public Service Delivery
                            <br />
                            for Every Citizen
                        </h1>

                        <p className="mt-6 max-w-2xl text-lg text-primary-foreground/80 leading-8">
                            {cityName} MESOB eService Center connects
                            citizens, businesses and public institutions
                            through one secure digital government platform.

                            Manage services across{" "}
                            <strong>{subcityCount}</strong> Sub Cities
                            and{" "}
                            <strong>{woredaCount}</strong> Woredas with
                            faster, transparent and accountable service
                            delivery.
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4">

                            <Button
                                size="lg"
                                asChild
                            >
                                <Link href="/services">
                                    Explore Services
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>

                            <Button
                                variant="secondary"
                                size="lg"
                                asChild
                            >
                                <Link href="/track-application">
                                    Track Application
                                </Link>
                            </Button>

                        </div>

                    </div>

                    {/* RIGHT */}

                    <Card className="border-0 shadow-2xl">

                        <CardContent className="p-8">

                            <div className="grid grid-cols-2 gap-5">

                                {stats.length > 0 ? (
                                    stats.map((item, index) => {
                                        const Icon = icons[index] ?? Landmark;

                                        return (
                                            <Card key={item.label}>
                                                <CardContent className="p-6">
                                                    <Icon className="mb-4 h-8 w-8 text-primary" />

                                                    <div className="text-4xl font-extrabold">
                                                        {item.value}
                                                    </div>

                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {item.label}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-2 rounded-lg border p-6 text-center text-muted-foreground">
                                        No statistics available.
                                    </div>
                                )}

                            </div>

                            <Card className="mt-6 bg-primary text-primary-foreground border-0">

                                <CardContent className="p-6">

                                    <Badge
                                        variant="secondary"
                                    >
                                        Service Promise
                                    </Badge>

                                    <h2 className="mt-4 text-2xl font-bold">
                                        Less Waiting.
                                        <br />
                                        More Transparency.
                                        <br />
                                        Better Governance.
                                    </h2>

                                </CardContent>

                            </Card>

                        </CardContent>

                    </Card>

                </div>

            </div>

        </section>
    );
}