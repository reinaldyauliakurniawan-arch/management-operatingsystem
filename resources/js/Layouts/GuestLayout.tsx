import { Link } from "@inertiajs/react";
import { PropsWithChildren } from "react";

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-subtle px-lg">
            <div className="mb-xl text-center">
                <p className="text-[var(--font-base)] font-medium uppercase tracking-widest text-text-muted">
                    Just Speak English Course
                </p>
                <h1 className="mt-xs text-[var(--font-lg)] font-semibold tracking-tight text-text-primary">
                    Management OS
                </h1>
            </div>
            <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-2xl">
                {children}
            </div>
        </div>
    );
}
