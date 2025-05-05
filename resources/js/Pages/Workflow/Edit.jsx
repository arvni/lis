import AddForm from './Components/Form';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {useForm,router} from "@inertiajs/react";

const Edit = ({workflow}) => {
    const {data, setData, post, errors} = useForm({...workflow, _method: "put"});
    const handleSubmit = () => post(route('workflows.update', workflow.id));
    const handleCancel = () => router.visit(route('workflows.index'));
    return (<AddForm data={data}
                     errors={errors}
                     setData={setData}
                     submit={handleSubmit}
                     cancel={handleCancel}/>
    );
}

const breadCrumbs = [
    {
        title: "Workflows",
        link: route("workflows.index"),
        icon: null,
    },
    {
        title: "Edit Workflow",
        link: "",
        icon: null
    }
]

Edit.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
export default Edit;
