import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
    eyebrow: string;
    title: string;
    description?: string;
    centered?: boolean;
    light?: boolean;
    className?: string;
}

export function SectionTitle({
                                 eyebrow,
                                 title,
                                 description,
                                 centered = false,
                                 light = false,
                                 className,
                             }: SectionTitleProps) {
    return (
        <div
            className={cn(
                "mb-12 max-w-3xl",
                centered && "mx-auto text-center",
                className
            )}
        >
            <Badge variant={light ? "secondary" : "outline"}>
                {eyebrow}
            </Badge>

            <h2
                className={cn(
                    "mt-4 text-3xl font-bold tracking-tight md:text-4xl",
                    light ? "text-white" : "text-foreground"
                )}
            >
                {title}
            </h2>

            {description && (
                <p
                    className={cn(
                        "mt-4 text-lg leading-8",
                        light
                            ? "text-slate-200"
                            : "text-muted-foreground"
                    )}
                >
                    {description}
                </p>
            )}
        </div>
    );
}

export default SectionTitle;