import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/Lib/utils";

const badgeVariants = cva(
    "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-xs border border-transparent px-2 py-0.5 text-[var(--font-base)] font-medium tracking-wide whitespace-nowrap transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
    {
        variants: {
            variant: {
                success: "bg-[#d1fae5] text-[#047857]",
                warning: "bg-[#fef3c7] text-[#92400e]",
                error: "bg-[#fee2e2] text-[#991b1b]",
                info: "bg-[#eff6ff] text-[#1e3a8a]",
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
