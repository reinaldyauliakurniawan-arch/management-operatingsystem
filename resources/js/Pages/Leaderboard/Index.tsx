import { useState } from "react";
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
            { date_from: dateFrom || undefined, date_to: dateTo || undefined },
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

    const grouped = roleOptions
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
            <Card className="mb-xl p-0">
                <CardContent className="flex flex-wrap items-end gap-md py-md">
                    <div>
                        <Label className="mb-1.5 text-text-secondary">
                            Dari
                        </Label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="mb-1.5 text-text-secondary">
                            Sampai
                        </Label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" onClick={applyFilter}>
                        Filter
                    </Button>
                </CardContent>
            </Card>

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
                        <h2 className="mb-md text-[14px] font-semibold tracking-tight text-text-primary">
                            {roleLabels[group.role]}
                        </h2>
                        <Card className="p-0">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                #
                                            </TableHead>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.entries.map((entry, idx) => (
                                            <>
                                                <TableRow key={entry.user_id}>
                                                    <TableCell className="text-text-secondary">
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-text-primary">
                                                        {entry.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-[16px] font-semibold tracking-tight text-primary-text">
                                                            {entry.score}
                                                        </span>
                                                        <span className="ml-1 text-text-muted">
                                                            / 100
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setExpanded(
                                                                    expanded ===
                                                                        entry.user_id
                                                                        ? null
                                                                        : entry.user_id,
                                                                )
                                                            }
                                                        >
                                                            {expanded ===
                                                            entry.user_id
                                                                ? "Tutup"
                                                                : "Breakdown"}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                {expanded === entry.user_id && (
                                                    <TableRow
                                                        key={`${entry.user_id}-detail`}
                                                    >
                                                        <TableCell
                                                            colSpan={4}
                                                            className="bg-surface-subtle"
                                                        >
                                                            <div className="flex flex-col gap-sm">
                                                                {entry.breakdown.map(
                                                                    (b) => (
                                                                        <div
                                                                            key={
                                                                                b.parameter
                                                                            }
                                                                            className="flex items-center justify-between"
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
                                                                    <p className="text-text-muted">
                                                                        Belum
                                                                        ada
                                                                        parameter
                                                                        untuk
                                                                        role
                                                                        ini.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                ))}
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
                            <p className="mb-sm text-[12px] font-medium tracking-wider text-text-muted uppercase">
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
                                            <p className="text-[12px] text-text-muted">
                                                Max {p.max_points} pts ·{" "}
                                                {p.assigned_roles
                                                    .map((r) => roleLabels[r])
                                                    .join(", ")}
                                            </p>
                                        </div>
                                        <Button
                                            size="xs"
                                            variant="destructive"
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
                            <p className="mb-sm text-[12px] font-medium tracking-wider text-text-muted uppercase">
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
                                        <select
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
                                            className="w-full rounded-sm border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/12"
                                        >
                                            <option value="manual">
                                                Manual
                                            </option>
                                            <option value="automatic">
                                                Otomatis
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                {paramForm.data.is_automatic && (
                                    <div>
                                        <Label className="mb-1.5 text-text-secondary">
                                            Sumber Data *
                                        </Label>
                                        <select
                                            value={
                                                paramForm.data.automatic_source
                                            }
                                            onChange={(e) =>
                                                paramForm.setData(
                                                    "automatic_source",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-sm border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/12"
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
                                        </select>
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
                                                        ? "rounded-xs bg-primary-subtle px-2 py-0.5 text-[12px] font-medium text-primary-text"
                                                        : "rounded-xs bg-surface-raised px-2 py-0.5 text-[12px] font-medium text-text-secondary"
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
                                <select
                                    value={pointForm.data.user_id}
                                    onChange={(e) =>
                                        pointForm.setData(
                                            "user_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-sm border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/12"
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
                                </select>
                            </div>
                            <div>
                                <Label className="mb-1.5 text-text-secondary">
                                    Parameter *
                                </Label>
                                <select
                                    value={pointForm.data.parameter_id}
                                    onChange={(e) =>
                                        pointForm.setData(
                                            "parameter_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-sm border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/12"
                                >
                                    <option value="">
                                        — Pilih parameter manual —
                                    </option>
                                    {manualParameters.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (max {p.max_points})
                                        </option>
                                    ))}
                                </select>
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
