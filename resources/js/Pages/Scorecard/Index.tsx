import { useState } from "react";
import { useForm, Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

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

const S: Record<string, any> = {
    label: {
        fontSize: 12,
        fontWeight: 500,
        color: "#6b6b6b",
        marginBottom: 6,
        letterSpacing: "0.02em",
    },
    input: {
        width: "100%",
        background: "#f0f0f0",
        border: "1px solid #e4e4e4",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 14,
        color: "#1a1a1a",
        outline: "none",
    },
    select: {
        width: "100%",
        background: "#f0f0f0",
        border: "1px solid #e4e4e4",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 14,
        color: "#1a1a1a",
        outline: "none",
        appearance: "none" as const,
    },
    btnPrimary: {
        background: "#1a5c41",
        color: "#ffffff",
        border: "none",
        borderRadius: 9999,
        padding: "8px 20px",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
    },
    btnSecondary: {
        background: "#f0f0f0",
        color: "#1a1a1a",
        border: "1px solid #e4e4e4",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 14,
        cursor: "pointer",
    },
    btnGhost: {
        background: "none",
        border: "none",
        fontSize: 12,
        color: "#6b6b6b",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: 8,
    },
    btnDanger: {
        background: "#fef2f2",
        color: "#991b1b",
        border: "none",
        borderRadius: 8,
        padding: "4px 10px",
        fontSize: 12,
        cursor: "pointer",
    },
};

function Modal({ open, onClose, title, children }: any) {
    if (!open) return null;
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                }}
            />
            <div
                style={{
                    position: "relative",
                    background: "#fff",
                    borderRadius: 18,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    width: "100%",
                    maxWidth: 520,
                    margin: 24,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #e4e4e4",
                    }}
                >
                    <h2
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#1a1a1a",
                            margin: 0,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {title}
                    </h2>
                </div>
                <div style={{ padding: 24 }}>{children}</div>
            </div>
        </div>
    );
}

function StatusDot({ status }: { status: string }) {
    const cfg: Record<string, [string, string]> = {
        green: ["#1a5c41", "#e8f0ec"],
        yellow: ["#78350f", "#fef3c7"],
        red: ["#991b1b", "#fef2f2"],
    };
    const [color, bg] = cfg[status] ?? ["#999999", "#f0f0f0"];
    return (
        <span
            style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
            }}
            title={status}
        />
    );
}

export default function ScorecardIndex({
    metrics,
    users,
    weeks,
}: {
    metrics: { data: Metric[] };
    users: any[];
    weeks: string[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const userId = auth.user.id;
    const [createOpen, setCreateOpen] = useState(false);
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
        if (!confirm("Hapus metric ini?")) return;
        router.delete(route("scorecard.destroy", id), { preserveScroll: true });
    };

    // Tampilkan 8 minggu terbaru
    const visibleWeeks = weeks.slice(0, 8);

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

    return (
        <AuthenticatedLayout>
            <Head title="Scorecard" />
            <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}`}</style>

            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #e4e4e4",
                    paddingBottom: 24,
                    marginBottom: 24,
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: 24,
                            fontWeight: 600,
                            color: "#1a1a1a",
                            margin: 0,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Scorecard
                    </h1>
                    <p
                        style={{
                            fontSize: 14,
                            color: "#6b6b6b",
                            margin: "4px 0 0",
                        }}
                    >
                        Weekly measurables tim
                    </p>
                </div>
                {isLeader && (
                    <button
                        onClick={() => setCreateOpen(true)}
                        style={S.btnPrimary}
                    >
                        + Tambah Metric
                    </button>
                )}
            </div>

            {/* Table — horizontal scroll */}
            <div
                style={{
                    background: "#ffffff",
                    border: "1px solid #e4e4e4",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
            >
                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            minWidth: 700,
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#f5f5f5" }}>
                                <th
                                    style={{
                                        padding: "12px 16px",
                                        textAlign: "left",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: "#6b6b6b",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                        position: "sticky",
                                        left: 0,
                                        background: "#f5f5f5",
                                        whiteSpace: "nowrap",
                                        minWidth: 180,
                                    }}
                                >
                                    Metric
                                </th>
                                <th
                                    style={{
                                        padding: "12px 16px",
                                        textAlign: "left",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: "#6b6b6b",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Owner
                                </th>
                                <th
                                    style={{
                                        padding: "12px 16px",
                                        textAlign: "left",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: "#6b6b6b",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Goal
                                </th>
                                {visibleWeeks.map((w) => (
                                    <th
                                        key={w}
                                        style={{
                                            padding: "12px 8px",
                                            textAlign: "center",
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: "#6b6b6b",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                            whiteSpace: "nowrap",
                                            minWidth: 90,
                                        }}
                                    >
                                        {formatWeek(w)}
                                    </th>
                                ))}
                                {isLeader && (
                                    <th
                                        style={{
                                            padding: "12px 16px",
                                            width: 60,
                                        }}
                                    />
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4 + visibleWeeks.length}
                                        style={{
                                            padding: "48px 16px",
                                            textAlign: "center",
                                            color: "#999999",
                                            fontSize: 14,
                                        }}
                                    >
                                        Belum ada metric.{" "}
                                        {isLeader && "Tambah metric pertama."}
                                    </td>
                                </tr>
                            )}
                            {metrics.data.map((metric, i) => (
                                <tr
                                    key={metric.id}
                                    style={{
                                        borderTop:
                                            i === 0
                                                ? "none"
                                                : "1px solid #e4e4e4",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "12px 16px",
                                            position: "sticky",
                                            left: 0,
                                            background: "#fff",
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: "#1a1a1a",
                                                margin: 0,
                                            }}
                                        >
                                            {metric.title}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: 11,
                                                color: "#999999",
                                                margin: "2px 0 0",
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {metric.frequency}
                                        </p>
                                    </td>
                                    <td
                                        style={{
                                            padding: "12px 16px",
                                            fontSize: 13,
                                            color: "#6b6b6b",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {metric.owner.name}
                                    </td>
                                    <td
                                        style={{
                                            padding: "12px 16px",
                                            fontSize: 13,
                                            color: "#6b6b6b",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {metric.comparison_operator}{" "}
                                        {metric.goal_value}
                                    </td>
                                    {visibleWeeks.map((w) => {
                                        const score = metric.scores.find(
                                            (s) => s.week_start_date === w,
                                        );
                                        const canInput = canInputMetric(metric);
                                        const statusBg =
                                            score?.status === "green"
                                                ? "#e8f0ec"
                                                : score?.status === "red"
                                                  ? "#fef2f2"
                                                  : score?.status === "yellow"
                                                    ? "#fef3c7"
                                                    : "transparent";
                                        return (
                                            <td
                                                key={w}
                                                style={{
                                                    padding: "8px 6px",
                                                    textAlign: "center",
                                                }}
                                            >
                                                {canInput ? (
                                                    <input
                                                        type="number"
                                                        defaultValue={
                                                            score?.actual_value ??
                                                            ""
                                                        }
                                                        onBlur={(e) =>
                                                            logScore(
                                                                metric.id,
                                                                w,
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{
                                                            width: 76,
                                                            textAlign: "center",
                                                            background:
                                                                statusBg ||
                                                                "#f0f0f0",
                                                            border: "1px solid #e4e4e4",
                                                            borderRadius: 6,
                                                            padding: "5px 6px",
                                                            fontSize: 13,
                                                            color: "#1a1a1a",
                                                            outline: "none",
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 4,
                                                            fontSize: 13,
                                                            color: "#1a1a1a",
                                                            background:
                                                                statusBg,
                                                            padding: "4px 8px",
                                                            borderRadius: 6,
                                                        }}
                                                    >
                                                        {score ? (
                                                            <>
                                                                <StatusDot
                                                                    status={
                                                                        score.status
                                                                    }
                                                                />{" "}
                                                                {
                                                                    score.actual_value
                                                                }
                                                            </>
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    color: "#cccccc",
                                                                }}
                                                            >
                                                                —
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    {isLeader && (
                                        <td style={{ padding: "12px 16px" }}>
                                            <button
                                                onClick={() =>
                                                    deleteMetric(metric.id)
                                                }
                                                style={S.btnDanger}
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Tambah Metric"
            >
                <form
                    onSubmit={submit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    <div>
                        <p style={S.label}>Nama Metric *</p>
                        <input
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            placeholder="Contoh: Weekly Revenue"
                            style={S.input}
                            required
                        />
                        {errors.title && (
                            <p
                                style={{
                                    fontSize: 12,
                                    color: "#991b1b",
                                    marginTop: 4,
                                }}
                            >
                                {errors.title}
                            </p>
                        )}
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                        }}
                    >
                        <div>
                            <p style={S.label}>Goal Value *</p>
                            <input
                                type="number"
                                value={data.goal_value}
                                onChange={(e) =>
                                    setData("goal_value", e.target.value)
                                }
                                placeholder="50000"
                                style={S.input}
                                required
                            />
                        </div>
                        <div>
                            <p style={S.label}>Operator *</p>
                            <select
                                value={data.comparison_operator}
                                onChange={(e) =>
                                    setData(
                                        "comparison_operator",
                                        e.target.value,
                                    )
                                }
                                style={S.select}
                            >
                                <option value=">=">≥ (min)</option>
                                <option value="<=">≤ (maks)</option>
                                <option value="==">= (tepat)</option>
                            </select>
                        </div>
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                        }}
                    >
                        <div>
                            <p style={S.label}>Owner *</p>
                            <select
                                value={data.owner_id}
                                onChange={(e) =>
                                    setData("owner_id", e.target.value)
                                }
                                style={S.select}
                            >
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p style={S.label}>Frekuensi</p>
                            <select
                                value={data.frequency}
                                onChange={(e) =>
                                    setData("frequency", e.target.value)
                                }
                                style={S.select}
                            >
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                            paddingTop: 8,
                            borderTop: "1px solid #e4e4e4",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setCreateOpen(false)}
                            style={S.btnSecondary}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                ...S.btnPrimary,
                                opacity: processing ? 0.6 : 1,
                            }}
                        >
                            {processing ? "Menyimpan…" : "Simpan Metric"}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
