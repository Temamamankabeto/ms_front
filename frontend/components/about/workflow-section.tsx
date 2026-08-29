import {
    ArrowRight,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    FileUp,
    SearchCheck,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionTitle } from "./section-title";

interface WorkflowSectionProps {
    workflow?: string[] | null;
}

const icons = [
    ClipboardCheck,
    FileUp,
    SearchCheck,
    CheckCircle2,
    CreditCard,
    ArrowRight,
];

const descriptions = [
    "Citizens submit service applications online through the MESOB portal.",
    "Upload the required documents securely for verification.",
    "Assigned officers review and verify submitted information.",
    "Authorized officials approve or reject the application.",
    "Complete payment through the supported payment methods.",
    "Receive the approved service or downloadable document.",
];

export function WorkflowSection({
                                    workflow = [],
                                }: WorkflowSectionProps) {

    const workflowList = Array.isArray(workflow) ? workflow : [];

    return (
        <section className="bg-muted/30 py-20">
            <div className="container mx-auto max-w-7xl px-4">

                <SectionTitle
                    eyebrow="Service Workflow"
                    title="Simple, Transparent & Digital"
                    description="Every government service follows the same transparent workflow from application submission to final delivery."
                    centered
                />

                <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

                    {workflowList.length > 0 ? (
                        workflowList.map((step, index) => {

                            const Icon = icons[index] ?? CheckCircle2;

                            return (
                                <Card
                                    key={`${step}-${index}`}
                                    className="relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                                >
                                    <CardContent className="p-8">

                                        <Badge className="mb-6" variant="secondary">
                                            Step {index + 1}
                                        </Badge>

                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                                            <Icon className="h-8 w-8" />
                                        </div>

                                        <h3 className="mt-6 text-2xl font-bold">
                                            {step}
                                        </h3>

                                        <p className="mt-4 leading-7 text-muted-foreground">
                                            {descriptions[index] ??
                                                "Complete the workflow step securely through the MESOB platform."}
                                        </p>

                                    </CardContent>

                                    {index !== workflowList.length - 1 && (
                                        <div className="absolute right-5 top-5 hidden lg:block">
                                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    ) : (
                        <Card className="col-span-full">
                            <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
                                No workflow steps available.
                            </CardContent>
                        </Card>
                    )}

                </div>

                {/* Your CTA card remains unchanged */}

            </div>
        </section>
    );
}