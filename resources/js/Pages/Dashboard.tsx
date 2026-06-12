import { Head, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

interface DashboardProps {
    stats: {
        rocks_total: number;
        rocks_on_track: number;
        rocks_off_track: number;
        rocks_done: number;
        issues_open: number;
        todos_overdue: number;
        scorecard_red: number;
    };
    role: string | null;
    upcomingMeeting: {
        id: number;
        title: string | null;
        scheduled_at: string;
    } | null;
    upcomingEvents: {
        id: number;
        name: string;
        type: string;
        event_date: string;
    }[];
    leaderboardTop3: {
        user_id: number;
        name: string;
        role: string;
        score: number;
    }[];
    selfLeaderboard: { score: number; rank: number; total: number } | null;
}

const fmt = (s: string) =>
    new Date(s).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
const fmtDatetime = (s: string) =>
    new Date(s).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

function StatCard({
    label,
    value,
    sub,
    color = "#1a1a1a",
    href,
}: {
    label: string;
    value: number;
    sub?: string;
    color?: string;
    href?: string;
}) {
    const content = (
        <div
            style={{
                background: "#ffffff",
                border: "1px solid #e4e4e4",
                borderRadius: 18,
                padding: 24,
                cursor: href ? "pointer" : "default",
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
                {label}
            </p>
            <p
                style={{
                    fontSize: 36,
                    fontWeight: 600,
                    color,
                    margin: 0,
                    letterSpacing: "-0.02em",
                }}
            >
                {value}
            </p>
            {sub && (
                <p style={{ fontSize: 12, color: "#999999", marginTop: 4 }}>
                    {sub}
                </p>
            )}
        </div>
    );
    return href ? (
        <Link href={href} style={{ textDecoration: "none" }}>
            {content}
        </Link>
    ) : (
        content
    );
}

export default function Dashboard({
    stats,
    role,
    upcomingMeeting,
    upcomingEvents,
    leaderboardTop3,
    selfLeaderboard,
}: DashboardProps) {
    const { auth } = usePage().props as any;
    const isLeader = role === "leader";
    const isMember = role === "member";
    const isTutor = role === "tutor";

    const countdown = (s: string) => {
        const diff = Math.ceil((new Date(s).getTime() - Date.now()) / 86400000);
        if (diff <= 0) return "Hari ini";
        if (diff === 1) return "Besok";
        return `${diff} hari lagi`;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            {/* Header */}
            <div
                style={{
                    borderBottom: "1px solid #e4e4e4",
                    paddingBottom: 24,
                    marginBottom: 24,
                }}
            >
                <h1
                    style={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: "#1a1a1a",
                        margin: 0,
                        letterSpacing: "-0.02em",
                    }}
                >
                    Dashboard
                </h1>
                <p
                    style={{
                        fontSize: 14,
                        color: "#6b6b6b",
                        margin: "4px 0 0",
                        textTransform: "capitalize",
                    }}
                >
                    {auth.user.name} · {role ?? "—"}
                </p>
            </div>

            {/* LEADER VIEW */}
            {isLeader && (
                <>
                    {/* Rocks summary */}
                    <p
                        style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#999999",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 12,
                        }}
                    >
                        Rocks Tim
                    </p>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 16,
                            marginBottom: 32,
                        }}
                    >
                        <StatCard
                            label="Total Rocks"
                            value={stats.rocks_total}
                            href="/rocks"
                        />
                        <StatCard
                            label="On Track"
                            value={stats.rocks_on_track}
                            color="#1a5c41"
                            href="/rocks"
                        />
                        <StatCard
                            label="Off Track"
                            value={stats.rocks_off_track}
                            color="#991b1b"
                            href="/rocks"
                        />
                        <StatCard
                            label="Done"
                            value={stats.rocks_done}
                            color="#6b6b6b"
                            href="/rocks"
                        />
                    </div>

                    {/* Weekly pulse */}
                    <p
                        style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#999999",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 12,
                        }}
                    >
                        Weekly Pulse
                    </p>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 16,
                            marginBottom: 32,
                        }}
                    >
                        <StatCard
                            label="Scorecard Merah"
                            value={stats.scorecard_red}
                            color={
                                stats.scorecard_red > 0 ? "#991b1b" : "#1a5c41"
                            }
                            href="/scorecard"
                        />
                        <StatCard
                            label="Issues Open"
                            value={stats.issues_open}
                            color={
                                stats.issues_open > 0 ? "#92400e" : "#1a5c41"
                            }
                            href="/ids"
                        />
                        <StatCard
                            label="To-Do Overdue"
                            value={stats.todos_overdue}
                            color={
                                stats.todos_overdue > 0 ? "#991b1b" : "#1a5c41"
                            }
                            href="/todos"
                        />
                    </div>

                    {/* Bottom row */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 16,
                        }}
                    >
                        {/* Upcoming meeting */}
                        <div
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
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: 16,
                                }}
                            >
                                L10 Terdekat
                            </p>
                            {upcomingMeeting ? (
                                <div>
                                    <p
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 600,
                                            color: "#1a1a1a",
                                            margin: 0,
                                        }}
                                    >
                                        {upcomingMeeting.title ?? "L10 Meeting"}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: "#6b6b6b",
                                            margin: "4px 0 12px",
                                        }}
                                    >
                                        {fmtDatetime(
                                            upcomingMeeting.scheduled_at,
                                        )}
                                    </p>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 500,
                                            background: "#eff6ff",
                                            color: "#1e3a5f",
                                            padding: "3px 10px",
                                            borderRadius: 4,
                                        }}
                                    >
                                        {countdown(
                                            upcomingMeeting.scheduled_at,
                                        )}
                                    </span>
                                </div>
                            ) : (
                                <p style={{ fontSize: 13, color: "#999999" }}>
                                    Tidak ada meeting terjadwal.
                                </p>
                            )}
                        </div>

                        {/* Top 3 leaderboard */}
                        <div
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
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: 16,
                                }}
                            >
                                Top Leaderboard
                            </p>
                            {leaderboardTop3.length === 0 ? (
                                <p style={{ fontSize: 13, color: "#999999" }}>
                                    Belum ada data.
                                </p>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                    }}
                                >
                                    {leaderboardTop3.map((e, idx) => (
                                        <div
                                            key={e.user_id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color:
                                                        idx === 0
                                                            ? "#92400e"
                                                            : "#999999",
                                                    width: 20,
                                                }}
                                            >
                                                #{idx + 1}
                                            </span>
                                            <span
                                                style={{
                                                    flex: 1,
                                                    fontSize: 13,
                                                    color: "#1a1a1a",
                                                }}
                                            >
                                                {e.name}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: "#1a5c41",
                                                }}
                                            >
                                                {e.score}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upcoming events */}
                        <div
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
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: 16,
                                }}
                            >
                                Events (7 hari)
                            </p>
                            {upcomingEvents.length === 0 ? (
                                <p style={{ fontSize: 13, color: "#999999" }}>
                                    Tidak ada event mendatang.
                                </p>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                    }}
                                >
                                    {upcomingEvents.map((ev) => (
                                        <div
                                            key={ev.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                    background:
                                                        ev.type === "training"
                                                            ? "#e8f0ec"
                                                            : "#eff6ff",
                                                    color:
                                                        ev.type === "training"
                                                            ? "#1a5c41"
                                                            : "#1e3a5f",
                                                    padding: "2px 6px",
                                                    borderRadius: 4,
                                                    textTransform: "capitalize",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {ev.type}
                                            </span>
                                            <span
                                                style={{
                                                    flex: 1,
                                                    fontSize: 13,
                                                    color: "#1a1a1a",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {ev.name}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "#999999",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {fmt(ev.event_date)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* MEMBER VIEW */}
            {isMember && (
                <>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 16,
                            marginBottom: 24,
                        }}
                    >
                        <StatCard
                            label="Rocks Saya (On Track)"
                            value={stats.rocks_on_track}
                            color="#1a5c41"
                            href="/rocks"
                        />
                        <StatCard
                            label="To-Do Overdue"
                            value={stats.todos_overdue}
                            color={
                                stats.todos_overdue > 0 ? "#991b1b" : "#1a5c41"
                            }
                            href="/todos"
                        />
                    </div>
                    <MemberBottom
                        selfLeaderboard={selfLeaderboard}
                        upcomingEvents={upcomingEvents}
                        upcomingMeeting={upcomingMeeting}
                        countdown={countdown}
                        fmtDatetime={fmtDatetime}
                        fmt={fmt}
                    />
                </>
            )}

            {/* TUTOR VIEW */}
            {isTutor && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <StatCard
                            label="To-Do Overdue"
                            value={stats.todos_overdue}
                            color={
                                stats.todos_overdue > 0 ? "#991b1b" : "#1a5c41"
                            }
                            href="/todos"
                        />
                    </div>
                    <MemberBottom
                        selfLeaderboard={selfLeaderboard}
                        upcomingEvents={upcomingEvents}
                        upcomingMeeting={null}
                        countdown={countdown}
                        fmtDatetime={fmtDatetime}
                        fmt={fmt}
                    />
                </>
            )}
        </AuthenticatedLayout>
    );
}

function MemberBottom({
    selfLeaderboard,
    upcomingEvents,
    upcomingMeeting,
    countdown,
    fmtDatetime,
    fmt,
}: any) {
    return (
        <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
            {/* Skor leaderboard diri sendiri */}
            <div
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
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 16,
                    }}
                >
                    Skor Leaderboard
                </p>
                {selfLeaderboard ? (
                    <div>
                        <p
                            style={{
                                fontSize: 36,
                                fontWeight: 600,
                                color: "#1a5c41",
                                margin: 0,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {selfLeaderboard.score}%
                        </p>
                        <p
                            style={{
                                fontSize: 13,
                                color: "#6b6b6b",
                                margin: "8px 0 0",
                            }}
                        >
                            Rank #{selfLeaderboard.rank} dari{" "}
                            {selfLeaderboard.total}
                        </p>
                    </div>
                ) : (
                    <p style={{ fontSize: 13, color: "#999999" }}>
                        Belum ada data leaderboard.
                    </p>
                )}
            </div>

            {/* Upcoming events */}
            <div
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
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 16,
                    }}
                >
                    Events Mendatang
                </p>
                {upcomingEvents.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#999999" }}>
                        Tidak ada event.
                    </p>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        {upcomingEvents.map((ev: any) => (
                            <div
                                key={ev.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 500,
                                        background:
                                            ev.type === "training"
                                                ? "#e8f0ec"
                                                : "#eff6ff",
                                        color:
                                            ev.type === "training"
                                                ? "#1a5c41"
                                                : "#1e3a5f",
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {ev.type}
                                </span>
                                <span
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        color: "#1a1a1a",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {ev.name}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "#999999",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {fmt(ev.event_date)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming meeting (hanya member, bukan tutor) */}
            {upcomingMeeting && (
                <div
                    style={{
                        background: "#ffffff",
                        border: "1px solid #e4e4e4",
                        borderRadius: 18,
                        padding: 24,
                        gridColumn: "span 2",
                    }}
                >
                    <p
                        style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#999999",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 12,
                        }}
                    >
                        L10 Terdekat
                    </p>
                    <p
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#1a1a1a",
                            margin: 0,
                        }}
                    >
                        {upcomingMeeting.title ?? "L10 Meeting"}
                    </p>
                    <p
                        style={{
                            fontSize: 13,
                            color: "#6b6b6b",
                            margin: "4px 0 0",
                        }}
                    >
                        {fmtDatetime(upcomingMeeting.scheduled_at)} ·{" "}
                        {countdown(upcomingMeeting.scheduled_at)}
                    </p>
                </div>
            )}
        </div>
    );
}
