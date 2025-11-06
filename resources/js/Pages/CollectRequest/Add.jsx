import AddForm from './Components/Form';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm, usePage} from "@inertiajs/react";

const Add = () => {
    const { sampleCollectors, referrers } = usePage().props;

    const {data, setData, post, errors, setError, clearErrors} = useForm({
        sample_collector_id: null,
        referrer_id: null,
        logistic_information: {},
    });

    const handleSubmit = () => post(route('collect-requests.store'));

    const handleCancel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('collect-requests.index'));
    };

    return (
        <AddForm
            data={data}
            setData={setData}
            submit={handleSubmit}
            cancel={handleCancel}
            errors={errors}
            setError={setError}
            clearErrors={clearErrors}
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
        title: "Add New Collect Request",
        link: "",
        icon: null
    }
]

Add.layout = page => <AuthenticatedLayout auth={page.props.auth}
                                          children={page}
                                          breadcrumbs={breadCrumbs}/>
export default Add;
