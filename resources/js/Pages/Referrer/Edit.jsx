import AddForm from './Components/Form';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';

const Edit = ({ referrer }) => {
    const { data, setData, post, errors, setError, clearErrors } = useForm({
        ...referrer,
        _method: 'put',
    });
    const handleSubmit = () => post(route('referrers.update', referrer.id));
    const handleCancel = () => router.visit(route('referrers.index'));
    return (
        <>
            <Head title={`Edit Referrer: ${referrer.fullName}`} />
            <AddForm
                data={data}
                setData={setData}
                submit={handleSubmit}
                cancel={handleCancel}
                errors={errors}
                clearErrors={clearErrors}
                setError={setError}
            />
        </>
    );
};

const breadCrumbs = [
    {
        title: 'Referrers',
        link: route('referrers.index'),
        icon: null,
    },
    {
        title: 'Edit Referrer',
        link: '',
        icon: null,
    },
];

Edit.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs} />
);
export default Edit;
