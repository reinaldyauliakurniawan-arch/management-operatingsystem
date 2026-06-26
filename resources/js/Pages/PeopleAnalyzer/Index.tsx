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

interface CoreValueScore {
    value: string;
    symbol: "+" | "+/-" | "-";
}
interface Evaluation {
    id: number;
    evaluatee: { id: number; name: string } | null;
    evaluator: { id: number; name: string };
    is_candidate: boolean;
    candidate_name: string | null;
    display_name: string;
    period: string | null;
    seat_title: string | null;
    manual_seat_title: string | null;
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
    gwc_capacity: string;
}
interface User {
    id: number;
    name: string;
}
interface Seat {
    id: number;
    title: string;
    team_id?: number;
    team_name?: string;
}

const SEAT_FIT_LABELS: Record<string, { label: string; variant: any }> = {
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
        variant: "neutral",
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
            className={`inline-flex items-center gap-xs text-[var(--font-base)] font-medium ${value ? "text-primary" : "text-error-text"}`}
        >
            <span
                className={`inline-block size-1.5 rounded-full ${value ? "bg-primary" : "bg-error"}`}
            />
            {value ? "Y" : "N"}
        </span>
    );
}
function SymbolBadge({ symbol }: { symbol: string }) {
    const styles: Record<string, string> = {
        "+": "bg-primary-subtle text-primary-text",
        "+/-": "bg-warning-subtle text-warning-text",
        "-": "bg-error-subtle text-error-text",
    };
    return (
        <span
            className={`rounded-xs px-sm py-0.5 text-[var(--font-sm)] font-semibold ${styles[symbol] ?? ""}`}
        >
            {symbol}
        </span>
    );
}

// ── EvalFormBody diangkat ke luar agar tidak re-mount tiap render ──
interface EvalFormBodyProps {
    evalFormData: any;
    setEvalFormData: (key: string, value: any) => void;
    editEval: Evaluation | null;
    users: User[];
    seats: Seat[];
    vto_core_values: string[];
}

function EvalFormBody({
    evalFormData,
    setEvalFormData,
    editEval,
    users,
    seats,
    vto_core_values,
}: EvalFormBodyProps) {
    const addCoreValue = () =>
        setEvalFormData("core_values_scores", [
            ...evalFormData.core_values_scores,
            { value: "", symbol: "+" },
        ]);

    const removeCoreValue = (i: number) =>
        setEvalFormData(
            "core_values_scores",
            evalFormData.core_values_scores.filter(
                (_: any, idx: number) => idx !== i,
            ),
        );

    const updateCoreValue = (
        i: number,
        field: "value" | "symbol",
        val: string,
    ) => {
        const updated = [...evalFormData.core_values_scores];
        updated[i] = { ...updated[i], [field]: val };
        setEvalFormData("core_values_scores", updated);
    };

    return (
        <div className="flex flex-col gap-lg">
            {/* Candidate toggle */}
            {!editEval && (
                <div className="flex items-center gap-md rounded-lg border border-border bg-surface-raised px-md py-sm">
                    <span className="text-[var(--font-base)] text-text-secondary">
                        Mode penilaian:
                    </span>
                    <div className="flex gap-sm">
                        {[
                            { val: false, label: "Anggota Tim" },
                            { val: true, label: "Kandidat Eksternal" },
                        ].map(({ val, label }) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() =>
                                    setEvalFormData("is_candidate", val)
                                }
                                className={`rounded-xs px-md py-xs text-[var(--font-base)] font-medium transition-colors ${evalFormData.is_candidate === val ? "bg-primary-subtle text-primary-text" : "bg-surface-overlay text-text-muted"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Evaluatee / Candidate name */}
            {evalFormData.is_candidate ? (
                <div className="flex flex-col gap-xs">
                    <Label>Nama Kandidat *</Label>
                    <Input
                        value={evalFormData.candidate_name}
                        onChange={(e) =>
                            setEvalFormData("candidate_name", e.target.value)
                        }
                        placeholder="Nama lengkap kandidat"
                        required
                    />
                </div>
            ) : !editEval ? (
                <div className="flex flex-col gap-xs">
                    <Label>Evaluatee *</Label>
                    <Select
                        value={evalFormData.evaluatee_id}
                        onChange={(e) =>
                            setEvalFormData("evaluatee_id", e.target.value)
                        }
                    >
                        <option value="">— Pilih anggota —</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </Select>
                </div>
            ) : null}

            {/* Seat / Posisi */}
            <div className="flex flex-col gap-xs">
                <Label>Posisi yang Dinilai (opsional)</Label>
                <Select
                    value={evalFormData.seat_id}
                    onChange={(e) => {
                        setEvalFormData("seat_id", e.target.value);
                        if (e.target.value) {
                            setEvalFormData("manual_seat_title", "");
                        }
                    }}
                >
                    <option value="">— Tidak spesifik —</option>
                    {seats.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.title}
                            {s.team_name ? ` (${s.team_name})` : ""}
                        </option>
                    ))}
                </Select>
                <Input
                    value={evalFormData.manual_seat_title}
                    onChange={(e) =>
                        setEvalFormData("manual_seat_title", e.target.value)
                    }
                    disabled={!!evalFormData.seat_id}
                    placeholder="Atau tulis posisi manual (jika belum ada di daftar)"
                />
                <p className="text-[var(--font-sm)] text-text-muted">
                    Untuk kandidat: posisi yang dilamar. Untuk anggota: posisi
                    yang sedang dijabat.
                </p>
            </div>

            <div className="flex flex-col gap-xs">
                <Label>Periode (opsional)</Label>
                <Input
                    value={evalFormData.period}
                    onChange={(e) => setEvalFormData("period", e.target.value)}
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
                                    <span className="text-[var(--font-base)] text-text-primary">
                                        {labels[key]}
                                    </span>
                                    <div className="flex gap-sm">
                                        {["Y", "N"].map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() =>
                                                    setEvalFormData(
                                                        key,
                                                        opt === "Y",
                                                    )
                                                }
                                                className={`rounded-xs px-md py-xs text-[var(--font-base)] font-semibold transition-colors ${evalFormData[key] === (opt === "Y") ? (opt === "Y" ? "bg-primary-subtle text-primary-text" : "bg-error-subtle text-error-text") : "bg-surface-overlay text-text-muted hover:bg-surface-overlay/70"}`}
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
                    <div className="flex gap-xs">
                        {vto_core_values.length > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setEvalFormData(
                                        "core_values_scores",
                                        vto_core_values.map((v) => ({
                                            value: v,
                                            symbol: "+",
                                        })),
                                    )
                                }
                            >
                                ↺ Reset dari VTO
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addCoreValue}
                        >
                            + Tambah
                        </Button>
                    </div>
                </div>
                {vto_core_values.length > 0 && (
                    <p className="text-[var(--font-sm)] text-text-muted">
                        Core values dari VTO otomatis dimuat. Ubah simbol sesuai
                        penilaian.
                    </p>
                )}
                <div className="flex flex-col gap-sm">
                    {evalFormData.core_values_scores.map(
                        (cv: any, i: number) => (
                            <div key={i} className="flex items-center gap-sm">
                                <Input
                                    value={cv.value}
                                    onChange={(e) =>
                                        updateCoreValue(
                                            i,
                                            "value",
                                            e.target.value,
                                        )
                                    }
                                    placeholder={`Core value ${i + 1}`}
                                    className="flex-1"
                                />
                                <select
                                    value={cv.symbol}
                                    onChange={(e) =>
                                        updateCoreValue(
                                            i,
                                            "symbol",
                                            e.target.value,
                                        )
                                    }
                                    className="bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors appearance-none"
                                >
                                    <option value="+">+</option>
                                    <option value="+/-">+/-</option>
                                    <option value="-">-</option>
                                </select>
                                {evalFormData.core_values_scores.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeCoreValue(i)}
                                        className="text-[var(--font-base)] text-text-muted hover:text-error-text transition-colors"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ),
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-xs">
                <Label>Catatan (opsional)</Label>
                <Textarea
                    value={evalFormData.notes}
                    onChange={(e) => setEvalFormData("notes", e.target.value)}
                    placeholder="Observasi atau konteks tambahan..."
                    rows={3}
                />
            </div>
        </div>
    );
}

export default function PeopleAnalyzerIndex({
    evaluations,
    users,
    standard,
    canManage,
    vto_core_values,
    seats,
}: {
    evaluations: Evaluation[];
    users: User[];
    standard: Standard | null;
    canManage: boolean;
    vto_core_values: string[];
    seats: Seat[];
}) {
    const [tab, setTab] = useState<"members" | "candidates" | "history">(
        "members",
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [editEval, setEditEval] = useState<Evaluation | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [standardOpen, setStandardOpen] = useState(false);
    const [detailEval, setDetailEval] = useState<Evaluation | null>(null);

    const evalForm = useForm({
        evaluatee_id: "",
        is_candidate: false,
        candidate_name: "",
        seat_id: "",
        manual_seat_title: "",
        period: "",
        gwc_get: true,
        gwc_want: true,
        gwc_capacity: true,
        core_values_scores: [] as { value: string; symbol: string }[],
        notes: "",
    });

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
        const cvScores = vto_core_values.length
            ? vto_core_values.map((v: string) => ({ value: v, symbol: "+" }))
            : [{ value: "", symbol: "+" }];
        evalForm.setData("core_values_scores", cvScores);
        setCreateOpen(true);
    };

    const openEdit = (ev: Evaluation) => {
        evalForm.setData({
            evaluatee_id: ev.evaluatee ? String(ev.evaluatee.id) : "",
            is_candidate: ev.is_candidate,
            candidate_name: ev.candidate_name ?? "",
            seat_id: "",
            manual_seat_title: ev.manual_seat_title ?? "",
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

    const memberEvals = evaluations.filter((e) => !e.is_candidate);
    const candidateEvals = evaluations.filter((e) => e.is_candidate);
    const tabData =
        tab === "members"
            ? memberEvals
            : tab === "candidates"
              ? candidateEvals
              : evaluations;

    const EvalTable = ({ data }: { data: Evaluation[] }) => (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        {[
                            "Nama",
                            "Posisi",
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
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7}>
                                <EmptyState
                                    title="Tidak ada data"
                                    description="Belum ada evaluasi di kategori ini."
                                />
                            </TableCell>
                        </TableRow>
                    )}
                    {data.map((ev) => (
                        <TableRow key={ev.id}>
                            <TableCell>
                                <p className="text-[var(--font-base)] font-medium text-text-primary">
                                    {ev.display_name}
                                </p>
                                <p className="text-[var(--font-sm)] text-text-muted">
                                    {ev.is_candidate && (
                                        <span className="mr-xs rounded-xs bg-warning-subtle px-xs py-0.5 text-[var(--font-sm)] text-warning-text">
                                            Kandidat
                                        </span>
                                    )}
                                    by {ev.evaluator.name}
                                </p>
                            </TableCell>
                            <TableCell className="text-text-secondary">
                                {ev.seat_title ?? "—"}
                            </TableCell>
                            <TableCell className="text-text-secondary">
                                {ev.period ?? "—"}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-xs">
                                    <span className="text-[var(--font-sm)] text-text-muted">
                                        G: <GwcDot value={ev.gwc_get} />
                                    </span>
                                    <span className="text-[var(--font-sm)] text-text-muted">
                                        W: <GwcDot value={ev.gwc_want} />
                                    </span>
                                    <span className="text-[var(--font-sm)] text-text-muted">
                                        C: <GwcDot value={ev.gwc_capacity} />
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
                                            <span className="text-[var(--font-base)] text-text-secondary">
                                                {cv.value}
                                            </span>
                                            <SymbolBadge symbol={cv.symbol} />
                                        </div>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                <SeatFitBadge
                                    fit={ev.seat_fit_computed ?? ev.seat_fit}
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

            {/* Standard strip */}
            {standard && (
                <div className="mb-xl flex flex-wrap items-center gap-lg rounded-lg border border-border bg-surface-subtle px-lg py-md">
                    <p className="text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
                        Bare Minimum Standard
                    </p>
                    <div className="flex flex-wrap gap-md">
                        <span className="text-[var(--font-base)] text-text-secondary">
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
                        <span className="text-[var(--font-base)] text-text-secondary">
                            GWC: Get={standard.gwc_get ? "Y" : "N"} · Want=
                            {standard.gwc_want ? "Y" : "N"} · Capacity=
                            {standard.gwc_capacity}
                        </span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-lg flex gap-xs border-b border-border">
                {[
                    {
                        key: "members",
                        label: `Anggota Tim (${memberEvals.length})`,
                    },
                    {
                        key: "candidates",
                        label: `Kandidat (${candidateEvals.length})`,
                    },
                    {
                        key: "history",
                        label: `Semua Riwayat (${evaluations.length})`,
                    },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key as any)}
                        className={`px-md pb-sm pt-xs text-[var(--font-base)] font-medium transition-colors border-b-2 -mb-px ${tab === key ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

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
                <EvalTable data={tabData} />
            )}

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Buat Evaluasi</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form id="eval-create-form" onSubmit={submitEval}>
                            <EvalFormBody
                                evalFormData={evalForm.data}
                                setEvalFormData={evalForm.setData}
                                editEval={editEval}
                                users={users}
                                seats={seats}
                                vto_core_values={vto_core_values}
                            />
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
                            form="eval-create-form"
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
                onOpenChange={(o) => !o && setEditEval(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Evaluasi — {editEval?.display_name}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form id="eval-edit-form" onSubmit={submitEval}>
                            <EvalFormBody
                                evalFormData={evalForm.data}
                                setEvalFormData={evalForm.setData}
                                editEval={editEval}
                                users={users}
                                seats={seats}
                                vto_core_values={vto_core_values}
                            />
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
                            type="submit"
                            form="eval-edit-form"
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
                onOpenChange={(o) => !o && setDetailEval(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>
                            Detail Evaluasi — {detailEval?.display_name}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        {detailEval && (
                            <div className="flex flex-col gap-lg">
                                <div className="grid grid-cols-2 gap-md">
                                    <div>
                                        <p className="text-[var(--font-base)] text-text-muted">
                                            Posisi
                                        </p>
                                        <p className="text-[var(--font-base)] text-text-primary">
                                            {detailEval.seat_title ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[var(--font-base)] text-text-muted">
                                            Periode
                                        </p>
                                        <p className="text-[var(--font-base)] text-text-primary">
                                            {detailEval.period ?? "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--font-base)] text-text-muted">
                                        Seat Fit
                                    </span>
                                    <SeatFitBadge
                                        fit={
                                            detailEval.seat_fit_computed ??
                                            detailEval.seat_fit
                                        }
                                    />
                                </div>
                                <div>
                                    <p className="mb-sm text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
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
                                                <span className="text-[var(--font-base)] text-text-secondary">
                                                    {label}
                                                </span>
                                                <GwcDot value={val} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-sm text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
                                        Core Values
                                    </p>
                                    <div className="flex flex-col gap-sm">
                                        {detailEval.core_values_scores.map(
                                            (cv, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between rounded-lg border border-border px-md py-sm"
                                                >
                                                    <span className="text-[var(--font-base)] text-text-primary">
                                                        {cv.value}
                                                    </span>
                                                    <SymbolBadge
                                                        symbol={cv.symbol}
                                                    />
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                                {detailEval.notes && (
                                    <div>
                                        <p className="mb-sm text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
                                            Catatan
                                        </p>
                                        <p className="text-[var(--font-base)] text-text-secondary whitespace-pre-line">
                                            {detailEval.notes}
                                        </p>
                                    </div>
                                )}
                                <p className="text-[var(--font-base)] text-text-muted">
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
                            id="std-form"
                            onSubmit={submitStandard}
                            className="flex flex-col gap-lg"
                        >
                            <p className="text-[var(--font-base)] text-text-secondary">
                                Tentukan threshold minimum untuk lulus evaluasi.
                            </p>
                            {[
                                {
                                    key: "min_plus" as const,
                                    label: "Min jumlah (+)",
                                },
                                {
                                    key: "max_plus_minus" as const,
                                    label: "Max jumlah (+/-)",
                                },
                                {
                                    key: "max_minus" as const,
                                    label: "Max jumlah (-)",
                                },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex flex-col gap-xs">
                                    <Label>{label}</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={stdForm.data[key]}
                                        onChange={(e) =>
                                            stdForm.setData(
                                                key,
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </div>
                            ))}
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
                                            <span className="text-[var(--font-base)] text-text-secondary">
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
                                                        className={`rounded-xs px-md py-xs text-[var(--font-base)] font-semibold transition-colors ${stdForm.data[key] === (opt === "Y") ? (opt === "Y" ? "bg-primary-subtle text-primary-text" : "bg-error-subtle text-error-text") : "bg-surface-overlay text-text-muted"}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--font-base)] text-text-secondary">
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
                                                    className={`rounded-xs px-md py-xs text-[var(--font-base)] font-semibold transition-colors ${stdForm.data.gwc_capacity === opt ? (opt === "Y" ? "bg-primary-subtle text-primary-text" : "bg-error-subtle text-error-text") : "bg-surface-overlay text-text-muted"}`}
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
                            type="submit"
                            form="std-form"
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
                onOpenChange={(o) => !o && setDeleteId(null)}
                title="Hapus Evaluasi"
                description="Evaluasi ini akan dihapus (soft delete)."
                onConfirm={() => deleteId && destroy(deleteId)}
            />
        </AuthenticatedLayout>
    );
}
