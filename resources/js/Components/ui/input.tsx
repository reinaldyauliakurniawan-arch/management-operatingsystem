import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/Lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <InputPrimitive
            type={type}
            data-slot="input"
            className={cn(
                "h-9 w-full min-w-0 rounded-sm border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-colors outline-none placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
