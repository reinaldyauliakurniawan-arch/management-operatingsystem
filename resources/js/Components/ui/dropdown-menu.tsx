import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@/Lib/utils";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
    return <MenuPrimitive.Root {...props} />;
}

function DropdownMenuTrigger({
    children,
    ...props
}: MenuPrimitive.Trigger.Props) {
    return (
        <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props}>
            {children}
        </MenuPrimitive.Trigger>
    );
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
    return <MenuPrimitive.Portal {...props} />;
}

function DropdownMenuContent({
    className,
    ...props
}: MenuPrimitive.Positioner.Props) {
    return (
        <MenuPrimitive.Portal>
            <MenuPrimitive.Positioner>
                <MenuPrimitive.Popup
                    data-slot="dropdown-menu-content"
                    className={cn(
                        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
                        className,
                    )}
                    {...props}
                />
            </MenuPrimitive.Positioner>
        </MenuPrimitive.Portal>
    );
}

function DropdownMenuLabel({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dropdown-menu-label"
            className={cn("px-2 py-1.5 text-sm font-semibold", className)}
            {...props}
        />
    );
}

function DropdownMenuSeparator({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dropdown-menu-separator"
            className={cn("-mx-1 my-1 h-px bg-muted", className)}
            {...props}
        />
    );
}

function DropdownMenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
    return (
        <MenuPrimitive.Item
            data-slot="dropdown-menu-item"
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className,
            )}
            {...props}
        />
    );
}

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
};
