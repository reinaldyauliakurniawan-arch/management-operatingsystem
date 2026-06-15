import { useState } from "react";
import { Head, usePage, useForm, router } from "@inertiajs/react";
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
import { Textarea } from "@/Components/ui/textarea";
import { EmptyState } from "@/Components/ui/empty-state";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";

// ---- Types ----

interface CoreValueScore {
    value: string;
    symbol: "+" | "+/-" | "-";
}

interface Evaluation {
    id: number;
    evaluatee: { id: number; name: string };
    evaluator: { id: number; name: string };
    period: string | null;
    gwc_get: boolean;
    gwc_want: boolean;
    gwc_capacity: boolean;
    core_values_scores: CoreValueScore[];
    seat_fit: string;
    seat_fit_computed: string;
    notes: string | null;
    created_at: string;
}

interface Standard {
    min_plus: number;
    max_plus_minus: number;
    max_minus: number;
    gwc_get: boolean;
    gwc_want: boolean;
    gwc_capacity: string; // "Y" | "N"
}

interface User {
    id: number;
    name: string;
}

// ---- Helpers ----

const SEAT_FIT_LABELS: Record<
    string,
    { label: string; variant: "success" | "warning" | "error" | "neutral" }
> = {
    right_person_right_seat: {
        label: "Right Person, Right Seat",
        variant: "success",
    },
    wrong_person_right_seat: {
        label: "Wrong Person, Right Seat",
        variant: "warning",
    },
    right_person_wrong_seat: {
        label: "Right Person, Wrong Seat",
        variant: "info" as any,
    },
    wrong_person_wrong_seat: {
        label: "Wrong Person, Wrong Seat",
        variant: "error",
    },
};

function SeatFitBadge({ fit }: { fit: string }) {
    const meta = SEAT_FIT_LABELS[fit] ?? { label: fit, variant: "neutral" };
    return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function GwcDot({ value }: { value: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-xs text-[12px] font-medium ${value ? "text-primary" : "text-error-text"}`}
        >
            <span
                className={`inline-block size-1.5 rounded-full ${value ? "bg-primary" : "bg-error"}`}
            />
            {value ? "Y" : "N"}
        </span>
    );
}

function SymbolBadge({ symbol }: { symbol: "+" | "+/-" | "-" }) {
    const styles: Record<string, string> = {
        "+": "bg-primary-subtle text-primary-text",
        "+/-": "bg-warning-subtle text-warning-text",
        "-": "bg-error-subtle text-error-text",
    };
    return (
        <span
            className={`rounded-xs px-sm py-0.5 text-[11px] font-semibold ${styles[symbol]}`}
        >
            {symbol}
        </span>
    );
}

const DEFAULT_CORE_VALUES = [{ value: "", symbol: "+" as const }];

// ---- Main Component ----

export default function PeopleAnalyzerIndex({
    evaluations,
    users,
    standard,
    canManage,
}: {
    evaluations: Evaluation[];
    users: User[];
    standard: Standard | null;
    canManage: boolean;
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editEval, setEditEval] = useState<Evaluation | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [standardOpen, setStandardOpen] = useState(false);
    const [detailEval, setDetailEval] = useState<Evaluation | null>(null);

    // Eval form
    const evalForm = useForm({
        evaluatee_id: "",
        period: "",
        gwc_get: true,
        gwc_want: true,
        gwc_capacity: true,
        core_values_scores: [{ value: "", symbol: "+" }] as {
            value: string;
            symbol: string;
        }[],
        notes: "",
    });

    // Standard form
    const stdForm = useForm({
        min_plus: standard?.min_plus ?? 3,
        max_plus_minus: standard?.max_plus_minus ?? 2,
        max_minus: standard?.max_minus ?? 0,
        gwc_get: standard?.gwc_get ?? true,
        gwc_want: standard?.gwc_want ?? true,
        gwc_capacity: standard?.gwc_capacity ?? "Y",
    });

    const openCreate = () => {
        evalForm.reset();
        evalForm.setData("core_values_scores", [{ value: "", symbol: "+" }]);
        setCreateOpen(true);
    };

    const openEdit = (ev: Evaluation) => {
        evalForm.setData({
            evaluatee_id: String(ev.evaluatee.id),
            period: ev.period ?? "",
            gwc_get: ev.gwc_get,
            gwc_want: ev.gwc_want,
            gwc_capacity: ev.gwc_capacity,
            core_values_scores: ev.core_values_scores.length
                ? ev.core_values_scores
                : [{ value: "", symbol: "+" }],
            notes: ev.notes ?? "",
        });
        setEditEval(ev);
    };

    const submitEval = (e: React.FormEvent) => {
        e.preventDefault();
        if (editEval) {
            evalForm.patch(route("people-analyzer.update", editEval.id), {
                onSuccess: () => {
                    setEditEval(null);
                    evalForm.reset();
                },
            });
        } else {
            evalForm.post(route("people-analyzer.store"), {
                onSuccess: () => {
                    setCreateOpen(false);
                    evalForm.reset();
                },
            });
        }
    };

    const submitStandard = (e: React.FormEvent) => {
        e.preventDefault();
        stdForm.post(route("people-analyzer.standard.upsert"), {
            onSuccess: () => setStandardOpen(false),
        });
    };

    const destroy = (id: number) =>
        router.delete(route("people-analyzer.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
        });

    const addCoreValue = () =>
        evalForm.setData("core_values_scores", [
            ...evalForm.data.core_values_scores,
            { value: "", symbol: "+" },
        ]);

    const removeCoreValue = (i: number) =>
        evalForm.setData(
            "core_values_scores",
            evalForm.data.core_values_scores.filter((_, idx) => idx !== i),
        );

    const updateCoreValue = (
        i: number,
        field: "value" | "symbol",
        val: string,
    ) => {
        const updated = [...evalForm.data.core_values_scores];
        updated[i] = { ...updated[i], [field]: val };
        evalForm.setData("core_values_scores", updated);
    };

    const EvalFormBody = () => (
        <div className="flex flex-col gap-lg">
            {/* Evaluatee — only on create */}
            {!editEval && (
                <div className="flex flex-col gap-xs">
                    <Label>Evaluatee *</Label>
                    <Select
                        value={evalForm.data.evaluatee_id}
                        onChange={(e) =>
                            evalForm.setData("evaluatee_id", e.target.value)
                        }
                    >
                        <option value="">— Pilih user —</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </Select>
                    {evalForm.errors.evaluatee_id && (
                        <p className="text-[12px] text-error-text">
                            {evalForm.errors.evaluatee_id}
                        </p>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-xs">
                <Label>Periode (opsional)</Label>
                <Input
                    value={evalForm.data.period}
                    onChange={(e) => evalForm.setData("period", e.target.value)}
                    placeholder="Misal: Q3 2025"
                />
            </div>

            {/* GWC */}
            <div className="flex flex-col gap-xs">
                <Label>GWC Assessment</Label>
                <div className="flex flex-col gap-sm rounded-lg border border-border bg-surface-raised p-md">
                    {(["gwc_get", "gwc_want", "gwc_capacity"] as const).map(
                        (key) => {
                            const labels: Record<string, string> = {
                                gwc_get: "Get it — Paham peran & ekspektasi",
                                gwc_want: "Want it — Mau & termotivasi",
                                gwc_capacity:
                                    "Capacity — Mampu secara waktu & kapasitas",
                            };
                            return (
                                <label
                                    key={key}
                                    className="flex cursor-pointer items-center justify-between"
                                >
                                    <span className="text-[13px] text-text-primary">
                                        {labels[key]}
                                    </span>
                                    <div className="flex gap-sm">
                                        {["Y", "N"].map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() =>
                                                    evalForm.setData(
                                                        key,
                                                        opt === "Y",
                                                    )
                                                }
                                                className={`rounded-xs px-md py-xs text-[12px] font-semibold transition-colors ${
                                                    evalForm.data[key] ===
                                                    (opt === "Y")
                                                        ? opt === "Y"
                                                            ? "bg-primary-subtle text-primary-text"
                                                            : "bg-error-subtle text-error-text"
                                                        : "bg-surface-overlay text-text-muted hover:bg-surface-overlay/70"
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </label>
                            );
                        },
                    )}
                </div>
            </div>

            {/* Core Values */}
            <div className="flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                    <Label>Core Values</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addCoreValue}
                    >
                        + Tambah
                    </Button>
                </div>
                <div className="flex flex-col gap-sm">
                    {evalForm.data.core_values_scores.map((cv, i) => (
                        <div key={i} className="flex items-center gap-sm">
                            <Input
                                value={cv.value}
                                onChange={(e) =>
                                    updateCoreValue(i, "value", e.target.value)
                                }
                                placeholder={`Core value ${i + 1}`}
                                className="flex-1"
                            />
                            <select
                                value={cv.symbol}
                                onChange={(e) =>
                                    updateCoreValue(i, "symbol", e.target.value)
                                }
                                className="bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors appearance-none"
                            >
                                <option value="+">+</option>
                                <option value="+/-">+/-</option>
                                <option value="-">-</option>
                            </select>
                            {evalForm.data.core_values_scores.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeCoreValue(i)}
                                    className="text-[12px] text-text-muted hover:text-error-text transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-xs">
                <Label>Catatan (opsional)</Label>
                <Textarea
                    value={evalForm.data.notes}
                    onChange={(e) => evalForm.setData("notes", e.target.value)}
                    placeholder="Observasi atau konteks tambahan..."
                    rows={3}
                />
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="People Analyzer" />

            <PageHeader
                title="People Analyzer"
                subtitle="Evaluasi GWC & Core Values fit per anggota tim"
                action={
                    canManage ? (
                        <div className="flex gap-sm">
                            <Button
                                variant="secondary"
                                onClick={() => setStandardOpen(true)}
                            >
                                Atur Standard
                            </Button>
                            <Button onClick={openCreate}>
                                + Buat Evaluasi
                            </Button>
                        </div>
                    ) : undefined
                }
            />

            {/* Standard info strip */}
            {standard && (
                <div className="mb-xl flex flex-wrap items-center gap-lg rounded-lg border border-border bg-surface-subtle px-lg py-md">
                    <p className="text-[12px] font-medium uppercase tracking-wider text-text-muted">
                        Bare Minimum Standard
                    </p>
                    <div className="flex flex-wrap gap-md">
                        <span className="text-[13px] text-text-secondary">
                            Core Values: min{" "}
                            <span className="font-semibold text-primary">
                                {standard.min_plus}×(+)
                            </span>
                            {" · "}max{" "}
                            <span className="font-semibold text-warning-text">
                                {standard.max_plus_minus}×(+/-)
                            </span>
                            {" · "}max{" "}
                            <span className="font-semibold text-error-text">
                                {standard.max_minus}×(-)
                            </span>
                        </span>
                        <span className="text-[13px] text-text-secondary">
                            GWC: Get={standard.gwc_get ? "Y" : "N"} · Want=
                            {standard.gwc_want ? "Y" : "N"} · Capacity=
                            {standard.gwc_capacity}
                        </span>
                    </div>
                </div>
            )}

            {evaluations.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <EmptyState
                            title="Belum ada evaluasi"
                            description={
                                canManage
                                    ? "Buat evaluasi pertama untuk mulai menganalisis tim."
                                    : "Belum ada evaluasi untukmu di tim ini."
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            {[
                                "Nama",
                                "Periode",
                                "GWC",
                                "Core Values",
                                "Seat Fit",
                                "",
                            ].map((h, i) => (
                                <TableHead key={i}>{h}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {evaluations.map((ev) => (
                            <TableRow key={ev.id}>
                                <TableCell>
                                    <p className="text-[13px] font-medium text-text-primary">
                                        {ev.evaluatee.name}
                                    </p>
                                    <p className="text-[12px] text-text-muted">
                                        by {ev.evaluator.name}
                                    </p>
                                </TableCell>
                                <TableCell className="text-text-secondary">
                                    {ev.period ?? "—"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-xs">
                                        <span className="text-[11px] text-text-muted">
                                            G: <GwcDot value={ev.gwc_get} />
                                        </span>
                                        <span className="text-[11px] text-text-muted">
                                            W: <GwcDot value={ev.gwc_want} />
                                        </span>
                                        <span className="text-[11px] text-text-muted">
                                            C:{" "}
                                            <GwcDot value={ev.gwc_capacity} />
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-xs">
                                        {ev.core_values_scores.map((cv, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-xs"
                                            >
                                                <span className="text-[12px] text-text-secondary">
                                                    {cv.value}
                                                </span>
                                                <SymbolBadge
                                                    symbol={cv.symbol as any}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <SeatFitBadge
                                        fit={
                                            ev.seat_fit_computed ?? ev.seat_fit
                                        }
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-sm">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDetailEval(ev)}
                                        >
                                            Detail
                                        </Button>
                                        {canManage && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(ev)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDeleteId(ev.id)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Buat Evaluasi</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form onSubmit={submitEval}>
                            <EvalFormBody />
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
                            onClick={submitEval}
                            disabled={evalForm.processing}
                        >
                            {evalForm.processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog
                open={!!editEval}
                onOpenChange={(open) => !open && setEditEval(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Evaluasi — {editEval?.evaluatee.name}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form onSubmit={submitEval}>
                            <EvalFormBody />
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditEval(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={submitEval}
                            disabled={evalForm.processing}
                        >
                            {evalForm.processing ? "Menyimpan…" : "Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog
                open={!!detailEval}
                onOpenChange={(open) => !open && setDetailEval(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>
                            Detail Evaluasi — {detailEval?.evaluatee.name}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        {detailEval && (
                            <div className="flex flex-col gap-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[12px] text-text-muted">
                                            Periode
                                        </p>
                                        <p className="text-[13px] text-text-primary">
                                            {detailEval.period ?? "—"}
                                        </p>
                                    </div>
                                    <SeatFitBadge
                                        fit={
                                            detailEval.seat_fit_computed ??
                                            detailEval.seat_fit
                                        }
                                    />
                                </div>

                                <div>
                                    <p className="mb-sm text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                        GWC
                                    </p>
                                    <div className="flex flex-col gap-xs rounded-lg border border-border bg-surface-raised p-md">
                                        {[
                                            {
                                                label: "Get it",
                                                val: detailEval.gwc_get,
                                            },
                                            {
                                                label: "Want it",
                                                val: detailEval.gwc_want,
                                            },
                                            {
                                                label: "Capacity",
                                                val: detailEval.gwc_capacity,
                                            },
                                        ].map(({ label, val }) => (
                                            <div
                                                key={label}
                                                className="flex items-center justify-between"
                                            >
                                                <span className="text-[13px] text-text-secondary">
                                                    {label}
                                                </span>
                                                <GwcDot value={val} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-sm text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                        Core Values
                                    </p>
                                    <div className="flex flex-col gap-sm">
                                        {detailEval.core_values_scores.map(
                                            (cv, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between rounded-lg border border-border px-md py-sm"
                                                >
                                                    <span className="text-[13px] text-text-primary">
                                                        {cv.value}
                                                    </span>
                                                    <SymbolBadge
                                                        symbol={
                                                            cv.symbol as any
                                                        }
                                                    />
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {detailEval.notes && (
                                    <div>
                                        <p className="mb-sm text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                            Catatan
                                        </p>
                                        <p className="text-[13px] text-text-secondary whitespace-pre-line">
                                            {detailEval.notes}
                                        </p>
                                    </div>
                                )}

                                <p className="text-[12px] text-text-muted">
                                    Dievaluasi oleh {detailEval.evaluator.name}
                                </p>
                            </div>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setDetailEval(null)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Standard Modal */}
            <Dialog open={standardOpen} onOpenChange={setStandardOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Atur Bare Minimum Standard</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            onSubmit={submitStandard}
                            className="flex flex-col gap-lg"
                        >
                            <p className="text-[13px] text-text-secondary">
                                Tentukan threshold minimum untuk lulus evaluasi.
                                Skor dihitung dari core values dan GWC.
                            </p>

                            <div className="flex flex-col gap-xs">
                                <Label>Min jumlah (+)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={stdForm.data.min_plus}
                                    onChange={(e) =>
                                        stdForm.setData(
                                            "min_plus",
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Max jumlah (+/-)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={stdForm.data.max_plus_minus}
                                    onChange={(e) =>
                                        stdForm.setData(
                                            "max_plus_minus",
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Max jumlah (-)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={stdForm.data.max_minus}
                                    onChange={(e) =>
                                        stdForm.setData(
                                            "max_minus",
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </div>

                            <div className="flex flex-col gap-xs">
                                <Label>GWC Minimum</Label>
                                <div className="flex flex-col gap-sm rounded-lg border border-border bg-surface-raised p-md">
                                    {(
                                        [
                                            {
                                                key: "gwc_get" as const,
                                                label: "Get it",
                                            },
                                            {
                                                key: "gwc_want" as const,
                                                label: "Want it",
                                            },
                                        ] as const
                                    ).map(({ key, label }) => (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between"
                                        >
                                            <span className="text-[13px] text-text-secondary">
                                                {label} harus Y?
                                            </span>
                                            <div className="flex gap-sm">
                                                {["Y", "N"].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() =>
                                                            stdForm.setData(
                                                                key,
                                                                opt === "Y",
                                                            )
                                                        }
                                                        className={`rounded-xs px-md py-xs text-[12px] font-semibold transition-colors ${
                                                            stdForm.data[
                                                                key
                                                            ] ===
                                                            (opt === "Y")
                                                                ? opt === "Y"
                                                                    ? "bg-primary-subtle text-primary-text"
                                                                    : "bg-error-subtle text-error-text"
                                                                : "bg-surface-overlay text-text-muted"
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] text-text-secondary">
                                            Capacity harus Y?
                                        </span>
                                        <div className="flex gap-sm">
                                            {["Y", "N"].map((opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() =>
                                                        stdForm.setData(
                                                            "gwc_capacity",
                                                            opt,
                                                        )
                                                    }
                                                    className={`rounded-xs px-md py-xs text-[12px] font-semibold transition-colors ${
                                                        stdForm.data
                                                            .gwc_capacity ===
                                                        opt
                                                            ? opt === "Y"
                                                                ? "bg-primary-subtle text-primary-text"
                                                                : "bg-error-subtle text-error-text"
                                                            : "bg-surface-overlay text-text-muted"
                                                    }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setStandardOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={submitStandard}
                            disabled={stdForm.processing}
                        >
                            {stdForm.processing
                                ? "Menyimpan…"
                                : "Simpan Standard"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Hapus Evaluasi"
                description="Evaluasi ini akan dihapus (soft delete). Data historis tetap tersimpan."
                onConfirm={() => deleteId && destroy(deleteId)}
            />
        </AuthenticatedLayout>
    );
}
