import AddForm from './Components/Form';
import {useForm} from "@inertiajs/inertia-react";
import {Inertia} from "@inertiajs/inertia";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const Edit = ({referrer}) => {
    console.log(referrer);
    const {data, setData, post, errors, setError, clearErrors} = useForm({...referrer, _method: "put"});
    const handleSubmit = () => post(route('referrers.update', referrer.id));
    const handleCancel = () => Inertia.visit(route('referrers.index'));
    return (
        <>
            <AddForm data={data} edit setData={setData} submit={handleSubmit} cancel={handleCancel} errors={errors} clearErrors={clearErrors} setError={setError}/>
        </>
    );
}

const breadCrumbs = [
    {
        title: "Referrers",
        link: "/referrers",
        icon: null,
    },
    {
        title: "Edit Referrer",
        link: "",
        icon: null
    }
]

Edit.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
export default Edit;
