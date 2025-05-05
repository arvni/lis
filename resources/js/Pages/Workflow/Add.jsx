import AddForm from './Components/Form';;
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";

const Add = () => {
    const {data, setData, post,errors} = useForm({
        name: "",
        section_workflows: [],
        description: "",
        status: true
    });
    const handleSubmit = () => post(route('workflows.store'))
    const handleCancel = () => router.visit(route('workflows.index'));
    return <AddForm data={data}
                    errors={errors}
                    setData={setData}
                    submit={handleSubmit}
                    cancel={handleCancel}/>;
}

const breadCrumbs = [
    {
        title: "Workflows",
        link: route("workflows.index"),
        icon: null,
    },
    {
        title: "Add New Workflow",
        link: "",
        icon: null
    }
]

Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
export default Add;
