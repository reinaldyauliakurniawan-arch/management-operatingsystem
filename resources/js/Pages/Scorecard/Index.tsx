import { useState } from "react";
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
        green: "bg-[#1a5c41]",
        yellow: "bg-[#78350f]",
        red: "bg-[#991b1b]",
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

export default function ScorecardIndex({
    metrics,
    users,
    weeks,
    filters,
}: {
    metrics: { data: Metric[] };
    users: User[];
    weeks: string[];
    filters: { year: number; quarter: number };
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const userId = auth.user.id;
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteMetricId, setDeleteMetricId] = useState<number | null>(null);

    const goToPeriod = (year: number, quarter: number) => {
        router.get(
            route("scorecard.index"),
            { year, quarter },
            { preserveState: true },
        );
    };

    const yearOptions = [filters.year - 1, filters.year, filters.year + 1];

    const { data, setData, post, processing, reset, errors } = useForm({
        title: "",
        owner_id: users[0]?.id || "",
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
                            value={filters.quarter}
                            onChange={(e) =>
                                goToPeriod(
                                    filters.year,
                                    parseInt(e.target.value),
                                )
                            }
                            className="h-9 w-auto"
                        >
                            <option value={1}>Q1</option>
                            <option value={2}>Q2</option>
                            <option value={3}>Q3</option>
                            <option value={4}>Q4</option>
                        </Select>
                        <Select
                            value={filters.year}
                            onChange={(e) =>
                                goToPeriod(
                                    parseInt(e.target.value),
                                    filters.quarter,
                                )
                            }
                            className="h-9 w-auto"
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </Select>
                        {isLeader && (
                            <Button onClick={() => setCreateOpen(true)}>
                                + Tambah Metric
                            </Button>
                        )}
                    </div>
                }
            />

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
                                <p className="mt-0.5 text-[11px] text-text-muted capitalize">
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
                                            <input
                                                type="number"
                                                defaultValue={
                                                    score?.actual_value ?? ""
                                                }
                                                onBlur={(e) =>
                                                    logScore(
                                                        metric.id,
                                                        w,
                                                        e.target.value,
                                                    )
                                                }
                                                className={`h-8 w-20 rounded-sm border border-border text-center text-sm text-text-primary outline-none transition-colors focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12 ${statusCellClass(score?.status) || "bg-surface-raised"}`}
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
                                        variant="destructive"
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

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Tambah Metric</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
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
                                    <p className="text-[12px] text-error-text">
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
                                            <option key={u.id} value={u.id}>
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
                        <Button onClick={submit} disabled={processing}>
                            {processing ? "Menyimpan…" : "Simpan Metric"}
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
