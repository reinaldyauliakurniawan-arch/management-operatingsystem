import { Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Card, CardContent } from "@/Components/ui/card";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import DeleteUserForm from "./Partials/DeleteUserForm";

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout>
            <Head title="Profil" />
            <PageHeader title="Profil" subtitle="Kelola informasi akun kamu" />

            <div className="flex flex-col gap-xl max-w-xl">
                <Card>
                    <CardContent className="pt-xl">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-xl">
                        <UpdatePasswordForm />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-xl">
                        <DeleteUserForm />
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
