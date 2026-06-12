import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/Lib/utils";

const badgeVariants = cva(
    "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-xs border border-transparent px-2 py-0.5 text-[12px] font-medium tracking-wide whitespace-nowrap transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
    {
        variants: {
            variant: {
                success: "bg-success-subtle text-success-text",
                warning: "bg-warning-subtle text-warning-text",
                error: "bg-error-subtle text-error-text",
                info: "bg-info-subtle text-info-text",
                neutral: "bg-surface-raised text-text-secondary",
            },
        },
        defaultVariants: {
            variant: "neutral",
        },
    },
);

function Badge({
    className,
    variant = "neutral",
    render,
    ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
    return useRender({
        defaultTagName: "span",
        props: mergeProps<"span">(
            {
                className: cn(badgeVariants({ variant }), className),
            },
            props,
        ),
        render,
        state: {
            slot: "badge",
            variant,
        },
    });
}

export { Badge, badgeVariants };
