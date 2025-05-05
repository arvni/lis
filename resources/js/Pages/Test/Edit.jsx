import AddForm from './Components/Form';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";

const Edit = ({test}) => {
    const {data, setData, post, errors, setError, clearErrors} = useForm({...test, _method: "put"});
    const handleSubmit = () => post(route('tests.update', test.id));
    const handleCancel = () => router.visit(route('tests.index'));
    return <AddForm data={data}
                    edit
                    setData={setData}
                    submit={handleSubmit}
                    cancel={handleCancel}
                    errors={errors}
                    clearErrors={clearErrors}
                    setError={setError}/>;
}

const breadCrumbs = [
    {
        title: "Tests",
        link: route("tests.index"),
        icon: null,
    },
    {
        title: "Edit Test",
        link: "",
        icon: null
    }
]

Edit.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
export default Edit;
