import {
    CheckCircle2,
    ClipboardCheck,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import { SectionTitle } from "./section-title";

const items = [
    {
        title: "Our Vision",
        description:
            "To become a leading smart city digital government platform that delivers accessible, transparent, secure, and citizen-centered public services for everyone.",
        icon: Sparkles,
    },
    {
        title: "Our Mission",
        description:
            "To digitize municipal services, improve efficiency, reduce service delivery time, strengthen accountability, and provide high-quality public services through modern technology.",
        icon: ClipboardCheck,
    },
    {
        title: "Our Core Values",
        description:
            "Transparency, accountability, integrity, innovation, security, inclusion, collaboration, and excellent customer service guide every service we deliver.",
        icon: ShieldCheck,
    },
];

const objectives = [
    "Provide 24/7 online government services",
    "Reduce paperwork and manual processing",
    "Increase transparency and accountability",
    "Improve citizen satisfaction",
    "Strengthen digital governance",
    "Enable real-time application tracking",
];

export function VisionMissionSection() {
    return (
        <section className="py-20">
            <div className="container mx-auto max-w-7xl px-4">

                <SectionTitle
                    eyebrow="About MESOB"
                    title="Vision, Mission & Core Values"
                    description="MESOB is a modern municipal digital platform designed to transform public service delivery across the City Administration."
                />

                <div className="grid gap-6 lg:grid-cols-3">

                    {items.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Card
                                key={item.title}
                                className="transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                            >
                                <CardContent className="p-8">

                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                        <Icon className="h-8 w-8 text-primary" />
                                    </div>

                                    <h3 className="mt-6 text-2xl font-bold">
                                        {item.title}
                                    </h3>

                                    <p className="mt-4 leading-7 text-muted-foreground">
                                        {item.description}
                                    </p>

                                </CardContent>
                            </Card>
                        );
                    })}

                </div>

                <Card className="mt-12 border-0 bg-primary text-primary-foreground shadow-xl">
                    <CardContent className="grid gap-10 p-8 lg:grid-cols-2 lg:p-10">

                        <div>

                            <h2 className="text-3xl font-bold">
                                Strategic Objectives
                            </h2>

                            <p className="mt-4 leading-8 text-primary-foreground/80">
                                The MESOB platform supports digital transformation by
                                improving service accessibility, increasing operational
                                efficiency, and strengthening good governance across
                                all administrative levels.
                            </p>

                        </div>

                        <div className="grid gap-4">

                            {objectives.map((objective) => (
                                <div
                                    key={objective}
                                    className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 p-4"
                                >
                                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />

                                    <span>{objective}</span>
                                </div>
                            ))}

                        </div>

                    </CardContent>
                </Card>

            </div>
        </section>
    );
}