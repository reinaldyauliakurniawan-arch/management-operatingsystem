import { Link, usePage } from "@inertiajs/react";
import { PropsWithChildren, ReactNode, useState } from "react";

type NavItem = {
    label: string;
    href: string;
    routeName: string;
};

const navGroups = [
    {
        label: "EOS Core",
        items: [
            { label: "Dashboard", href: "/dashboard", routeName: "dashboard" },
            { label: "VTO", href: "/vto", routeName: "vto.index" },
            {
                label: "Accountability Chart",
                href: "/accountability-chart",
                routeName: "accountability-chart.index",
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
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage().props as any;
    const user = auth.user;
    const userTeams = auth.userTeams ?? [];
    const activeTeamId = auth.activeTeamId;
    const activeTeam = userTeams.find((t: any) => t.id === activeTeamId);

    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex min-h-screen bg-[#f7f7f6]">
            {/* Sidebar */}
            <aside
                className={`flex flex-col border-r border-[#ebebea] bg-[#f7f7f6] transition-all duration-200 ${sidebarOpen ? "w-60" : "w-14"}`}
                style={{ minHeight: "100vh" }}
            >
                {/* Team Switcher */}
                <div className="border-b border-[#ebebea] px-3 py-3">
                    {sidebarOpen ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-500 text-[#9b9b98] uppercase tracking-wider">
                                    Active Team
                                </p>
                                <p className="text-sm font-600 text-[#1a1a19] truncate max-w-[150px]">
                                    {activeTeam?.name ?? "—"}
                                </p>
                            </div>
                            {userTeams.length > 1 && (
                                <select
                                    className="text-xs border border-[#ebebea] rounded-lg bg-white px-2 py-1 text-[#6b6b69] focus:outline-none focus:border-[#059669]"
                                    value={activeTeamId ?? ""}
                                    onChange={(e) => {
                                        fetch("/teams/switch", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                                "X-CSRF-TOKEN": (
                                                    document.querySelector(
                                                        "meta[name=csrf-token]",
                                                    ) as HTMLMetaElement
                                                )?.content,
                                            },
                                            body: JSON.stringify({
                                                team_id: e.target.value,
                                            }),
                                        }).then(() => window.location.reload());
                                    }}
                                >
                                    {userTeams.map((t: any) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <span className="text-lg font-bold text-[#059669]">
                                J
                            </span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
                    {navGroups.map((group) => (
                        <div key={group.label}>
                            {sidebarOpen && (
                                <p className="px-2 mb-1 text-[11px] font-500 text-[#9b9b98] uppercase tracking-wider">
                                    {group.label}
                                </p>
                            )}
                            <ul className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = route().current(
                                        item.routeName,
                                    );
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                                                    isActive
                                                        ? "bg-[#d1fae5] text-[#065f46] border-l-2 border-[#059669] pl-[6px]"
                                                        : "text-[#6b6b69] hover:bg-[#ebebea] hover:text-[#1a1a19]"
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
                <div className="border-t border-[#ebebea] px-3 py-3">
                    {sidebarOpen ? (
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-500 text-[#1a1a19] truncate">
                                    {user.name}
                                </p>
                                <p className="text-xs text-[#9b9b98] truncate">
                                    {user.email}
                                </p>
                            </div>
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="text-xs text-[#9b9b98] hover:text-[#dc2626] transition-colors whitespace-nowrap"
                            >
                                Logout
                            </Link>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="w-7 h-7 rounded-full bg-[#d1fae5] flex items-center justify-center">
                                <span className="text-xs font-600 text-[#065f46]">
                                    {user.name?.[0]?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Topbar */}
                <header className="h-12 border-b border-[#ebebea] bg-white flex items-center px-6 gap-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-[#9b9b98] hover:text-[#1a1a19] transition-colors"
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
                    <span className="text-sm text-[#9b9b98]">
                        {activeTeam?.name}
                    </span>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6 max-w-[1280px] w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
