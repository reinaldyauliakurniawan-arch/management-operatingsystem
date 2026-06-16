import React, { useState } from "react";
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
    responsibilities: string[];
    user: { id: number; name: string } | null;
    parent_id: number | null;
    team_id: number;
    children: Seat[];
}

interface User {
    id: number;
    name: string;
}

function SeatCard({
    seat,
    isLeader,
    isOrgAdmin,
    onDelete,
    onEdit,
    depth = 0,
}: {
    seat: Seat;
    isLeader: boolean;
    isOrgAdmin: boolean;
    onDelete: (id: number) => void;
    onEdit: (seat: Seat) => void;
    depth?: number;
}) {
    const hasChildren = seat.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* connector from parent */}
            {depth > 0 && <div className="h-10 w-px bg-border" />}

            {/* Card */}
            <div className="group w-[260px] rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-xs)] transition-all duration-200 hover:border-primary hover:bg-surface-subtle">
                {/* role label + actions */}
                <div className="mb-3 flex items-start justify-between">
                    <span className="text-[var(--font-sm)] font-semibold uppercase tracking-widest text-primary opacity-70">
                        {depth === 0 ? "Root" : `Level ${depth}`}
                    </span>
                    {(isLeader || isOrgAdmin) && (
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                onClick={() => onEdit(seat)}
                                className="rounded px-2 py-0.5 text-[var(--font-sm)] font-medium text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(seat.id)}
                                className="rounded px-2 py-0.5 text-[var(--font-sm)] font-medium text-error hover:bg-error-subtle"
                            >
                                Hapus
                            </button>
                        </div>
                    )}
                </div>

                {/* title */}
                <h3 className="text-[var(--font-md)] font-semibold leading-snug tracking-tight text-text-primary">
                    {seat.title}
                </h3>

                {/* person */}
                {seat.user ? (
                    <p className="mt-1 text-[var(--font-base)] text-text-secondary">
                        {seat.user.name}
                    </p>
                ) : (
                    <p className="mt-1 text-[var(--font-base)] italic text-text-muted">
                        Belum terisi
                    </p>
                )}

                {/* responsibilities */}
                {seat.responsibilities && seat.responsibilities.length > 0 && (
                    <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
                        {seat.responsibilities.map((r, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-[var(--font-base)] leading-snug text-text-secondary"
                            >
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                                {r}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* children subtree */}
            {hasChildren && (
                <div className="flex flex-col items-center">
                    {/* vertical down to horizontal bar */}
                    <div className="h-10 w-px bg-border" />
                    <div className="relative flex items-start">
                        {/* horizontal bar */}
                        {seat.children.length > 1 && (
                            <div
                                className="absolute top-0 h-px bg-border"
                                style={{
                                    left: "130px",
                                    right: "130px",
                                }}
                            />
                        )}
                        <div className="flex gap-8">
                            {seat.children.map((child) => (
                                <SeatCard
                                    key={child.id}
                                    seat={child}
                                    isLeader={isLeader}
                                    isOrgAdmin={isOrgAdmin}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                    depth={depth + 1}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AccountabilityChartIndex({
    seats,
    users,
    bigPicture: initialBigPicture,
}: {
    seats: Seat[];
    users: User[];
    bigPicture: boolean;
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const isOrgAdmin = auth.user?.is_org_admin;

    const [createOpen, setCreateOpen] = useState(false);
    const [editSeat, setEditSeat] = useState<Seat | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [tab, setTab] = useState<"existing" | "new">("existing");
    const [bigPicture, setBigPicture] = useState(initialBigPicture);

    const [submitAsNew, setSubmitAsNew] = React.useState(false);
    const { data, setData, post, put, processing, reset, errors, transform } =
        useForm({
            title: "",
            responsibilities: "",
            user_id: "" as string | number,
            parent_id: "" as string | number,
            // new user fields
            create_new_user: false,
            new_user_name: "",
            new_user_email: "",
            new_user_role: "member" as string,
        });

    transform((d) => ({
        ...d,
        responsibilities: d.responsibilities
            ? d.responsibilities
                  .split("\n")
                  .map((s: string) => s.trim())
                  .filter(Boolean)
            : [],
        create_new_user: submitAsNew,
    }));

    const toggleBigPicture = (val: boolean) => {
        setBigPicture(val);
        router.get(
            route("accountability.index"),
            { big_picture: val ? 1 : 0 },
            { preserveState: true, replace: true },
        );
    };

    const openCreate = () => {
        reset();
        setTab("existing");
        setCreateOpen(true);
    };

    const openEdit = (seat: Seat) => {
        setData({
            title: seat.title,
            responsibilities: seat.responsibilities?.join("\n") ?? "",
            user_id: seat.user?.id ?? "",
            parent_id: seat.parent_id ?? "",
            create_new_user: false,
            new_user_name: "",
            new_user_email: "",
            new_user_role: "member",
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
            const isNew = tab === "new";
            router.post(
                route("accountability-chart.store"),
                {
                    ...data,
                    responsibilities: data.responsibilities
                        ? data.responsibilities
                              .split("\n")
                              .map((s: string) => s.trim())
                              .filter(Boolean)
                        : [],
                    create_new_user: isNew,
                },
                {
                    onSuccess: () => {
                        setCreateOpen(false);
                        reset();
                    },
                },
            );
        }
    };

    const destroy = (id: number) => {
        router.delete(route("accountability-chart.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
        });
    };

    const allSeats = (function flatten(list: Seat[] = []): Seat[] {
        return (list ?? []).flatMap((s) => [s, ...flatten(s.children ?? [])]);
    })(seats ?? []);

    const ExistingUserForm = () => (
        <div className="flex flex-col gap-lg">
            <div className="flex flex-col gap-xs">
                <Label>Nama Seat / Posisi *</Label>
                <Input
                    value={data.title}
                    onChange={(e) => setData("title", e.target.value)}
                    placeholder="Misal: Head of Marketing"
                    aria-invalid={!!errors.title}
                />
                {errors.title && (
                    <p className="text-[var(--font-base)] text-error-text">
                        {errors.title}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Responsibilities (satu per baris)</Label>
                <Textarea
                    value={data.responsibilities}
                    onChange={(e) =>
                        setData("responsibilities", e.target.value)
                    }
                    placeholder={
                        "Contoh:\nManage marketing budget\nLead campaign strategy"
                    }
                    rows={3}
                />
            </div>
            <div className="flex flex-col gap-xs">
                <Label>User (opsional)</Label>
                <Select
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
                <Label>Parent Seat (opsional)</Label>
                <Select
                    value={data.parent_id}
                    onChange={(e) => setData("parent_id", e.target.value)}
                >
                    <option value="">— Root —</option>
                    {allSeats
                        .filter((s) => s.id !== editSeat?.id)
                        .map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}
                            </option>
                        ))}
                </Select>
            </div>
        </div>
    );

    const NewUserForm = () => (
        <div className="flex flex-col gap-lg">
            <div className="rounded-sm bg-info-subtle px-md py-sm text-[var(--font-base)] text-info-text">
                User baru akan dibuat dengan password default{" "}
                <strong>member123</strong>. Mereka bisa mengubah password
                sendiri setelah login.
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Nama Lengkap *</Label>
                <Input
                    value={data.new_user_name}
                    onChange={(e) => setData("new_user_name", e.target.value)}
                    placeholder="Nama lengkap"
                    aria-invalid={!!errors.new_user_name}
                />
                {errors.new_user_name && (
                    <p className="text-[var(--font-base)] text-error-text">
                        {errors.new_user_name}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Email *</Label>
                <Input
                    type="email"
                    value={data.new_user_email}
                    onChange={(e) => setData("new_user_email", e.target.value)}
                    placeholder="email@perusahaan.com"
                    aria-invalid={!!errors.new_user_email}
                />
                {errors.new_user_email && (
                    <p className="text-[var(--font-base)] text-error-text">
                        {errors.new_user_email}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Role di Team *</Label>
                <Select
                    value={data.new_user_role}
                    onChange={(e) => setData("new_user_role", e.target.value)}
                >
                    <option value="member">Member</option>
                    <option value="tutor">Tutor</option>
                    <option value="leader">Leader</option>
                </Select>
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Nama Seat / Posisi *</Label>
                <Input
                    value={data.title}
                    onChange={(e) => setData("title", e.target.value)}
                    placeholder="Misal: Head of Marketing"
                    aria-invalid={!!errors.title}
                />
                {errors.title && (
                    <p className="text-[var(--font-base)] text-error-text">
                        {errors.title}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Parent Seat (opsional)</Label>
                <Select
                    value={data.parent_id}
                    onChange={(e) => setData("parent_id", e.target.value)}
                >
                    <option value="">— Root —</option>
                    {allSeats.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.title}
                        </option>
                    ))}
                </Select>
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
                    <div className="flex items-center gap-sm">
                        {/* View toggle */}
                        <div className="flex rounded-sm border border-border overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleBigPicture(false)}
                                className={`px-md py-xs text-[var(--font-base)] font-medium transition-colors ${
                                    !bigPicture
                                        ? "bg-primary text-text-inverse"
                                        : "bg-surface text-text-secondary hover:bg-surface-overlay"
                                }`}
                            >
                                Tim Saya
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleBigPicture(true)}
                                className={`px-md py-xs text-[var(--font-base)] font-medium transition-colors ${
                                    bigPicture
                                        ? "bg-primary text-text-inverse"
                                        : "bg-surface text-text-secondary hover:bg-surface-overlay"
                                }`}
                            >
                                Seluruh Org
                            </button>
                        </div>
                        {(isLeader || isOrgAdmin) && !bigPicture && (
                            <Button onClick={openCreate}>+ Tambah Seat</Button>
                        )}
                    </div>
                }
            />

            {seats.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <EmptyState
                            title={
                                bigPicture
                                    ? "Belum ada chart"
                                    : "Chart tim belum dibuat"
                            }
                            description={
                                isLeader || isOrgAdmin
                                    ? "Tambah seat pertama untuk membangun struktur."
                                    : "Struktur belum dibuat oleh leader."
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface-subtle p-2xl">
                    <div className="flex min-w-max flex-col items-center pb-16">
                        {seats
                            .filter((s) => s.parent_id === null)
                            .map((seat) => (
                                <SeatCard
                                    key={seat.id}
                                    seat={seat}
                                    isLeader={isLeader && !bigPicture}
                                    isOrgAdmin={isOrgAdmin && !bigPicture}
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
                        {/* Tab switcher */}
                        <div className="mb-lg flex rounded-sm border border-border overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setTab("existing")}
                                className={`flex-1 py-xs text-[var(--font-base)] font-medium transition-colors ${
                                    tab === "existing"
                                        ? "bg-primary text-text-inverse"
                                        : "bg-surface text-text-secondary hover:bg-surface-overlay"
                                }`}
                            >
                                User yang Ada
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab("new")}
                                className={`flex-1 py-xs text-[var(--font-base)] font-medium transition-colors ${
                                    tab === "new"
                                        ? "bg-primary text-text-inverse"
                                        : "bg-surface text-text-secondary hover:bg-surface-overlay"
                                }`}
                            >
                                Buat User Baru
                            </button>
                        </div>
                        <form id="seat-create-form" onSubmit={submit}>
                            {tab === "existing" ? (
                                <ExistingUserForm />
                            ) : (
                                <NewUserForm />
                            )}
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
                            form="seat-create-form"
                            disabled={processing}
                        >
                            {processing
                                ? "Menyimpan…"
                                : tab === "new"
                                  ? "Buat User & Seat"
                                  : "Simpan Seat"}
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
                        <form id="seat-edit-form" onSubmit={submit}>
                            <ExistingUserForm />
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditSeat(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="seat-edit-form"
                            disabled={processing}
                        >
                            {processing ? "Menyimpan…" : "Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Hapus Seat"
                description="Seat ini akan dihapus. Anggota yang terhubung tidak ikut terhapus."
                onConfirm={() => deleteId && destroy(deleteId)}
            />
        </AuthenticatedLayout>
    );
}
