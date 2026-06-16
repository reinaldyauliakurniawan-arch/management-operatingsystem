import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("login"), { onFinish: () => reset("password") });
    };

    return (
        <GuestLayout>
            <Head title="Masuk" />

            {status && (
                <p className="mb-lg text-[13px] font-medium text-primary">
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
                        autoComplete="username"
                        autoFocus
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                        <p className="text-[12px] text-error-text">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-xs">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {canResetPassword && (
                            <Link
                                href={route("password.request")}
                                className="text-[12px] text-text-muted hover:text-primary-text transition-colors"
                            >
                                Lupa password?
                            </Link>
                        )}
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        autoComplete="current-password"
                        aria-invalid={!!errors.password}
                    />
                    {errors.password && (
                        <p className="text-[12px] text-error-text">
                            {errors.password}
                        </p>
                    )}
                </div>

                <label className="flex cursor-pointer items-center gap-sm">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) =>
                            setData("remember", e.target.checked as false)
                        }
                        className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="text-[13px] text-text-secondary">
                        Ingat saya
                    </span>
                </label>

                <Button type="submit" disabled={processing} className="w-full">
                    {processing ? "Masuk…" : "Masuk"}
                </Button>

                <p className="text-center text-[13px] text-text-muted">
                    Belum punya akun?{" "}
                    <Link
                        href={route("register")}
                        className="text-primary-text hover:underline"
                    >
                        Daftar
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
