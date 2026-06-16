import { Head, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: "",
        password_confirmation: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("password.store"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <form onSubmit={submit} className="flex flex-col gap-lg">
                <div className="flex flex-col gap-xs">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        autoComplete="username"
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                        <p className="text-[var(--font-base)] text-error-text">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-xs">
                    <Label htmlFor="password">Password Baru</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        autoComplete="new-password"
                        autoFocus
                        aria-invalid={!!errors.password}
                    />
                    {errors.password && (
                        <p className="text-[var(--font-base)] text-error-text">
                            {errors.password}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-xs">
                    <Label htmlFor="password_confirmation">
                        Konfirmasi Password
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        autoComplete="new-password"
                        aria-invalid={!!errors.password_confirmation}
                    />
                    {errors.password_confirmation && (
                        <p className="text-[var(--font-base)] text-error-text">
                            {errors.password_confirmation}
                        </p>
                    )}
                </div>

                <Button type="submit" disabled={processing} className="w-full">
                    {processing ? "Menyimpan…" : "Reset Password"}
                </Button>
            </form>
        </GuestLayout>
    );
}
