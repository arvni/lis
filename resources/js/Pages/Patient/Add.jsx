import AddForm from './Components/Form';
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {useEffect, useState} from "react";
import {router, useForm} from "@inertiajs/react";

const patient = {
    fullName: "",
    idNo: "",
    nationality: {
        code: "OM",
        label: "Oman"
    },
    idCardInstAvailable: false,
    dateOfBirth: "",
    gender: null,
    avatar: null
}

const Add = (props) => {
    const {data, setData, post, processing} = useForm({});
    const [step, setStep] = useState(0);
    useEffect(() => {
        setData(patient);
    }, []);
    useEffect(() => {
        props.patient ? setData(prevData => ({...prevData, ...props.patient, _method: "put"})) : null;
    }, [props]);
    const save = () => {
        switch (step) {
            case 0:
                console.log("here");
                setStep(1);
                break;
            case 1:
                post(route('patients.store'));
                break;
        }
    };
    const back = () => step > 0 ? setStep(step - 1) : handleCancel();
    const handleCancel = () => router.visit(route('patients.index'));
    return (
        <>
            <AddForm data={data}
                     setData={setData}
                     next={save}
                     back={back}
                     step={step}
                     {...props}/>
            <Backdrop sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}} open={processing}>
                <CircularProgress color="inherit"/>
            </Backdrop>
        </>
    );
}

const breadCrumbs = [
    {
        title: "Patient",
        link: route("patients.index"),
        icon: null,
    },
    {
        title: "Add New Patient",
        link: "",
        icon: null
    }
]

Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
export default Add;
