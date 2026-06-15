import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/Lib/utils";

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    "rounded-full bg-primary text-text-inverse hover:bg-primary-hover hover:scale-[0.97]",
                outline:
                    "rounded-sm border-border bg-surface hover:bg-surface-overlay hover:text-text-primary",
                secondary:
                    "rounded-sm border-border bg-surface-raised text-text-primary hover:bg-surface-overlay",
                ghost: "rounded-sm text-text-secondary hover:bg-surface-overlay hover:text-text-primary",
                destructive:
                    "rounded-sm bg-error-subtle text-error-text hover:bg-error-subtle/70",
                danger: "rounded-sm bg-error-subtle text-error-text hover:bg-error-subtle/80",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default:
                    "h-9 gap-1.5 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
                xs: "h-7 gap-1 px-3 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
                sm: "h-7 gap-1 px-4 text-[0.8rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
                lg: "h-10 gap-1.5 px-6 text-sm has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
                icon: "size-9 rounded-sm",
                "icon-xs":
                    "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
                "icon-sm": "size-7 rounded-sm",
                "icon-lg": "size-9 rounded-sm",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

function Button({
    className,
    variant = "default",
    size = "default",
    ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
    return (
        <ButtonPrimitive
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
