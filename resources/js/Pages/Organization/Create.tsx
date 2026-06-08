import { Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('organization.store'));
    };

    return (
        <GuestLayout>
            <Head title="Create Organization" />

            <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="w-full max-w-md mx-auto">
                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header>
                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>Create Organization</CardTitle>
                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Description>
                        To get started with Harmonic System, please create an organization for your team.
                    </CardDescription>
                </CardHeader>
                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Acme Corp"
                                required
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            Create Organization
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
