import * as React from "react";

import { cn } from "@/Lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
    return (
        <div
            data-slot="table-container"
            className="relative w-full overflow-x-auto rounded-lg border border-border shadow-sm"
        >
            <table
                data-slot="table"
                className={cn("w-full caption-bottom text-sm", className)}
                {...props}
            />
        </div>
    );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
    return (
        <thead
            data-slot="table-header"
            className={cn(
                "bg-surface-subtle [&_tr]:border-b [&_tr]:border-border",
                className,
            )}
            {...props}
        />
    );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
    return (
        <tbody
            data-slot="table-body"
            className={cn("[&_tr:last-child]:border-0", className)}
            {...props}
        />
    );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
    return (
        <tfoot
            data-slot="table-footer"
            className={cn(
                "border-t border-border bg-surface-subtle font-medium [&>tr]:last:border-b-0",
                className,
            )}
            {...props}
        />
    );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
    return (
        <tr
            data-slot="table-row"
            className={cn(
                "border-b border-border transition-colors duration-100 hover:bg-surface-overlay data-[state=selected]:bg-surface-overlay",
                className,
            )}
            {...props}
        />
    );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
    return (
        <th
            data-slot="table-head"
            className={cn(
                "h-auto px-4 py-3 text-left align-middle text-[12px] font-medium tracking-wider whitespace-nowrap text-text-secondary uppercase [&:has([role=checkbox])]:pr-0",
                className,
            )}
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
    return (
        <td
            data-slot="table-cell"
            className={cn(
                "px-4 py-3 align-middle text-[13px] text-text-primary whitespace-nowrap [&:has([role=checkbox])]:pr-0",
                className,
            )}
            {...props}
        />
    );
}

function TableCaption({
    className,
    ...props
}: React.ComponentProps<"caption">) {
    return (
        <caption
            data-slot="table-caption"
            className={cn("mt-4 text-sm text-text-secondary", className)}
            {...props}
        />
    );
}

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
};
