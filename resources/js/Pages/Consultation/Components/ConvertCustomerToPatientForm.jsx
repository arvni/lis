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
    IconButton,
    Alert,
    Fade,
    useTheme,
    useMediaQuery
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
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import {useForm} from "@inertiajs/react";

// Slide transition for the dialog
const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const ConvertCustomerToPatientForm = ({time, open, onClose}) => {
    console.log(time);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [feedback, setFeedback] = useState({
        show: false,
        message: "",
        severity: "info"
    });

    const {data, setData, post, processing, errors, clearErrors, reset, setError} = useForm({
        fullName: time?.reservable?.name || "",
        phone: time?.reservable?.phone || "",
        _method: "put"
    });

    // Clear feedback message after 5 seconds
    useEffect(() => {
        if (feedback.show) {
            const timer = setTimeout(() => {
                setFeedback(prev => ({...prev, show: false}));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [feedback.show]);

    // Handle form changes
    const handleChange = (e) => {
        const {name, value} = e.target;
        setData(prevData => ({...prevData, [name]: value}));

        // Clear specific error when user starts typing
        if (errors[name]) {
            clearErrors(name);
        }
    };

    // Handle form submission
    const handleSubmit = () => {
        // Validate form before submission
        const requiredFields = ['fullName', 'phone', 'idNo', 'nationality', 'avatar'];
        let hasError = false;

        requiredFields.forEach(field => {
            if (!data[field]) {
                setError(field, 'This field is required');
                hasError = true;
            }
        });

        if (hasError) {
            setFeedback({
                show: true,
                message: "Please fill in all required fields",
                severity: "error"
            });
            return;
        }

        setLoading(true);
        // Submit form data to server
        post(route("update-customer-to-patient", time.id), {
            onSuccess: () => {
                setLoading(false);
                setSuccess(true);
                setFeedback({
                    show: true,
                    message: data.patient_id ? "Patient information updated successfully" : "Patient added successfully",
                    severity: "success"
                });
                onClose();
                reset();
            },
            onError: (errors) => {
                setLoading(false);
                setFeedback({
                    show: true,
                    message: "There was an error processing your request",
                    severity: "error"
                });
            }
        });
    };

    // Navigate to next step
    const next = async () => {
        switch (step) {
            case 0:
                if (!data.idNo || data.idNo.trim() === "") {
                    setError('idNo', 'Please enter an ID or passport number');
                    setFeedback({
                        show: true,
                        message: "Please enter an ID or passport number",
                        severity: "error"
                    });
                    return;
                }

                setLoading(true);
                setFeedback({
                    show: true,
                    message: "Searching for patient records...",
                    severity: "info"
                });

                try {
                    await getPatientByIdNo(data.idNo, findPatientCallBack);
                } catch (error) {
                    setLoading(false);
                    setFeedback({
                        show: true,
                        message: "Failed to search for patient. Please try again.",
                        severity: "error"
                    });
                }
                break;

            case 1:
                handleSubmit();
                break;
        }
    };

    // Callback for patient search
    const findPatientCallBack = ({data: patientData = {}}) => {
        const {nationality = null,id=null} = patientData;

        // Find matching nationality from countries list
        if (id) {
            const matchedNationality = nationality
                ? countries.find((item) => item.code === nationality) || null
                : null;
            setData(prevData => ({
                ...prevData,
                ...patientData,
                nationality: matchedNationality,
            }));
        }

        setLoading(false);
        setStep(step + 1);

        // Show appropriate feedback
        setFeedback({
            show: true,
            message: id ? "Patient found. You can update their information." : "Creating new patient record.",
            severity: "info"
        });
    };

    // Go back to previous step
    const back = () => {
        setStep(step - 1);
        clearErrors();
    };

    // Get step information for current step
    const getStepInfo = () => {
        const steps = [
            {
                title: "Enter ID/Passport Number",
                icon: <BadgeIcon color="primary"/>,
                description: "Search for existing patient or create new one"
            },
            {
                title: "Complete Patient Information",
                icon: <PersonIcon color="primary"/>,
                description: "Fill in or update patient details"
            }
        ];
        return steps[step] || steps[0];
    };

    const {title, icon, description} = getStepInfo();

    // Handle dialog close with confirmation if needed
    const handleDialogClose = () => {
        if (loading || processing) {
            return; // Don't allow closing while processing
        }

        if (step === 1 && !success) {
            // Could add confirmation dialog here
            if (window.confirm("Are you sure you want to cancel? Your changes will be lost.")) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth="md"
            fullScreen={isMobile}
            slots={{transition: Transition}}
            onClose={handleDialogClose}
            sx={{
                '& .MuiDialog-paper': {
                    borderRadius: isMobile ? 0 : 2,
                    overflow: 'hidden'
                }
            }}
        >
            {/* Custom Dialog Header */}
            <Paper
                elevation={3}
                square
                sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    position: 'relative',
                    py: 2,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <PersonAddIcon sx={{mr: 1.5}}/>
                    <Typography variant="h6" component="h2">
                        Convert to Patient
                    </Typography>
                </Box>

                <IconButton
                    aria-label="close"
                    onClick={handleDialogClose}
                    disabled={loading || processing}
                    size="large"
                    sx={{
                        color: 'primary.contrastText',
                    }}
                >
                    <CloseIcon/>
                </IconButton>
            </Paper>

            {/* Feedback Alert */}
            <Fade in={feedback.show}>
                <Alert
                    severity={feedback.severity}
                    sx={{
                        borderRadius: 0,
                        '& .MuiAlert-message': {width: '100%'}
                    }}
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => setFeedback(prev => ({...prev, show: false}))}
                        >
                            <CloseIcon fontSize="inherit"/>
                        </IconButton>
                    }
                >
                    {feedback.message}
                </Alert>
            </Fade>

            <DialogContent sx={{px: 3, py: 3}}>
                {success ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '300px'
                        }}
                    >
                        <CheckCircleIcon color="success" sx={{fontSize: 60}}/>
                        <Typography variant="h6" sx={{mt: 2}}>
                            {data.patient_id ? "Patient Updated" : "Patient Added"}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{mt: 1, textAlign: 'center'}}>
                            The patient information has been successfully {data.patient_id ? "updated" : "added"}.
                        </Typography>
                    </Box>
                ) : loading ? (
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
                            {step === 0 ? "Searching for patient records..." : "Processing your request..."}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Step indicator with title */}
                        <Box sx={{mb: 3}}>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                                {icon}
                                <Box sx={{ml: 1}}>
                                    <Typography variant="subtitle1" sx={{fontWeight: 'medium'}}>
                                        {title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {description}
                                    </Typography>
                                </Box>
                            </Box>

                            <Stepper
                                activeStep={step}
                                alternativeLabel
                                sx={{mt: 3, mb: 2}}
                            >
                                <Step key={0}>
                                    <StepLabel>ID/Passport</StepLabel>
                                </Step>
                                <Step key={1}>
                                    <StepLabel>Personal Info</StepLabel>
                                </Step>
                            </Stepper>

                            <Divider/>
                        </Box>

                        {/* Form content based on current step */}
                        <Box sx={{minHeight: '300px'}}>
                            {step === 0 && (
                                <Box sx={{maxWidth: '600px', mx: 'auto', py: 2}}>
                                    <PatientIdForm
                                        data={data}
                                        onChange={handleChange}
                                        errors={errors}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                next();
                                            }
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{mt: 2, textAlign: 'center'}}
                                    >
                                        Enter the ID number or passport number to search for an existing patient record
                                        or create a new one.
                                    </Typography>
                                </Box>
                            )}

                            {step === 1 && (
                                <PatientForm
                                    data={data}
                                    errors={errors}
                                    onChange={handleChange}
                                    isEditing={!!data.patient_id}
                                />
                            )}
                        </Box>
                    </>
                )}
            </DialogContent>

            {!success && <Divider/>}

            <DialogActions sx={{px: 3, py: 2}}>
                {!success && (
                    <>
                        <Button
                            onClick={handleDialogClose}
                            disabled={loading || processing}
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
                                disabled={loading || processing}
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
                            {step === 0 ? "Next" : (data.patient_id ? "Update Patient" : "Add Patient")}
                        </Button>
                    </>
                )}

                {success && (
                    <Button
                        onClick={onClose}
                        variant="contained"
                        color="primary"
                        fullWidth={isMobile}
                    >
                        Close
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ConvertCustomerToPatientForm;
