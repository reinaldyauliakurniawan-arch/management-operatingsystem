import { Link, usePage, router } from "@inertiajs/react";
import { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import {
    LayoutDashboard,
    Target,
    Network,
    Users,
    LineChart,
    AlertCircle,
    Mountain,
    CheckSquare,
    CalendarClock,
    Award,
    CalendarDays,
    Trophy,
    UsersRound,
    Workflow,
} from "lucide-react";

const navGroups = [
    {
        label: "Fundamentals",
        items: [
            {
                label: "Home",
                href: "/dashboard",
                routeName: "dashboard",
                icon: LayoutDashboard,
                external: false,
            },
            {
                label: "VTO",
                href: "/vto",
                routeName: "vto.index",
                icon: Target,
                external: false,
            },
            {
                label: "Accountability Chart",
                href: "/accountability-chart",
                routeName: "accountability.index",
                icon: Network,
                external: false,
            },
            {
                label: "Scorecard",
                href: "/scorecard",
                routeName: "scorecard.index",
                icon: LineChart,
                external: false,
            },
            {
                label: "Core Process",
                href: "https://www.canva.com/design/DAG3C7iUjn0/NMyonqO2Jc6o-6NRC-3I5A/edit?utm_content=DAG3C7iUjn0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
                routeName: null,
                icon: Workflow,
                external: true,
            },
            {
                label: "Issues List",
                href: "/ids",
                routeName: "ids.index",
                icon: AlertCircle,
                external: false,
            },
            {
                label: "Rocks",
                href: "/rocks",
                routeName: "rocks.index",
                icon: Mountain,
                external: false,
            },
            {
                label: "L10 Meeting",
                href: "/l10",
                routeName: "l10.index",
                icon: CalendarClock,
                external: false,
            },
            {
                label: "Weekly Priorities",
                href: "/todos",
                routeName: "todos.index",
                icon: CheckSquare,
                external: false,
            },
        ],
    },
    {
        label: "Proprietary",
        items: [
            {
                label: "Leadership Assessment",
                href: "/leadership-assessment",
                routeName: "leadership-assessment.index",
                icon: Award,
                external: false,
            },
            {
                label: "Teams",
                href: "/teams",
                routeName: "teams.index",
                icon: UsersRound,
                external: false,
            },
            {
                label: "People Analyzer",
                href: "/people-analyzer",
                routeName: "people-analyzer.index",
                icon: Users,
                external: false,
            },
            {
                label: "Events",
                href: "/events",
                routeName: "events.index",
                icon: CalendarDays,
                external: false,
            },
            {
                label: "Leaderboard",
                href: "/leaderboard",
                routeName: "leaderboard.index",
                icon: Trophy,
                external: false,
            },
        ],
    },
];

export default function Authenticated({
    children,
    header,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage().props as any;
    const user = auth.user;
    const userTeams = auth.userTeams ?? [];
    const activeTeamId = auth.activeTeamId;
    const activeTeam = userTeams.find((t: any) => t.id === activeTeamId);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    const switchTeam = (teamId: string) => {
        router.post(
            "/teams/switch",
            { team_id: teamId },
            { preserveScroll: false },
        );
    };

    return (
        <div className="relative flex h-screen overflow-hidden bg-surface">
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
            <aside
                className={`flex flex-col overflow-x-hidden shrink-0 h-screen bg-[#064e3b] border-r border-black/20 transition-all duration-200 ease-in-out z-40 ${
                    mobileOpen
                        ? "fixed inset-y-0 left-0 w-60 shadow-xl"
                        : "hidden md:sticky md:top-0 md:flex"
                }`}
                style={{
                    width: mobileOpen ? undefined : sidebarOpen ? 240 : 56,
                }}
            >
                <div className="border-b border-border px-4 py-3">
                    {sidebarOpen ? (
                        <div>
                            <p className="mb-0.5 text-[var(--font-sm)] font-medium uppercase tracking-[0.06em] text-white/50">
                                Active Team
                            </p>
                            {userTeams.length > 1 ? (
                                <select
                                    value={activeTeamId ?? ""}
                                    onChange={(e) => switchTeam(e.target.value)}
                                    className="w-full bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-[13px] text-white outline-none appearance-none"
                                >
                                    {userTeams.map((t: any) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-[13px] font-medium text-white overflow-hidden text-ellipsis whitespace-nowrap">
                                    {activeTeam?.name ?? "—"}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <span className="text-[13px] font-semibold text-white">
                                {activeTeam?.name?.[0]?.toUpperCase() ?? "J"}
                            </span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto min-h-0 px-2 py-3">
                    {navGroups.map((group) => (
                        <div key={group.label} className="mb-sm">
                            {sidebarOpen && (
                                <p className="px-2.5 mb-1 mt-4 text-[var(--font-sm)] font-medium uppercase tracking-[0.06em] text-white/50">
                                    {group.label}
                                </p>
                            )}
                            <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
                                {group.items.map((item) => {
                                    const href = item.href;
                                    const isActive =
                                        !item.external &&
                                        item.routeName !== null &&
                                        typeof route === "function" &&
                                        route().current(item.routeName);

                                    const cls = `flex items-center gap-2.5 rounded-md text-[13px] no-underline whitespace-nowrap overflow-hidden transition-[background,color] duration-100 ${
                                        isActive
                                            ? "px-2.5 py-1.5 font-medium text-white bg-white/10 border-l-[3px] border-[#059669]"
                                            : "px-2.5 py-1.5 font-normal text-white/60 bg-transparent hover:bg-white/5 hover:text-white border-l-[3px] border-transparent"
                                    } ${!sidebarOpen ? "justify-center" : ""}`;

                                    return (
                                        <li key={href}>
                                            {item.external ? (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={
                                                        !sidebarOpen
                                                            ? item.label
                                                            : undefined
                                                    }
                                                    className={cls}
                                                >
                                                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-white/50"}`} />
                                                    {sidebarOpen && (
                                                        <span>
                                                            {item.label}
                                                        </span>
                                                    )}
                                                </a>
                                            ) : (
                                                <Link
                                                    href={href}
                                                    title={
                                                        !sidebarOpen
                                                            ? item.label
                                                            : undefined
                                                    }
                                                    className={cls}
                                                >
                                                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-white/50"}`} />
                                                    {sidebarOpen && (
                                                        <span>
                                                            {item.label}
                                                        </span>
                                                    )}
                                                </Link>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="border-t border-border px-4 py-3">
                    {sidebarOpen ? (
                        <div className="flex items-center justify-between gap-sm">
                            <div className="min-w-0">
                                <p className="text-[13px] font-medium text-white overflow-hidden text-ellipsis whitespace-nowrap">
                                    {user.name}
                                </p>
                                <p className="text-[var(--font-sm)] text-white/50 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {user.email}
                                </p>
                            </div>
                            <div className="flex gap-sm">
                                <Link
                                    href={route("profile.edit")}
                                    className="text-[var(--font-sm)] text-white/50 bg-transparent border-none cursor-pointer whitespace-nowrap transition-colors duration-150 hover:text-white"
                                >
                                    Profil
                                </Link>
                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="text-[var(--font-sm)] text-white/50 bg-transparent border-none cursor-pointer whitespace-nowrap transition-colors duration-150 hover:text-red-400"
                                >
                                    Logout
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="size-7 rounded-full bg-[#059669] flex items-center justify-center">
                                <span className="text-[var(--font-sm)] font-semibold text-white">
                                    {user.name?.[0]?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                <header className="h-16 shrink-0 min-w-0 flex items-center gap-md px-6 bg-surface-raised border-b border-border shadow-sm">
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="flex md:hidden items-center p-xs bg-transparent border-none cursor-pointer text-text-muted hover:text-text-primary"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <rect
                                y="2"
                                width="16"
                                height="1.5"
                                rx="0.75"
                                fill="currentColor"
                            />
                            <rect
                                y="7.25"
                                width="16"
                                height="1.5"
                                rx="0.75"
                                fill="currentColor"
                            />
                            <rect
                                y="12.5"
                                width="16"
                                height="1.5"
                                rx="0.75"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden md:flex items-center p-xs bg-transparent border-none cursor-pointer text-text-muted transition-colors duration-150 hover:text-text-primary"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <rect
                                y="2"
                                width="16"
                                height="1.5"
                                rx="0.75"
                                fill="currentColor"
                            />
                            <rect
                                y="7.25"
                                width="16"
                                height="1.5"
                                rx="0.75"
                                fill="currentColor"
                            />
                            <rect
                                y="12.5"
                                width="16"
                                height="1.5"
                                rx="0.75"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                    <span className="text-[13px] font-medium text-text-secondary">
                        {activeTeam?.name}
                    </span>
                </header>

                <main className="flex-1 overflow-y-auto px-6 py-8 w-full">
                    <div className="max-w-7xl mx-auto">
                        {header}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
