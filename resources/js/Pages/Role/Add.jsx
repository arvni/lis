import AddForm from './Components/Form';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";

const Add = ({permissions, ...props}) => {
    const {data, setData, post, processing} = useForm({name: "", permissions: []});
    const handleSubmit = () => post(route('roles.store'));
    const handleCancel = () => router.visit(route('roles.index'));
    return (<AddForm data={data}
                     setData={setData}
                     submit={handleSubmit}
                     permissions={permissions}
                     cancel={handleCancel}/>);
}

const breadCrumbs = [
    {
        title: "Roles",
        link: route("roles.index"),
        icon: null,
    },
    {
        title: "Add New Role",
        link: "",
        icon: null
    }
]

Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
export default Add;
