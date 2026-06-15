import { Link, usePage, router } from "@inertiajs/react";
import { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";

const navGroups = [
    {
        label: "EOS Core",
        items: [
            { label: "Dashboard", href: "/dashboard", routeName: "dashboard" },
            { label: "VTO", href: "/vto", routeName: "vto.index" },
            {
                label: "Accountability Chart",
                href: "/accountability-chart",
                routeName: "accountability.index",
            },
            {
                label: "People Analyzer",
                href: "/people-analyzer",
                routeName: "people-analyzer.index",
            },
            {
                label: "Scorecard",
                href: "/scorecard",
                routeName: "scorecard.index",
            },
            { label: "Issues / IDS", href: "/ids", routeName: "ids.index" },
            { label: "Rocks", href: "/rocks", routeName: "rocks.index" },
            { label: "To-Do", href: "/todos", routeName: "todos.index" },
            { label: "L10 Meeting", href: "/l10", routeName: "l10.index" },
        ],
    },
    {
        label: "Proprietary",
        items: [
            {
                label: "Leadership Assessment",
                href: "/leadership-assessment",
                routeName: "leadership-assessment.index",
            },
            { label: "Events", href: "/events", routeName: "events.index" },
            {
                label: "Leaderboard",
                href: "/leaderboard",
                routeName: "leaderboard.index",
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

    const switchTeam = (teamId: string) => {
        router.post(
            "/teams/switch",
            { team_id: teamId },
            { preserveScroll: false },
        );
    };

    return (
        <div className="flex h-screen overflow-hidden bg-surface-subtle">
            {/* Sidebar */}
            <aside
                className="sticky top-0 flex flex-col overflow-x-hidden shrink-0 h-screen bg-surface-subtle border-r border-border transition-[width] duration-200 ease-in-out"
                style={{ width: sidebarOpen ? 240 : 56 }}
            >
                {/* Team Switcher */}
                <div className="border-b border-border p-md">
                    {sidebarOpen ? (
                        <div>
                            <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
                                Active Team
                            </p>
                            {userTeams.length > 1 ? (
                                <select
                                    value={activeTeamId ?? ""}
                                    onChange={(e) => switchTeam(e.target.value)}
                                    className="w-full bg-surface-raised border border-border rounded-lg px-sm py-xs text-[13px] text-text-primary outline-none appearance-none"
                                >
                                    {userTeams.map((t: any) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-[13px] font-medium text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
                                    {activeTeam?.name ?? "—"}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <span className="text-[14px] font-semibold text-primary">
                                {activeTeam?.name?.[0]?.toUpperCase() ?? "J"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto min-h-0 px-sm py-md">
                    {navGroups.map((group) => (
                        <div key={group.label} className="mb-sm">
                            {sidebarOpen && (
                                <p className="px-sm mb-xs mt-md text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
                                    {group.label}
                                </p>
                            )}
                            <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
                                {group.items.map((item) => {
                                    const isActive =
                                        typeof route === "function" &&
                                        route().current(item.routeName);
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-sm rounded-sm text-[13px] no-underline whitespace-nowrap overflow-hidden transition-[background,color] duration-100 border-l-2 ${
                                                    isActive
                                                        ? "pl-[6px] pr-sm py-[6px] font-medium text-primary bg-primary-subtle border-primary"
                                                        : "px-sm py-[6px] font-normal text-text-secondary bg-transparent border-transparent hover:bg-surface-overlay hover:text-text-primary"
                                                }`}
                                            >
                                                {sidebarOpen && (
                                                    <span>{item.label}</span>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* User Menu */}
                <div className="border-t border-border p-md">
                    {sidebarOpen ? (
                        <div className="flex items-center justify-between gap-sm">
                            <div className="min-w-0">
                                <p className="text-[13px] font-medium text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
                                    {user.name}
                                </p>
                                <p className="text-[11px] text-text-muted overflow-hidden text-ellipsis whitespace-nowrap">
                                    {user.email}
                                </p>
                            </div>
                            <div className="flex gap-sm">
                                <Link
                                    href={route("profile.edit")}
                                    className="text-[11px] text-text-muted bg-transparent border-none cursor-pointer whitespace-nowrap transition-colors duration-150 hover:text-text-primary"
                                >
                                    Profil
                                </Link>
                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="text-[11px] text-text-muted bg-transparent border-none cursor-pointer whitespace-nowrap transition-colors duration-150 hover:text-error-text"
                                >
                                    Logout
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="size-7 rounded-full bg-primary-subtle flex items-center justify-center">
                                <span className="text-[11px] font-semibold text-primary">
                                    {user.name?.[0]?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-12 shrink-0 min-w-0 flex items-center gap-md px-xl bg-surface border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="flex items-center p-xs bg-transparent border-none cursor-pointer text-text-muted transition-colors duration-150 hover:text-text-primary"
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
                    <span className="text-[13px] text-text-muted">
                        {activeTeam?.name}
                    </span>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-xl w-full">
                    <div className="max-w-[1280px] mx-auto">
                        {header}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
