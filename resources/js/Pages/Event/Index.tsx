import { useState } from "react";
import { useForm, Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Card, CardContent } from "@/Components/ui/card";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from "@/Components/ui/dialog";

interface EventItem {
    id: number;
    name: string;
    type: "training" | "townhall";
    event_date: string;
    description: string | null;
    assigned_roles: string[] | null;
    attended_count: number | null;
    my_attended: boolean;
    is_past: boolean;
}

interface UserOption {
    id: number;
    name: string;
}

const roleOptions = [
    { value: "leader", label: "Leader" },
    { value: "member", label: "Member" },
    { value: "tutor", label: "Tutor" },
];

export default function EventIndex({
    events,
    users,
    isLeader,
}: {
    events: EventItem[];
    users: UserOption[];
    isLeader: boolean;
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [overrideEvent, setOverrideEvent] = useState<EventItem | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: "",
        type: "training" as "training" | "townhall",
        event_date: "",
        description: "",
        assigned_roles: [] as string[],
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

    const toggleRole = (role: string) => {
        setData(
            "assigned_roles",
            data.assigned_roles.includes(role)
                ? data.assigned_roles.filter((r) => r !== role)
                : [...data.assigned_roles, role],
        );
    };

    const markAttended = (id: number) =>
        router.post(route("events.attend", id), {}, { preserveScroll: true });

    const destroy = (id: number) => {
        if (!confirm("Hapus event ini?")) return;
        router.delete(route("events.destroy", id), { preserveScroll: true });
    };

    const upcoming = events.filter((e) => !e.is_past);
    const past = events.filter((e) => e.is_past);

    return (
        <AuthenticatedLayout>
            <Head title="Events" />

            <PageHeader
                title="Events"
                subtitle="Training & townhall — kehadiran masuk ke leaderboard"
                action={
                    isLeader && (
                        <Button onClick={() => setCreateOpen(true)}>
                            + Tambah Event
                        </Button>
                    )
                }
            />

            <div className="flex flex-col gap-xl">
                <EventTable
                    title="Upcoming"
                    items={upcoming}
                    isLeader={isLeader}
                    users={users}
                    onMark={markAttended}
                    onDelete={destroy}
                    onOverride={setOverrideEvent}
                    emptyText="Tidak ada event mendatang."
                />
                <EventTable
                    title="Past"
                    items={past}
                    isLeader={isLeader}
                    users={users}
                    onMark={markAttended}
                    onDelete={destroy}
                    onOverride={setOverrideEvent}
                    emptyText="Belum ada riwayat event."
                />
            </div>

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Tambah Event</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit}>
                        <DialogBody className="flex flex-col gap-lg">
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Nama Event *
                                </Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    placeholder="Misal: Public Speaking Training"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-error-text">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-md">
                                <div>
                                    <Label className="mb-1.5 text-text-secondary">
                                        Tipe *
                                    </Label>
                                    <select
                                        value={data.type}
                                        onChange={(e) =>
                                            setData(
                                                "type",
                                                e.target.value as any,
                                            )
                                        }
                                        className="w-full rounded-sm border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/12"
                                    >
                                        <option value="training">
                                            Training
                                        </option>
                                        <option value="townhall">
                                            Townhall
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="mb-1.5 text-text-secondary">
                                        Tanggal *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.event_date}
                                        onChange={(e) =>
                                            setData(
                                                "event_date",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {errors.event_date && (
                                        <p className="mt-1 text-xs text-error-text">
                                            {errors.event_date}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Deskripsi
                                </Label>
                                <Textarea
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    placeholder="Detail event..."
                                />
                            </div>
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Assign ke Role (kosongkan untuk semua)
                                </Label>
                                <div className="flex flex-wrap gap-sm">
                                    {roleOptions.map((r) => (
                                        <button
                                            type="button"
                                            key={r.value}
                                            onClick={() => toggleRole(r.value)}
                                            className={
                                                data.assigned_roles.includes(
                                                    r.value,
                                                )
                                                    ? "rounded-xs bg-primary-subtle px-2 py-0.5 text-[12px] font-medium text-primary-text"
                                                    : "rounded-xs bg-surface-raised px-2 py-0.5 text-[12px] font-medium text-text-secondary"
                                            }
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </DialogBody>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setCreateOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? "Menyimpan…" : "Simpan Event"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Override Attendance Modal */}
            <Dialog
                open={!!overrideEvent}
                onOpenChange={(open) => !open && setOverrideEvent(null)}
            >
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Override Kehadiran</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="flex flex-col gap-sm">
                        <p className="mb-1 text-sm text-text-secondary">
                            {overrideEvent?.name}
                        </p>
                        {users.map((u) => (
                            <div
                                key={u.id}
                                className="flex items-center justify-between rounded-sm bg-surface-subtle px-3 py-2"
                            >
                                <span className="text-sm text-text-primary">
                                    {u.name}
                                </span>
                                <div className="flex gap-sm">
                                    <Button
                                        size="xs"
                                        variant="secondary"
                                        onClick={() =>
                                            overrideEvent &&
                                            router.post(
                                                route(
                                                    "events.override",
                                                    overrideEvent.id,
                                                ),
                                                {
                                                    user_id: u.id,
                                                    attended: true,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Hadir
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        onClick={() =>
                                            overrideEvent &&
                                            router.post(
                                                route(
                                                    "events.override",
                                                    overrideEvent.id,
                                                ),
                                                {
                                                    user_id: u.id,
                                                    attended: false,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Tidak Hadir
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setOverrideEvent(null)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

function EventTable({
    title,
    items,
    isLeader,
    users,
    onMark,
    onDelete,
    onOverride,
    emptyText,
}: {
    title: string;
    items: EventItem[];
    isLeader: boolean;
    users: UserOption[];
    onMark: (id: number) => void;
    onDelete: (id: number) => void;
    onOverride: (e: EventItem) => void;
    emptyText: string;
}) {
    return (
        <div>
            <h2 className="mb-md text-[14px] font-semibold tracking-tight text-text-primary">
                {title}
            </h2>
            <Card className="p-0">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Assigned</TableHead>
                                {isLeader && <TableHead>Hadir</TableHead>}
                                <TableHead>Status Saya</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={isLeader ? 7 : 6}
                                        className="py-12 text-center text-text-muted"
                                    >
                                        {emptyText}
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell>
                                        <p className="font-medium text-text-primary">
                                            {event.name}
                                        </p>
                                        {event.description && (
                                            <p className="mt-0.5 text-[12px] text-text-muted">
                                                {event.description.slice(0, 60)}
                                                {event.description.length > 60
                                                    ? "…"
                                                    : ""}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="info">
                                            {event.type === "training"
                                                ? "Training"
                                                : "Townhall"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-text-secondary">
                                        {event.event_date}
                                    </TableCell>
                                    <TableCell className="text-text-secondary">
                                        {event.assigned_roles?.length
                                            ? event.assigned_roles.join(", ")
                                            : "Semua"}
                                    </TableCell>
                                    {isLeader && (
                                        <TableCell className="text-text-secondary">
                                            {event.attended_count ?? "—"} /{" "}
                                            {users.length}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        {event.my_attended ? (
                                            <Badge variant="success">
                                                Hadir
                                            </Badge>
                                        ) : event.is_past ? (
                                            <Badge variant="error">
                                                Tidak Hadir
                                            </Badge>
                                        ) : (
                                            <Badge variant="neutral">
                                                Belum
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-sm">
                                            {!event.my_attended && (
                                                <Button
                                                    size="xs"
                                                    variant="secondary"
                                                    onClick={() =>
                                                        onMark(event.id)
                                                    }
                                                >
                                                    Mark Hadir
                                                </Button>
                                            )}
                                            {isLeader && (
                                                <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        onOverride(event)
                                                    }
                                                >
                                                    Override
                                                </Button>
                                            )}
                                            {isLeader && (
                                                <Button
                                                    size="xs"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        onDelete(event.id)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
