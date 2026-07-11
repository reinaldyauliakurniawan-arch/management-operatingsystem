import { useState } from "react";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
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
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { EmptyState } from "@/Components/ui/empty-state";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";

interface LeadershipType {
    id: number;
    name: string;
}
interface User {
    id: number;
    name: string;
}
interface AdditionalAssessor {
    id: number;
    user: User;
}
interface Assignment {
    id: number;
    cycle_id: number;
    user_id: number;
    user: User;
    type: LeadershipType;
    submission_count: number;
    total_assessors: number;
    is_closed: boolean;
    additional_assessors: AdditionalAssessor[];
}
interface Cycle {
    id: number;
    name: string;
    period: string | null;
    is_closed: boolean;
    assignments: Assignment[];
}

const fmt = (s: string | null) =>
    s
        ? new Date(s).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : "—";

export default function LeadershipAssessmentIndex({
    cycles,
    users,
    allOrgUsers,
    types,
    pendingAssignments,
}: {
    cycles: Cycle[];
    users: User[];
    allOrgUsers: User[];
    types: LeadershipType[];
    pendingAssignments: Assignment[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";

    const [cycleOpen, setCycleOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [deleteCycleId, setDeleteCycleId] = useState<number | null>(null);
    const [extraAssessorFor, setExtraAssessorFor] = useState<Assignment | null>(
        null,
    );
    const [extraUserIds, setExtraUserIds] = useState<Set<number>>(new Set());

    const cycleForm = useForm({ name: "", periode_start: "", periode_end: "" });
    const assignForm = useForm({
        cycle_id: "",
        matrix: [] as { user_id: number; leadership_type_ids: number[] }[],
    });
    const [matrixSelection, setMatrixSelection] = useState<
        Record<number, Set<number>>
    >({});

    const toggleMatrixCell = (userId: number, typeId: number) => {
        setMatrixSelection((prev) => {
            const next = { ...prev };
            const set = new Set(next[userId] ?? []);
            set.has(typeId) ? set.delete(typeId) : set.add(typeId);
            next[userId] = set;
            return next;
        });
    };

    const submitCycle = (e: React.FormEvent) => {
        e.preventDefault();
        cycleForm.post(route("leadership-assessment.cycles.store"), {
            onSuccess: () => {
                setCycleOpen(false);
                cycleForm.reset();
            },
        });
    };

    const submitAssign = (e: React.FormEvent) => {
        e.preventDefault();
        const matrix = Object.entries(matrixSelection)
            .filter(([, set]) => set.size > 0)
            .map(([userId, set]) => ({
                user_id: Number(userId),
                leadership_type_ids: Array.from(set),
            }));

        if (matrix.length === 0 || !assignForm.data.cycle_id) return;

        assignForm.transform(() => ({ matrix }));
        assignForm.post(
            route(
                "leadership-assessment.cycles.assign",
                assignForm.data.cycle_id,
            ),
            {
                onSuccess: () => {
                    setAssignOpen(false);
                    setMatrixSelection({});
                    assignForm.reset();
                },
            },
        );
    };

    const closeCycle = (id: number) =>
        router.post(
            route("leadership-assessment.cycles.close", id),
            {},
            { preserveScroll: true },
        );

    const destroyCycle = (id: number) =>
        router.delete(route("leadership-assessment.cycles.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDeleteCycleId(null),
        });

    const toggleExtraUser = (userId: number) => {
        setExtraUserIds((prev) => {
            const next = new Set(prev);
            next.has(userId) ? next.delete(userId) : next.add(userId);
            return next;
        });
    };

    const submitExtraAssessors = () => {
        if (!extraAssessorFor || extraUserIds.size === 0) return;
        router.post(
            route(
                "leadership-assessment.assignments.extra-assessors.store",
                extraAssessorFor.id,
            ),
            { user_ids: Array.from(extraUserIds) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setExtraAssessorFor(null);
                    setExtraUserIds(new Set());
                },
            },
        );
    };

    const removeExtraAssessor = (assignmentId: number, extraId: number) =>
        router.delete(
            route("leadership-assessment.assignments.extra-assessors.destroy", {
                assignment: assignmentId,
                extra: extraId,
            }),
            { preserveScroll: true },
        );

    return (
        <AuthenticatedLayout>
            <Head title="Leadership Assessment" />

            <PageHeader
                title="Leadership Assessment"
                subtitle="360° penilaian kepemimpinan per siklus"
                action={
                    isLeader ? (
                        <div className="flex gap-sm">
                            <Link
                                href={route(
                                    "leadership-assessment.rubrik.index",
                                )}
                            >
                                <Button variant="ghost">Kelola Rubrik</Button>
                            </Link>
                            <Button
                                variant="secondary"
                                onClick={() => setAssignOpen(true)}
                            >
                                + Assign Assessment
                            </Button>
                            <Button onClick={() => setCycleOpen(true)}>
                                + Buat Cycle
                            </Button>
                        </div>
                    ) : undefined
                }
            />

            {/* Pending assessments for current user */}
            {pendingAssignments.length > 0 && (
                <div className="mb-xl">
                    <p className="mb-md text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
                        Assessment Menunggu Kamu
                    </p>
                    <div className="flex flex-col gap-sm">
                        {pendingAssignments.map((a) => (
                            <div
                                key={a.id}
                                className="flex items-center justify-between rounded-lg border border-border bg-surface px-lg py-md"
                            >
                                <div>
                                    <p className="text-[var(--font-base)] font-medium text-text-primary">
                                        {a.user.name}
                                    </p>
                                    <p className="text-[var(--font-base)] text-text-muted">
                                        {a.type.name}
                                    </p>
                                </div>
                                <Link
                                    href={route("leadership-assessment.take", {
                                        cycle: a.cycle_id,
                                        assessee: a.user_id,
                                    })}
                                >
                                    <Button size="sm">Nilai Sekarang →</Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cycles */}
            {cycles.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <EmptyState
                            title="Belum ada cycle"
                            description={
                                isLeader
                                    ? "Buat cycle assessment pertama untuk memulai."
                                    : "Belum ada cycle assessment yang dibuat."
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col gap-xl">
                    {cycles.map((cycle) => (
                        <div key={cycle.id}>
                            <div className="mb-md flex items-center justify-between">
                                <div>
                                    <h2 className="text-[var(--font-base)] font-semibold tracking-tight text-text-primary">
                                        {cycle.name}
                                    </h2>
                                    {cycle.period && (
                                        <p className="text-[var(--font-base)] text-text-muted">
                                            {cycle.period}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-sm">
                                    {cycle.is_closed ? (
                                        <Badge variant="neutral">Ditutup</Badge>
                                    ) : (
                                        <Badge variant="success">Aktif</Badge>
                                    )}
                                    {isLeader && !cycle.is_closed && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => closeCycle(cycle.id)}
                                        >
                                            Tutup Cycle
                                        </Button>
                                    )}
                                    {isLeader &&
                                        cycle.assignments.length === 0 && (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() =>
                                                    setDeleteCycleId(cycle.id)
                                                }
                                            >
                                                Hapus
                                            </Button>
                                        )}
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {[
                                            {
                                                key: "assessee",
                                                label: "Assessee",
                                            },
                                            {
                                                key: "type",
                                                label: "Tipe Leadership",
                                            },
                                            {
                                                key: "progress",
                                                label: "Progress",
                                            },
                                            { key: "status", label: "Status" },
                                            { key: "actions", label: "" },
                                        ].map((h) => (
                                            <TableHead key={h.key}>
                                                {h.label}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cycle.assignments.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5}>
                                                <EmptyState
                                                    title="Belum ada assignment"
                                                    description="Tambah assignment untuk cycle ini."
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {cycle.assignments.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell className="font-medium text-text-primary">
                                                {a.user.name}
                                            </TableCell>
                                            <TableCell className="text-text-secondary">
                                                {a.type.name}
                                            </TableCell>
                                            <TableCell className="text-text-secondary">
                                                {a.submission_count}/
                                                {a.total_assessors} assessor
                                            </TableCell>
                                            <TableCell>
                                                {cycle.is_closed ? (
                                                    <Badge variant="neutral">
                                                        Selesai
                                                    </Badge>
                                                ) : a.submission_count ===
                                                  a.total_assessors ? (
                                                    <Badge variant="success">
                                                        Lengkap
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="warning">
                                                        Menunggu
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-xs">
                                                    {isLeader &&
                                                        !cycle.is_closed && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setExtraAssessorFor(
                                                                        a,
                                                                    );
                                                                    setExtraUserIds(
                                                                        new Set(),
                                                                    );
                                                                }}
                                                            >
                                                                + Assessor
                                                            </Button>
                                                        )}
                                                    {(isLeader ||
                                                        cycle.is_closed) && (
                                                        <Link
                                                            href={route(
                                                                "leadership-assessment.results",
                                                                {
                                                                    cycle: cycle.id,
                                                                    assessee:
                                                                        a.user_id,
                                                                },
                                                            )}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                Hasil
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                                {a.additional_assessors.length >
                                                    0 && (
                                                    <div className="mt-xs flex flex-wrap gap-xs">
                                                        {a.additional_assessors.map(
                                                            (ex) => (
                                                                <Badge
                                                                    key={ex.id}
                                                                    variant="neutral"
                                                                    className="cursor-pointer"
                                                                    onClick={() =>
                                                                        isLeader &&
                                                                        !cycle.is_closed &&
                                                                        removeExtraAssessor(
                                                                            a.id,
                                                                            ex.id,
                                                                        )
                                                                    }
                                                                >
                                                                    {
                                                                        ex.user
                                                                            .name
                                                                    }{" "}
                                                                    ✕
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Cycle Modal */}
            <Dialog open={cycleOpen} onOpenChange={setCycleOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Buat Cycle Assessment</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="cycle-form"
                            onSubmit={submitCycle}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="cycle-name">Nama Cycle *</Label>
                                <Input
                                    id="cycle-name"
                                    value={cycleForm.data.name}
                                    onChange={(e) =>
                                        cycleForm.setData(
                                            "name",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Misal: Q3 2025"
                                    aria-invalid={!!cycleForm.errors.name}
                                />
                                {cycleForm.errors.name && (
                                    <p className="text-[var(--font-base)] text-error-text">
                                        {cycleForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Periode Mulai (opsional)</Label>
                                <Input
                                    type="date"
                                    value={cycleForm.data.periode_start}
                                    onChange={(e) =>
                                        cycleForm.setData(
                                            "periode_start",
                                            e.target.value,
                                        )
                                    }
                                />
                                <Label>Periode Selesai (opsional)</Label>
                                <Input
                                    type="date"
                                    value={cycleForm.data.periode_end}
                                    onChange={(e) =>
                                        cycleForm.setData(
                                            "periode_end",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setCycleOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="cycle-form"
                            disabled={cycleForm.processing}
                        >
                            {cycleForm.processing ? "Menyimpan…" : "Buat Cycle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Modal */}
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Assign Assessment</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="assign-form"
                            onSubmit={submitAssign}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>Cycle *</Label>
                                <Select
                                    value={assignForm.data.cycle_id}
                                    onChange={(e) =>
                                        assignForm.setData(
                                            "cycle_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">— Pilih cycle —</option>
                                    {cycles
                                        .filter((c) => !c.is_closed)
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                </Select>
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>
                                    Matrix Assessee × Tipe Leadership *
                                </Label>
                                <div className="overflow-x-auto rounded-lg border border-border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Anggota</TableHead>
                                                {types.map((t) => (
                                                    <TableHead
                                                        key={t.id}
                                                        className="text-center"
                                                    >
                                                        {t.name}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((u) => (
                                                <TableRow key={u.id}>
                                                    <TableCell>
                                                        {u.name}
                                                    </TableCell>
                                                    {types.map((t) => (
                                                        <TableCell
                                                            key={t.id}
                                                            className="text-center"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    matrixSelection[
                                                                        u.id
                                                                    ]?.has(
                                                                        t.id,
                                                                    ) ?? false
                                                                }
                                                                onChange={() =>
                                                                    toggleMatrixCell(
                                                                        u.id,
                                                                        t.id,
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setAssignOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="assign-form"
                            disabled={assignForm.processing}
                        >
                            {assignForm.processing ? "Menyimpan…" : "Assign"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Additional Assessor Modal */}
            <Dialog
                open={extraAssessorFor !== null}
                onOpenChange={(open) => !open && setExtraAssessorFor(null)}
            >
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>
                            Tambah Assessor — {extraAssessorFor?.user.name} (
                            {extraAssessorFor?.type.name})
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <div className="flex max-h-64 flex-col gap-xs overflow-y-auto">
                            {allOrgUsers
                                .filter(
                                    (u) => u.id !== extraAssessorFor?.user_id,
                                )
                                .map((u) => (
                                    <label
                                        key={u.id}
                                        className="flex items-center gap-sm rounded-md px-sm py-xs hover:bg-surface-overlay"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={extraUserIds.has(u.id)}
                                            onChange={() =>
                                                toggleExtraUser(u.id)
                                            }
                                        />
                                        {u.name}
                                    </label>
                                ))}
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setExtraAssessorFor(null)}
                        >
                            Batal
                        </Button>
                        <Button onClick={submitExtraAssessors}>
                            Tambahkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteCycleId !== null}
                onOpenChange={(open) => !open && setDeleteCycleId(null)}
                title="Hapus Cycle"
                description="Cycle ini akan dihapus (soft delete). Hanya bisa dihapus jika belum ada submission."
                onConfirm={() => deleteCycleId && destroyCycle(deleteCycleId)}
            />
        </AuthenticatedLayout>
    );
}
