import { useState } from "react";
import { Head, usePage, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent } from "@/Components/ui/card";
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

interface Seat {
    id: number;
    title: string;
    responsibilities: string | null;
    user: { id: number; name: string } | null;
    parent_id: number | null;
    children: Seat[];
    is_sub_chart: boolean;
}

interface User {
    id: number;
    name: string;
}

function SeatCard({
    seat,
    isLeader,
    isOrgAdmin,
    users,
    onDelete,
    onEdit,
    depth = 0,
}: {
    seat: Seat;
    isLeader: boolean;
    isOrgAdmin: boolean;
    users: User[];
    onDelete: (id: number) => void;
    onEdit: (seat: Seat) => void;
    depth?: number;
}) {
    return (
        <div
            className={`flex flex-col items-center ${depth > 0 ? "mt-lg" : ""}`}
        >
            {/* Connector line */}
            {depth > 0 && <div className="h-lg w-px bg-border" />}
            <div
                className="w-56 rounded-lg border border-border bg-surface p-md shadow-xs"
                style={{ minWidth: 200 }}
            >
                <p className="text-[13px] font-semibold tracking-tight text-text-primary">
                    {seat.title}
                </p>
                {seat.user ? (
                    <p className="mt-xs text-[12px] text-primary-text font-medium">
                        {seat.user.name}
                    </p>
                ) : (
                    <p className="mt-xs text-[12px] text-text-muted italic">
                        Belum terisi
                    </p>
                )}
                {seat.responsibilities && (
                    <p className="mt-xs text-[11px] text-text-muted leading-snug">
                        {seat.responsibilities.slice(0, 80)}
                        {seat.responsibilities.length > 80 ? "…" : ""}
                    </p>
                )}
                {seat.is_sub_chart && (
                    <Badge variant="info" className="mt-sm">
                        Sub-chart
                    </Badge>
                )}
                {(isLeader || isOrgAdmin) && (
                    <div className="mt-sm flex gap-xs">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(seat)}
                            className="text-[11px]"
                        >
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(seat.id)}
                            className="text-[11px]"
                        >
                            Hapus
                        </Button>
                    </div>
                )}
            </div>

            {/* Children */}
            {seat.children.length > 0 && (
                <div className="mt-0 flex flex-col items-center">
                    <div className="h-lg w-px bg-border" />
                    <div className="flex gap-xl">
                        {seat.children.map((child) => (
                            <SeatCard
                                key={child.id}
                                seat={child}
                                isLeader={isLeader}
                                isOrgAdmin={isOrgAdmin}
                                users={users}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AccountabilityChartIndex({
    seats,
    users,
}: {
    seats: Seat[];
    users: User[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const isOrgAdmin = auth.user?.is_org_admin;

    const [createOpen, setCreateOpen] = useState(false);
    const [editSeat, setEditSeat] = useState<Seat | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        title: "",
        responsibilities: "",
        user_id: "" as string | number,
        parent_id: "" as string | number,
        is_sub_chart: false,
    });

    const openCreate = () => {
        reset();
        setCreateOpen(true);
    };

    const openEdit = (seat: Seat) => {
        setData({
            title: seat.title,
            responsibilities: seat.responsibilities ?? "",
            user_id: seat.user?.id ?? "",
            parent_id: seat.parent_id ?? "",
            is_sub_chart: seat.is_sub_chart,
        });
        setEditSeat(seat);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editSeat) {
            put(route("accountability-chart.update", editSeat.id), {
                onSuccess: () => {
                    setEditSeat(null);
                    reset();
                },
            });
        } else {
            post(route("accountability-chart.store"), {
                onSuccess: () => {
                    setCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const destroy = (id: number) => {
        router.delete(route("accountability-chart.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
        });
    };

    // Flatten all seats for parent selector
    const allSeats = (function flatten(list: Seat[]): Seat[] {
        return list.flatMap((s) => [s, ...flatten(s.children)]);
    })(seats);

    const FormBody = () => (
        <div className="flex flex-col gap-lg">
            <div className="flex flex-col gap-xs">
                <Label htmlFor="seat-title">Nama Seat / Posisi *</Label>
                <Input
                    id="seat-title"
                    value={data.title}
                    onChange={(e) => setData("title", e.target.value)}
                    placeholder="Misal: Head of Marketing"
                    aria-invalid={!!errors.title}
                />
                {errors.title && (
                    <p className="text-[12px] text-error-text">
                        {errors.title}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-xs">
                <Label htmlFor="seat-resp">Responsibilities</Label>
                <Textarea
                    id="seat-resp"
                    value={data.responsibilities}
                    onChange={(e) =>
                        setData("responsibilities", e.target.value)
                    }
                    placeholder="Tanggung jawab utama seat ini..."
                    rows={3}
                />
            </div>
            <div className="flex flex-col gap-xs">
                <Label htmlFor="seat-user">User (opsional)</Label>
                <Select
                    id="seat-user"
                    value={data.user_id}
                    onChange={(e) => setData("user_id", e.target.value)}
                >
                    <option value="">— Belum terisi —</option>
                    {users.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </Select>
            </div>
            <div className="flex flex-col gap-xs">
                <Label htmlFor="seat-parent">Parent Seat (opsional)</Label>
                <Select
                    id="seat-parent"
                    value={data.parent_id}
                    onChange={(e) => setData("parent_id", e.target.value)}
                >
                    <option value="">— Root (tidak ada parent) —</option>
                    {allSeats
                        .filter((s) => s.id !== editSeat?.id)
                        .map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}
                            </option>
                        ))}
                </Select>
            </div>
            <div className="flex items-center gap-sm">
                <input
                    id="seat-subchart"
                    type="checkbox"
                    checked={data.is_sub_chart}
                    onChange={(e) => setData("is_sub_chart", e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                />
                <Label htmlFor="seat-subchart" className="cursor-pointer">
                    Tandai sebagai sub-chart tim
                </Label>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Accountability Chart" />

            <PageHeader
                title="Accountability Chart"
                subtitle="Struktur organisasi — siapa di seat apa"
                action={
                    isLeader || isOrgAdmin ? (
                        <Button onClick={openCreate}>+ Tambah Seat</Button>
                    ) : undefined
                }
            />

            {seats.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <EmptyState
                            title="Chart belum dibuat"
                            description={
                                isOrgAdmin
                                    ? "Tambah seat pertama untuk membangun struktur organisasi."
                                    : "Struktur organisasi belum dibuat oleh org admin."
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border bg-surface p-2xl">
                    <div className="flex flex-col items-center">
                        {seats.map((seat) => (
                            <SeatCard
                                key={seat.id}
                                seat={seat}
                                isLeader={isLeader}
                                isOrgAdmin={isOrgAdmin}
                                users={users}
                                onDelete={(id) => setDeleteId(id)}
                                onEdit={openEdit}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Tambah Seat</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form onSubmit={submit}>
                            <FormBody />
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setCreateOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={submit} disabled={processing}>
                            {processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog
                open={!!editSeat}
                onOpenChange={(open) => !open && setEditSeat(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Edit Seat</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form onSubmit={submit}>
                            <FormBody />
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditSeat(null)}
                        >
                            Batal
                        </Button>
                        <Button onClick={submit} disabled={processing}>
                            {processing ? "Menyimpan…" : "Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Hapus Seat"
                description="Seat ini akan dihapus (soft delete). Data historis tetap tersimpan."
                onConfirm={() => deleteId && destroy(deleteId)}
            />
        </AuthenticatedLayout>
    );
}
