import {
    BarChart3,
    BellRing,
    CheckCircle2,
    FileText,
    Lock,
    ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

import { SectionTitle } from "./section-title";

const features = [
    {
        title: "Online Applications",
        description:
            "Citizens can submit applications from anywhere without visiting government offices.",
        icon: FileText,
    },
    {
        title: "Secure Document Upload",
        description:
            "Upload required documents safely with secure digital storage.",
        icon: Lock,
    },
    {
        title: "Real-Time Notifications",
        description:
            "Receive instant notifications whenever your application status changes.",
        icon: BellRing,
    },
    {
        title: "Role-Based Access",
        description:
            "City, Sub City and Woreda officers work using secure permission-based dashboards.",
        icon: ShieldCheck,
    },
    {
        title: "Analytics & Reports",
        description:
            "Generate performance reports and service analytics for better decision making.",
        icon: BarChart3,
    },
    {
        title: "Transparent Workflow",
        description:
            "Every application is traceable from submission through approval and delivery.",
        icon: CheckCircle2,
    },
];

export function FeatureSection() {
    return (
        <section className="py-20">
            <div className="container mx-auto max-w-7xl px-4">

                <SectionTitle
                    eyebrow="Platform Features"
                    title="Built for Modern Municipal Service Delivery"
                    description="MESOB combines secure workflows, digital document management, online applications, notifications, reporting, and role-based access into one unified platform."
                />

                <div className="mt-12 grid gap-10 lg:grid-cols-[420px_1fr]">

                    {/* Left Content */}

                    <Card className="border-0 bg-primary text-primary-foreground shadow-xl">

                        <CardContent className="p-8">

                            <Badge variant="secondary">
                                Why Choose MESOB?
                            </Badge>

                            <h2 className="mt-6 text-3xl font-bold leading-tight">
                                A Complete Digital Government Platform
                            </h2>

                            <p className="mt-6 leading-8 text-primary-foreground/80">
                                MESOB enables city administrations to
                                modernize public service delivery through
                                centralized digital workflows. Citizens,
                                businesses and government officers all work
                                within one secure platform that improves
                                transparency, efficiency and accountability.
                            </p>

                            <div className="mt-8 space-y-4">

                                {[
                                    "Citizen Self-Service Portal",
                                    "Secure Authentication",
                                    "Online Payments",
                                    "Digital Approvals",
                                    "Application Tracking",
                                ].map((item) => (

                                    <div
                                        key={item}
                                        className="flex items-center gap-3"
                                    >
                                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />

                                        <span>{item}</span>

                                    </div>

                                ))}

                            </div>

                        </CardContent>

                    </Card>

                    {/* Right Feature Grid */}

                    <div className="grid gap-6 md:grid-cols-2">
                        {features.map((feature) => {
                            const Icon = feature.icon;

                            return (
                                <Card
                                    key={feature.title}
                                    className="group transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                                >
                                    <CardContent className="p-7">

                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary">
                                            <Icon className="h-7 w-7 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                                        </div>

                                        <h3 className="mt-6 text-xl font-bold">
                                            {feature.title}
                                        </h3>

                                        <p className="mt-3 leading-7 text-muted-foreground">
                                            {feature.description}
                                        </p>

                                    </CardContent>
                                </Card>
                            );
                        })}                    </div>
                </div>

                {/* Bottom Summary */}

                <Card className="mt-16 border-0 bg-muted shadow-lg">
                    <CardContent className="grid gap-8 p-8 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                value: "24/7",
                                label: "Online Access",
                            },
                            {
                                value: "100%",
                                label: "Digital Workflow",
                            },
                            {
                                value: "Secure",
                                label: "Role-Based Access",
                            },
                            {
                                value: "Fast",
                                label: "Service Delivery",
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="text-center"
                            >
                                <div className="text-3xl font-bold text-primary">
                                    {item.value}
                                </div>

                                <p className="mt-2 text-muted-foreground">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

            </div>
        </section>
    );
}