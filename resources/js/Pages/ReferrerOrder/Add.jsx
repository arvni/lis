import AddForm from './Components/Form';
import {useForm} from "@inertiajs/inertia-react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import {Inertia} from "@inertiajs/inertia";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const Add = () => {
    const {data, setData, post, processing, errors, setError, clearErrors} = useForm({
        fullName: "",
        email: "",
        phoneNo: "",
        billingInfo: {
            name: "",
            address: "",
            vatIn: "",
            phone: "",
            email: "",
            city: "",
            country: "",
        },
        isActive: true,
    });
    const handleSubmit = () => {
        post(route('referrers.store'))
    };
    const handleCancel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        Inertia.visit(route('referrers.index'));
    }
    return (
        <>
            <AddForm data={data} setData={setData} submit={handleSubmit}
                     cancel={handleCancel} errors={errors} setError={setError} clearErrors={clearErrors}/>
            <Backdrop sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}} open={processing}>
                <CircularProgress color="inherit"/>
            </Backdrop>
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
        title: "Add New Referrer",
        link: "",
        icon: null
    }
]

Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
export default Add;
