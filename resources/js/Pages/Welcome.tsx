import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Button } from "@/Components/ui/button";

export default function Welcome({ auth }: PageProps) {
    return (
        <>
            <Head title="Just Speak English — Management OS" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-surface-subtle">
                <div className="text-center">
                    <p className="text-[var(--font-base)] font-medium uppercase tracking-widest text-text-muted">
                        Just Speak English Course
                    </p>
                    <h1 className="mt-xs text-[var(--font-xl)] font-semibold tracking-tight text-text-primary">
                        Management OS
                    </h1>
                    <p className="mt-sm text-[var(--font-base)] text-text-secondary">
                        Sistem operasional manajemen tim internal.
                    </p>

                    <div className="mt-xl flex justify-center gap-sm">
                        {auth.user ? (
                            <Link href={route("dashboard")}>
                                <Button>Buka Dashboard</Button>
                            </Link>
                        ) : (
                            <>
                                <Link href={route("login")}>
                                    <Button>Masuk</Button>
                                </Link>
                                <Link href={route("register")}>
                                    <Button variant="secondary">Daftar</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
