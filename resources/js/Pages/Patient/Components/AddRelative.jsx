import Dialog from "@mui/material/Dialog";
import {
    CircularProgress,
    DialogActions,
    Step,
    StepLabel,
    Stepper,
    DialogContent,
    Typography,
    Box,
    Paper,
    Divider,
    Slide,
    IconButton
} from "@mui/material";
import PatientIdForm from "@/Pages/Patient/Components/PatientIdForm";
import PatientForm from "@/Pages/Patient/Components/PatientForm";
import {useEffect, useState, forwardRef} from "react";
import Button from "@mui/material/Button";
import {getPatientByIdNo} from "@/Pages/Patient/Components/Form.jsx";
import countries from "@/Data/Countries.js";
import {
    Close as CloseIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    PersonAdd as PersonAddIcon,
    Badge as BadgeIcon,
    Person as PersonIcon
} from "@mui/icons-material";

// Slide transition for the dialog
const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const AddRelative = ({
                         open,
                         relative,
                         setRelative,
                         errors,
                         OnSubmit,
                         onClose,
                         processing = false
                     }) => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setRelative({...relative, [e.target.name]: e.target.value});

    useEffect(() => {
        if (relative.id && open) {
            next();
        } else {
            setStep(0);
        }
    }, [open]);

    const next = async () => {
        switch (step) {
            case 0:
                if (!relative.idNo) {
                    // If no ID provided, just show validation error
                    setRelative({...relative, idNo: ""});
                    return;
                }
                setLoading(true);
                await getPatientByIdNo(relative.idNo, findPatientCallBack);
                break;
            case 1:
                OnSubmit();
                break;
        }
    };

    const findPatientCallBack = (response) => {
        setLoading(false);
        setStep(step + 1);
        if (response) {
            const {id = null, nationality = null, ...res} = response.data
            setRelative(prevRelative => ({
                ...prevRelative,
                relative_id: id,
                ...res,
                nationality: countries.find((item) => item.code === nationality) ?? null,
            }));
        }
    };

    const back = () => setStep(step - 1);

    // Get step title and icon based on current step
    const getStepInfo = () => {
        const steps = [
            {title: "Enter ID/Passport Number", icon: <BadgeIcon color="primary"/>},
            {title: "Complete Relative Information", icon: <PersonIcon color="primary"/>}
        ];
        return steps[step] || steps[0];
    };

    const {title, icon} = getStepInfo();

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth="md"
            slots={{transition: Transition}}
            onClose={loading ? null : onClose}
            sx={{
                '& .MuiDialog-paper': {
                    borderRadius: 2,
                    overflow: 'hidden'
                }
            }}
        >
            {/* Custom Dialog Header */}
            <Paper
                elevation={1}
                square
                sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    position: 'relative',
                    py: 2,
                    px: 3
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <PersonAddIcon sx={{mr: 1.5}}/>
                    <Typography variant="h6">
                        {relative.id ? "Edit Family Member" : "Add Family Member"}
                    </Typography>
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    disabled={loading}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'primary.contrastText',
                    }}
                >
                    <CloseIcon/>
                </IconButton>
            </Paper>

            <DialogContent sx={{px: 3, py: 3}}>
                {!loading ? (
                    <>
                        {/* Step indicator with title */}
                        <Box sx={{mb: 3}}>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                {icon}
                                <Typography variant="subtitle1" sx={{ml: 1, fontWeight: 'medium'}}>
                                    {title}
                                </Typography>
                            </Box>

                            <Stepper
                                activeStep={step}
                                alternativeLabel
                                sx={{mb: 2}}
                            >
                                <Step key={0}>
                                    <StepLabel>ID/Passport Number</StepLabel>
                                </Step>
                                <Step key={1}>
                                    <StepLabel>Personal Information</StepLabel>
                                </Step>
                            </Stepper>

                            <Divider/>
                        </Box>

                        {/* Form content based on current step */}
                        <Box sx={{minHeight: '300px'}}>
                            {step === 0 && (
                                <Box sx={{maxWidth: '600px', mx: 'auto', py: 2}}>
                                    <PatientIdForm data={relative} onChange={handleChange}/>
                                    <Typography variant="body2" color="text.secondary"
                                                sx={{mt: 2, textAlign: 'center'}}>
                                        Enter the ID number or passport number to search for an existing patient record
                                        or create a new one.
                                    </Typography>
                                </Box>
                            )}

                            {step === 1 && (
                                <PatientForm
                                    data={relative}
                                    errors={errors}
                                    onChange={handleChange}
                                    withRelative={true}
                                />
                            )}
                        </Box>
                    </>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '300px'
                        }}
                    >
                        <CircularProgress size={60} thickness={4}/>
                        <Typography variant="body1" sx={{mt: 3}}>
                            Searching for patient records...
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <Divider/>

            <DialogActions sx={{px: 3, py: 2}}>
                <Button
                    onClick={onClose}
                    disabled={loading}
                    variant="outlined"
                    color="inherit"
                    startIcon={<CloseIcon/>}
                >
                    Cancel
                </Button>

                <Box sx={{flex: '1 1 auto'}}/>

                {step > 0 && (
                    <Button
                        onClick={back}
                        disabled={loading}
                        variant="outlined"
                        startIcon={<ArrowBackIcon/>}
                        sx={{mr: 1}}
                    >
                        Back
                    </Button>
                )}

                <Button
                    onClick={next}
                    disabled={loading || processing}
                    variant="contained"
                    color={step === 1 ? "success" : "primary"}
                    endIcon={step === 0 ? <ArrowForwardIcon/> : <PersonAddIcon/>}
                >
                    {step === 0 ? "Next" : (relative.id ? "Update" : "Add")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddRelative;
