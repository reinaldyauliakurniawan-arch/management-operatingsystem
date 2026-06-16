import { Head, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({ email: "" });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("password.email"));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Password" />

            <p className="mb-lg text-[var(--font-base)] text-text-secondary">
                Masukkan email kamu dan kami akan kirimkan link untuk reset
                password.
            </p>

            {status && (
                <p className="mb-lg text-[var(--font-base)] font-medium text-primary">
                    {status}
                </p>
            )}

            <form onSubmit={submit} className="flex flex-col gap-lg">
                <div className="flex flex-col gap-xs">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        autoFocus
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                        <p className="text-[var(--font-base)] text-error-text">
                            {errors.email}
                        </p>
                    )}
                </div>

                <Button type="submit" disabled={processing} className="w-full">
                    {processing ? "Mengirim…" : "Kirim Link Reset"}
                </Button>
            </form>
        </GuestLayout>
    );
}
