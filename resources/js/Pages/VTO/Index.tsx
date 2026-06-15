import { useState, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
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
import { Textarea } from "@/Components/ui/textarea";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { cn } from "@/Lib/utils";
import {
    Award,
    Crosshair,
    Flag,
    Megaphone,
    LayoutGrid,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Plus,
    Trash2,
    ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VTO {
    id: number;
    core_values: string[];
    core_focus_purpose: string | null;
    core_focus_niche: string | null;
    ten_year_target: string | null;
    target_market: string | null;
    three_uniques: string | null;
    proven_process: string | null;
    guarantee: string | null;
    three_year_date: string | null;
    three_year_revenue: string | null;
    three_year_profit: string | null;
    three_year_measurables: string | null;
    three_year_look: string[];
    one_year_date: string | null;
    one_year_revenue: string | null;
    one_year_profit: string | null;
    one_year_measurables: string | null;
    one_year_goals: string[];
}

type Tab = "vision" | "traction";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayValue(value: string | number | null | undefined): string {
    if (value == null || value === "") return "—";
    return String(value);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GlassCard({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "rounded-[18px] border border-border bg-surface overflow-hidden",
                className,
            )}
        >
            {children}
        </div>
    );
}

function SectionTitle({
    icon: Icon,
    title,
}: {
    icon: React.ElementType;
    title: string;
}) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[18px] font-semibold leading-6 text-primary">
                {title}
            </h3>
            <Icon className="size-4 text-text-muted ml-auto" />
        </div>
    );
}

function Empty({ canEdit }: { canEdit: boolean }) {
    return (
        <p className="text-[13px] italic text-text-muted">
            Belum diisi.{canEdit && " Klik Edit untuk menambahkan."}
        </p>
    );
}

function MetricBar({
    revenue,
    profit,
    measurables,
    measurablesLabel,
    date,
}: {
    revenue: string | null;
    profit: string | null;
    measurables: string | null | undefined;
    measurablesLabel?: string;
    date: string | null;
}) {
    return (
        <div className="flex flex-wrap items-center gap-6 mb-6 pb-6 border-b border-border">
            {date && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
                        Target
                    </p>
                    <p className="text-[14px] font-semibold text-text-primary">
                        {formatDate(date)}
                    </p>
                </div>
            )}
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
                    Revenue
                </p>
                <p className="text-[18px] font-bold text-text-primary">
                    {displayValue(revenue)}
                </p>
            </div>
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
                    Profit
                </p>
                <p className="text-[18px] font-bold text-text-primary">
                    {displayValue(profit)}
                </p>
            </div>
            {measurables != null && measurables !== "" && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
                        {measurablesLabel ?? "Measurables"}
                    </p>
                    <div className="flex flex-col gap-0.5">
                        {String(measurables)
                            .split(",")
                            .map((m, i) => (
                                <p
                                    key={i}
                                    className="text-[18px] font-bold text-text-primary"
                                >
                                    {m.trim()}
                                </p>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Array field editor (for core_values, three_year_look, one_year_goals) ───

function ArrayFieldEditor({
    value,
    onChange,
    placeholder,
}: {
    value: string[];
    onChange: (v: string[]) => void;
    placeholder?: string;
}) {
    const update = (i: number, v: string) => {
        const next = [...value];
        next[i] = v;
        onChange(next);
    };
    const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
    const add = () => onChange([...value, ""]);

    return (
        <div className="flex flex-col gap-2">
            {value.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input
                        value={item}
                        onChange={(e) => update(i, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1"
                    />
                    <button
                        type="button"
                        onClick={() => remove(i)}
                        className="text-text-muted hover:text-error transition-colors"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={add}
                className="flex items-center gap-1 text-[13px] text-primary hover:underline mt-1 w-fit"
            >
                <Plus className="size-3.5" />
                Tambah item
            </button>
        </div>
    );
}

// ─── Edit Modal types ─────────────────────────────────────────────────────────

type EditTarget =
    | { type: "core_values" }
    | { type: "core_focus" }
    | { type: "ten_year_target" }
    | { type: "marketing_strategy" }
    | { type: "three_year_picture" }
    | { type: "one_year_plan" };

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VTOIndex({ vto }: { vto: VTO | null }) {
    const { auth } = usePage().props as any;
    const isOrgAdmin = auth.user?.is_org_admin;
    const isLeader = auth.teamRole === "leader";
    const canEdit = isOrgAdmin || isLeader;

    const [activeTab, setActiveTab] = useState<Tab>("vision");
    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [processing, setProcessing] = useState(false);

    // Field states for edit modal
    const [coreValues, setCoreValues] = useState<string[]>(
        vto?.core_values ?? [],
    );

    useEffect(() => {
        if (!vto) return;
        setCoreValues(vto.core_values ?? []);
        setCoreFocusPurpose(vto.core_focus_purpose ?? "");
        setCoreFocusNiche(vto.core_focus_niche ?? "");
        setTenYearTarget(vto.ten_year_target ?? "");
        setTargetMarket(vto.target_market ?? "");
        setThreeUniques(vto.three_uniques ?? "");
        setProvenProcess(vto.proven_process ?? "");
        setGuarantee(vto.guarantee ?? "");
        setThreeYearDate(vto.three_year_date ?? "");
        setThreeYearRevenue(vto.three_year_revenue ?? "");
        setThreeYearProfit(vto.three_year_profit ?? "");
        setThreeYearMeasurables(
            vto.three_year_measurables
                ? String(vto.three_year_measurables)
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                : [],
        );
        setThreeYearLook(vto.three_year_look ?? []);
        setOneYearDate(vto.one_year_date ?? "");
        setOneYearRevenue(vto.one_year_revenue ?? "");
        setOneYearProfit(vto.one_year_profit ?? "");
        setOneYearMeasurables(
            vto.one_year_measurables
                ? String(vto.one_year_measurables)
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                : [],
        );
        setOneYearGoals(vto.one_year_goals ?? []);
    }, [vto]);

    useEffect(() => {
        if (!vto) return;
        setCoreValues(vto.core_values ?? []);
        setCoreFocusPurpose(vto.core_focus_purpose ?? "");
        setCoreFocusNiche(vto.core_focus_niche ?? "");
        setTenYearTarget(vto.ten_year_target ?? "");
        setTargetMarket(vto.target_market ?? "");
        setThreeUniques(vto.three_uniques ?? "");
        setProvenProcess(vto.proven_process ?? "");
        setGuarantee(vto.guarantee ?? "");
        setThreeYearDate(vto.three_year_date ?? "");
        setThreeYearRevenue(vto.three_year_revenue ?? "");
        setThreeYearProfit(vto.three_year_profit ?? "");
        setThreeYearMeasurables(
            vto.three_year_measurables
                ? String(vto.three_year_measurables)
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                : [],
        );
        setThreeYearLook(vto.three_year_look ?? []);
        setOneYearDate(vto.one_year_date ?? "");
        setOneYearRevenue(vto.one_year_revenue ?? "");
        setOneYearProfit(vto.one_year_profit ?? "");
        setOneYearMeasurables(
            vto.one_year_measurables
                ? String(vto.one_year_measurables)
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                : [],
        );
        setOneYearGoals(vto.one_year_goals ?? []);
    }, [vto]);
    const [coreFocusPurpose, setCoreFocusPurpose] = useState(
        vto?.core_focus_purpose ?? "",
    );
    const [coreFocusNiche, setCoreFocusNiche] = useState(
        vto?.core_focus_niche ?? "",
    );
    const [tenYearTarget, setTenYearTarget] = useState(
        vto?.ten_year_target ?? "",
    );
    const [targetMarket, setTargetMarket] = useState(vto?.target_market ?? "");
    const [threeUniques, setThreeUniques] = useState(vto?.three_uniques ?? "");
    const [provenProcess, setProvenProcess] = useState(
        vto?.proven_process ?? "",
    );
    const [guarantee, setGuarantee] = useState(vto?.guarantee ?? "");
    const [threeYearDate, setThreeYearDate] = useState(
        vto?.three_year_date ?? "",
    );
    const [threeYearRevenue, setThreeYearRevenue] = useState(
        vto?.three_year_revenue ?? "",
    );
    const [threeYearProfit, setThreeYearProfit] = useState(
        vto?.three_year_profit ?? "",
    );
    const [threeYearMeasurables, setThreeYearMeasurables] = useState<string[]>(
        vto?.three_year_measurables
            ? String(vto.three_year_measurables)
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [],
    );
    const [threeYearLook, setThreeYearLook] = useState<string[]>(
        vto?.three_year_look ?? [],
    );
    const [oneYearDate, setOneYearDate] = useState(vto?.one_year_date ?? "");
    const [oneYearRevenue, setOneYearRevenue] = useState(
        vto?.one_year_revenue ?? "",
    );
    const [oneYearProfit, setOneYearProfit] = useState(
        vto?.one_year_profit ?? "",
    );
    const [oneYearMeasurables, setOneYearMeasurables] = useState<string[]>(
        vto?.one_year_measurables
            ? String(vto.one_year_measurables)
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [],
    );
    const [oneYearGoals, setOneYearGoals] = useState<string[]>(
        vto?.one_year_goals ?? [],
    );

    const save = (payload: Record<string, any>) => {
        if (!vto) return;
        setProcessing(true);
        router.post(route("vto.update"), payload, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setEditTarget(null);
            },
            onError: (errors) => {
                console.error("VTO save errors:", errors);
                alert("Gagal menyimpan: " + JSON.stringify(errors));
            },
        });
    };

    const handleSave = () => {
        if (!editTarget) return;
        switch (editTarget.type) {
            case "core_values":
                return save({ core_values: coreValues.filter(Boolean) });
            case "core_focus":
                return save({
                    core_focus_purpose: coreFocusPurpose,
                    core_focus_niche: coreFocusNiche,
                });
            case "ten_year_target":
                return save({ ten_year_target: tenYearTarget });
            case "marketing_strategy":
                return save({
                    target_market: targetMarket,
                    three_uniques: threeUniques,
                    proven_process: provenProcess,
                    guarantee,
                });
            case "three_year_picture":
                return save({
                    three_year_date: threeYearDate || null,
                    three_year_revenue: threeYearRevenue || null,
                    three_year_profit: threeYearProfit || null,
                    three_year_measurables:
                        threeYearMeasurables.filter(Boolean).join(", ") || null,
                    three_year_look: threeYearLook.filter(Boolean),
                });
            case "one_year_plan":
                return save({
                    one_year_date: oneYearDate || null,
                    one_year_revenue: oneYearRevenue || null,
                    one_year_profit: oneYearProfit || null,
                    one_year_measurables:
                        oneYearMeasurables.filter(Boolean).join(", ") || null,
                    one_year_goals: oneYearGoals.filter(Boolean),
                });
        }
    };

    const modalTitle: Record<EditTarget["type"], string> = {
        core_values: "Core Values",
        core_focus: "Core Focus",
        ten_year_target: "10-Year Target",
        marketing_strategy: "Marketing Strategy",
        three_year_picture: "3-Year Picture",
        one_year_plan: "1-Year Plan",
    };

    return (
        <AuthenticatedLayout>
            <Head title="VTO" />

            {/* Page Header + Tab Switcher */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <PageHeader
                    title="Vision/Traction Organizer"
                    subtitle="Fondasi strategis organisasi dalam dua halaman."
                />
                <div className="inline-flex p-1 bg-surface-overlay rounded-full border border-border shrink-0">
                    {(["vision", "traction"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2 rounded-full text-[14px] font-medium transition-all capitalize",
                                activeTab === tab
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-text-secondary hover:text-text-primary",
                            )}
                        >
                            {tab === "vision" ? "Vision" : "Traction"}
                        </button>
                    ))}
                </div>
            </div>

            {!vto ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <p className="text-[14px] text-text-muted">
                            VTO belum dibuat.{" "}
                            {isOrgAdmin &&
                                "Klik tombol di bawah untuk memulai."}
                        </p>
                        {isOrgAdmin && (
                            <Button
                                className="mt-4"
                                onClick={() =>
                                    router.post(route("vto.store"), {})
                                }
                            >
                                Inisiasi VTO
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : activeTab === "vision" ? (
                /* ════ VISION TAB ════ */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Core Values */}
                        <GlassCard className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <SectionTitle
                                    icon={Award}
                                    title="Core Values"
                                />
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setEditTarget({
                                                type: "core_values",
                                            })
                                        }
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>
                            {(vto.core_values ?? []).length > 0 ? (
                                <ul className="space-y-3">
                                    {vto.core_values.map((cv, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start"
                                        >
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 shrink-0" />
                                            <span className="text-[14px] leading-[22px]">
                                                {cv}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <Empty canEdit={canEdit} />
                            )}
                        </GlassCard>

                        {/* Core Focus */}
                        <GlassCard className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <SectionTitle
                                    icon={Crosshair}
                                    title="Core Focus"
                                />
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setEditTarget({
                                                type: "core_focus",
                                            })
                                        }
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                                        Purpose / Cause / Passion
                                    </p>
                                    {vto.core_focus_purpose ? (
                                        <p className="text-[14px] leading-[22px]">
                                            {vto.core_focus_purpose}
                                        </p>
                                    ) : (
                                        <Empty canEdit={canEdit} />
                                    )}
                                </div>
                                <div className="pt-4 border-t border-border">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                                        Niche
                                    </p>
                                    {vto.core_focus_niche ? (
                                        <p className="text-[14px] leading-[22px]">
                                            {vto.core_focus_niche}
                                        </p>
                                    ) : (
                                        <Empty canEdit={canEdit} />
                                    )}
                                </div>
                            </div>
                        </GlassCard>

                        {/* 10-Year Target */}
                        <GlassCard className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <SectionTitle
                                    icon={Flag}
                                    title="10-Year Target"
                                />
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setEditTarget({
                                                type: "ten_year_target",
                                            })
                                        }
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>
                            {vto.ten_year_target ? (
                                <div className="flex items-center justify-center py-8 text-center">
                                    <p className="text-[24px] font-bold leading-8 text-primary">
                                        {vto.ten_year_target}
                                    </p>
                                </div>
                            ) : (
                                <Empty canEdit={canEdit} />
                            )}
                        </GlassCard>

                        {/* Marketing Strategy */}
                        <GlassCard className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <SectionTitle
                                    icon={Megaphone}
                                    title="Marketing Strategy"
                                />
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setEditTarget({
                                                type: "marketing_strategy",
                                            })
                                        }
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                                        Target Market
                                    </p>
                                    {vto.target_market ? (
                                        <p className="text-[14px] leading-[22px]">
                                            {vto.target_market}
                                        </p>
                                    ) : (
                                        <Empty canEdit={canEdit} />
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                                            3 Uniques
                                        </p>
                                        {vto.three_uniques ? (
                                            <p className="text-[13px] leading-[20px]">
                                                {vto.three_uniques}
                                            </p>
                                        ) : (
                                            <Empty canEdit={canEdit} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                                            Guarantee
                                        </p>
                                        {vto.guarantee ? (
                                            <p className="text-[13px] italic leading-[20px]">
                                                "{vto.guarantee}"
                                            </p>
                                        ) : (
                                            <Empty canEdit={canEdit} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* 3-Year Picture — full width */}
                    <GlassCard className="p-8">
                        <div className="flex items-start justify-between mb-2">
                            <SectionTitle
                                icon={LayoutGrid}
                                title="3-Year Picture"
                            />
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setEditTarget({
                                            type: "three_year_picture",
                                        })
                                    }
                                >
                                    Edit
                                </Button>
                            )}
                        </div>
                        <MetricBar
                            date={vto.three_year_date}
                            revenue={vto.three_year_revenue}
                            profit={vto.three_year_profit}
                            measurables={vto.three_year_measurables}
                            measurablesLabel="Measurables"
                        />
                        {(vto.three_year_look ?? []).length > 0 ? (
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">
                                    Yang terlihat nanti
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    {vto.three_year_look.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3"
                                        >
                                            <CheckCircle2 className="size-4 text-primary shrink-0" />
                                            <span className="text-[14px] leading-[22px]">
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Empty canEdit={canEdit} />
                        )}
                    </GlassCard>
                </div>
            ) : (
                /* ════ TRACTION TAB ════ */
                <div className="space-y-6">
                    {/* 1-Year Plan */}
                    <GlassCard className="p-8">
                        <div className="flex items-start justify-between mb-2">
                            <SectionTitle icon={Calendar} title="1-Year Plan" />
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setEditTarget({ type: "one_year_plan" })
                                    }
                                >
                                    Edit
                                </Button>
                            )}
                        </div>
                        <MetricBar
                            date={vto.one_year_date}
                            revenue={vto.one_year_revenue}
                            profit={vto.one_year_profit}
                            measurables={vto.one_year_measurables}
                            measurablesLabel="Klien / Siswa"
                        />
                        {(vto.one_year_goals ?? []).length > 0 ? (
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">
                                    Goals Tahun Ini
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {vto.one_year_goals.map((goal, i) => (
                                        <p
                                            key={i}
                                            className="text-[14px] leading-[22px] py-2 px-3 bg-surface-subtle rounded-lg border border-border"
                                        >
                                            {i + 1}. {goal}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Empty canEdit={canEdit} />
                        )}
                    </GlassCard>

                    {/* Rocks — link to module */}
                    <GlassCard>
                        <div className="p-6 border-b border-border flex items-center justify-between bg-surface-subtle">
                            <h3 className="text-[18px] font-semibold text-primary">
                                Rocks (90-Day Priorities)
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    router.visit(route("rocks.index"))
                                }
                            >
                                <ExternalLink className="size-4 mr-1" />
                                Lihat semua Rocks
                            </Button>
                        </div>
                        <div className="p-6">
                            <p className="text-[13px] text-text-muted">
                                Rocks dikelola di modul Rocks dan ditinjau
                                setiap L10 Meeting. Klik "Lihat semua Rocks"
                                untuk detail per quarter.
                            </p>
                        </div>
                    </GlassCard>

                    {/* Issues — link to module */}
                    <GlassCard>
                        <div className="p-6 border-b border-border flex items-center justify-between bg-surface-subtle">
                            <h3 className="text-[18px] font-semibold text-primary">
                                Issues List (IDS)
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.visit(route("ids.index"))}
                            >
                                <ExternalLink className="size-4 mr-1" />
                                Lihat semua Issues
                            </Button>
                        </div>
                        <div className="p-6">
                            <p className="text-[13px] text-text-muted">
                                Issues diidentifikasi, didiskusikan, dan
                                diselesaikan (IDS) dalam L10 Meeting. Klik
                                "Lihat semua Issues" untuk daftar lengkap.
                            </p>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* ════ EDIT MODAL ════ */}
            <Dialog
                open={!!editTarget}
                onOpenChange={(open) => !open && setEditTarget(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>
                            Edit {editTarget ? modalTitle[editTarget.type] : ""}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        {editTarget?.type === "core_values" && (
                            <div className="flex flex-col gap-xs">
                                <Label>
                                    Core Values (format: "Nama: deskripsi" atau
                                    satu per baris)
                                </Label>
                                <ArrayFieldEditor
                                    value={coreValues}
                                    onChange={setCoreValues}
                                    placeholder="contoh: Extreme Ownership: Kami memiliki hasil, bukan hanya tugas"
                                />
                            </div>
                        )}

                        {editTarget?.type === "core_focus" && (
                            <div className="flex flex-col gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label>Purpose / Cause / Passion</Label>
                                    <Textarea
                                        value={coreFocusPurpose}
                                        onChange={(e) =>
                                            setCoreFocusPurpose(e.target.value)
                                        }
                                        rows={3}
                                        placeholder="Mengapa organisasi ini ada?"
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label>Niche</Label>
                                    <Textarea
                                        value={coreFocusNiche}
                                        onChange={(e) =>
                                            setCoreFocusNiche(e.target.value)
                                        }
                                        rows={3}
                                        placeholder="Apa yang paling kami kuasai?"
                                    />
                                </div>
                            </div>
                        )}

                        {editTarget?.type === "ten_year_target" && (
                            <div className="flex flex-col gap-xs">
                                <Label>10-Year Target</Label>
                                <Input
                                    value={tenYearTarget}
                                    onChange={(e) =>
                                        setTenYearTarget(e.target.value)
                                    }
                                    placeholder="contoh: 1 Juta Pelajar"
                                />
                            </div>
                        )}

                        {editTarget?.type === "marketing_strategy" && (
                            <div className="flex flex-col gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label>Target Market</Label>
                                    <Textarea
                                        value={targetMarket}
                                        onChange={(e) =>
                                            setTargetMarket(e.target.value)
                                        }
                                        rows={2}
                                        placeholder="Siapa pelanggan ideal kami?"
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label>3 Uniques</Label>
                                    <Textarea
                                        value={threeUniques}
                                        onChange={(e) =>
                                            setThreeUniques(e.target.value)
                                        }
                                        rows={3}
                                        placeholder="Apa yang membuat kami unik?"
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label>Proven Process</Label>
                                    <Textarea
                                        value={provenProcess}
                                        onChange={(e) =>
                                            setProvenProcess(e.target.value)
                                        }
                                        rows={2}
                                        placeholder="Jelaskan proses terbukti kami"
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label>Guarantee</Label>
                                    <Input
                                        value={guarantee}
                                        onChange={(e) =>
                                            setGuarantee(e.target.value)
                                        }
                                        placeholder="Garansi kami kepada pelanggan"
                                    />
                                </div>
                            </div>
                        )}

                        {editTarget?.type === "three_year_picture" && (
                            <div className="flex flex-col gap-md">
                                <div className="grid grid-cols-2 gap-md">
                                    <div className="flex flex-col gap-xs">
                                        <Label>Target Date</Label>
                                        <Input
                                            type="date"
                                            value={threeYearDate}
                                            onChange={(e) =>
                                                setThreeYearDate(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="flex flex-col gap-xs col-span-2">
                                        <Label>Measurables</Label>
                                        <ArrayFieldEditor
                                            value={threeYearMeasurables}
                                            onChange={setThreeYearMeasurables}
                                            placeholder="contoh: 450+ klien korporat"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-xs">
                                        <Label>Revenue</Label>
                                        <Input
                                            type="text"
                                            value={threeYearRevenue}
                                            onChange={(e) =>
                                                setThreeYearRevenue(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="contoh: Rp 12 M"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-xs">
                                        <Label>Profit</Label>
                                        <Input
                                            type="text"
                                            value={threeYearProfit}
                                            onChange={(e) =>
                                                setThreeYearProfit(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="contoh: 20%"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label>Yang terlihat nanti</Label>
                                    <ArrayFieldEditor
                                        value={threeYearLook}
                                        onChange={setThreeYearLook}
                                        placeholder="contoh: Sales engine mandiri di Asia"
                                    />
                                </div>
                            </div>
                        )}

                        {editTarget?.type === "one_year_plan" && (
                            <div className="flex flex-col gap-md">
                                <div className="grid grid-cols-2 gap-md">
                                    <div className="flex flex-col gap-xs">
                                        <Label>Target Date</Label>
                                        <Input
                                            type="date"
                                            value={oneYearDate}
                                            onChange={(e) =>
                                                setOneYearDate(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="flex flex-col gap-xs col-span-2">
                                        <Label>Measurables</Label>
                                        <ArrayFieldEditor
                                            value={oneYearMeasurables}
                                            onChange={setOneYearMeasurables}
                                            placeholder="contoh: 120 klien aktif"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-xs">
                                        <Label>Revenue</Label>
                                        <Input
                                            type="text"
                                            value={oneYearRevenue}
                                            onChange={(e) =>
                                                setOneYearRevenue(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="contoh: Rp 3,5 M"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-xs">
                                        <Label>Profit</Label>
                                        <Input
                                            type="text"
                                            value={oneYearProfit}
                                            onChange={(e) =>
                                                setOneYearProfit(e.target.value)
                                            }
                                            placeholder="contoh: 15%"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label>Goals Tahun Ini</Label>
                                    <ArrayFieldEditor
                                        value={oneYearGoals}
                                        onChange={setOneYearGoals}
                                        placeholder="contoh: Hire 3 Head Mentor untuk APAC"
                                    />
                                </div>
                            </div>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditTarget(null)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleSave} disabled={processing}>
                            {processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
