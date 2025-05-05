import AddForm from './Components/Form';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";

const Edit = ({permissions, role}) => {
    const {data, setData, post, processing} = useForm({...role, _method: "put"});
    const handleSubmit = () => post(route('roles.update', role.id));
    const handleCancel = () => router.visit(route('roles.index'));
    return (
            <AddForm data={data}
                     edit
                     setData={setData}
                     submit={handleSubmit}
                     permissions={permissions}
                     cancel={handleCancel}/>
    );
}

const breadCrumbs = [
    {
        title: "Roles",
        link: route("roles.index"),
        icon: null,
    },
    {
        title: "Edit Role",
        link: "",
        icon: null
    }
]

Edit.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
export default Edit;
