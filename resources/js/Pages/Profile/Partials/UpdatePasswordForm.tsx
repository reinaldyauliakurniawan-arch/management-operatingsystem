import { useForm } from "@inertiajs/react";
import { FormEventHandler, useRef } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export default function UpdatePasswordForm({
    className = "",
}: {
    className?: string;
}) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset("password", "password_confirmation");
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset("current_password");
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <h2 className="mb-xs text-[var(--font-base)] font-semibold tracking-tight text-text-primary">
                Ubah Password
            </h2>
            <p className="mb-lg text-[var(--font-base)] text-text-secondary">
                Gunakan password yang panjang dan acak agar akun tetap aman.
            </p>

            <form onSubmit={submit} className="flex flex-col gap-lg">
                <div className="flex flex-col gap-xs">
                    <Label htmlFor="current_password">Password Saat Ini</Label>
                    <Input
                        id="current_password"
                        ref={currentPasswordInput}
                        type="password"
                        value={data.current_password}
                        onChange={(e) =>
                            setData("current_password", e.target.value)
                        }
                        autoComplete="current-password"
                        aria-invalid={!!errors.current_password}
                    />
                    {errors.current_password && (
                        <p className="text-[var(--font-base)] text-error-text">
                            {errors.current_password}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-xs">
                    <Label htmlFor="password">Password Baru</Label>
                    <Input
                        id="password"
                        ref={passwordInput}
                        type="password"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        autoComplete="new-password"
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

                <div className="flex items-center gap-md">
                    <Button type="submit" disabled={processing}>
                        Simpan
                    </Button>
                    {recentlySuccessful && (
                        <p className="text-[var(--font-base)] text-primary">Tersimpan.</p>
                    )}
                </div>
            </form>
        </section>
    );
}
