import React, { useState } from "react";
import { useForm, Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
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
import { Settings } from "lucide-react";

interface User {
    id: number;
    name: string;
}
interface Metric {
    id: number;
    title: string;
    owner: { id: number; name: string };
    goal_value: number;
    comparison_operator: string;
    frequency: string;
    scores: {
        week_start_date: string;
        actual_value: number;
        status: "green" | "yellow" | "red";
    }[];
}

function StatusDot({ status }: { status: string }) {
    const cls: Record<string, string> = {
        green: "bg-success",
        yellow: "bg-warning",
        red: "bg-error",
    };
    return (
        <span
            className={`inline-block size-2 rounded-full ${cls[status] ?? "bg-text-muted"}`}
            title={status}
        />
    );
}

function statusCellClass(status?: string) {
    if (status === "green") return "bg-success-subtle";
    if (status === "red") return "bg-error-subtle";
    if (status === "yellow") return "bg-warning-subtle";
    return "";
}

function ScoreInput({
    defaultValue,
    status,
    onCommit,
}: {
    defaultValue: number | string;
    status?: string;
    onCommit: (val: string) => void;
}) {
    const [val, setVal] = React.useState(String(defaultValue));
    React.useEffect(() => {
        setVal(String(defaultValue));
    }, [defaultValue]);
    return (
        <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => onCommit(val)}
            className={`h-8 w-20 rounded-sm border border-border text-center text-sm text-text-primary outline-none transition-colors focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12 ${statusCellClass(status) || "bg-surface-raised"}`}
        />
    );
}

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function ScorecardIndex({
    metrics,
    users,
    weeks,
    filters,
    scorecardSettings,
}: {
    metrics: { data: Metric[] };
    users: User[];
    weeks: string[];
    filters: { quarter: number };
    scorecardSettings: { q1_start_date: string; scorecard_day: number };
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const isOrgAdmin = auth.isOrgAdmin;
    const canManageSettings = isLeader || isOrgAdmin;
    const userId = auth.user.id;
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteMetricId, setDeleteMetricId] = useState<number | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const settingsForm = useForm({
        q1_start_date: scorecardSettings.q1_start_date,
        scorecard_day: String(scorecardSettings.scorecard_day),
    });

    const submitSettings = (e: React.FormEvent) => {
        e.preventDefault();
        settingsForm.patch(route("scorecard.settings"), {
            onSuccess: () => setSettingsOpen(false),
        });
    };

    const goToPeriod = (quarter: number) => {
        router.get(
            route("scorecard.index"),
            { quarter },
            { preserveState: true },
        );
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        title: "",
        owner_id: users[0]?.id ? String(users[0].id) : "",
        goal_value: "",
        comparison_operator: ">=",
        frequency: "weekly",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("scorecard.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                reset();
            },
        });
    };

    const logScore = (metricId: number, week: string, value: string) => {
        if (value === "") return;
        router.post(
            route("scorecard.log"),
            { metric_id: metricId, week_start_date: week, actual_value: value },
            { preserveScroll: true },
        );
    };

    const deleteMetric = (id: number) => {
        router.delete(route("scorecard.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDeleteMetricId(null),
        });
    };

    const quarterWeeks = weeks;

    const formatWeek = (w: string) => {
        const d = new Date(w + "T00:00:00");
        return d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
        });
    };

    // PRD: member/tutor hanya bisa input metric milik sendiri
    const canInputMetric = (metric: Metric) =>
        isLeader || metric.owner.id === userId;

    const metricList = metrics.data;

    return (
        <AuthenticatedLayout>
            <Head title="Scorecard" />

            <PageHeader
                title="Scorecard"
                subtitle="Weekly measurables tim"
                action={
                    <div className="flex items-center gap-sm">
                        <Select
                            value={String(filters.quarter)}
                            onChange={(e) =>
                                goToPeriod(parseInt(e.target.value))
                            }
                            className="h-9 w-auto"
                        >
                            <option value={1}>Q1</option>
                            <option value={2}>Q2</option>
                            <option value={3}>Q3</option>
                            <option value={4}>Q4</option>
                        </Select>
                        {isLeader && (
                            <Button onClick={() => setCreateOpen(true)}>
                                + Tambah Metric
                            </Button>
                        )}
                        {canManageSettings && (
                            <button
                                onClick={() => setSettingsOpen(true)}
                                className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
                                title="Scorecard Settings"
                            >
                                <Settings className="size-4" />
                            </button>
                        )}
                    </div>
                }
            />

            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 z-10 min-w-[180px] bg-surface-subtle whitespace-nowrap">
                            Metric
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                            Owner
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                            Goal
                        </TableHead>
                        {quarterWeeks.map((w) => (
                            <TableHead
                                key={w}
                                className="min-w-[90px] whitespace-nowrap text-center"
                            >
                                {formatWeek(w)}
                            </TableHead>
                        ))}
                        {isLeader && <TableHead className="w-[60px]" />}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {metricList.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={
                                    3 + quarterWeeks.length + (isLeader ? 1 : 0)
                                }
                            >
                                <EmptyState
                                    title="Belum ada metric"
                                    description={
                                        isLeader
                                            ? "Tambah metric pertama untuk team ini."
                                            : "Belum ada metric yang ditambahkan untuk team ini."
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    )}
                    {metricList.map((metric) => (
                        <TableRow key={metric.id}>
                            <TableCell className="sticky left-0 z-10 bg-surface">
                                <p className="text-[13px] font-medium text-text-primary">
                                    {metric.title}
                                </p>
                                <p className="mt-0.5 text-[var(--font-sm)] text-text-muted capitalize">
                                    {metric.frequency}
                                </p>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-text-secondary">
                                {metric.owner.name}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-text-secondary">
                                {metric.comparison_operator} {metric.goal_value}
                            </TableCell>
                            {quarterWeeks.map((w) => {
                                const score = metric.scores.find(
                                    (s) => s.week_start_date === w,
                                );
                                const canInput = canInputMetric(metric);
                                return (
                                    <TableCell key={w} className="text-center">
                                        {canInput ? (
                                            <ScoreInput
                                                defaultValue={
                                                    score?.actual_value ?? ""
                                                }
                                                status={score?.status}
                                                onCommit={(val) =>
                                                    logScore(metric.id, w, val)
                                                }
                                            />
                                        ) : score ? (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-sm text-text-primary ${statusCellClass(score.status)}`}
                                            >
                                                <StatusDot
                                                    status={score.status}
                                                />{" "}
                                                {score.actual_value}
                                            </span>
                                        ) : (
                                            <span className="text-border-strong">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                );
                            })}
                            {isLeader && (
                                <TableCell>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() =>
                                            setDeleteMetricId(metric.id)
                                        }
                                    >
                                        Hapus
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Tambah Metric</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="scorecard-form"
                            onSubmit={submit}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="metric-title">
                                    Nama Metric *
                                </Label>
                                <Input
                                    id="metric-title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                    placeholder="Contoh: Weekly Revenue"
                                    aria-invalid={!!errors.title}
                                    required
                                />
                                {errors.title && (
                                    <p className="text-[var(--font-base)] text-error-text">
                                        {errors.title}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="metric-goal">
                                        Goal Value *
                                    </Label>
                                    <Input
                                        id="metric-goal"
                                        type="number"
                                        value={data.goal_value}
                                        onChange={(e) =>
                                            setData(
                                                "goal_value",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="50000"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="metric-operator">
                                        Operator *
                                    </Label>
                                    <Select
                                        id="metric-operator"
                                        value={data.comparison_operator}
                                        onChange={(e) =>
                                            setData(
                                                "comparison_operator",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value=">=">≥ (min)</option>
                                        <option value="<=">≤ (maks)</option>
                                        <option value="==">= (tepat)</option>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="metric-owner">
                                        Owner *
                                    </Label>
                                    <Select
                                        id="metric-owner"
                                        value={data.owner_id}
                                        onChange={(e) =>
                                            setData("owner_id", e.target.value)
                                        }
                                    >
                                        {users.map((u) => (
                                            <option
                                                key={u.id}
                                                value={String(u.id)}
                                            >
                                                {u.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="metric-frequency">
                                        Frekuensi
                                    </Label>
                                    <Select
                                        id="metric-frequency"
                                        value={data.frequency}
                                        onChange={(e) =>
                                            setData("frequency", e.target.value)
                                        }
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </Select>
                                </div>
                            </div>
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
                            form="scorecard-form"
                            disabled={processing || users.length === 0}
                        >
                            {processing ? "Menyimpan…" : "Simpan Metric"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Scorecard Settings */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Scorecard Settings</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="scorecard-settings-form"
                            onSubmit={submitSettings}
                            className="flex flex-col gap-md"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>Q1 Start Date *</Label>
                                <Input
                                    type="date"
                                    value={settingsForm.data.q1_start_date}
                                    onChange={(e) =>
                                        settingsForm.setData(
                                            "q1_start_date",
                                            e.target.value,
                                        )
                                    }
                                    aria-invalid={
                                        !!settingsForm.errors.q1_start_date
                                    }
                                />
                                <p className="text-[13px] text-text-muted">
                                    Tanggal mulai Q1. Q2/Q3/Q4 dihitung otomatis
                                    per 13 minggu.
                                </p>
                                {settingsForm.errors.q1_start_date && (
                                    <p className="text-[var(--font-base)] text-error-text">
                                        {settingsForm.errors.q1_start_date}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Hari Evaluasi Scorecard *</Label>
                                <Select
                                    value={settingsForm.data.scorecard_day}
                                    onChange={(e) =>
                                        settingsForm.setData(
                                            "scorecard_day",
                                            e.target.value,
                                        )
                                    }
                                >
                                    {DAYS.map((d, i) => (
                                        <option key={i} value={i}>
                                            {d}
                                        </option>
                                    ))}
                                </Select>
                                <p className="text-[13px] text-text-muted">
                                    Header kolom tabel akan menyesuaikan hari
                                    ini.
                                </p>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setSettingsOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="scorecard-settings-form"
                            disabled={settingsForm.processing}
                        >
                            {settingsForm.processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteMetricId !== null}
                onOpenChange={(open) => !open && setDeleteMetricId(null)}
                title="Hapus Metric"
                description="Metric ini akan dihapus/archived. Data historis tetap tersimpan."
                onConfirm={() => deleteMetricId && deleteMetric(deleteMetricId)}
            />
        </AuthenticatedLayout>
    );
}
