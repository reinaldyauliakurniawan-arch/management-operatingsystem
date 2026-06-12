import { Head, Link, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

interface Meeting {
    id: number;
    title: string | null;
    scheduled_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    rating: number | null;
    is_ongoing: boolean;
    is_scheduled: boolean;
    attendees: { id: number; name: string }[];
}

const S: Record<string, any> = {
    btnPrimary: {
        background: "#1a5c41",
        color: "#ffffff",
        border: "none",
        borderRadius: 9999,
        padding: "8px 20px",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        textDecoration: "none",
        display: "inline-block",
    },
    btnGhost: {
        background: "none",
        border: "none",
        fontSize: 12,
        color: "#6b6b6b",
        cursor: "pointer",
        padding: "4px 10px",
        borderRadius: 8,
        textDecoration: "none",
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

function MeetingStatus({ m }: { m: Meeting }) {
    if (m.ended_at)
        return (
            <span
                style={{
                    fontSize: 12,
                    fontWeight: 500,
                    background: "#f0f0f0",
                    color: "#6b6b6b",
                    padding: "2px 8px",
                    borderRadius: 4,
                }}
            >
                Selesai
            </span>
        );
    if (m.is_ongoing)
        return (
            <span
                style={{
                    fontSize: 12,
                    fontWeight: 500,
                    background: "#fef3c7",
                    color: "#78350f",
                    padding: "2px 8px",
                    borderRadius: 4,
                }}
            >
                Berlangsung
            </span>
        );
    if (m.is_scheduled)
        return (
            <span
                style={{
                    fontSize: 12,
                    fontWeight: 500,
                    background: "#eff6ff",
                    color: "#1e3a5f",
                    padding: "2px 8px",
                    borderRadius: 4,
                }}
            >
                Terjadwal
            </span>
        );
    return (
        <span
            style={{
                fontSize: 12,
                fontWeight: 500,
                background: "#f0f0f0",
                color: "#6b6b6b",
                padding: "2px 8px",
                borderRadius: 4,
            }}
        >
            Draft
        </span>
    );
}

const fmt = (s: string | null) =>
    s
        ? new Date(s).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "—";

export default function L10Index({
    meetings,
}: {
    meetings: { data: Meeting[] };
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";

    const destroy = (id: number) => {
        if (!confirm("Hapus meeting ini?")) return;
        router.delete(route("l10.destroy", id), { preserveScroll: true });
    };

    const meetingList = meetings.data;
    const ongoing = meetingList.find((m) => m.is_ongoing);
    const scheduled = meetingList.filter((m) => m.is_scheduled).length;
    const done = meetingList.filter((m) => m.ended_at).length;

    return (
        <AuthenticatedLayout>
            <Head title="L10 Meeting" />

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
                        L10 Meeting
                    </h1>
                    <p
                        style={{
                            fontSize: 14,
                            color: "#6b6b6b",
                            margin: "4px 0 0",
                        }}
                    >
                        Weekly meeting structure 90 menit
                    </p>
                </div>
                {isLeader && (
                    <Link href={route("l10.create")} style={S.btnPrimary}>
                        + Buat Meeting
                    </Link>
                )}
            </div>

            {/* Ongoing alert */}
            {ongoing && (
                <div
                    style={{
                        background: "#fef3c7",
                        border: "1px solid #f59e0b",
                        borderRadius: 12,
                        padding: "16px 20px",
                        marginBottom: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <p
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#78350f",
                                margin: 0,
                            }}
                        >
                            Meeting sedang berlangsung
                        </p>
                        <p
                            style={{
                                fontSize: 12,
                                color: "#92400e",
                                margin: "2px 0 0",
                            }}
                        >
                            {ongoing.title ?? "L10 Meeting"} · Dimulai{" "}
                            {fmt(ongoing.started_at)}
                        </p>
                    </div>
                    <Link
                        href={route("l10.workspace", ongoing.id)}
                        style={{
                            ...S.btnPrimary,
                            background: "#92400e",
                            fontSize: 13,
                        }}
                    >
                        Buka Workspace →
                    </Link>
                </div>
            )}

            {/* Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {[
                    { label: "Terjadwal", value: scheduled, color: "#1e3a5f" },
                    {
                        label: "Berlangsung",
                        value: ongoing ? 1 : 0,
                        color: "#78350f",
                    },
                    { label: "Selesai", value: done, color: "#1a5c41" },
                ].map((s) => (
                    <div
                        key={s.label}
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
                            {s.label}
                        </p>
                        <p
                            style={{
                                fontSize: 32,
                                fontWeight: 600,
                                color: s.color,
                                margin: 0,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {s.value}
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
                                "Meeting",
                                "Jadwal",
                                "Peserta",
                                "Rating",
                                "Status",
                                "",
                            ].map((h, i) => (
                                <th
                                    key={i}
                                    style={{
                                        padding: "12px 16px",
                                        textAlign: "left",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: "#6b6b6b",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {meetingList.length === 0 && (
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
                                    Belum ada meeting.
                                </td>
                            </tr>
                        )}
                        {meetingList.map((m, i) => (
                            <tr
                                key={m.id}
                                style={{
                                    borderTop:
                                        i === 0 ? "none" : "1px solid #e4e4e4",
                                }}
                                onMouseEnter={(e) =>
                                    ((
                                        e.currentTarget as HTMLElement
                                    ).style.background = "#f5f5f5")
                                }
                                onMouseLeave={(e) =>
                                    ((
                                        e.currentTarget as HTMLElement
                                    ).style.background = "transparent")
                                }
                            >
                                <td style={{ padding: "12px 16px" }}>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: "#1a1a1a",
                                            margin: 0,
                                        }}
                                    >
                                        {m.title ?? "L10 Meeting"}
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
                                    {fmt(m.scheduled_at)}
                                </td>
                                <td
                                    style={{
                                        padding: "12px 16px",
                                        fontSize: 13,
                                        color: "#6b6b6b",
                                    }}
                                >
                                    {m.attendees
                                        .slice(0, 3)
                                        .map((a) => a.name)
                                        .join(", ")}
                                    {m.attendees.length > 3
                                        ? ` +${m.attendees.length - 3}`
                                        : ""}
                                </td>
                                <td
                                    style={{
                                        padding: "12px 16px",
                                        fontSize: 13,
                                        color: "#6b6b6b",
                                    }}
                                >
                                    {m.rating ? (
                                        <span
                                            style={{
                                                fontWeight: 500,
                                                color: "#1a5c41",
                                            }}
                                        >
                                            {m.rating}/10
                                        </span>
                                    ) : (
                                        "—"
                                    )}
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <MeetingStatus m={m} />
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            justifyContent: "flex-end",
                                        }}
                                    >
                                        <Link
                                            href={route("l10.workspace", m.id)}
                                            style={{
                                                fontSize: 12,
                                                color: "#1a5c41",
                                                textDecoration: "none",
                                                padding: "4px 10px",
                                                background: "#e8f0ec",
                                                borderRadius: 8,
                                            }}
                                        >
                                            {m.ended_at ? "Lihat" : "Workspace"}
                                        </Link>
                                        {isLeader && (
                                            <button
                                                onClick={() => destroy(m.id)}
                                                style={S.btnDanger}
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
        </AuthenticatedLayout>
    );
}
