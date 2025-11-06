import AddForm from './Components/Form';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm, usePage} from "@inertiajs/react";

const Edit = () => {
    const { collectRequest, sampleCollectors, referrers } = usePage().props;

    const {data, setData, post, errors, setError, clearErrors} = useForm({
        ...collectRequest,
        _method: "put"
    });

    const handleSubmit = () => post(route('collect-requests.update', collectRequest.id));

    const handleCancel = () => router.visit(route('collect-requests.index'));

    return (
        <AddForm
            data={data}
            setData={setData}
            submit={handleSubmit}
            cancel={handleCancel}
            errors={errors}
            clearErrors={clearErrors}
            setError={setError}
            sampleCollectors={sampleCollectors || []}
            referrers={referrers || []}
        />
    );
}

const breadCrumbs = [
    {
        title: "Collect Requests",
        link: route("collect-requests.index"),
        icon: null,
    },
    {
        title: "Edit Collect Request",
        link: "",
        icon: null
    }
]

Edit.layout = page => <AuthenticatedLayout auth={page.props.auth}
                                           children={page}
                                           breadcrumbs={breadCrumbs}/>
export default Edit;
