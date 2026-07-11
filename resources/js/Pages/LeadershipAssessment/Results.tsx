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
interface ResultItem {
    item: string;
    self: number | null;
    assessors: AssessorScore[];
    final: number | null;
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

export default function Results({
    cycle,
    assessee,
    byType,
    overallAvg,
}: {
    cycle: Cycle;
    assessee: User;
    byType: TypeResult[];
    overallAvg: number | null;
}) {
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

            {overallAvg !== null && (
                <Card className="mb-xl">
                    <CardContent>
                        <p className="text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
                            Rata-rata Keseluruhan
                        </p>
                        <p className="mt-sm text-[var(--font-2xl)] font-semibold text-primary">
                            {overallAvg.toFixed(2)}
                            <span className="text-[var(--font-md)] text-text-muted">
                                {" "}
                                / 5
                            </span>
                        </p>
                        {cycle.status === "closed" && (
                            <Badge variant="neutral" className="mt-md">
                                Cycle ditutup
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            )}

            {byType.length === 0 ? (
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
                                    {group.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-lg border border-border px-lg py-md"
                                        >
                                            <div className="mb-sm flex items-center justify-between">
                                                <span className="text-[var(--font-base)] font-medium text-text-primary">
                                                    {item.item}
                                                </span>
                                                <Badge variant="success">
                                                    Final {item.final ?? "—"}
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
                                                            {a.label}: {a.level}
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
