import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";

interface AssessorScore {
    label: string;
    level: number;
}
interface RubricLevel {
    level: number;
    description: string;
}
interface ResultItem {
    itemId: number;
    item: string;
    self: number | null;
    assessors: AssessorScore[];
    final: number | null;
    rubrics: RubricLevel[];
}
interface TypeResult {
    type: string;
    avg: number | null;
    items: ResultItem[];
}
interface User {
    id: number;
    name: string;
}
interface Cycle {
    id: number;
    name: string;
    status: string;
}
interface AllTeamsTypeResult {
    type: string;
    avg: number | null;
}
interface AllTeamsResult {
    teamCount: number;
    cycleCount: number;
    byType: AllTeamsTypeResult[];
    overallAvg: number | null;
}

export default function Results({
    cycle,
    assessee,
    byType,
    overallAvg,
    allTeams,
}: {
    cycle: Cycle;
    assessee: User;
    byType: TypeResult[];
    overallAvg: number | null;
    allTeams: AllTeamsResult;
}) {
    const [scope, setScope] = useState<"team" | "all">("team");
    const showingAll = scope === "all";
    const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

    return (
        <AuthenticatedLayout>
            <Head title={`Hasil Assessment — ${assessee.name}`} />

            <PageHeader
                title={`Hasil: ${assessee.name}`}
                subtitle={cycle.name}
                action={
                    <Link href={route("leadership-assessment.index")}>
                        <Button variant="secondary">← Kembali</Button>
                    </Link>
                }
            />

            {allTeams.teamCount > 1 && (
                <div className="mb-lg flex gap-xs">
                    <Button
                        variant={showingAll ? "secondary" : "default"}
                        onClick={() => setScope("team")}
                    >
                        Team Ini
                    </Button>
                    <Button
                        variant={showingAll ? "default" : "secondary"}
                        onClick={() => setScope("all")}
                    >
                        Semua Team ({allTeams.teamCount})
                    </Button>
                </div>
            )}

            {(showingAll ? allTeams.overallAvg : overallAvg) !== null && (
                <Card className="mb-xl">
                    <CardContent>
                        <p className="text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
                            {showingAll
                                ? `Rata-rata Gabungan (${allTeams.cycleCount} cycle, ${allTeams.teamCount} team)`
                                : "Rata-rata Keseluruhan"}
                        </p>
                        <p className="mt-sm text-[var(--font-2xl)] font-semibold text-primary">
                            {(showingAll ? allTeams.overallAvg! : overallAvg!).toFixed(2)}
                            <span className="text-[var(--font-md)] text-text-muted">
                                {" "}
                                / 5
                            </span>
                        </p>
                        {!showingAll && cycle.status === "closed" && (
                            <Badge variant="neutral" className="mt-md">
                                Cycle ditutup
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            )}

            {showingAll ? (
                allTeams.byType.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center text-[var(--font-base)] text-text-muted">
                            Belum ada response lintas team untuk assessee ini.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-xl">
                        {allTeams.byType.map((group) => (
                            <Card key={group.type}>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[var(--font-base)] font-semibold text-text-primary">
                                            {group.type}
                                        </h2>
                                        <Badge variant="info">
                                            Final {group.avg ?? "—"}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            ) : byType.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center text-[var(--font-base)] text-text-muted">
                        Belum ada response untuk assessee ini.
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col gap-xl">
                    {byType.map((group) => (
                        <Card key={group.type}>
                            <CardContent>
                                <div className="mb-lg flex items-center justify-between">
                                    <h2 className="text-[var(--font-base)] font-semibold text-text-primary">
                                        {group.type}
                                    </h2>
                                    <Badge variant="info">
                                        Final {group.avg ?? "—"}
                                    </Badge>
                                </div>
                                <div className="flex flex-col gap-md">
                                    {group.items.map((item, idx) => {
                                        const isExpanded =
                                            expandedItemId === item.itemId;
                                        const finalLevel = item.final
                                            ? Math.round(item.final)
                                            : null;
                                        return (
                                            <div
                                                key={idx}
                                                className="rounded-lg border border-border px-lg py-md cursor-pointer"
                                                onClick={() =>
                                                    setExpandedItemId(
                                                        isExpanded
                                                            ? null
                                                            : item.itemId,
                                                    )
                                                }
                                            >
                                                <div className="mb-sm flex items-center justify-between">
                                                    <span className="text-[var(--font-base)] font-medium text-text-primary">
                                                        {item.item}
                                                    </span>
                                                    <Badge variant="success">
                                                        Final{" "}
                                                        {item.final ?? "—"}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-xs">
                                                    {item.self !== null && (
                                                        <Badge variant="warning">
                                                            Diri Sendiri:{" "}
                                                            {item.self}
                                                        </Badge>
                                                    )}
                                                    {item.assessors.map(
                                                        (a, aIdx) => (
                                                            <Badge
                                                                key={aIdx}
                                                                variant="neutral"
                                                            >
                                                                {a.label}:{" "}
                                                                {a.level}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                                {isExpanded && (
                                                    <div
                                                        className="mt-md flex flex-col gap-xs border-t border-border pt-md"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        {item.rubrics.map(
                                                            (r) => {
                                                                const isFinal =
                                                                    r.level ===
                                                                    finalLevel;
                                                                const isSelf =
                                                                    r.level ===
                                                                    item.self;
                                                                return (
                                                                    <div
                                                                        key={
                                                                            r.level
                                                                        }
                                                                        className={`rounded-sm px-md py-sm ${
                                                                            isFinal
                                                                                ? "bg-success-subtle border border-success-text"
                                                                                : isSelf
                                                                                  ? "bg-warning-subtle border border-warning-text"
                                                                                  : "bg-surface-subtle"
                                                                        }`}
                                                                    >
                                                                        <div className="mb-2xs flex items-center gap-xs">
                                                                            <Badge
                                                                                variant={
                                                                                    isFinal
                                                                                        ? "success"
                                                                                        : isSelf
                                                                                          ? "warning"
                                                                                          : "neutral"
                                                                                }
                                                                            >
                                                                                Level{" "}
                                                                                {
                                                                                    r.level
                                                                                }
                                                                            </Badge>
                                                                            {isFinal && (
                                                                                <span className="text-[var(--font-sm)] font-medium text-success-text">
                                                                                    Posisi kamu (final)
                                                                                </span>
                                                                            )}
                                                                            {isSelf &&
                                                                                !isFinal && (
                                                                                    <span className="text-[var(--font-sm)] font-medium text-warning-text">
                                                                                        Penilaian dirimu
                                                                                    </span>
                                                                                )}
                                                                        </div>
                                                                        <p className="text-[var(--font-sm)] text-text-secondary">
                                                                            {
                                                                                r.description
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
