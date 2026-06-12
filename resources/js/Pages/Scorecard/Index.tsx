import { useState } from "react";
import { useForm, Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog";

interface Metric {
    id: number;
    title: string;
    owner: { id: number; name: string };
    goal_value: number;
    comparison_operator: string;
    scores: {
        week_start_date: string;
        actual_value: number;
        status: "green" | "red";
    }[];
}

export default function Index({
    metrics,
    users,
    weeks,
}: {
    metrics: { data: Metric[] };
    users: any[];
    weeks: string[];
}) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title: "",
        owner_id: users[0]?.id || "",
        goal_value: "",
        comparison_operator: ">=",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("scorecard.store"), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const handleLogScore = (metricId: number, week: string, value: string) => {
        if (value === "") return;
        router.post(
            route("scorecard.log"),
            {
                metric_id: metricId,
                week_start_date: week,
                actual_value: value,
            },
            { preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Scorecard
                </h2>
            }
        >
            <Head title="Scorecard" />

            <div className="py-12">
                <div className="mx-auto max-w-full sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-end">
                        <Dialog
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                        >
                            <DialogTrigger
                                render={<Button>Add Metric</Button>}
                            />
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Metric</DialogTitle>
                                </DialogHeader>
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    <div>
                                        <Label>Title</Label>
                                        <Input
                                            value={data.title}
                                            onChange={(e) =>
                                                setData("title", e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Goal Value</Label>
                                            <Input
                                                type="number"
                                                value={data.goal_value}
                                                onChange={(e) =>
                                                    setData(
                                                        "goal_value",
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Operator</Label>
                                            <select
                                                className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md"
                                                value={data.comparison_operator}
                                                onChange={(e) =>
                                                    setData(
                                                        "comparison_operator",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value=">=">
                                                    &gt;=
                                                </option>
                                                <option value="<=">
                                                    &lt;=
                                                </option>
                                                <option value="==">==</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Owner</Label>
                                        <select
                                            className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md"
                                            value={data.owner_id}
                                            onChange={(e) =>
                                                setData(
                                                    "owner_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full"
                                    >
                                        Save Metric
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card className="glass overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">
                                        Metric
                                    </TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Goal</TableHead>
                                    {weeks.map((week) => (
                                        <TableHead
                                            key={week}
                                            className="text-center min-w-[100px]"
                                        >
                                            {new Date(week).toLocaleDateString(
                                                undefined,
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                },
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {metrics.data.map((metric) => (
                                    <TableRow key={metric.id}>
                                        <TableCell className="font-medium">
                                            {metric.title}
                                        </TableCell>
                                        <TableCell>
                                            {metric.owner.name}
                                        </TableCell>
                                        <TableCell>
                                            {metric.comparison_operator}{" "}
                                            {metric.goal_value}
                                        </TableCell>
                                        {weeks.map((week) => {
                                            const score = metric.scores.find(
                                                (s) =>
                                                    s.week_start_date === week,
                                            );
                                            return (
                                                <TableCell
                                                    key={week}
                                                    className="p-1"
                                                >
                                                    <Input
                                                        type="number"
                                                        className={`text-center h-8 ${score?.status === "red" ? "bg-red-100 dark:bg-red-900/30" : score?.status === "green" ? "bg-green-100 dark:bg-green-900/30" : ""}`}
                                                        defaultValue={
                                                            score?.actual_value ??
                                                            ""
                                                        }
                                                        onBlur={(e) =>
                                                            handleLogScore(
                                                                metric.id,
                                                                week,
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
