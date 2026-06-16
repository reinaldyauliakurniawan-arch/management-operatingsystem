import { Head, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("password.confirm"), { onFinish: () => reset("password") });
    };

    return (
        <GuestLayout>
            <Head title="Konfirmasi Password" />

            <p className="mb-lg text-[var(--font-base)] text-text-secondary">
                Area aman. Konfirmasi password kamu untuk melanjutkan.
            </p>

            <form onSubmit={submit} className="flex flex-col gap-lg">
                <div className="flex flex-col gap-xs">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        autoFocus
                        aria-invalid={!!errors.password}
                    />
                    {errors.password && (
                        <p className="text-[var(--font-base)] text-error-text">
                            {errors.password}
                        </p>
                    )}
                </div>

                <Button type="submit" disabled={processing} className="w-full">
                    {processing ? "Memverifikasi…" : "Konfirmasi"}
                </Button>
            </form>
        </GuestLayout>
    );
}
