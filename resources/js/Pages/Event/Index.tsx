import { useState } from "react";
import { Head, usePage, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent } from "@/Components/ui/card";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/Components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { EmptyState } from "@/Components/ui/empty-state";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";

interface Attendee {
    id: number;
    name: string;
    attended: boolean;
}

interface Event {
    id: number;
    name: string;
    type: "training" | "townhall";
    event_date: string;
    description: string | null;
    attendees: Attendee[];
    has_attended: boolean;
}

const fmt = (s: string) =>
    new Date(s).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

export default function EventIndex({
    events,
    users,
}: {
    events: Event[];
    users: { id: number; name: string }[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";

    const [createOpen, setCreateOpen] = useState(false);
    const [detailEvent, setDetailEvent] = useState<Event | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: "",
        type: "training" as "training" | "townhall",
        event_date: "",
        description: "",
        assigned_user_ids: [] as number[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("events.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                reset();
            },
        });
    };

    const markAttended = (id: number) =>
        router.post(route("events.attend", id), {}, { preserveScroll: true });

    const destroy = (id: number) => {
        router.delete(route("events.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
        });
    };

    const overrideAttendance = (eventId: number, userId: number) =>
        router.post(
            route("events.override", {
                event: eventId,
                user: userId,
            }),
            {},
            { preserveScroll: true },
        );

    const toggleAssignedUser = (uid: number) => {
        setData(
            "assigned_user_ids",
            data.assigned_user_ids.includes(uid)
                ? data.assigned_user_ids.filter((id) => id !== uid)
                : [...data.assigned_user_ids, uid],
        );
    };

    const eventList = events;
    const upcoming = eventList.filter(
        (e) => new Date(e.event_date) >= new Date(),
    ).length;
    const past = eventList.filter(
        (e) => new Date(e.event_date) < new Date(),
    ).length;

    return (
        <AuthenticatedLayout>
            <Head title="Event" />

            <PageHeader
                title="Event"
                subtitle="Training & Townhall tim"
                action={
                    isLeader ? (
                        <Button onClick={() => setCreateOpen(true)}>
                            + Tambah Event
                        </Button>
                    ) : undefined
                }
            />

            {/* Stats */}
            <div className="mb-xl grid max-w-sm grid-cols-2 gap-lg">
                {[
                    {
                        label: "Mendatang",
                        value: upcoming,
                        valueClass: "text-info-text",
                    },
                    {
                        label: "Selesai",
                        value: past,
                        valueClass: "text-text-secondary",
                    },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent>
                            <p className="mb-sm text-[var(--font-base)] font-medium uppercase tracking-wide text-text-muted">
                                {s.label}
                            </p>
                            <p
                                className={`text-[var(--font-2xl)] font-semibold leading-none tracking-tight ${s.valueClass}`}
                            >
                                {s.value}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        {["Event", "Tipe", "Tanggal", "Peserta", ""].map(
                            (h, i) => (
                                <TableHead key={i}>{h}</TableHead>
                            ),
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {eventList.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5}>
                                <EmptyState
                                    title="Belum ada event"
                                    description={
                                        isLeader
                                            ? "Tambah event pertama untuk tim."
                                            : "Belum ada event yang dijadwalkan."
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    )}
                    {eventList.map((ev) => {
                        const isPast = new Date(ev.event_date) < new Date();
                        const attended = ev.attendees.filter(
                            (a) => a.attended,
                        ).length;
                        return (
                            <TableRow key={ev.id}>
                                <TableCell>
                                    <p className="text-[var(--font-base)] font-medium text-text-primary">
                                        {ev.name}
                                    </p>
                                    {ev.description && (
                                        <p className="mt-0.5 text-[var(--font-base)] text-text-muted">
                                            {ev.description.slice(0, 60)}
                                            {ev.description.length > 60
                                                ? "…"
                                                : ""}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            ev.type === "training"
                                                ? "success"
                                                : "info"
                                        }
                                    >
                                        {ev.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-text-secondary">
                                    {fmt(ev.event_date)}
                                </TableCell>
                                <TableCell className="text-text-secondary">
                                    {attended}/{ev.attendees.length} hadir
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-sm">
                                        {!isPast && !ev.has_attended && (
                                            <Button
                                                size="sm"
                                                className="bg-primary-subtle text-primary-text hover:bg-primary-subtle/70"
                                                onClick={() =>
                                                    markAttended(ev.id)
                                                }
                                            >
                                                Hadir
                                            </Button>
                                        )}
                                        {ev.has_attended && (
                                            <Badge variant="success">
                                                Hadir ✓
                                            </Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDetailEvent(ev)}
                                        >
                                            Detail
                                        </Button>
                                        {isLeader && (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() =>
                                                    setDeleteId(ev.id)
                                                }
                                            >
                                                Hapus
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Tambah Event</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="event-form"
                            onSubmit={submit}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="ev-name">Nama Event *</Label>
                                <Input
                                    id="ev-name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    placeholder="Nama event..."
                                    aria-invalid={!!errors.name}
                                />
                                {errors.name && (
                                    <p className="text-[var(--font-base)] text-error-text">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="ev-type">Tipe *</Label>
                                    <Select
                                        id="ev-type"
                                        value={data.type}
                                        onChange={(e) =>
                                            setData(
                                                "type",
                                                e.target.value as any,
                                            )
                                        }
                                    >
                                        <option value="training">
                                            Training
                                        </option>
                                        <option value="townhall">
                                            Townhall
                                        </option>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="ev-date">Tanggal *</Label>
                                    <Input
                                        id="ev-date"
                                        type="date"
                                        value={data.event_date}
                                        onChange={(e) =>
                                            setData(
                                                "event_date",
                                                e.target.value,
                                            )
                                        }
                                        aria-invalid={!!errors.event_date}
                                    />
                                    {errors.event_date && (
                                        <p className="text-[var(--font-base)] text-error-text">
                                            {errors.event_date}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="ev-desc">Deskripsi</Label>
                                <Textarea
                                    id="ev-desc"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    placeholder="Detail event..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Assign ke User (opsional)</Label>
                                <div className="flex flex-wrap gap-sm">
                                    {users.map((u) => (
                                        <button
                                            type="button"
                                            key={u.id}
                                            onClick={() =>
                                                toggleAssignedUser(u.id)
                                            }
                                            className={
                                                data.assigned_user_ids.includes(
                                                    u.id,
                                                )
                                                    ? "rounded-xs bg-primary-subtle px-2 py-0.5 text-[var(--font-base)] font-medium text-primary-text"
                                                    : "rounded-xs bg-surface-raised px-2 py-0.5 text-[var(--font-base)] font-medium text-text-secondary"
                                            }
                                        >
                                            {u.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setCreateOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="event-form"
                            disabled={processing}
                        >
                            {processing ? "Menyimpan…" : "Simpan Event"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog
                open={!!detailEvent}
                onOpenChange={(open) => !open && setDetailEvent(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>{detailEvent?.name ?? ""}</DialogTitle>
                    </DialogHeader>
                    {detailEvent && (
                        <DialogBody className="flex flex-col gap-xl">
                            <div className="flex flex-wrap items-center gap-md">
                                <Badge
                                    variant={
                                        detailEvent.type === "training"
                                            ? "success"
                                            : "info"
                                    }
                                >
                                    {detailEvent.type}
                                </Badge>
                                <span className="text-[var(--font-base)] text-text-muted">
                                    {fmt(detailEvent.event_date)}
                                </span>
                            </div>
                            {detailEvent.description && (
                                <p className="text-sm text-text-secondary">
                                    {detailEvent.description}
                                </p>
                            )}
                            <div>
                                <p className="mb-md text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
                                    Daftar Peserta
                                </p>
                                <div className="flex flex-col gap-sm">
                                    {detailEvent.attendees.length === 0 && (
                                        <p className="text-[var(--font-base)] text-text-muted">
                                            Belum ada peserta.
                                        </p>
                                    )}
                                    {detailEvent.attendees.map((a) => (
                                        <div
                                            key={a.id}
                                            className="flex items-center gap-md rounded-sm bg-surface-subtle px-md py-sm"
                                        >
                                            <span className="flex-1 text-[var(--font-base)] text-text-primary">
                                                {a.name}
                                            </span>
                                            {a.attended ? (
                                                <Badge variant="success">
                                                    Hadir
                                                </Badge>
                                            ) : (
                                                <Badge variant="neutral">
                                                    Belum
                                                </Badge>
                                            )}
                                            {isLeader && !a.attended && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        overrideAttendance(
                                                            detailEvent.id,
                                                            a.id,
                                                        )
                                                    }
                                                    className="text-[var(--font-sm)]"
                                                >
                                                    Override
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </DialogBody>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Hapus Event"
                description="Event ini akan dihapus (soft delete)."
                onConfirm={() => deleteId && destroy(deleteId)}
            />
        </AuthenticatedLayout>
    );
}
