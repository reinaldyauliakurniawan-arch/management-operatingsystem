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
interface Assignment {
    id: number;
    cycle_id: number;
    user_id: number;
    user: User;
    type: LeadershipType;
    submission_count: number;
    total_assessors: number;
    is_closed: boolean;
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
    types,
    pendingAssignments,
}: {
    cycles: Cycle[];
    users: User[];
    types: LeadershipType[];
    pendingAssignments: Assignment[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";

    const [cycleOpen, setCycleOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [deleteCycleId, setDeleteCycleId] = useState<number | null>(null);

    const cycleForm = useForm({ name: "", period: "" });
    const assignForm = useForm({
        cycle_id: "",
        user_id: "",
        leadership_type_id: "",
    });

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
        assignForm.post(
            route("leadership-assessment.cycles.assign", assignForm.data.cycle_id),
            {
                onSuccess: () => {
                    setAssignOpen(false);
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

    return (
        <AuthenticatedLayout>
            <Head title="Leadership Assessment" />

            <PageHeader
                title="Leadership Assessment"
                subtitle="360° penilaian kepemimpinan per siklus"
                action={
                    isLeader ? (
                        <div className="flex gap-sm">
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
                    <p className="mb-md text-[12px] font-medium uppercase tracking-wider text-text-muted">
                        Assessment Menunggu Kamu
                    </p>
                    <div className="flex flex-col gap-sm">
                        {pendingAssignments.map((a) => (
                            <div
                                key={a.id}
                                className="flex items-center justify-between rounded-lg border border-border bg-surface px-lg py-md"
                            >
                                <div>
                                    <p className="text-[13px] font-medium text-text-primary">
                                        {a.user.name}
                                    </p>
                                    <p className="text-[12px] text-text-muted">
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
                                    <h2 className="text-[14px] font-semibold tracking-tight text-text-primary">
                                        {cycle.name}
                                    </h2>
                                    {cycle.period && (
                                        <p className="text-[12px] text-text-muted">
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
                                                variant="destructive"
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
                                            "Assessee",
                                            "Tipe Leadership",
                                            "Progress",
                                            "Status",
                                            "",
                                        ].map((h, i) => (
                                            <TableHead key={i}>{h}</TableHead>
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
                                                {(isLeader ||
                                                    cycle.is_closed) && (
                                                    <Link
                                                        href={route(
                                                            "leadership-assessment.results",
                                                            {
                                                                cycle: cycle.id,
                                                                assessee: a.user_id,
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
                                    <p className="text-[12px] text-error-text">
                                        {cycleForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="cycle-period">
                                    Periode (opsional)
                                </Label>
                                <Input
                                    id="cycle-period"
                                    value={cycleForm.data.period}
                                    onChange={(e) =>
                                        cycleForm.setData(
                                            "period",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Misal: Juli — September 2025"
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
                            onClick={submitCycle}
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
                                <Label>Assessee *</Label>
                                <Select
                                    value={assignForm.data.user_id}
                                    onChange={(e) =>
                                        assignForm.setData(
                                            "user_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">— Pilih user —</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Tipe Leadership *</Label>
                                <Select
                                    value={assignForm.data.leadership_type_id}
                                    onChange={(e) =>
                                        assignForm.setData(
                                            "leadership_type_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">— Pilih tipe —</option>
                                    {types.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </Select>
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
                            onClick={submitAssign}
                            disabled={assignForm.processing}
                        >
                            {assignForm.processing ? "Menyimpan…" : "Assign"}
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
