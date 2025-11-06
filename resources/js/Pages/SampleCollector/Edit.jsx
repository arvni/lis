import AddForm from './Components/Form';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm, usePage} from "@inertiajs/react";

const Edit = () => {
    const { sampleCollector } = usePage().props;

    const {data, setData, post, errors, setError, clearErrors} = useForm({
        ...sampleCollector,
        _method: "put"
    });

    const handleSubmit = () => post(route('sample-collectors.update', sampleCollector.id));

    const handleCancel = () => router.visit(route('sample-collectors.index'));

    return (
        <AddForm
            data={data}
            setData={setData}
            submit={handleSubmit}
            cancel={handleCancel}
            errors={errors}
            clearErrors={clearErrors}
            setError={setError}
        />
    );
}

const breadCrumbs = [
    {
        title: "Sample Collectors",
        link: route("sample-collectors.index"),
        icon: null,
    },
    {
        title: "Edit Sample Collector",
        link: "",
        icon: null
    }
]

Edit.layout = page => <AuthenticatedLayout auth={page.props.auth}
                                           children={page}
                                           breadcrumbs={breadCrumbs}/>
export default Edit;
