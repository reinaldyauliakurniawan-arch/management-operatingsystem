import { Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

interface VTOData {
    id: number;
    core_values: string[];
    core_focus_purpose: string;
    core_focus_niche: string;
    ten_year_target: string;
    target_market: string;
    three_uniques: string;
    proven_process: string;
    guarantee: string;
    three_year_date: string;
    three_year_revenue: string;
    three_year_profit: string;
    three_year_measurables: string;
    three_year_look: string[];
    one_year_date: string;
    one_year_revenue: string;
    one_year_profit: string;
    one_year_measurables: string;
    one_year_goals: string[];
}

export default function VTOIndex({ vto }: { vto: { data: VTOData } }) {
    const { data, setData, post, processing, errors } = useForm({
        ...vto.data,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('vto.update'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Vision/Traction Organizer
                </h2>
            }
        >
            <Head title="V/TO" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <Tabs defaultValue="vision" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="vision">Vision</TabsTrigger>
                                <TabsTrigger value="traction">Traction</TabsTrigger>
                            </TabsList>

                            <TabsContent value="vision" className="space-y-6 pt-6">
                                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header>
                                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>Core Values</CardTitle>
                                    </CardHeader>
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content className="space-y-4">
                                        {/* Simplified Core Values for now */}
                                        <Textarea
                                            placeholder="Enter core values, one per line"
                                            value={Array.isArray(data.core_values) ? data.core_values.join('\n') : ''}
                                            onChange={(e) => setData('core_values', e.target.value.split('\n'))}
                                        />
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header>
                                            <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>Core Focus</CardTitle>
                                        </CardHeader>
                                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content className="space-y-4">
                                            <div>
                                                <Label>Purpose/Cause/Passion</Label>
                                                <Input value={data.core_focus_purpose} onChange={e => setData('core_focus_purpose', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Niche</Label>
                                                <Input value={data.core_focus_niche} onChange={e => setData('core_focus_niche', e.target.value)} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header>
                                            <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>10-Year Target</CardTitle>
                                        </CardHeader>
                                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content>
                                            <Input value={data.ten_year_target} onChange={e => setData('ten_year_target', e.target.value)} />
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="traction" className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header>
                                            <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>3-Year Picture</CardTitle>
                                        </CardHeader>
                                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content className="space-y-4">
                                            <div>
                                                <Label>Date</Label>
                                                <Input type="date" value={data.three_year_date || ''} onChange={e => setData('three_year_date', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Revenue</Label>
                                                <Input type="number" value={data.three_year_revenue} onChange={e => setData('three_year_revenue', e.target.value)} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header>
                                            <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>1-Year Plan</CardTitle>
                                        </CardHeader>
                                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content className="space-y-4">
                                            <div>
                                                <Label>Date</Label>
                                                <Input type="date" value={data.one_year_date || ''} onChange={e => setData('one_year_date', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Revenue</Label>
                                                <Input type="number" value={data.one_year_revenue} onChange={e => setData('one_year_revenue', e.target.value)} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                Save V/TO
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

