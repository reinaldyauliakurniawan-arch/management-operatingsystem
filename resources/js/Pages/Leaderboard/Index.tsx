import React, { useState } from "react";
import { Trophy, ChevronDown, ChevronUp, Settings, Plus } from "lucide-react";
import { useForm, Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { Badge } from "@/Components/ui/badge";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from "@/Components/ui/dialog";

// ---- Types ----

interface Tier {
    min: number;
    points: number;
}
interface Config {
    weight?: number;
    max_points?: number;
    tiers?: Tier[];
    source?: string;
}
interface Parameter {
    id: number;
    scheme: "tutor" | "management";
    name: string;
    input_type: "per_unit" | "tiered" | "normalized" | "auto";
    config: Config | null;
    sort_order: number;
}
interface BreakdownItem {
    parameter_id: number;
    parameter: string;
    input_type: string;
    points: number;
    is_auto: boolean;
}
interface ScoreRow {
    user_id: number;
    name: string;
    role: string;
    scheme: "tutor" | "management";
    total: number;
    breakdown: BreakdownItem[];
}
interface Member {
    id: number;
    name: string;
    role: string;
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const INPUT_TYPES = [
    { value: "per_unit", label: "Per Unit (jumlah × bobot)" },
    { value: "tiered", label: "Tiered (nilai → poin via bracket)" },
    { value: "normalized", label: "Normalized (% hadir × maks)" },
    { value: "auto", label: "Auto (tarik dari modul)" },
];
const AUTO_SOURCES = [
    { value: "rocks", label: "Rocks completion rate" },
    { value: "scorecard", label: "Scorecard green rate" },
    { value: "events", label: "Event attendance rate" },
    { value: "leadership", label: "Leadership Assessment score" },
];
const SCHEME_LABELS: Record<string, string> = {
    tutor: "Tutor",
    management: "Manajemen",
};

// ---- Tier Editor ----

function TierEditor({
    tiers,
    onChange,
}: {
    tiers: Tier[];
    onChange: (t: Tier[]) => void;
}) {
    const update = (i: number, field: keyof Tier, val: number) => {
        const next = tiers.map((t, idx) =>
            idx === i ? { ...t, [field]: val } : t,
        );
        onChange(next);
    };
    const add = () => onChange([...tiers, { min: 0, points: 0 }]);
    const remove = (i: number) => onChange(tiers.filter((_, idx) => idx !== i));

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[var(--font-sm)] font-medium text-text-muted px-1">
                <span>Nilai minimum (≥)</span>
                <span>Poin</span>
                <span />
            </div>
            {tiers.map((t, i) => (
                <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                >
                    <Input
                        type="number"
                        step="any"
                        value={t.min}
                        onChange={(e) =>
                            update(i, "min", parseFloat(e.target.value) || 0)
                        }
                    />
                    <Input
                        type="number"
                        step="any"
                        value={t.points}
                        onChange={(e) =>
                            update(i, "points", parseFloat(e.target.value) || 0)
                        }
                    />
                    <button
                        type="button"
                        onClick={() => remove(i)}
                        className="text-text-muted hover:text-error-text px-1"
                    >
                        ✕
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={add}
                className="self-start text-[var(--font-sm)] text-primary hover:underline"
            >
                + Tambah bracket
            </button>
        </div>
    );
}

// ---- Config Editor ----

function ConfigEditor({
    inputType,
    config,
    onChange,
}: {
    inputType: string;
    config: Config;
    onChange: (c: Config) => void;
}) {
    if (inputType === "per_unit")
        return (
            <div>
                <Label className="mb-1.5 text-text-secondary">
                    Bobot per unit{" "}
                    <span className="text-text-muted">(negatif = penalti)</span>
                </Label>
                <Input
                    type="number"
                    step="any"
                    value={config.weight ?? 0}
                    onChange={(e) =>
                        onChange({
                            ...config,
                            weight: parseFloat(e.target.value) || 0,
                        })
                    }
                />
            </div>
        );

    if (inputType === "tiered")
        return (
            <div>
                <Label className="mb-1.5 text-text-secondary">
                    Bracket Poin
                </Label>
                <TierEditor
                    tiers={config.tiers ?? []}
                    onChange={(tiers) => onChange({ ...config, tiers })}
                />
            </div>
        );

    if (inputType === "normalized")
        return (
            <div>
                <Label className="mb-1.5 text-text-secondary">
                    Poin Maksimum
                </Label>
                <Input
                    type="number"
                    min={0}
                    step="any"
                    value={config.max_points ?? 0}
                    onChange={(e) =>
                        onChange({
                            ...config,
                            max_points: parseFloat(e.target.value) || 0,
                        })
                    }
                />
            </div>
        );

    if (inputType === "auto")
        return (
            <div className="flex flex-col gap-md">
                <div>
                    <Label className="mb-1.5 text-text-secondary">
                        Sumber Data
                    </Label>
                    <Select
                        value={config.source ?? ""}
                        onChange={(e) =>
                            onChange({ ...config, source: e.target.value })
                        }
                    >
                        <option value="">— Pilih —</option>
                        {AUTO_SOURCES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <div>
                    <Label className="mb-1.5 text-text-secondary">
                        Bracket Poin{" "}
                        <span className="text-text-muted">
                            (dari persentase 0–100)
                        </span>
                    </Label>
                    <TierEditor
                        tiers={config.tiers ?? []}
                        onChange={(tiers) => onChange({ ...config, tiers })}
                    />
                </div>
            </div>
        );

    return null;
}

// ---- Param Row ----

function ParamRow({
    param,
    onEdit,
    onDelete,
}: {
    param: Parameter;
    onEdit: (p: Parameter) => void;
    onDelete: (id: number) => void;
}) {
    const configSummary = () => {
        const c = param.config;
        if (!c) return "—";
        if (param.input_type === "per_unit") return `bobot: ${c.weight}`;
        if (param.input_type === "normalized")
            return `maks: ${c.max_points} poin`;
        if (param.input_type === "tiered")
            return `${c.tiers?.length ?? 0} bracket`;
        if (param.input_type === "auto") return `auto: ${c.source}`;
        return "—";
    };

    return (
        <div className="flex items-center justify-between rounded-sm bg-surface-subtle px-3 py-2.5">
            <div>
                <p className="text-sm font-medium text-text-primary">
                    {param.name}
                </p>
                <p className="text-[var(--font-sm)] text-text-muted">
                    {
                        INPUT_TYPES.find((t) => t.value === param.input_type)
                            ?.label
                    }{" "}
                    · {configSummary()}
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => onEdit(param)}
                >
                    Edit
                </Button>
                <Button
                    size="xs"
                    variant="danger"
                    onClick={() => onDelete(param.id)}
                >
                    Hapus
                </Button>
            </div>
        </div>
    );
}

// ---- Main Page ----

export default function LeaderboardIndex({
    scores,
    parameters,
    members,
    filters,
}: {
    scores: ScoreRow[];
    parameters: Parameter[];
    members: Member[];
    filters: { year: number; quarter: string };
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";

    const [quarter, setQuarter] = useState(filters.quarter);
    const [year, setYear] = useState(String(filters.year));
    const [expanded, setExpanded] = useState<number | null>(null);

    // modals
    const [configOpen, setConfigOpen] = useState(false);
    const [entryOpen, setEntryOpen] = useState(false);
    const [editParam, setEditParam] = useState<Parameter | null>(null);
    const [deleteParamId, setDeleteParamId] = useState<number | null>(null);
    const [recalcOpen, setRecalcOpen] = useState(false);

    // new param form state
    const [newScheme, setNewScheme] = useState<"tutor" | "management">(
        "management",
    );
    const [newName, setNewName] = useState("");
    const [newInputType, setNewInputType] = useState("per_unit");
    const [newConfig, setNewConfig] = useState<Config>({ weight: 0 });
    const [paramSaving, setParamSaving] = useState(false);

    // edit param state mirrors
    const [editInputType, setEditInputType] = useState("per_unit");
    const [editConfig, setEditConfig] = useState<Config>({});
    const [editName, setEditName] = useState("");

    const entryForm = useForm({
        parameter_id: "",
        user_id: "",
        quarter: filters.quarter,
        year: String(filters.year),
        raw_value: "",
        notes: "",
    });

    const applyFilter = () => {
        router.get(
            route("leaderboard.index"),
            { quarter, year },
            { preserveState: true },
        );
    };

    const openEdit = (p: Parameter) => {
        setEditParam(p);
        setEditName(p.name);
        setEditInputType(p.input_type);
        setEditConfig(p.config ?? {});
    };

    const saveEdit = () => {
        if (!editParam) return;
        router.patch(
            route("leaderboard.parameters.update", editParam.id),
            {
                name: editName,
                input_type: editInputType,
                config: editConfig as any,
            },
            { preserveScroll: true, onSuccess: () => setEditParam(null) },
        );
    };

    const saveNew = () => {
        setParamSaving(true);
        router.post(
            route("leaderboard.parameters.store"),
            {
                scheme: newScheme,
                name: newName,
                input_type: newInputType,
                config: newConfig as any,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewName("");
                    setNewConfig({ weight: 0 });
                    setParamSaving(false);
                },
                onError: () => setParamSaving(false),
            },
        );
    };

    const confirmDelete = () => {
        if (!deleteParamId) return;
        router.delete(route("leaderboard.parameters.destroy", deleteParamId), {
            preserveScroll: true,
            onFinish: () => setDeleteParamId(null),
        });
    };

    const submitEntry = (e: React.FormEvent) => {
        e.preventDefault();
        entryForm.post(route("leaderboard.entries.store"), {
            preserveScroll: true,
            onSuccess: () => {
                entryForm.reset();
                setEntryOpen(false);
            },
        });
    };

    const doRecalc = () => {
        router.post(
            route("leaderboard.recalculate"),
            { quarter, year },
            {
                preserveScroll: true,
                onFinish: () => setRecalcOpen(false),
            },
        );
    };

    // Group by scheme
    const tutorScores = scores.filter((s) => s.scheme === "tutor");
    const mgmtScores = scores.filter((s) => s.scheme === "management");

    const SchemeTable = ({
        rows,
        label,
    }: {
        rows: ScoreRow[];
        label: string;
    }) => {
        if (rows.length === 0) return null;
        return (
            <div>
                <h2 className="mb-3 text-[var(--font-md)] font-semibold text-text-primary">
                    Leaderboard {label}
                </h2>
                <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-surface-subtle">
                                <th className="px-5 py-3.5 text-left text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-secondary w-16">
                                    #
                                </th>
                                <th className="px-5 py-3.5 text-left text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-secondary">
                                    Nama
                                </th>
                                <th className="px-5 py-3.5 text-right text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-secondary">
                                    Total Poin
                                </th>
                                <th className="px-5 py-3.5 w-28" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rows.map((row, idx) => (
                                <React.Fragment key={row.user_id}>
                                    <tr className="transition-colors hover:bg-surface-subtle">
                                        <td className="px-5 py-4">
                                            {idx === 0 ? (
                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                                                    1
                                                    <Trophy className="absolute ml-3 -mt-3 h-3 w-3 text-primary" />
                                                </span>
                                            ) : (
                                                <span className="text-sm font-semibold text-text-secondary">
                                                    {idx + 1}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold text-text-primary">
                                                {row.name}
                                            </p>
                                            <p className="text-[var(--font-sm)] text-text-muted capitalize">
                                                {row.role}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="text-[var(--font-md)] font-bold text-primary">
                                                {row.total.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() =>
                                                    setExpanded(
                                                        expanded === row.user_id
                                                            ? null
                                                            : row.user_id,
                                                    )
                                                }
                                                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[var(--font-sm)] font-medium text-text-secondary hover:bg-surface-raised"
                                            >
                                                {expanded === row.user_id ? (
                                                    <>
                                                        <ChevronUp className="h-3 w-3" />{" "}
                                                        Tutup
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="h-3 w-3" />{" "}
                                                        Detail
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                    {expanded === row.user_id && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="bg-surface-subtle px-5 py-4"
                                            >
                                                <div className="flex flex-col gap-1.5">
                                                    {row.breakdown.map((b) => (
                                                        <div
                                                            key={b.parameter_id}
                                                            className="flex items-center justify-between text-sm"
                                                        >
                                                            <span className="text-text-secondary">
                                                                {b.parameter}
                                                                {b.is_auto && (
                                                                    <Badge
                                                                        variant="info"
                                                                        className="ml-1.5"
                                                                    >
                                                                        Auto
                                                                    </Badge>
                                                                )}
                                                            </span>
                                                            <span
                                                                className={`font-semibold ${b.points < 0 ? "text-error-text" : "text-text-primary"}`}
                                                            >
                                                                {b.points >= 0
                                                                    ? "+"
                                                                    : ""}
                                                                {b.points.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
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
        );
    };

    const tutorParams = parameters.filter((p) => p.scheme === "tutor");
    const mgmtParams = parameters.filter((p) => p.scheme === "management");

    return (
        <AuthenticatedLayout>
            <Head title="Leaderboard" />

            <PageHeader
                title="Leaderboard"
                subtitle={`${quarter} ${year}`}
                action={
                    isLeader && (
                        <div className="flex gap-sm">
                            <Button
                                variant="secondary"
                                onClick={() => setEntryOpen(true)}
                            >
                                <Plus className="h-4 w-4" /> Input Poin
                            </Button>
                            <Button onClick={() => setConfigOpen(true)}>
                                <Settings className="h-4 w-4" /> Konfigurasi
                            </Button>
                        </div>
                    )
                }
            />

            {/* Filter */}
            <div className="mb-xl flex flex-wrap items-end gap-4">
                <div className="flex bg-surface-subtle p-1 rounded-full border border-border gap-1">
                    {QUARTERS.map((q) => (
                        <button
                            key={q}
                            type="button"
                            onClick={() => setQuarter(q)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                quarter === q
                                    ? "bg-surface shadow-sm border border-border text-primary font-semibold"
                                    : "text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            {q}
                        </button>
                    ))}
                </div>
                <div className="flex items-end gap-2">
                    <div>
                        <Label className="mb-1 text-text-secondary">
                            Tahun
                        </Label>
                        <Input
                            type="number"
                            value={year}
                            min={2020}
                            max={2099}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-28"
                        />
                    </div>
                    <Button onClick={applyFilter}>Tampilkan</Button>
                    {isLeader && (
                        <Button
                            variant="secondary"
                            onClick={() => setRecalcOpen(true)}
                        >
                            Recalculate
                        </Button>
                    )}
                </div>
            </div>

            {/* Tables */}
            <div className="flex flex-col gap-xl">
                {scores.length === 0 && (
                    <div className="rounded-lg border border-border bg-surface py-16 text-center text-text-muted">
                        Belum ada data untuk {quarter} {year}.
                        {isLeader &&
                            " Input poin atau tambah parameter di Konfigurasi."}
                    </div>
                )}
                <SchemeTable rows={tutorScores} label="Tutor" />
                <SchemeTable rows={mgmtScores} label="Manajemen" />
            </div>

            {/* === Config Modal === */}
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                <DialogContent size="lg">
                    <DialogHeader>
                        <DialogTitle>Konfigurasi Parameter</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="flex flex-col gap-xl">
                        {/* Tutor params */}
                        <div>
                            <p className="mb-sm text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-muted">
                                Skema Tutor
                            </p>
                            <div className="flex flex-col gap-sm">
                                {tutorParams.length === 0 && (
                                    <p className="text-sm text-text-muted">
                                        Belum ada.
                                    </p>
                                )}
                                {tutorParams.map((p) => (
                                    <ParamRow
                                        key={p.id}
                                        param={p}
                                        onEdit={openEdit}
                                        onDelete={setDeleteParamId}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Management params */}
                        <div>
                            <p className="mb-sm text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-muted">
                                Skema Manajemen
                            </p>
                            <div className="flex flex-col gap-sm">
                                {mgmtParams.length === 0 && (
                                    <p className="text-sm text-text-muted">
                                        Belum ada.
                                    </p>
                                )}
                                {mgmtParams.map((p) => (
                                    <ParamRow
                                        key={p.id}
                                        param={p}
                                        onEdit={openEdit}
                                        onDelete={setDeleteParamId}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Add new */}
                        <div className="border-t border-border pt-xl">
                            <p className="mb-sm text-[var(--font-sm)] font-semibold uppercase tracking-widest text-text-muted">
                                Tambah Parameter Baru
                            </p>
                            <div className="flex flex-col gap-md">
                                <div className="grid grid-cols-2 gap-md">
                                    <div>
                                        <Label className="mb-1.5 text-text-secondary">
                                            Skema
                                        </Label>
                                        <Select
                                            value={newScheme}
                                            onChange={(e) =>
                                                setNewScheme(
                                                    e.target.value as any,
                                                )
                                            }
                                        >
                                            <option value="management">
                                                Manajemen
                                            </option>
                                            <option value="tutor">Tutor</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="mb-1.5 text-text-secondary">
                                            Nama Parameter
                                        </Label>
                                        <Input
                                            value={newName}
                                            onChange={(e) =>
                                                setNewName(e.target.value)
                                            }
                                            placeholder="Misal: Kehadiran Rapat"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="mb-1.5 text-text-secondary">
                                        Tipe Input
                                    </Label>
                                    <Select
                                        value={newInputType}
                                        onChange={(e) => {
                                            setNewInputType(e.target.value);
                                            setNewConfig({});
                                        }}
                                    >
                                        {INPUT_TYPES.map((t) => (
                                            <option
                                                key={t.value}
                                                value={t.value}
                                            >
                                                {t.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <ConfigEditor
                                    inputType={newInputType}
                                    config={newConfig}
                                    onChange={setNewConfig}
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={saveNew}
                                        disabled={
                                            paramSaving || !newName.trim()
                                        }
                                    >
                                        {paramSaving
                                            ? "Menyimpan…"
                                            : "Tambah Parameter"}
                                    </Button>
                                </div>
                            </div>
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

            {/* === Edit Param Modal === */}
            <Dialog
                open={!!editParam}
                onOpenChange={(open) => !open && setEditParam(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Edit Parameter</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="flex flex-col gap-md">
                        <div>
                            <Label className="mb-1.5 text-text-secondary">
                                Nama
                            </Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="mb-1.5 text-text-secondary">
                                Tipe Input
                            </Label>
                            <Select
                                value={editInputType}
                                onChange={(e) => {
                                    setEditInputType(e.target.value);
                                    setEditConfig({});
                                }}
                            >
                                {INPUT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <ConfigEditor
                            inputType={editInputType}
                            config={editConfig}
                            onChange={setEditConfig}
                        />
                        <p className="text-[var(--font-sm)] text-text-muted">
                            Perubahan hanya berlaku untuk entry baru. Entry lama
                            tidak terpengaruh kecuali lo trigger Recalculate.
                        </p>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditParam(null)}
                        >
                            Batal
                        </Button>
                        <Button onClick={saveEdit}>Simpan Perubahan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* === Input Poin Modal === */}
            <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Input Poin</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEntry}>
                        <DialogBody className="flex flex-col gap-md">
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Kuartal & Tahun
                                </Label>
                                <div className="grid grid-cols-2 gap-sm">
                                    <Select
                                        value={entryForm.data.quarter}
                                        onChange={(e) =>
                                            entryForm.setData(
                                                "quarter",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {QUARTERS.map((q) => (
                                            <option key={q} value={q}>
                                                {q}
                                            </option>
                                        ))}
                                    </Select>
                                    <Input
                                        type="number"
                                        min={2020}
                                        max={2099}
                                        value={entryForm.data.year}
                                        onChange={(e) =>
                                            entryForm.setData(
                                                "year",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    User
                                </Label>
                                <Select
                                    value={entryForm.data.user_id}
                                    onChange={(e) =>
                                        entryForm.setData(
                                            "user_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">— Pilih user —</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.role})
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Parameter
                                </Label>
                                <Select
                                    value={entryForm.data.parameter_id}
                                    onChange={(e) =>
                                        entryForm.setData(
                                            "parameter_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        — Pilih parameter —
                                    </option>
                                    {parameters
                                        .filter((p) => p.input_type !== "auto")
                                        .map((p) => (
                                            <option key={p.id} value={p.id}>
                                                [{SCHEME_LABELS[p.scheme]}]{" "}
                                                {p.name}
                                            </option>
                                        ))}
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Nilai Mentah
                                    <span className="ml-1 text-text-muted text-[var(--font-sm)]">
                                        (jumlah sesi / skor TOEFL / persentase —
                                        sistem hitung poinnya)
                                    </span>
                                </Label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={entryForm.data.raw_value}
                                    onChange={(e) =>
                                        entryForm.setData(
                                            "raw_value",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Catatan
                                </Label>
                                <Input
                                    value={entryForm.data.notes}
                                    onChange={(e) =>
                                        entryForm.setData(
                                            "notes",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Opsional"
                                />
                            </div>
                        </DialogBody>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setEntryOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={entryForm.processing}
                            >
                                {entryForm.processing ? "Menyimpan…" : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* === Confirm Delete Param === */}
            <ConfirmDialog
                open={deleteParamId !== null}
                onOpenChange={(open) => !open && setDeleteParamId(null)}
                title="Hapus Parameter"
                description="Parameter ini dihapus permanen. Entry lama tetap ada tapi tidak terhitung lagi. Lanjutkan?"
                onConfirm={confirmDelete}
            />

            {/* === Confirm Recalculate === */}
            <ConfirmDialog
                open={recalcOpen}
                onOpenChange={setRecalcOpen}
                title={`Recalculate ${quarter} ${year}`}
                description={`Semua entry ${quarter} ${year} akan dihitung ulang dengan config parameter terbaru. Entry lama akan dioverride. Tidak bisa dibatalkan.`}
                onConfirm={doRecalc}
            />
        </AuthenticatedLayout>
    );
}
