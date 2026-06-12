import * as React from "react";

import { cn } from "@/Lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "flex field-sizing-content min-h-16 w-full rounded-sm border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-colors outline-none placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20",
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
