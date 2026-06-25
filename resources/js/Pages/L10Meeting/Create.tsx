import { Head, useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { Card, CardContent } from "@/Components/ui/card";

interface User {
    id: number;
    name: string;
}

export default function L10Create({
    members,
    next_scheduled,
}: {
    members: User[];
    next_scheduled?: string;
}) {
    const { data, setData, post, processing, errors } = useForm({
        title: "",
        scheduled_at: next_scheduled ?? "",
        attendee_ids: [] as number[],
    });

    const toggleAttendee = (id: number) => {
        setData(
            "attendee_ids",
            data.attendee_ids.includes(id)
                ? data.attendee_ids.filter((x) => x !== id)
                : [...data.attendee_ids, id],
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("l10.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Buat L10 Meeting" />

            <PageHeader
                title="Buat L10 Meeting"
                subtitle="Jadwalkan meeting mingguan tim kamu"
            />

            <div className="max-w-xl">
                <Card>
                    <CardContent>
                        <form
                            onSubmit={submit}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="l10-title">
                                    Judul (opsional)
                                </Label>
                                <Input
                                    id="l10-title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                    placeholder="Misal: Weekly L10 — Agustus W3"
                                />
                            </div>

                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="l10-scheduled">
                                    Tanggal & Jam Meeting *
                                </Label>
                                <Input
                                    id="l10-scheduled"
                                    type="datetime-local"
                                    value={data.scheduled_at}
                                    onChange={(e) =>
                                        setData("scheduled_at", e.target.value)
                                    }
                                    aria-invalid={!!errors.scheduled_at}
                                />
                                {errors.scheduled_at && (
                                    <p className="text-[var(--font-base)] text-error-text">
                                        {errors.scheduled_at}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-xs">
                                <Label>Peserta</Label>
                                <div className="flex flex-col gap-xs rounded-lg border border-border bg-surface-raised p-md">
                                    {members.length === 0 ? (
                                        <p className="text-[13px] text-text-muted">
                                            Belum ada anggota tim.
                                        </p>
                                    ) : (
                                        members.map((m) => (
                                            <label
                                                key={m.id}
                                                className="flex cursor-pointer items-center gap-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={data.attendee_ids.includes(
                                                        m.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleAttendee(m.id)
                                                    }
                                                    className="h-4 w-4 rounded accent-primary"
                                                />
                                                <span className="text-[var(--font-base)] text-text-primary">
                                                    {m.name}
                                                </span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-sm pt-sm">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        router.visit(route("l10.index"))
                                    }
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? "Menyimpan…" : "Buat Meeting"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
