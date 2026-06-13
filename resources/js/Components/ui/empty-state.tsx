import * as React from "react";

import { cn } from "@/Lib/utils";

interface EmptyStateProps extends React.ComponentProps<"div"> {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

function EmptyState({
    icon,
    title,
    description,
    action,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            data-slot="empty-state"
            className={cn(
                "flex flex-col items-center justify-center gap-1 py-3xl text-center",
                className,
            )}
            {...props}
        >
            {icon && (
                <div className="mb-md flex size-12 items-center justify-center rounded-lg bg-surface-subtle text-text-muted [&_svg]:size-6">
                    {icon}
                </div>
            )}
            <p className="text-sm font-semibold tracking-tight text-text-primary">
                {title}
            </p>
            {description && (
                <p className="max-w-sm text-sm text-text-secondary">
                    {description}
                </p>
            )}
            {action && <div className="mt-lg">{action}</div>}
        </div>
    );
}

export { EmptyState };
