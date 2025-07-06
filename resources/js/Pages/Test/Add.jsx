import AddForm from './Components/Form';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";

const Add = () => {
    const {data, setData, post, errors, setError, clearErrors} = useForm({
        name: "",
        fullName: "",
        code: "",
        sample_type_tests: [],
        type:'TEST',
        method_tests: [],
        testGroup: "",
        report_templates: [],
        description: "",
        status: true,
        price:0,
        price_type:"Fix",
        extra:{},
        referrer_price:0,
        referrer_price_type:"Fix",
        referrer_extra:{},
    });
    const handleSubmit = () => post(route('tests.store'))
    const handleCancel = () => router.visit(route('tests.index'));
    return (
            <AddForm data={data}
                     setData={setData}
                     submit={handleSubmit}
                     cancel={handleCancel}
                     errors={errors}
                     setError={setError}
                     clearErrors={clearErrors}/>
    );
}

const breadCrumbs = [
    {
        title: "Tests",
        link: route("tests.index"),
        icon: null,
    },
    {
        title: "Add New Test",
        link: "",
        icon: null
    }
]

Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
export default Add;
