import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';

export default function TakeAssessment({ cycle, assessee, type }: any) {
    const { data, setData, post, processing } = useForm({
        cycle_id: cycle.id,
        assessee_id: assessee.id,
        responses: {} as any
    });

    const submit = (e: any) => {
        e.preventDefault();
        post(route('leadership.submit'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight">Assess: {assessee.name}</h2>}>
            <Head title="Take Assessment" />
            <div className="py-12 max-w-3xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{type.name}</CardTitle>
                        <CardDescription>Select the rubric level that best describes {assessee.name} for each item.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-8">
                            {type.items.map((item: any) => (
                                <div key={item.id} className="space-y-4">
                                    <h3 className="font-bold">{item.title}</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {item.rubrics.sort((a:any, b:any) => a.level - b.level).map((rubric: any) => (
                                            <div
                                                key={rubric.id}
                                                onClick={() => setData('responses', { ...data.responses, [item.id]: rubric.level })}
                                                className={`p-4 border rounded cursor-pointer ${data.responses[item.id] === rubric.level ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                            >
                                                <div className="font-bold">Level {rubric.level}</div>
                                                <div className="text-sm opacity-90">{rubric.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <Button size="lg" className="w-full" disabled={processing || Object.keys(data.responses).length !== type.items.length}>
                                Submit Anonymous Assessment
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
