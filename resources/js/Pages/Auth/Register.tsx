import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Daftar" />

            <form onSubmit={submit} className="flex flex-col gap-lg">
                <div className="flex flex-col gap-xs">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        autoComplete="name"
                        autoFocus
                        required
                        aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                        <p className="text-[var(--font-base)] text-error-text">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-xs">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        autoComplete="username"
                        required
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                        <p className="text-[var(--font-base)] text-error-text">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-xs">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        autoComplete="new-password"
                        required
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
                        required
                        aria-invalid={!!errors.password_confirmation}
                    />
                    {errors.password_confirmation && (
                        <p className="text-[var(--font-base)] text-error-text">
                            {errors.password_confirmation}
                        </p>
                    )}
                </div>

                <Button type="submit" disabled={processing} className="w-full">
                    {processing ? "Mendaftar…" : "Daftar"}
                </Button>

                <p className="text-center text-[var(--font-base)] text-text-muted">
                    Sudah punya akun?{" "}
                    <Link
                        href={route("login")}
                        className="text-primary-text hover:underline"
                    >
                        Masuk
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
