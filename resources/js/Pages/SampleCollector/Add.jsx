import AddForm from './Components/Form';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";

const Add = () => {
    const {data, setData, post, errors, setError, clearErrors} = useForm({
        name: "",
        email: "",
    });

    const handleSubmit = () => post(route('sample-collectors.store'));

    const handleCancel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('sample-collectors.index'));
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
        title: "Add New Sample Collector",
        link: "",
        icon: null
    }
]

Add.layout = page => <AuthenticatedLayout auth={page.props.auth}
                                          children={page}
                                          breadcrumbs={breadCrumbs}/>
export default Add;
