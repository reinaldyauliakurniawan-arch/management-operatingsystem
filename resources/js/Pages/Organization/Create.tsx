import { Head, useForm } from "@inertiajs/react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export default function OrganizationCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("organization.store"));
    };

    return (
        <GuestLayout>
            <Head title="Buat Organization" />

            <div className="mx-auto w-full max-w-md">
                <div className="mb-xl">
                    <h1 className="text-[var(--font-lg)] font-semibold tracking-tight text-text-primary">
                        Buat Organization
                    </h1>
                    <p className="mt-xs text-[var(--font-base)] text-text-secondary">
                        Mulai dengan membuat organization untuk tim kamu.
                    </p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-lg">
                    <div className="flex flex-col gap-xs">
                        <Label htmlFor="org-name">Nama Organization *</Label>
                        <Input
                            id="org-name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Misal: Just Speak English"
                            aria-invalid={!!errors.name}
                            required
                        />
                        {errors.name && (
                            <p className="text-[var(--font-base)] text-error-text">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full"
                    >
                        {processing ? "Membuat…" : "Buat Organization"}
                    </Button>
                </form>
            </div>
        </GuestLayout>
    );
}
