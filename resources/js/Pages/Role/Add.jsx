import AddForm from './Components/Form';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';

const Add = ({ permissions, ..._props }) => {
    const { data, setData, post } = useForm({ name: '', permissions: [] });
    const handleSubmit = () => post(route('roles.store'));
    const handleCancel = () => router.visit(route('roles.index'));
    return (
        <>
            <Head title="Add Role" />
            <AddForm
                data={data}
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
        title: 'Add New Role',
        link: '',
        icon: null,
    },
];

Add.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);
export default Add;
