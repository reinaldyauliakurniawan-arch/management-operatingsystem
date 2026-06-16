import React, { useState } from "react";
import { Trophy, TrendingUp, Users, Zap } from "lucide-react";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";
import { useForm, Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
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
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from "@/Components/ui/dialog";

interface Breakdown {
    parameter: string;
    earned: number;
    max: number;
    automatic: boolean;
}

interface ScoreEntry {
    user_id: number;
    name: string;
    role: "leader" | "member" | "tutor";
    score: number;
    breakdown: Breakdown[];
}

interface Parameter {
    id: number;
    name: string;
    max_points: number;
    assigned_roles: string[];
    is_automatic: boolean;
    automatic_source: string | null;
}

const automaticSources = [
    { value: "rocks", label: "Rocks completion rate" },
    { value: "scorecard", label: "Scorecard green rate" },
    { value: "todos", label: "To-Do completion rate" },
    { value: "events", label: "Event attendance rate" },
    { value: "leadership", label: "Leadership Assessment score" },
];

const roleOptions = ["leader", "member", "tutor"];

const roleLabels: Record<string, string> = {
    leader: "Leader",
    member: "Member",
    tutor: "Tutor",
};

export default function LeaderboardIndex({
    scores,
    parameters,
    filters,
}: {
    scores: ScoreEntry[];
    parameters: Parameter[];
    filters: { date_from: string | null; date_to: string | null };
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";

    const [expanded, setExpanded] = useState<number | null>(null);
    const [configOpen, setConfigOpen] = useState(false);
    const [pointOpen, setPointOpen] = useState(false);
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
    const [dateTo, setDateTo] = useState(filters.date_to ?? "");
    const [deleteParamId, setDeleteParamId] = useState<number | null>(null);

    const paramForm = useForm({
        name: "",
        max_points: 10,
        assigned_roles: [] as string[],
        is_automatic: false,
        automatic_source: "" as string,
    });

    const pointForm = useForm({
        parameter_id: "",
        user_id: "",
        points: 0,
        notes: "",
    });

    const applyFilter = () => {
        router.get(
            route("leaderboard.index"),
            { date_from: dateFrom || null, date_to: dateTo || null },
            { preserveState: true },
        );
    };

    const submitParam = (e: React.FormEvent) => {
        e.preventDefault();
        paramForm.post(route("leaderboard.parameters.store"), {
            onSuccess: () => paramForm.reset(),
            preserveScroll: true,
        });
    };

    const deleteParam = (id: number) => {
        setDeleteParamId(id);
    };

    const confirmDeleteParam = () => {
        if (!deleteParamId) return;
        router.delete(route("leaderboard.parameters.destroy", deleteParamId), {
            preserveScroll: true,
            onFinish: () => setDeleteParamId(null),
        });
    };

    const submitPoint = (e: React.FormEvent) => {
        e.preventDefault();
        pointForm.post(route("leaderboard.entries.store"), {
            onSuccess: () => {
                pointForm.reset();
                setPointOpen(false);
            },
            preserveScroll: true,
        });
    };

    const toggleParamRole = (role: string) => {
        paramForm.setData(
            "assigned_roles",
            paramForm.data.assigned_roles.includes(role)
                ? paramForm.data.assigned_roles.filter((r) => r !== role)
                : [...paramForm.data.assigned_roles, role],
        );
    };

    const grouped = (isLeader ? roleOptions : [auth.teamRole].filter(Boolean))
        .map((role) => ({
            role,
            entries: scores.filter((s) => s.role === role),
        }))
        .filter((g) => g.entries.length > 0);

    const manualParameters = parameters.filter((p) => !p.is_automatic);
    const manualParamUsers = scores;

    return (
        <AuthenticatedLayout>
            <Head title="Leaderboard" />

            <PageHeader
                title="Leaderboard"
                subtitle="Ranking per role berdasarkan akumulasi poin"
                action={
                    isLeader && (
                        <div className="flex gap-sm">
                            <Button
                                variant="secondary"
                                onClick={() => setPointOpen(true)}
                            >
                                + Input Poin
                            </Button>
                            <Button onClick={() => setConfigOpen(true)}>
                                Konfigurasi
                            </Button>
                        </div>
                    )
                }
            />

            {/* Filter */}
            <div className="mb-xl rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:p-6 flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
                <div className="flex flex-col gap-2">
                    <span className="text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-secondary">
                        Periode Cepat
                    </span>
                    <div className="flex bg-surface-subtle p-1 rounded-full border border-border gap-1">
                        {[
                            { label: "Q1", from: `-01-01`, to: `-03-31` },
                            { label: "Q2", from: `-04-01`, to: `-06-30` },
                            { label: "Q3", from: `-07-01`, to: `-09-30` },
                            { label: "Q4", from: `-10-01`, to: `-12-31` },
                        ].map((q) => {
                            const year = new Date().getFullYear();
                            const isActive = dateFrom === `${year}${q.from}`;
                            return (
                                <button
                                    key={q.label}
                                    type="button"
                                    onClick={() => {
                                        setDateFrom(`${year}${q.from}`);
                                        setDateTo(`${year}${q.to}`);
                                    }}
                                    className={`px-4 py-1.5 rounded-full text-[var(--font-base)] font-medium transition-all ${
                                        isActive
                                            ? "bg-surface shadow-[var(--shadow-xs)] border border-border text-primary font-semibold"
                                            : "text-text-secondary hover:text-text-primary"
                                    }`}
                                >
                                    {q.label} {year}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-text-secondary">Dari</Label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-text-secondary">Sampai</Label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <Button onClick={applyFilter}>Filter</Button>
                    {(dateFrom || dateTo) && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setDateFrom("");
                                setDateTo("");
                                router.get(
                                    route("leaderboard.index"),
                                    {},
                                    { preserveState: true },
                                );
                            }}
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Leaderboard tables per role */}
            <div className="flex flex-col gap-xl">
                {grouped.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-text-muted">
                            Belum ada data leaderboard.{" "}
                            {isLeader && "Tambah parameter di Konfigurasi."}
                        </CardContent>
                    </Card>
                )}
                {grouped.map((group) => (
                    <div key={group.role}>
                        <div className="mb-3 flex items-center justify-between px-1">
                            <h2 className="text-[var(--font-md)] font-semibold tracking-tight text-text-primary">
                                {roleLabels[group.role]} Rank
                            </h2>
                            <div className="flex items-center gap-2 text-[var(--font-sm)] text-text-muted">
                                <span className="h-2 w-2 rounded-full bg-primary" />
                                {group.entries.length} peserta
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-surface-subtle">
                                        <th className="px-6 py-4 text-left text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-secondary w-20">
                                            # Rank
                                        </th>
                                        <th className="px-6 py-4 text-left text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-secondary">
                                            Nama
                                        </th>
                                        <th className="px-6 py-4 text-center text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-secondary">
                                            Score
                                        </th>
                                        <th className="px-6 py-4 text-right text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-secondary">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {group.entries.map((entry, idx) => (
                                        <React.Fragment key={entry.user_id}>
                                            <tr className="transition-colors duration-150 hover:bg-surface-subtle">
                                                <td className="px-6 py-5">
                                                    {idx === 0 ? (
                                                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[var(--font-base)] font-bold text-white">
                                                            1
                                                            <span className="absolute -right-1 -top-2">
                                                                <Trophy className="h-3.5 w-3.5 text-primary" />
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[var(--font-base)] font-semibold text-text-secondary">
                                                            {idx + 1}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-[var(--font-base)] font-semibold text-text-primary">
                                                        {entry.name}
                                                    </p>
                                                    <p className="text-[var(--font-base)] text-text-secondary capitalize">
                                                        {entry.role}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-[var(--font-md)] font-bold text-primary">
                                                            {entry.score}
                                                            <span className="text-[var(--font-base)] font-medium text-text-secondary">
                                                                {" "}
                                                                / 100
                                                            </span>
                                                        </span>
                                                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-raised">
                                                            <div
                                                                className="h-full rounded-full bg-primary transition-all"
                                                                style={{
                                                                    width: `${Math.min(entry.score, 100)}%`,
                                                                    opacity:
                                                                        idx ===
                                                                        0
                                                                            ? 1
                                                                            : 0.5 +
                                                                              0.5 *
                                                                                  (1 -
                                                                                      idx /
                                                                                          group
                                                                                              .entries
                                                                                              .length),
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button
                                                        onClick={() =>
                                                            setExpanded(
                                                                expanded ===
                                                                    entry.user_id
                                                                    ? null
                                                                    : entry.user_id,
                                                            )
                                                        }
                                                        className={`rounded-full border px-4 py-1.5 text-[var(--font-base)] font-medium transition-all ${
                                                            expanded ===
                                                            entry.user_id
                                                                ? "border-primary bg-primary text-white"
                                                                : "border-border text-text-secondary hover:bg-surface-raised"
                                                        }`}
                                                    >
                                                        {expanded ===
                                                        entry.user_id
                                                            ? "Tutup"
                                                            : "Breakdown"}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expanded === entry.user_id && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="bg-surface-subtle px-6 py-4"
                                                    >
                                                        <div className="flex flex-col gap-2">
                                                            {entry.breakdown.map(
                                                                (b) => (
                                                                    <div
                                                                        key={
                                                                            b.parameter
                                                                        }
                                                                        className="flex items-center justify-between text-[var(--font-base)]"
                                                                    >
                                                                        <span className="text-text-secondary">
                                                                            {
                                                                                b.parameter
                                                                            }{" "}
                                                                            {b.automatic && (
                                                                                <Badge
                                                                                    variant="info"
                                                                                    className="ml-1"
                                                                                >
                                                                                    Auto
                                                                                </Badge>
                                                                            )}
                                                                        </span>
                                                                        <span className="font-medium text-text-primary">
                                                                            {
                                                                                b.earned
                                                                            }{" "}
                                                                            /{" "}
                                                                            {
                                                                                b.max
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                            {entry.breakdown
                                                                .length ===
                                                                0 && (
                                                                <p className="text-[var(--font-base)] text-text-muted">
                                                                    Belum ada
                                                                    parameter
                                                                    untuk role
                                                                    ini.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {/* Insight Cards */}
                {scores.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {[
                            {
                                label: "Top Scorer",
                                value: `${scores[0]?.name ?? "-"} (${scores[0]?.score ?? 0})`,
                                icon: TrendingUp,
                            },
                            {
                                label: "Total Peserta",
                                value: `${scores.length} Members`,
                                icon: Users,
                            },
                            {
                                label: "Rata-rata Score",
                                value: `${scores.length ? (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1) : 0} pts`,
                                icon: Zap,
                            },
                        ].map((card) => (
                            <div
                                key={card.label}
                                className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-subtle">
                                    <card.icon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-secondary">
                                        {card.label}
                                    </p>
                                    <p className="text-[var(--font-md)] font-bold text-text-primary">
                                        {card.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Config Modal */}
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                <DialogContent size="lg">
                    <DialogHeader>
                        <DialogTitle>Konfigurasi Leaderboard</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="flex flex-col gap-xl">
                        {/* existing parameters */}
                        <div>
                            <p className="mb-sm text-[var(--font-base)] font-medium tracking-wider text-text-muted uppercase">
                                Parameter Aktif
                            </p>
                            <div className="flex flex-col gap-sm">
                                {parameters.length === 0 && (
                                    <p className="text-sm text-text-muted">
                                        Belum ada parameter.
                                    </p>
                                )}
                                {parameters.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between rounded-sm bg-surface-subtle px-3 py-2"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">
                                                {p.name}{" "}
                                                {p.is_automatic && (
                                                    <Badge
                                                        variant="info"
                                                        className="ml-1"
                                                    >
                                                        Auto
                                                    </Badge>
                                                )}
                                            </p>
                                            <p className="text-[var(--font-base)] text-text-muted">
                                                Max {p.max_points} pts ·{" "}
                                                {p.assigned_roles
                                                    .map((r) => roleLabels[r])
                                                    .join(", ")}
                                            </p>
                                        </div>
                                        <Button
                                            size="xs"
                                            variant="danger"
                                            onClick={() => deleteParam(p.id)}
                                        >
                                            Hapus
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* add new parameter */}
                        <div>
                            <p className="mb-sm text-[var(--font-base)] font-medium tracking-wider text-text-muted uppercase">
                                Tambah Parameter Baru
                            </p>
                            <form
                                onSubmit={submitParam}
                                className="flex flex-col gap-md"
                            >
                                <div>
                                    <Label className="mb-1.5 text-text-secondary">
                                        Nama Parameter *
                                    </Label>
                                    <Input
                                        value={paramForm.data.name}
                                        onChange={(e) =>
                                            paramForm.setData(
                                                "name",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Misal: Disiplin Kehadiran"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-md">
                                    <div>
                                        <Label className="mb-1.5 text-text-secondary">
                                            Poin Maks *
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0.1}
                                            step={0.1}
                                            value={paramForm.data.max_points}
                                            onChange={(e) =>
                                                paramForm.setData(
                                                    "max_points",
                                                    parseFloat(e.target.value),
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-1.5 text-text-secondary">
                                            Tipe
                                        </Label>
                                        <Select
                                            value={
                                                paramForm.data.is_automatic
                                                    ? "automatic"
                                                    : "manual"
                                            }
                                            onChange={(e) =>
                                                paramForm.setData(
                                                    "is_automatic",
                                                    e.target.value ===
                                                        "automatic",
                                                )
                                            }
                                        >
                                            <option value="manual">
                                                Manual
                                            </option>
                                            <option value="automatic">
                                                Otomatis
                                            </option>
                                        </Select>
                                    </div>
                                </div>
                                {paramForm.data.is_automatic && (
                                    <div>
                                        <Label className="mb-1.5 text-text-secondary">
                                            Sumber Data *
                                        </Label>
                                        <Select
                                            value={
                                                paramForm.data.automatic_source
                                            }
                                            onChange={(e) =>
                                                paramForm.setData(
                                                    "automatic_source",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">— Pilih —</option>
                                            {automaticSources.map((s) => (
                                                <option
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    {s.label}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                )}
                                <div>
                                    <Label className="mb-1.5 text-text-secondary">
                                        Assign ke Role *
                                    </Label>
                                    <div className="flex flex-wrap gap-sm">
                                        {roleOptions.map((r) => (
                                            <button
                                                type="button"
                                                key={r}
                                                onClick={() =>
                                                    toggleParamRole(r)
                                                }
                                                className={
                                                    paramForm.data.assigned_roles.includes(
                                                        r,
                                                    )
                                                        ? "rounded-xs bg-primary-subtle px-2 py-0.5 text-[var(--font-base)] font-medium text-primary-text"
                                                        : "rounded-xs bg-surface-raised px-2 py-0.5 text-[var(--font-base)] font-medium text-text-secondary"
                                                }
                                            >
                                                {roleLabels[r]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={paramForm.processing}
                                    >
                                        {paramForm.processing
                                            ? "Menyimpan…"
                                            : "Tambah Parameter"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setConfigOpen(false)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Point Entry Modal */}
            <Dialog open={pointOpen} onOpenChange={setPointOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Input Poin Manual</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitPoint}>
                        <DialogBody className="flex flex-col gap-md">
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    User *
                                </Label>
                                <Select
                                    value={pointForm.data.user_id}
                                    onChange={(e) =>
                                        pointForm.setData(
                                            "user_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">— Pilih user —</option>
                                    {manualParamUsers.map((s) => (
                                        <option
                                            key={s.user_id}
                                            value={s.user_id}
                                        >
                                            {s.name} ({roleLabels[s.role]})
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Parameter *
                                </Label>
                                <Select
                                    value={pointForm.data.parameter_id}
                                    onChange={(e) =>
                                        pointForm.setData(
                                            "parameter_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        — Pilih parameter manual —
                                    </option>
                                    {manualParameters.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (max {p.max_points})
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Poin *
                                </Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step={0.1}
                                    value={pointForm.data.points}
                                    onChange={(e) =>
                                        pointForm.setData(
                                            "points",
                                            parseFloat(e.target.value),
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Catatan
                                </Label>
                                <Input
                                    value={pointForm.data.notes}
                                    onChange={(e) =>
                                        pointForm.setData(
                                            "notes",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Opsional..."
                                />
                            </div>
                        </DialogBody>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setPointOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={pointForm.processing}
                            >
                                {pointForm.processing ? "Menyimpan…" : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={deleteParamId !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteParamId(null);
                }}
                title="Hapus Parameter"
                description="Parameter ini akan dihapus permanen. Lanjutkan?"
                onConfirm={confirmDeleteParam}
            />
        </AuthenticatedLayout>
    );
}
