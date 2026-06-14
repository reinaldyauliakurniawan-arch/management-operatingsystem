import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Button } from "@/Components/ui/button";

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("verification.send"));
    };

    return (
        <GuestLayout>
            <Head title="Verifikasi Email" />

            <p className="mb-lg text-[13px] text-text-secondary">
                Terima kasih sudah mendaftar! Cek emailmu dan klik link
                verifikasi yang sudah kami kirim.
            </p>

            {status === "verification-link-sent" && (
                <p className="mb-lg text-[13px] font-medium text-primary">
                    Link verifikasi baru sudah dikirim ke emailmu.
                </p>
            )}

            <form onSubmit={submit} className="flex flex-col gap-lg">
                <Button type="submit" disabled={processing} className="w-full">
                    {processing ? "Mengirim…" : "Kirim Ulang Email Verifikasi"}
                </Button>

                <Link
                    href={route("logout")}
                    method="post"
                    as="button"
                    className="text-center text-[13px] text-text-muted hover:text-error-text transition-colors"
                >
                    Keluar
                </Link>
            </form>
        </GuestLayout>
    );
}
