import { Head, router } from "@inertiajs/react";
import { useState } from "react";
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
interface Assignment {
    id: number;
    leadership_type_id: number;
    leadership_type: LeadershipType;
}
interface User {
    id: number;
    name: string;
}
interface Cycle {
    id: number;
    name: string;
}
interface ExistingResponse {
    item_id: number;
    rubric_level: number;
}

export default function TakeAssessment({
    cycle,
    assessee,
    assignments,
    existingResponses,
}: {
    cycle: Cycle;
    assessee: User;
    assignments: Assignment[];
    existingResponses: Record<number, ExistingResponse>;
}) {
    const initialResponses: Record<number, number> = {};
    Object.values(existingResponses ?? {}).forEach((r) => {
        initialResponses[r.item_id] = r.rubric_level;
    });

    const [responses, setResponses] =
        useState<Record<number, number>>(initialResponses);
    const [customMode, setCustomMode] = useState<Record<number, boolean>>({});
    const [processing, setProcessing] = useState(false);

    const allItems = assignments.flatMap((a) => a.leadership_type.items);
    const answered = Object.keys(responses).length;
    const total = allItems.length;
    const complete = answered === total && total > 0;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route("leadership-assessment.submit", {
                cycle: cycle.id,
                assessee: assessee.id,
            }),
            {
                responses: Object.entries(responses).map(([itemId, level]) => ({
                    item_id: Number(itemId),
                    level,
                })),
            },
            {
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Assessment — ${assessee.name}`} />

            <PageHeader
                title={`Nilai: ${assessee.name}`}
                subtitle={cycle.name}
                action={
                    <Badge variant={complete ? "success" : "warning"}>
                        {answered}/{total} dijawab
                    </Badge>
                }
            />

            <div className="max-w-2xl">
                <form onSubmit={submit} className="flex flex-col gap-xl">
                    {assignments.map((assignment) => (
                        <div key={assignment.id}>
                            <p className="mb-md text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
                                {assignment.leadership_type.name}
                            </p>
                            {assignment.leadership_type.items.map((item) => (
                                <Card key={item.id} className="mb-lg">
                                    <CardContent>
                                        <p className="mb-lg text-[var(--font-base)] font-semibold tracking-tight text-text-primary">
                                            {item.title}
                                        </p>
                                        <div className="flex flex-col gap-sm">
                                            {[...item.rubrics]
                                                .sort(
                                                    (a, b) => a.level - b.level,
                                                )
                                                .map((rubric) => {
                                                    const selected =
                                                        Math.round(
                                                            responses[
                                                                item.id
                                                            ] ?? -1,
                                                        ) === rubric.level;
                                                    return (
                                                        <button
                                                            key={rubric.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setResponses({
                                                                    ...responses,
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
                                                                className={`text-[var(--font-base)] font-semibold uppercase tracking-wider mb-xs ${selected ? "text-primary-text" : "text-text-muted"}`}
                                                            >
                                                                Level{" "}
                                                                {rubric.level}
                                                            </p>
                                                            <p
                                                                className={`text-[var(--font-base)] leading-relaxed ${selected ? "text-primary-text" : "text-text-secondary"}`}
                                                            >
                                                                {
                                                                    rubric.description
                                                                }
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            <div className="flex items-center gap-sm pt-xs">
                                                <label className="flex items-center gap-xs text-[var(--font-base)] text-text-muted">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            customMode[
                                                                item.id
                                                            ] ?? false
                                                        }
                                                        onChange={(e) =>
                                                            setCustomMode({
                                                                ...customMode,
                                                                [item.id]:
                                                                    e.target
                                                                        .checked,
                                                            })
                                                        }
                                                    />
                                                    Nilai desimal manual
                                                </label>
                                                {customMode[item.id] && (
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={5}
                                                        step={0.01}
                                                        value={
                                                            responses[
                                                                item.id
                                                            ] ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            setResponses({
                                                                ...responses,
                                                                [item.id]:
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                            })
                                                        }
                                                        className="w-24 rounded-md border border-border bg-surface px-sm py-xs text-[var(--font-base)]"
                                                        placeholder="mis. 3.78"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
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
