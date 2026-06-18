import AddForm from './Components/Form';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';

const Edit = ({ permissions, role }) => {
    const { data, setData, post, processing } = useForm({ ...role, _method: 'put' });
    const handleSubmit = () => post(route('roles.update', role.id));
    const handleCancel = () => router.visit(route('roles.index'));
    return (
        <>
            <Head title={`Edit Role: ${role.name}`} />
            <AddForm
                data={data}
                edit
                setData={setData}
                submit={handleSubmit}
                permissions={permissions}
                cancel={handleCancel}
            />
        </>
    );
};

const breadCrumbs = [
    {
        title: 'Roles',
        link: route('roles.index'),
        icon: null,
    },
    {
        title: 'Edit Role',
        link: '',
        icon: null,
    },
];

Edit.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);
export default Edit;
