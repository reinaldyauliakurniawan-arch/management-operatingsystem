import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";

interface ResultItem {
    item: string;
    level: number;
}
interface TypeResult {
    type: string;
    avg: number;
    count: number;
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
                        <p className="text-[12px] font-medium uppercase tracking-wider text-text-muted">
                            Rata-rata Keseluruhan
                        </p>
                        <p className="mt-sm text-[32px] font-semibold text-primary">
                            {overallAvg.toFixed(2)}
                            <span className="text-[16px] text-text-muted">
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
                    <CardContent className="py-16 text-center text-[13px] text-text-muted">
                        Belum ada response untuk assessee ini.
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col gap-xl">
                    {byType.map((group) => (
                        <Card key={group.type}>
                            <CardContent>
                                <div className="mb-lg flex items-center justify-between">
                                    <h2 className="text-[14px] font-semibold text-text-primary">
                                        {group.type}
                                    </h2>
                                    <Badge variant="info">
                                        Avg {group.avg} ({group.count} respons)
                                    </Badge>
                                </div>
                                <div className="flex flex-col gap-sm">
                                    {group.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between rounded-lg border border-border px-lg py-md"
                                        >
                                            <span className="text-[13px] text-text-primary">
                                                {item.item}
                                            </span>
                                            <Badge variant="neutral">
                                                Level {item.level}
                                            </Badge>
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
