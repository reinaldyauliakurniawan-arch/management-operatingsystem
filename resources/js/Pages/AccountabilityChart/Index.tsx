import React, { useState, useEffect, useCallback } from "react";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
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

// ─── Sub-forms (top-level agar tidak re-mount saat parent re-render) ──────────

function ExistingUserForm({
    title,
    setTitle,
    responsibilities,
    setResponsibilities,
    userId,
    setUserId,
    parentId,
    setParentId,
    users,
    allSeats,
    editSeatId,
    errors,
}: {
    title: string;
    setTitle: (v: string) => void;
    responsibilities: string;
    setResponsibilities: (v: string) => void;
    userId: string;
    setUserId: (v: string) => void;
    parentId: string;
    setParentId: (v: string) => void;
    users: User[];
    allSeats: Seat[];
    editSeatId?: number;
    errors: Record<string, string>;
}) {
    return (
        <div className="flex flex-col gap-lg">
            <div className="flex flex-col gap-xs">
                <Label>Nama Seat / Posisi *</Label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    placeholder={
                        "Contoh:\nManage marketing budget\nLead campaign strategy"
                    }
                    rows={3}
                />
            </div>
            <div className="flex flex-col gap-xs">
                <Label>User (opsional)</Label>
                <Select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
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
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                >
                    <option value="">— Root —</option>
                    {allSeats
                        .filter((s) => s.id !== editSeatId)
                        .map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}
                            </option>
                        ))}
                </Select>
            </div>
        </div>
    );
}

function NewUserForm({
    title,
    setTitle,
    newName,
    setNewName,
    newEmail,
    setNewEmail,
    newRole,
    setNewRole,
    parentId,
    setParentId,
    allSeats,
    errors,
}: {
    title: string;
    setTitle: (v: string) => void;
    newName: string;
    setNewName: (v: string) => void;
    newEmail: string;
    setNewEmail: (v: string) => void;
    newRole: string;
    setNewRole: (v: string) => void;
    parentId: string;
    setParentId: (v: string) => void;
    allSeats: Seat[];
    errors: Record<string, string>;
}) {
    return (
        <div className="flex flex-col gap-lg">
            <div className="rounded-sm bg-info-subtle px-md py-sm text-[var(--font-base)] text-info-text">
                User baru akan dibuat dengan password default{" "}
                <strong>member123</strong>.
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Nama Lengkap *</Label>
                <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
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
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
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
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                >
                    <option value="member">Member</option>
                    <option value="tutor">Tutor</option>
                    <option value="leader">Leader</option>
                </Select>
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Nama Seat / Posisi *</Label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
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
}

// ─── Seat Card (visual tree node) ────────────────────────────────────────────

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
    const hasChildren = (seat.children ?? []).length > 0;
    return (
        <div className="flex flex-col items-center">
            {depth > 0 && <div className="h-10 w-px bg-border" />}
            <div className="group w-[260px] rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-xs)] transition-all duration-200 hover:border-primary hover:bg-surface-subtle">
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
                <h3 className="text-[var(--font-md)] font-semibold leading-snug tracking-tight text-text-primary">
                    {seat.title}
                </h3>
                {seat.user ? (
                    <p className="mt-1 text-[var(--font-base)] text-text-secondary">
                        {seat.user.name}
                    </p>
                ) : (
                    <p className="mt-1 text-[var(--font-base)] italic text-text-muted">
                        Belum terisi
                    </p>
                )}
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
            {hasChildren && (
                <div className="flex flex-col items-center">
                    <div className="h-10 w-px bg-border" />
                    <div className="relative flex items-start">
                        {seat.children.length > 1 && (
                            <div
                                className="absolute top-0 h-px bg-border"
                                style={{ left: "130px", right: "130px" }}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccountabilityChartIndex() {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const isOrgAdmin = auth.user?.is_org_admin;

    // ── Data state ──
    const [seats, setSeats] = useState<Seat[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [bigPicture, setBigPicture] = useState(false);

    // ── Modal state ──
    const [createOpen, setCreateOpen] = useState(false);
    const [editSeat, setEditSeat] = useState<Seat | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [tab, setTab] = useState<"existing" | "new">("existing");
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Form fields (uncontrolled per field agar kursor tidak lompat) ──
    const [fTitle, setFTitle] = useState("");
    const [fResp, setFResp] = useState("");
    const [fUserId, setFUserId] = useState("");
    const [fParentId, setFParentId] = useState("");
    const [fNewName, setFNewName] = useState("");
    const [fNewEmail, setFNewEmail] = useState("");
    const [fNewRole, setFNewRole] = useState("member");

    // ── Fetch helpers ──
    const fetchSeats = useCallback(async () => {
        try {
            const res = await axios.get(
                `/api/accountability-chart/seats?big_picture=${bigPicture ? 1 : 0}`,
            );
            setSeats(res.data.seats);
        } catch (e) {
            console.error("Failed to fetch seats", e);
        }
    }, [bigPicture]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await axios.get("/api/accountability-chart/users");
            setUsers(res.data.users);
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchSeats(), fetchUsers()]).finally(() =>
            setLoading(false),
        );
    }, [fetchSeats, fetchUsers]);

    // ── Flatten seats for parent selector ──
    const allSeats = (function flatten(list: Seat[] = []): Seat[] {
        return list.flatMap((s) => [s, ...flatten(s.children ?? [])]);
    })(seats);

    // ── Helpers ──
    const resetForm = () => {
        setFTitle("");
        setFResp("");
        setFUserId("");
        setFParentId("");
        setFNewName("");
        setFNewEmail("");
        setFNewRole("member");
        setErrors({});
    };

    const openCreate = () => {
        resetForm();
        setTab("existing");
        setCreateOpen(true);
    };

    const openEdit = (seat: Seat) => {
        setFTitle(seat.title);
        setFResp(seat.responsibilities?.join("\n") ?? "");
        setFUserId(seat.user?.id?.toString() ?? "");
        setFParentId(seat.parent_id?.toString() ?? "");
        setErrors({});
        setEditSeat(seat);
    };

    // ── Submit create ──
    const submitCreate = async () => {
        setProcessing(true);
        setErrors({});
        try {
            const payload =
                tab === "new"
                    ? {
                          create_new_user: true,
                          new_user_name: fNewName,
                          new_user_email: fNewEmail,
                          new_user_role: fNewRole,
                          title: fTitle,
                          parent_id: fParentId || null,
                          responsibilities: fResp
                              ? fResp
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                              : [],
                      }
                    : {
                          create_new_user: false,
                          title: fTitle,
                          responsibilities: fResp
                              ? fResp
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                              : [],
                          user_id: fUserId || null,
                          parent_id: fParentId || null,
                      };

            await axios.post("/api/accountability-chart", payload);
            setCreateOpen(false);
            resetForm();
            await fetchSeats();
        } catch (e: any) {
            if (e.response?.data?.errors) setErrors(e.response.data.errors);
        } finally {
            setProcessing(false);
        }
    };

    // ── Submit edit ──
    const submitEdit = async () => {
        if (!editSeat) return;
        setProcessing(true);
        setErrors({});
        try {
            await axios.patch(`/api/accountability-chart/${editSeat.id}`, {
                title: fTitle,
                responsibilities: fResp
                    ? fResp
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
                user_id: fUserId || null,
                parent_id: fParentId || null,
            });
            setEditSeat(null);
            resetForm();
            await fetchSeats();
        } catch (e: any) {
            if (e.response?.data?.errors) setErrors(e.response.data.errors);
        } finally {
            setProcessing(false);
        }
    };

    // ── Delete ──
    const destroy = async (id: number) => {
        try {
            await axios.delete(`/api/accountability-chart/${id}`);
            setDeleteId(null);
            await fetchSeats();
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    // ── Generate from teams ──
    const generateFromTeams = async () => {
        try {
            await axios.post("/api/accountability-chart/generate-from-teams");
            await fetchSeats();
        } catch (e) {
            console.error("Generate failed", e);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Accountability Chart" />

            <PageHeader
                title="Accountability Chart"
                subtitle="Struktur organisasi — siapa di seat apa"
                action={
                    <div className="flex items-center gap-sm">
                        <div className="flex rounded-sm border border-border overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setBigPicture(false)}
                                className={`px-md py-xs text-[var(--font-base)] font-medium transition-colors ${!bigPicture ? "bg-primary text-text-inverse" : "bg-surface text-text-secondary hover:bg-surface-overlay"}`}
                            >
                                Tim Saya
                            </button>
                            <button
                                type="button"
                                onClick={() => setBigPicture(true)}
                                className={`px-md py-xs text-[var(--font-base)] font-medium transition-colors ${bigPicture ? "bg-primary text-text-inverse" : "bg-surface text-text-secondary hover:bg-surface-overlay"}`}
                            >
                                Seluruh Org
                            </button>
                        </div>
                        {(isLeader || isOrgAdmin) && !bigPicture && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={generateFromTeams}
                                >
                                    Generate dari Tim
                                </Button>
                                <Button onClick={openCreate}>
                                    + Tambah Seat
                                </Button>
                            </>
                        )}
                    </div>
                }
            />

            {loading ? (
                <Card>
                    <CardContent className="py-16 text-center text-text-secondary">
                        Memuat chart…
                    </CardContent>
                </Card>
            ) : seats.length === 0 ? (
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
                                    ? "Tambah seat pertama atau generate dari data tim."
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
                        <div className="mb-lg flex rounded-sm border border-border overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setTab("existing")}
                                className={`flex-1 py-xs text-[var(--font-base)] font-medium transition-colors ${tab === "existing" ? "bg-primary text-text-inverse" : "bg-surface text-text-secondary hover:bg-surface-overlay"}`}
                            >
                                User yang Ada
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab("new")}
                                className={`flex-1 py-xs text-[var(--font-base)] font-medium transition-colors ${tab === "new" ? "bg-primary text-text-inverse" : "bg-surface text-text-secondary hover:bg-surface-overlay"}`}
                            >
                                Buat User Baru
                            </button>
                        </div>
                        {tab === "existing" ? (
                            <ExistingUserForm
                                title={fTitle}
                                setTitle={setFTitle}
                                responsibilities={fResp}
                                setResponsibilities={setFResp}
                                userId={fUserId}
                                setUserId={setFUserId}
                                parentId={fParentId}
                                setParentId={setFParentId}
                                users={users}
                                allSeats={allSeats}
                                errors={errors}
                            />
                        ) : (
                            <NewUserForm
                                title={fTitle}
                                setTitle={setFTitle}
                                newName={fNewName}
                                setNewName={setFNewName}
                                newEmail={fNewEmail}
                                setNewEmail={setFNewEmail}
                                newRole={fNewRole}
                                setNewRole={setFNewRole}
                                parentId={fParentId}
                                setParentId={setFParentId}
                                allSeats={allSeats}
                                errors={errors}
                            />
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setCreateOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={submitCreate} disabled={processing}>
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
                        <ExistingUserForm
                            title={fTitle}
                            setTitle={setFTitle}
                            responsibilities={fResp}
                            setResponsibilities={setFResp}
                            userId={fUserId}
                            setUserId={setFUserId}
                            parentId={fParentId}
                            setParentId={setFParentId}
                            users={users}
                            allSeats={allSeats}
                            editSeatId={editSeat?.id}
                            errors={errors}
                        />
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditSeat(null)}
                        >
                            Batal
                        </Button>
                        <Button onClick={submitEdit} disabled={processing}>
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
