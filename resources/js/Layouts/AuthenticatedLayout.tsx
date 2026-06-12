import { Link, usePage, router } from "@inertiajs/react";
import { PropsWithChildren } from "react";
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

export default function Authenticated({ children }: PropsWithChildren) {
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
        <div className="flex min-h-screen" style={{ background: "#f5f5f5" }}>
            {/* Sidebar */}
            <aside
                style={{
                    width: sidebarOpen ? 240 : 56,
                    minHeight: "100vh",
                    background: "#f5f5f5",
                    borderRight: "1px solid #e4e4e4",
                    display: "flex",
                    flexDirection: "column",
                    transition: "width 200ms ease",
                    flexShrink: 0,
                }}
            >
                {/* Team Switcher */}
                <div
                    style={{
                        borderBottom: "1px solid #e4e4e4",
                        padding: "12px",
                    }}
                >
                    {sidebarOpen ? (
                        <div>
                            <p
                                style={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    color: "#999999",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: 2,
                                }}
                            >
                                Active Team
                            </p>
                            {userTeams.length > 1 ? (
                                <select
                                    value={activeTeamId ?? ""}
                                    onChange={(e) => switchTeam(e.target.value)}
                                    style={{
                                        width: "100%",
                                        background: "#f0f0f0",
                                        border: "1px solid #e4e4e4",
                                        borderRadius: 8,
                                        padding: "4px 8px",
                                        fontSize: 13,
                                        color: "#1a1a1a",
                                        outline: "none",
                                        appearance: "none",
                                    }}
                                >
                                    {userTeams.map((t: any) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: "#1a1a1a",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {activeTeam?.name ?? "—"}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#1a5c41",
                                }}
                            >
                                {activeTeam?.name?.[0]?.toUpperCase() ?? "J"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav
                    style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}
                >
                    {navGroups.map((group) => (
                        <div key={group.label} style={{ marginBottom: 8 }}>
                            {sidebarOpen && (
                                <p
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 500,
                                        color: "#999999",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        padding: "0 8px",
                                        marginBottom: 4,
                                        marginTop: 12,
                                    }}
                                >
                                    {group.label}
                                </p>
                            )}
                            <ul
                                style={{
                                    listStyle: "none",
                                    margin: 0,
                                    padding: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                }}
                            >
                                {group.items.map((item) => {
                                    const isActive =
                                        typeof route === "function" &&
                                        route().current(item.routeName);
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    padding: isActive
                                                        ? "6px 8px 6px 6px"
                                                        : "6px 8px",
                                                    borderRadius: 8,
                                                    fontSize: 13,
                                                    fontWeight: isActive
                                                        ? 500
                                                        : 400,
                                                    color: isActive
                                                        ? "#1a5c41"
                                                        : "#6b6b6b",
                                                    background: isActive
                                                        ? "#e8f0ec"
                                                        : "transparent",
                                                    borderLeft: isActive
                                                        ? "2px solid #1a5c41"
                                                        : "2px solid transparent",
                                                    textDecoration: "none",
                                                    transition:
                                                        "background 100ms, color 100ms",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isActive) {
                                                        (
                                                            e.currentTarget as HTMLElement
                                                        ).style.background =
                                                            "#e8e8e8";
                                                        (
                                                            e.currentTarget as HTMLElement
                                                        ).style.color =
                                                            "#1a1a1a";
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isActive) {
                                                        (
                                                            e.currentTarget as HTMLElement
                                                        ).style.background =
                                                            "transparent";
                                                        (
                                                            e.currentTarget as HTMLElement
                                                        ).style.color =
                                                            "#6b6b6b";
                                                    }
                                                }}
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
                <div
                    style={{ borderTop: "1px solid #e4e4e4", padding: "12px" }}
                >
                    {sidebarOpen ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                            }}
                        >
                            <div style={{ minWidth: 0 }}>
                                <p
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: "#1a1a1a",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {user.name}
                                </p>
                                <p
                                    style={{
                                        fontSize: 11,
                                        color: "#999999",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {user.email}
                                </p>
                            </div>
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                style={{
                                    fontSize: 11,
                                    color: "#999999",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    transition: "color 150ms",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = "#991b1b")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.color = "#999999")
                                }
                            >
                                Logout
                            </Link>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    background: "#e8f0ec",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#1a5c41",
                                    }}
                                >
                                    {user.name?.[0]?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                }}
            >
                {/* Topbar */}
                <header
                    style={{
                        height: 48,
                        borderBottom: "1px solid #e4e4e4",
                        background: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 24px",
                        gap: 12,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        flexShrink: 0,
                    }}
                >
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#999999",
                            padding: 4,
                            display: "flex",
                            alignItems: "center",
                            transition: "color 150ms",
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#1a1a1a")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#999999")
                        }
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
                    <span style={{ fontSize: 13, color: "#999999" }}>
                        {activeTeam?.name}
                    </span>
                </header>

                {/* Content */}
                <main
                    style={{
                        flex: 1,
                        padding: 24,
                        maxWidth: 1280,
                        width: "100%",
                        margin: "0 auto",
                    }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
