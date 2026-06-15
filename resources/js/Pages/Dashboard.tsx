import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Card, CardContent } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";

interface DashboardProps {
    stats: {
        rocks_total: number;
        rocks_on_track: number;
        rocks_off_track: number;
        rocks_done: number;
        issues_open: number;
        todos_overdue: number;
        todos_due_today: number;
        scorecard_red: number;
        my_rocks?: { id: number; title: string; status: string }[];
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
    leaderboardTop3ByRole: Record<
        string,
        { user_id: number; name: string; role: string; score: number }[]
    >;
    selfLeaderboard: {
        score: number;
        rank: number | null;
        total: number;
    } | null;
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
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const countdown = (s: string) => {
    const now = new Date();
    const target = new Date(s.includes("T") ? s : s + "T00:00:00");
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
    );
    const diff = Math.ceil((targetDay.getTime() - nowDay.getTime()) / 86400000);
    if (diff <= 0) return "Hari ini";
    if (diff === 1) return "Besok";
    return `${diff} hari lagi`;
};

function StatCard({
    label,
    value,
    valueColor = "text-text-primary",
    sub,
    href,
}: {
    label: string;
    value: number | string;
    valueColor?: string;
    sub?: string;
    href?: string;
}) {
    const inner = (
        <Card>
            <CardContent>
                <p className="mb-sm text-[12px] font-medium uppercase tracking-wide text-text-muted">
                    {label}
                </p>
                <p
                    className={`text-[24px] font-semibold leading-none tracking-tight ${valueColor}`}
                >
                    {value}
                </p>
                {sub && (
                    <p className="mt-xs text-[12px] text-text-muted">{sub}</p>
                )}
            </CardContent>
        </Card>
    );
    return href ? (
        <Link href={href} className="block no-underline">
            {inner}
        </Link>
    ) : (
        inner
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-md text-[12px] font-medium uppercase tracking-wider text-text-muted">
            {children}
        </p>
    );
}

export default function Dashboard({
    stats,
    role,
    upcomingMeeting,
    upcomingEvents,
    leaderboardTop3ByRole = {},
    selfLeaderboard,
}: DashboardProps) {
    const { auth } = usePage().props as any;
    const isLeader = role === "leader";
    const isMember = role === "member";
    const isTutor = role === "tutor";

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <PageHeader
                title="Dashboard"
                subtitle={`${auth.user.name} · ${role ?? "—"}`}
            />

            {/* LEADER VIEW */}
            {isLeader && (
                <>
                    <SectionLabel>Rocks Tim</SectionLabel>
                    <div className="mb-2xl grid grid-cols-4 gap-lg">
                        <StatCard
                            label="Total Rocks"
                            value={stats.rocks_total}
                            href="/rocks"
                        />
                        <StatCard
                            label="On Track"
                            value={stats.rocks_on_track}
                            valueColor="text-primary"
                            href="/rocks"
                        />
                        <StatCard
                            label="Off Track"
                            value={stats.rocks_off_track}
                            valueColor={
                                stats.rocks_off_track > 0
                                    ? "text-error-text"
                                    : "text-text-primary"
                            }
                            href="/rocks"
                        />
                        <StatCard
                            label="Done"
                            value={stats.rocks_done}
                            valueColor="text-text-secondary"
                            href="/rocks"
                        />
                    </div>

                    <SectionLabel>Weekly Pulse</SectionLabel>
                    <div className="mb-2xl grid grid-cols-3 gap-lg">
                        <StatCard
                            label="Scorecard Merah"
                            value={stats.scorecard_red}
                            valueColor={
                                stats.scorecard_red > 0
                                    ? "text-error-text"
                                    : "text-primary"
                            }
                            href="/scorecard"
                        />
                        <StatCard
                            label="Issues Open"
                            value={stats.issues_open}
                            valueColor={
                                stats.issues_open > 0
                                    ? "text-warning-text"
                                    : "text-primary"
                            }
                            href="/ids"
                        />
                        <StatCard
                            label="To-Do Overdue"
                            value={stats.todos_overdue}
                            valueColor={
                                stats.todos_overdue > 0
                                    ? "text-error-text"
                                    : "text-primary"
                            }
                            href="/todos"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-lg">
                        {/* Upcoming meeting */}
                        <Card>
                            <CardContent>
                                <p className="mb-lg text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                    L10 Terdekat
                                </p>
                                {upcomingMeeting ? (
                                    <div>
                                        <p className="text-[16px] font-semibold tracking-tight text-text-primary">
                                            {upcomingMeeting.title ??
                                                "L10 Meeting"}
                                        </p>
                                        <p className="mt-xs text-[13px] text-text-secondary">
                                            {fmtDatetime(
                                                upcomingMeeting.scheduled_at,
                                            )}
                                        </p>
                                        <Badge variant="info" className="mt-md">
                                            {countdown(
                                                upcomingMeeting.scheduled_at,
                                            )}
                                        </Badge>
                                    </div>
                                ) : (
                                    <p className="text-[13px] text-text-muted">
                                        Tidak ada meeting terjadwal.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top leaderboard per role */}
                        <Card>
                            <CardContent>
                                <p className="mb-lg text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                    Top Leaderboard
                                </p>
                                {Object.keys(leaderboardTop3ByRole).length ===
                                0 ? (
                                    <p className="text-[13px] text-text-muted">
                                        Belum ada data.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-md">
                                        {Object.entries(
                                            leaderboardTop3ByRole,
                                        ).map(([roleKey, entries]) => (
                                            <div key={roleKey}>
                                                <p className="mb-xs text-[11px] font-medium uppercase text-text-muted">
                                                    {roleKey}
                                                </p>
                                                <div className="flex flex-col gap-xs">
                                                    {entries.map((e, idx) => (
                                                        <div
                                                            key={e.user_id}
                                                            className="flex items-center gap-md"
                                                        >
                                                            <span
                                                                className={`w-5 text-[13px] font-semibold ${idx === 0 ? "text-warning-text" : "text-text-muted"}`}
                                                            >
                                                                #{idx + 1}
                                                            </span>
                                                            <span className="flex-1 text-[13px] text-text-primary">
                                                                {e.name}
                                                            </span>
                                                            <span className="text-[13px] font-semibold text-primary">
                                                                {e.score}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming events */}
                        <Card>
                            <CardContent>
                                <p className="mb-lg text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                    Events (7 hari)
                                </p>
                                {upcomingEvents.length === 0 ? (
                                    <p className="text-[13px] text-text-muted">
                                        Tidak ada event mendatang.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-sm">
                                        {upcomingEvents.map((ev) => (
                                            <div
                                                key={ev.id}
                                                className="flex items-center gap-sm"
                                            >
                                                <Badge
                                                    variant={
                                                        ev.type === "training"
                                                            ? "success"
                                                            : "info"
                                                    }
                                                >
                                                    {ev.type}
                                                </Badge>
                                                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-text-primary">
                                                    {ev.name}
                                                </span>
                                                <span className="shrink-0 text-[12px] text-text-muted">
                                                    {fmt(ev.event_date)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* MEMBER VIEW */}
            {isMember && (
                <>
                    {stats.my_rocks && stats.my_rocks.length > 0 && (
                        <>
                            <SectionLabel>Rocks Saya</SectionLabel>
                            <Card className="mb-xl">
                                <CardContent className="flex flex-col gap-sm pt-xl">
                                    {stats.my_rocks.map((rock) => (
                                        <div
                                            key={rock.id}
                                            className="flex items-center justify-between rounded-lg border border-border px-lg py-md"
                                        >
                                            <span className="text-[13px] text-text-primary">
                                                {rock.title}
                                            </span>
                                            <Badge
                                                variant={
                                                    rock.status === "on_track"
                                                        ? "success"
                                                        : rock.status ===
                                                            "off_track"
                                                          ? "error"
                                                          : "neutral"
                                                }
                                            >
                                                {rock.status.replace("_", " ")}
                                            </Badge>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </>
                    )}
                    <div className="mb-xl grid grid-cols-3 gap-lg">
                        <StatCard
                            label="Rocks Saya (On Track)"
                            value={stats.rocks_on_track}
                            valueColor="text-primary"
                            href="/rocks"
                        />
                        <StatCard
                            label="To-Do Hari Ini"
                            value={stats.todos_due_today}
                            valueColor={
                                stats.todos_due_today > 0
                                    ? "text-warning-text"
                                    : "text-primary"
                            }
                            href="/todos"
                        />
                        <StatCard
                            label="To-Do Overdue"
                            value={stats.todos_overdue}
                            valueColor={
                                stats.todos_overdue > 0
                                    ? "text-error-text"
                                    : "text-primary"
                            }
                            href="/todos"
                        />
                    </div>
                    <MemberBottomSection
                        selfLeaderboard={selfLeaderboard}
                        upcomingEvents={upcomingEvents}
                        upcomingMeeting={upcomingMeeting}
                    />
                </>
            )}

            {/* TUTOR VIEW */}
            {isTutor && (
                <>
                    <div className="mb-xl grid grid-cols-2 gap-lg">
                        <StatCard
                            label="To-Do Hari Ini"
                            value={stats.todos_due_today}
                            valueColor={
                                stats.todos_due_today > 0
                                    ? "text-warning-text"
                                    : "text-primary"
                            }
                            href="/todos"
                        />
                        <StatCard
                            label="To-Do Overdue"
                            value={stats.todos_overdue}
                            valueColor={
                                stats.todos_overdue > 0
                                    ? "text-error-text"
                                    : "text-primary"
                            }
                            href="/todos"
                        />
                    </div>
                    <MemberBottomSection
                        selfLeaderboard={selfLeaderboard}
                        upcomingEvents={upcomingEvents}
                        upcomingMeeting={null}
                    />
                </>
            )}
            {!isLeader && !isMember && !isTutor && (
                <Card>
                    <CardContent className="py-xl text-center text-[14px] text-text-muted">
                        Akunmu belum terdaftar sebagai anggota team. Hubungi
                        leader untuk mendapatkan akses.
                    </CardContent>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}

function MemberBottomSection({
    selfLeaderboard,
    upcomingEvents,
    upcomingMeeting,
}: {
    selfLeaderboard: {
        score: number;
        rank: number | null;
        total: number;
    } | null;
    upcomingEvents: {
        id: number;
        name: string;
        type: string;
        event_date: string;
    }[];
    upcomingMeeting: {
        id: number;
        title: string | null;
        scheduled_at: string;
    } | null;
}) {
    return (
        <div className="grid grid-cols-2 gap-lg">
            <Card>
                <CardContent>
                    <p className="mb-lg text-[12px] font-medium uppercase tracking-wider text-text-muted">
                        Skor Leaderboard
                    </p>
                    {selfLeaderboard ? (
                        <>
                            <p className="text-[24px] font-semibold leading-none tracking-tight text-primary">
                                {selfLeaderboard.score}%
                            </p>
                            <p className="mt-sm text-[13px] text-text-secondary">
                                {selfLeaderboard.rank !== null
                                    ? `Rank #${selfLeaderboard.rank} dari ${selfLeaderboard.total}`
                                    : `Dari ${selfLeaderboard.total} peserta`}
                            </p>
                        </>
                    ) : (
                        <p className="text-[13px] text-text-muted">
                            Belum ada data leaderboard.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <p className="mb-lg text-[12px] font-medium uppercase tracking-wider text-text-muted">
                        Events Mendatang
                    </p>
                    {upcomingEvents.length === 0 ? (
                        <p className="text-[13px] text-text-muted">
                            Tidak ada event.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-sm">
                            {upcomingEvents.map((ev) => (
                                <div
                                    key={ev.id}
                                    className="flex items-center gap-sm"
                                >
                                    <Badge
                                        variant={
                                            ev.type === "training"
                                                ? "success"
                                                : "info"
                                        }
                                    >
                                        {ev.type}
                                    </Badge>
                                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-text-primary">
                                        {ev.name}
                                    </span>
                                    <span className="shrink-0 text-[12px] text-text-muted">
                                        {fmt(ev.event_date)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {upcomingMeeting && (
                <Card className="col-span-2">
                    <CardContent>
                        <p className="mb-sm text-[12px] font-medium uppercase tracking-wider text-text-muted">
                            L10 Terdekat
                        </p>
                        <p className="text-[16px] font-semibold tracking-tight text-text-primary">
                            {upcomingMeeting.title ?? "L10 Meeting"}
                        </p>
                        <p className="mt-xs text-[13px] text-text-secondary">
                            {fmtDatetime(upcomingMeeting.scheduled_at)} ·{" "}
                            {countdown(upcomingMeeting.scheduled_at)}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
