import {Step, StepLabel, Stepper} from "@mui/material";
import Container from "@mui/material/Container";
import PatientForm from "./PatientForm";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PatientIdForm from "@/Pages/Patient/Components/PatientIdForm";
import React, {useEffect, useState} from "react";
import countries from "@/Data/Countries";
import {router} from "@inertiajs/react";

export const getPatientByIdNo = (idNo, callback) => axios.get(route('api.patients.getByIdNo', {idNo}))
    .then(res => callback(res.data))
    .catch((e) => callback(e));

export default function ({data, setData, back, edit, next, step, ...rest}) {
    const [errors, setErrors] = useState({});
    useEffect(() => {
        if (rest.relative)
            setData(prevData => ({
                ...prevData,
                relatives: [...prevData.relatives, {...rest.relative.data, relationship: ""}]
            }));
    }, [rest.relative]);
    const handlePatientChange = e => {
        setData(prevData => ({
            ...prevData,
            [e.target.name]: e.target.value
        }))
    };
    const handleNext = () => {
        switch (step) {
            case 0:
                getPatientByIdNo(data.idNo, findPatientCallBack);
                break;
            case 1:
                if (checkPatientForm())
                    next();
                break;
        }
    }
    const checkPatientForm = () => {
        let tmp = {}
        if (!data.fullName)
            tmp = {fullName: "Please Enter Full Name"};
        if (!data.nationality || !countries.filter((item) => item.code == data.nationality.code).length)
            tmp = {...tmp, nationality: "Please Select Nationality"};
        if (!data.dateOfBirth)
            tmp = {...tmp, dateOfBirth: "Please Select Date Of Birth"};
        if (!data.phone)
            tmp = {
                ...tmp,
                phone: "Please Enter a Valid Phone Number",
            };
        if (!data.avatar)
            tmp = {...tmp, avatar: "Please Upload IDCard Or Passport"};
        if (!data.gender)
            tmp = {...tmp, gender: "Please Select Gender"};
        setErrors(tmp);
        return !Object.keys(tmp).length;
    }
    const findPatientCallBack = (res) => {
        if (res?.data?.id) {
            router.visit(route('patients.show', res.data.id));
            setData(prevData => ({...prevData, ...res.data}));
        }
        next()
    }

    return (
        <Container sx={{p: "1em"}}>
            <Typography variant="h4">{`${edit ? "Edit" : "Add New"} Patient`}</Typography>
            <Divider sx={{my: "1em"}}/>
            <Stepper activeStep={step} alternativeLabel sx={{my: "1em"}}>
                <Step key={0}>
                    <StepLabel>ID No.</StepLabel>
                </Step>
                <Step key={1}>
                    <StepLabel>Information</StepLabel>
                </Step>
            </Stepper>
            <Divider sx={{my: "2em"}}/>
            {step == 0 && <PatientIdForm data={data} onChange={handlePatientChange}/>}
            {step == 1 && <PatientForm data={data} errors={errors} edit={edit} onChange={handlePatientChange}/>}
            <Divider sx={{my: "1em"}}/>
            <Grid container flex justifyItems="flex-end" justifyContent="flex-end" spacing={2}>
                <Grid>
                    <Button onClick={back}>Back</Button>
                </Grid>
                <Grid>
                    <Button variant="contained" onClick={handleNext}>Next</Button>
                </Grid>
            </Grid>
        </Container>
    );
}
