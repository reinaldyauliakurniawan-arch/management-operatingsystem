import { useState } from "react";
import { useForm, Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

interface User {
    id: number;
    name: string;
}
interface Milestone {
    id: number;
    title: string;
    due_date: string | null;
    is_done: boolean;
    sort_order: number;
}
interface Rock {
    id: number;
    title: string;
    description: string;
    owner: { id: number; name: string };
    quarter: string;
    year: number;
    due_date: string | null;
    status: "on_track" | "off_track" | "done";
    milestones: Milestone[];
}

const statusConfig = {
    on_track: { label: "On Track", bg: "#e8f0ec", color: "#1a5c41" },
    off_track: { label: "Off Track", bg: "#fef2f2", color: "#991b1b" },
    done: { label: "Done", bg: "#f0f0f0", color: "#6b6b6b" },
};

function Badge({ status }: { status: Rock["status"] }) {
    const cfg = statusConfig[status];
    return (
        <span
            style={{
                background: cfg.bg,
                color: cfg.color,
                fontSize: 12,
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: 4,
                letterSpacing: "0.02em",
            }}
        >
            {cfg.label}
        </span>
    );
}

function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
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
                    background: "#ffffff",
                    borderRadius: 18,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    width: "100%",
                    maxWidth: 560,
                    margin: 24,
                    animation: "modalIn 150ms ease-out",
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

function SelectInput({ value, onChange, children, style }: any) {
    return (
        <select
            value={value}
            onChange={onChange}
            style={{
                width: "100%",
                background: "#f0f0f0",
                border: "1px solid #e4e4e4",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 14,
                color: "#1a1a1a",
                outline: "none",
                appearance: "none",
                cursor: "pointer",
                ...style,
            }}
        >
            {children}
        </select>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
    type = "text",
    style,
}: any) {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                width: "100%",
                background: "#f0f0f0",
                border: "1px solid #e4e4e4",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 14,
                color: "#1a1a1a",
                outline: "none",
                ...style,
            }}
        />
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <p
            style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#6b6b6b",
                marginBottom: 6,
                letterSpacing: "0.02em",
            }}
        >
            {children}
        </p>
    );
}

export default function RocksIndex({
    rocks,
    users,
}: {
    rocks: { data: Rock[] };
    users: User[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const [createOpen, setCreateOpen] = useState(false);
    const [detailRock, setDetailRock] = useState<Rock | null>(null);
    const [milestoneTitle, setMilestoneTitle] = useState("");

    const { data, setData, post, processing, reset, errors } = useForm({
        title: "",
        description: "",
        owner_id: users[0]?.id || "",
        quarter: "Q1",
        year: new Date().getFullYear(),
        due_date: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("rocks.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                reset();
            },
        });
    };

    const updateStatus = (id: number, status: string) =>
        router.patch(
            route("rocks.updateStatus", id),
            { status },
            { preserveScroll: true },
        );

    const deleteRock = (id: number) => {
        if (!confirm("Hapus rock ini?")) return;
        router.delete(route("rocks.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDetailRock(null),
        });
    };

    const addMilestone = (rockId: number) => {
        if (!milestoneTitle.trim()) return;
        router.post(
            route("rocks.milestones.store", rockId),
            { title: milestoneTitle },
            {
                preserveScroll: true,
                onSuccess: () => setMilestoneTitle(""),
            },
        );
    };

    const toggleMilestone = (milestoneId: number) =>
        router.patch(
            route("rocks.milestones.toggle", milestoneId),
            {},
            { preserveScroll: true },
        );

    const deleteMilestone = (milestoneId: number) =>
        router.delete(route("rocks.milestones.destroy", milestoneId), {
            preserveScroll: true,
        });

    const rockList = rocks.data;
    const total = rockList.length;
    const onTrack = rockList.filter((r) => r.status === "on_track").length;
    const offTrack = rockList.filter((r) => r.status === "off_track").length;
    const done = rockList.filter((r) => r.status === "done").length;

    return (
        <AuthenticatedLayout>
            <Head title="Rocks" />
            <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>

            {/* Page Header */}
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
                        Rocks
                    </h1>
                    <p
                        style={{
                            fontSize: 14,
                            color: "#6b6b6b",
                            margin: "4px 0 0",
                        }}
                    >
                        90-day priorities tim
                    </p>
                </div>
                {isLeader && (
                    <button
                        onClick={() => setCreateOpen(true)}
                        style={{
                            background: "#1a5c41",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 9999,
                            padding: "8px 20px",
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "background 150ms, transform 150ms",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                                "#134d36";
                            (e.currentTarget as HTMLElement).style.transform =
                                "scale(0.97)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                                "#1a5c41";
                            (e.currentTarget as HTMLElement).style.transform =
                                "scale(1)";
                        }}
                    >
                        + Tambah Rock
                    </button>
                )}
            </div>

            {/* Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {[
                    { label: "Total", value: total, color: "#1a1a1a" },
                    { label: "On Track", value: onTrack, color: "#1a5c41" },
                    { label: "Off Track", value: offTrack, color: "#991b1b" },
                    { label: "Done", value: done, color: "#6b6b6b" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        style={{
                            background: "#ffffff",
                            border: "1px solid #e4e4e4",
                            borderRadius: 18,
                            padding: 24,
                        }}
                    >
                        <p
                            style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: "#999999",
                                letterSpacing: "0.02em",
                                marginBottom: 8,
                            }}
                        >
                            {stat.label}
                        </p>
                        <p
                            style={{
                                fontSize: 32,
                                fontWeight: 600,
                                color: stat.color,
                                margin: 0,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div
                style={{
                    background: "#ffffff",
                    border: "1px solid #e4e4e4",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
            >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f5f5f5" }}>
                            {[
                                "Rock",
                                "Owner",
                                "Periode",
                                "Due Date",
                                "Status",
                                "",
                            ].map((h) => (
                                <th
                                    key={h}
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
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rockList.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    style={{
                                        padding: "48px 16px",
                                        textAlign: "center",
                                        color: "#999999",
                                        fontSize: 14,
                                    }}
                                >
                                    Belum ada rock.{" "}
                                    {isLeader && "Tambah rock pertama."}
                                </td>
                            </tr>
                        )}
                        {rockList.map((rock, i) => (
                            <tr
                                key={rock.id}
                                style={{
                                    borderTop:
                                        i === 0 ? "none" : "1px solid #e4e4e4",
                                }}
                                onMouseEnter={(e) =>
                                    ((
                                        e.currentTarget as HTMLElement
                                    ).style.background = "#e8e8e8")
                                }
                                onMouseLeave={(e) =>
                                    ((
                                        e.currentTarget as HTMLElement
                                    ).style.background = "transparent")
                                }
                            >
                                <td style={{ padding: "12px 16px" }}>
                                    <button
                                        onClick={() => setDetailRock(rock)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            padding: 0,
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
                                            {rock.title}
                                        </p>
                                        {rock.description && (
                                            <p
                                                style={{
                                                    fontSize: 12,
                                                    color: "#999999",
                                                    margin: "2px 0 0",
                                                }}
                                            >
                                                {rock.description.slice(0, 60)}
                                                {rock.description.length > 60
                                                    ? "…"
                                                    : ""}
                                            </p>
                                        )}
                                    </button>
                                </td>
                                <td
                                    style={{
                                        padding: "12px 16px",
                                        fontSize: 13,
                                        color: "#6b6b6b",
                                    }}
                                >
                                    {rock.owner.name}
                                </td>
                                <td
                                    style={{
                                        padding: "12px 16px",
                                        fontSize: 13,
                                        color: "#6b6b6b",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {rock.quarter} {rock.year}
                                </td>
                                <td
                                    style={{
                                        padding: "12px 16px",
                                        fontSize: 13,
                                        color: "#6b6b6b",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {rock.due_date ?? "—"}
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <Badge status={rock.status} />
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            alignItems: "center",
                                            justifyContent: "flex-end",
                                        }}
                                    >
                                        {isLeader && (
                                            <SelectInput
                                                value={rock.status}
                                                onChange={(e: any) =>
                                                    updateStatus(
                                                        rock.id,
                                                        e.target.value,
                                                    )
                                                }
                                                style={{
                                                    width: "auto",
                                                    fontSize: 12,
                                                    padding: "4px 8px",
                                                }}
                                            >
                                                <option value="on_track">
                                                    On Track
                                                </option>
                                                <option value="off_track">
                                                    Off Track
                                                </option>
                                                <option value="done">
                                                    Done
                                                </option>
                                            </SelectInput>
                                        )}
                                        <button
                                            onClick={() => setDetailRock(rock)}
                                            style={{
                                                fontSize: 12,
                                                color: "#6b6b6b",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: "4px 8px",
                                                borderRadius: 8,
                                                transition: "color 150ms",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.color =
                                                    "#1a1a1a")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.color =
                                                    "#6b6b6b")
                                            }
                                        >
                                            Detail
                                        </button>
                                        {isLeader && (
                                            <button
                                                onClick={() =>
                                                    deleteRock(rock.id)
                                                }
                                                style={{
                                                    fontSize: 12,
                                                    color: "#999999",
                                                    background: "#fef2f2",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    padding: "4px 10px",
                                                    borderRadius: 8,
                                                    transition: "color 150ms",
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.color =
                                                        "#991b1b")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.color =
                                                        "#999999")
                                                }
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Tambah Rock"
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
                        <Label>Judul Rock *</Label>
                        <TextInput
                            value={data.title}
                            onChange={(e: any) =>
                                setData("title", e.target.value)
                            }
                            placeholder="Judul rock..."
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
                    <div>
                        <Label>Deskripsi</Label>
                        <textarea
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            placeholder="Deskripsi opsional..."
                            rows={3}
                            style={{
                                width: "100%",
                                background: "#f0f0f0",
                                border: "1px solid #e4e4e4",
                                borderRadius: 8,
                                padding: "8px 12px",
                                fontSize: 14,
                                color: "#1a1a1a",
                                outline: "none",
                                resize: "vertical",
                                fontFamily: "inherit",
                            }}
                        />
                    </div>
                    <div>
                        <Label>Owner *</Label>
                        <SelectInput
                            value={data.owner_id}
                            onChange={(e: any) =>
                                setData("owner_id", e.target.value)
                            }
                        >
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </SelectInput>
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 12,
                        }}
                    >
                        <div>
                            <Label>Quarter *</Label>
                            <SelectInput
                                value={data.quarter}
                                onChange={(e: any) =>
                                    setData("quarter", e.target.value)
                                }
                            >
                                {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                                    <option key={q} value={q}>
                                        {q}
                                    </option>
                                ))}
                            </SelectInput>
                        </div>
                        <div>
                            <Label>Year *</Label>
                            <TextInput
                                type="number"
                                value={data.year}
                                onChange={(e: any) =>
                                    setData("year", parseInt(e.target.value))
                                }
                            />
                        </div>
                        <div>
                            <Label>Due Date</Label>
                            <TextInput
                                type="date"
                                value={data.due_date}
                                onChange={(e: any) =>
                                    setData("due_date", e.target.value)
                                }
                            />
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
                            style={{
                                background: "#f0f0f0",
                                color: "#1a1a1a",
                                border: "1px solid #e4e4e4",
                                borderRadius: 8,
                                padding: "8px 16px",
                                fontSize: 14,
                                cursor: "pointer",
                            }}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                background: "#1a5c41",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: 9999,
                                padding: "8px 20px",
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: "pointer",
                                opacity: processing ? 0.6 : 1,
                            }}
                        >
                            {processing ? "Menyimpan…" : "Simpan Rock"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail / Milestone Modal */}
            <Modal
                open={!!detailRock}
                onClose={() => setDetailRock(null)}
                title={detailRock?.title ?? ""}
            >
                {detailRock && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <Badge status={detailRock.status} />
                            <span style={{ fontSize: 12, color: "#999999" }}>
                                {detailRock.owner.name} · {detailRock.quarter}{" "}
                                {detailRock.year}
                            </span>
                            {detailRock.due_date && (
                                <span
                                    style={{ fontSize: 12, color: "#999999" }}
                                >
                                    Due: {detailRock.due_date}
                                </span>
                            )}
                        </div>
                        {detailRock.description && (
                            <p
                                style={{
                                    fontSize: 14,
                                    color: "#6b6b6b",
                                    margin: 0,
                                }}
                            >
                                {detailRock.description}
                            </p>
                        )}

                        {/* Milestones */}
                        <div>
                            <p
                                style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: "#6b6b6b",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                    marginBottom: 12,
                                }}
                            >
                                Milestones
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {detailRock.milestones.length === 0 && (
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: "#999999",
                                        }}
                                    >
                                        Belum ada milestone.
                                    </p>
                                )}
                                {detailRock.milestones.map((m) => (
                                    <div
                                        key={m.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "8px 12px",
                                            background: "#f5f5f5",
                                            borderRadius: 8,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={m.is_done}
                                            onChange={() =>
                                                toggleMilestone(m.id)
                                            }
                                            style={{
                                                accentColor: "#1a5c41",
                                                width: 16,
                                                height: 16,
                                                cursor: "pointer",
                                            }}
                                        />
                                        <span
                                            style={{
                                                flex: 1,
                                                fontSize: 13,
                                                color: m.is_done
                                                    ? "#999999"
                                                    : "#1a1a1a",
                                                textDecoration: m.is_done
                                                    ? "line-through"
                                                    : "none",
                                            }}
                                        >
                                            {m.title}
                                        </span>
                                        {m.due_date && (
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: "#999999",
                                                }}
                                            >
                                                {m.due_date}
                                            </span>
                                        )}
                                        {isLeader && (
                                            <button
                                                onClick={() =>
                                                    deleteMilestone(m.id)
                                                }
                                                style={{
                                                    fontSize: 11,
                                                    color: "#999999",
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.color =
                                                        "#991b1b")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.color =
                                                        "#999999")
                                                }
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {isLeader && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginTop: 12,
                                    }}
                                >
                                    <input
                                        value={milestoneTitle}
                                        onChange={(e) =>
                                            setMilestoneTitle(e.target.value)
                                        }
                                        placeholder="Tambah milestone..."
                                        onKeyDown={(e) =>
                                            e.key === "Enter" &&
                                            addMilestone(detailRock.id)
                                        }
                                        style={{
                                            flex: 1,
                                            background: "#f0f0f0",
                                            border: "1px solid #e4e4e4",
                                            borderRadius: 8,
                                            padding: "8px 12px",
                                            fontSize: 13,
                                            color: "#1a1a1a",
                                            outline: "none",
                                        }}
                                    />
                                    <button
                                        onClick={() =>
                                            addMilestone(detailRock.id)
                                        }
                                        style={{
                                            background: "#1a5c41",
                                            color: "#ffffff",
                                            border: "none",
                                            borderRadius: 9999,
                                            padding: "8px 16px",
                                            fontSize: 13,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Tambah
                                    </button>
                                </div>
                            )}
                        </div>

                        {isLeader && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    paddingTop: 12,
                                    borderTop: "1px solid #e4e4e4",
                                }}
                            >
                                <button
                                    onClick={() => deleteRock(detailRock.id)}
                                    style={{
                                        background: "#fef2f2",
                                        color: "#991b1b",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "8px 16px",
                                        fontSize: 13,
                                        cursor: "pointer",
                                    }}
                                >
                                    Hapus Rock
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
