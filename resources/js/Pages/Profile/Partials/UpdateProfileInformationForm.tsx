import { Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
    className = "",
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;
    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route("profile.update"));
    };

    return (
        <section className={className}>
            <h2 className="mb-xs text-[14px] font-semibold tracking-tight text-text-primary">
                Informasi Profil
            </h2>
            <p className="mb-lg text-[13px] text-text-secondary">
                Perbarui nama dan alamat email akun kamu.
            </p>

            <form onSubmit={submit} className="flex flex-col gap-lg">
                <div className="flex flex-col gap-xs">
                    <Label htmlFor="name">Nama</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        autoComplete="name"
                        required
                        aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                        <p className="text-[12px] text-error-text">
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
                        <p className="text-[12px] text-error-text">
                            {errors.email}
                        </p>
                    )}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="text-[13px] text-text-secondary">
                            Email belum diverifikasi.{" "}
                            <Link
                                href={route("verification.send")}
                                method="post"
                                as="button"
                                className="text-primary-text hover:underline"
                            >
                                Kirim ulang verifikasi.
                            </Link>
                        </p>
                        {status === "verification-link-sent" && (
                            <p className="mt-sm text-[13px] font-medium text-primary">
                                Link verifikasi baru sudah dikirim.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-md">
                    <Button type="submit" disabled={processing}>
                        Simpan
                    </Button>
                    {recentlySuccessful && (
                        <p className="text-[13px] text-primary">Tersimpan.</p>
                    )}
                </div>
            </form>
        </section>
    );
}
