import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/Lib/utils";

function Select({
    className,
    children,
    ...props
}: React.ComponentProps<"select">) {
    return (
        <div className="relative">
            <select
                data-slot="select"
                className={cn(
                    "h-9 w-full appearance-none rounded-sm border border-border bg-surface-raised px-3 py-2 pr-9 text-sm text-text-primary transition-colors outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20",
                    className,
                )}
                {...props}
            >
                {children}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        </div>
    );
}

export { Select };
