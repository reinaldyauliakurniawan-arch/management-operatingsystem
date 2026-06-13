import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Button } from "@/Components/ui/button";

export default function Welcome({ auth }: PageProps) {
    return (
        <>
            <Head title="Just Speak English — Management OS" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f5]">
                <div className="text-center">
                    <p className="text-[12px] font-medium uppercase tracking-widest text-text-muted">
                        Just Speak English Course
                    </p>
                    <h1 className="mt-xs text-[28px] font-semibold tracking-tight text-text-primary">
                        Management OS
                    </h1>
                    <p className="mt-sm text-[14px] text-text-secondary">
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
