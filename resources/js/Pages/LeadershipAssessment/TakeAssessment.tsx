import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";

interface Rubric {
    id: number;
    level: number;
    description: string;
}
interface Item {
    id: number;
    title: string;
    rubrics: Rubric[];
}
interface LeadershipType {
    id: number;
    name: string;
    items: Item[];
}
interface User {
    id: number;
    name: string;
}
interface Cycle {
    id: number;
    name: string;
}

export default function TakeAssessment({
    cycle,
    assessee,
    type,
}: {
    cycle: Cycle;
    assessee: User;
    type: LeadershipType;
}) {
    const { data, setData, post, processing } = useForm({
        cycle_id: cycle.id,
        assessee_id: assessee.id,
        responses: {} as Record<number, number>,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("leadership.submit"));
    };

    const answered = Object.keys(data.responses).length;
    const total = type.items.length;
    const complete = answered === total;

    return (
        <AuthenticatedLayout>
            <Head title={`Assessment — ${assessee.name}`} />

            <PageHeader
                title={`Nilai: ${assessee.name}`}
                subtitle={`${cycle.name} · ${type.name}`}
                action={
                    <Badge variant={complete ? "success" : "warning"}>
                        {answered}/{total} dijawab
                    </Badge>
                }
            />

            <div className="max-w-2xl">
                <form onSubmit={submit} className="flex flex-col gap-xl">
                    {type.items.map((item) => (
                        <Card key={item.id}>
                            <CardContent className="pt-xl">
                                <p className="mb-lg text-[14px] font-semibold tracking-tight text-text-primary">
                                    {item.title}
                                </p>
                                <div className="flex flex-col gap-sm">
                                    {[...item.rubrics]
                                        .sort((a, b) => a.level - b.level)
                                        .map((rubric) => {
                                            const selected =
                                                data.responses[item.id] ===
                                                rubric.level;
                                            return (
                                                <button
                                                    key={rubric.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setData("responses", {
                                                            ...data.responses,
                                                            [item.id]:
                                                                rubric.level,
                                                        })
                                                    }
                                                    className={`w-full rounded-lg border px-lg py-md text-left transition-colors ${
                                                        selected
                                                            ? "border-primary bg-primary-subtle"
                                                            : "border-border bg-surface hover:bg-surface-overlay"
                                                    }`}
                                                >
                                                    <p
                                                        className={`text-[12px] font-semibold uppercase tracking-wider mb-xs ${selected ? "text-primary-text" : "text-text-muted"}`}
                                                    >
                                                        Level {rubric.level}
                                                    </p>
                                                    <p
                                                        className={`text-[13px] leading-relaxed ${selected ? "text-primary-text" : "text-text-secondary"}`}
                                                    >
                                                        {rubric.description}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex justify-end pb-xl">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={processing || !complete}
                        >
                            {processing
                                ? "Mengirim…"
                                : "Submit Assessment Anonim"}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
