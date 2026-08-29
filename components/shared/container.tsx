import * as React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    as?: React.ElementType;
    size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizes = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
};

export function Container({
                              as: Component = "div",
                              size = "xl",
                              className,
                              children,
                              ...props
                          }: ContainerProps) {
    return (
        <Component
            className={cn(
                "mx-auto w-full px-4 sm:px-6 lg:px-8",
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
}

export default Container;