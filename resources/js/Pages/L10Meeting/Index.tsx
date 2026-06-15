import { useState } from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";
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
import { EmptyState } from "@/Components/ui/empty-state";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";

interface Meeting {
    id: number;
    title: string | null;
    scheduled_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    rating: number | null;
    is_ongoing: boolean;
    is_scheduled: boolean;
    attendees: { id: number; name: string }[];
}

function MeetingStatus({ m }: { m: Meeting }) {
    if (m.ended_at) return <Badge variant="neutral">Selesai</Badge>;
    if (m.is_ongoing) return <Badge variant="warning">Berlangsung</Badge>;
    if (m.is_scheduled) return <Badge variant="info">Terjadwal</Badge>;
    return <Badge variant="neutral">Draft</Badge>;
}

const fmt = (s: string | null) =>
    s
        ? new Date(s).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "—";

export default function L10Index({
    meetings,
}: {
    meetings: { data: Meeting[] };
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const destroy = (id: number) => {
        router.delete(route("l10.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
        });
    };

    const meetingList = meetings.data;
    const ongoing = meetingList.find((m) => m.is_ongoing);
    const scheduled = meetingList.filter((m) => m.is_scheduled).length;
    const done = meetingList.filter((m) => m.ended_at).length;

    return (
        <AuthenticatedLayout>
            <Head title="L10 Meeting" />

            <PageHeader
                title="L10 Meeting"
                subtitle="Weekly meeting structure 90 menit"
                action={
                    isLeader ? (
                        <Link href={route("l10.create")}>
                            <Button>+ Buat Meeting</Button>
                        </Link>
                    ) : undefined
                }
            />

            {/* Ongoing alert */}
            {ongoing && (
                <div className="mb-xl flex items-center justify-between rounded-lg border border-warning bg-warning-subtle px-xl py-md">
                    <div>
                        <p className="text-[13px] font-semibold text-warning-text">
                            Meeting sedang berlangsung
                        </p>
                        <p className="mt-xs text-[12px] text-warning-text">
                            {ongoing.title ?? "L10 Meeting"} · Dimulai{" "}
                            {fmt(ongoing.started_at)}
                        </p>
                    </div>
                    <Link href={route("l10.workspace", ongoing.id)}>
                        <Button>Buka Workspace →</Button>
                    </Link>
                </div>
            )}

            {/* Stats */}
            <div className="mb-xl grid grid-cols-3 gap-lg">
                {[
                    {
                        label: "Terjadwal",
                        value: scheduled,
                        valueClass: "text-info-text",
                    },
                    {
                        label: "Berlangsung",
                        value: ongoing ? 1 : 0,
                        valueClass: "text-warning-text",
                    },
                    {
                        label: "Selesai",
                        value: done,
                        valueClass: "text-primary",
                    },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent>
                            <p className="mb-sm text-[12px] font-medium uppercase tracking-wide text-text-muted">
                                {s.label}
                            </p>
                            <p
                                className={`text-[32px] font-semibold leading-none tracking-tight ${s.valueClass}`}
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
                        {[
                            { key: "meeting", label: "Meeting" },
                            { key: "jadwal", label: "Jadwal" },
                            { key: "peserta", label: "Peserta" },
                            { key: "rating", label: "Rating" },
                            { key: "status", label: "Status" },
                            { key: "actions", label: "" },
                        ].map((h) => (
                            <TableHead key={h.key}>{h.label}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {meetingList.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6}>
                                <EmptyState
                                    title="Belum ada meeting"
                                    description={
                                        isLeader
                                            ? "Buat meeting pertama untuk tim."
                                            : "Belum ada meeting yang dijadwalkan."
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    )}
                    {meetingList.map((m) => (
                        <TableRow key={m.id}>
                            <TableCell>
                                <p className="text-[13px] font-medium text-text-primary">
                                    {m.title ?? "L10 Meeting"}
                                </p>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-text-secondary">
                                {fmt(m.scheduled_at)}
                            </TableCell>
                            <TableCell className="text-text-secondary">
                                {m.attendees
                                    .slice(0, 3)
                                    .map((a) => a.name)
                                    .join(", ")}
                                {m.attendees.length > 3
                                    ? ` +${m.attendees.length - 3}`
                                    : ""}
                            </TableCell>
                            <TableCell className="text-text-secondary">
                                {m.rating ? (
                                    <span className="font-medium text-primary-text">
                                        {m.rating}/10
                                    </span>
                                ) : (
                                    "—"
                                )}
                            </TableCell>
                            <TableCell>
                                <MeetingStatus m={m} />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-end gap-sm">
                                    <Link href={route("l10.workspace", m.id)}>
                                        <Button variant="secondary" size="sm">
                                            {m.ended_at ? "Lihat" : "Workspace"}
                                        </Button>
                                    </Link>
                                    {isLeader && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => setDeleteId(m.id)}
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

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Hapus Meeting"
                description="Meeting ini akan dihapus (soft delete)."
                onConfirm={() => deleteId && destroy(deleteId)}
            />
        </AuthenticatedLayout>
    );
}
