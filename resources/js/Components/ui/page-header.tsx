import * as React from "react";

import { cn } from "@/Lib/utils";

interface PageHeaderProps extends React.ComponentProps<"div"> {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

function PageHeader({
    title,
    subtitle,
    action,
    className,
    ...props
}: PageHeaderProps) {
    return (
        <div
            data-slot="page-header"
            className={cn(
                "mb-xl flex items-center justify-between gap-lg border-b border-border pb-xl",
                className,
            )}
            {...props}
        >
            <div>
                <h1 className="text-[var(--font-lg)] leading-tight font-semibold tracking-[-0.02em] text-text-primary">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

export { PageHeader };
