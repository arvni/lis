import React, {useState, Suspense} from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    Paper,
    Alert,
    Checkbox,
    FormControlLabel,
    IconButton,
    Slide,
    FormHelperText,
    Switch,
    Grid2 as Grid
} from "@mui/material";
import {
    Close as CloseIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    Save as SaveIcon,
    LocalHospital as LocalHospitalIcon,
    Science as ScienceIcon,
    Receipt as ReceiptIcon,
} from "@mui/icons-material";

// Transition component for dialog
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

import TestsSection from "@/Pages/Acceptance/Components/TestsSection";
import useAcceptanceFormState from "@/Pages/Acceptance/Components/hooks/useAcceptanceFormState.js";


// Report Section Component
const ReportSection = ({data, errors, onChange}) => {

    return (
        <Box sx={{p: 2}}>
            <Grid container spacing={3}>
                {/* Out Patient Toggle */}
                <Grid size={{xs: 12, sm: 6}}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={data?.out_patient || false}
                                onChange={(e) => onChange('out_patient', e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Out Patient"
                    />
                </Grid>

                {/* Send to Referrer option for referred patients */}
                {
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!!data?.howReport?.sendToReferrer}
                                    onChange={e => onChange('howReport.sendToReferrer', e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={`Send a copy to Referrer (${data.referrer.fullName})`}
                        />
                        {errors?.["howReport.sendToReferrer"] && (
                            <FormHelperText error>{errors["howReport.sendToReferrer"]}</FormHelperText>
                        )}
                    </Grid>
                }
            </Grid>
        </Box>
    );
};

// Main Acceptance Form Dialog Component
const AcceptanceFormDialog = ({
                                  open = false,
                                  onClose,
                                  initialData = {},
                                  errors = {},
                                  onSubmit,
                                  setData,
                                  maxDiscount = 0,
                                  requestedTests = []
                              }) => {
    const [activeStep, setActiveStep] = useState(0);
    const correctedInitialData = {
        referenceCode: "",
        out_patient: false,
        howReport: {
            sendToReferrer: false
        },
        acceptanceItems: {
            tests: [],
            panels: []
        },
        ...initialData
    };

    const steps = [
        {label: "Tests Selection", icon: <ScienceIcon/>},
        {label: "Sampling & Delivery", icon: <LocalHospitalIcon/>},
        {label: "Review & Submit", icon: <ReceiptIcon/>}
    ];

    const {
        data,
        testModalState,
        panelModalState,
        deleteConfirmState,
        handlers
    } = useAcceptanceFormState(correctedInitialData, maxDiscount);
    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        onSubmit && onSubmit(data);
    };

    const hasStepErrors = (step) => {
        if (!errors) return false;
        switch (step) {
            case 0:
                return Boolean(errors.acceptanceItems);
            case 1:
                return Boolean(
                    errors["howReport.sendToReferrer"]
                );
            default:
                return false;
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <TestsSection
                        data={data}
                        errors={errors}
                        testModalState={testModalState}
                        panelModalState={panelModalState}
                        deleteConfirmState={deleteConfirmState}
                        handlers={handlers}
                        requestedTests={requestedTests}
                    />
                );
            case 1:
                return (
                    <ReportSection
                        data={data}
                        errors={errors}
                        onChange={handlers.handleFormChange}
                    />
                );
            case 2:
                return (
                    <Box sx={{p: 2}}>
                        <Typography variant="h6" gutterBottom>Review Your Information</Typography>
                        <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>

                            {
                                <Box sx={{mt: 2}}>
                                    <Typography variant="subtitle1" color="primary" gutterBottom>
                                        Referral Information
                                    </Typography>
                                    <Typography variant="body2">
                                        Reference Code: {data.referenceCode || "N/A"}
                                    </Typography>
                                </Box>
                            }


                            <Box sx={{mt: 2}}>
                                <Typography variant="subtitle1" color="primary" gutterBottom>
                                    Sampling & Delivery
                                </Typography>
                                <Typography variant="body2">
                                    Out Patient: {data.out_patient ? "Yes" : "No"}
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            slots={{transition: Transition}}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Typography variant="h5">New Acceptance Form</Typography>
                <IconButton onClick={onClose}>
                    <CloseIcon/>
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                {/* Stepper */}
                <Box sx={{p: 3, borderBottom: 1, borderColor: 'divider'}}>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((step, index) => (
                            <Step key={step.label} completed={activeStep > index}>
                                <StepLabel error={hasStepErrors(index)}>
                                    {step.label}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                {/* Error Alert */}
                {Object.keys(errors).length > 0 && (
                    <Alert severity="error" sx={{m: 2}}>
                        Please correct the errors before proceeding.
                    </Alert>
                )}

                {/* Step Content */}
                <Box sx={{flex: 1, overflow: 'auto'}}>
                    <Suspense fallback={<Box sx={{p: 3}}>Loading...</Box>}>
                        {renderStepContent(activeStep)}
                    </Suspense>
                </Box>
            </DialogContent>

            <DialogActions sx={{p: 3, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between'}}>
                <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    startIcon={<ArrowBackIcon/>}
                    variant="outlined"
                    size="large"
                >
                    Back
                </Button>

                {activeStep === steps.length - 1 ? (
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<SaveIcon/>}
                    >
                        Submit Acceptance
                    </Button>
                ) : (
                    <Button
                        onClick={handleNext}
                        variant="contained"
                        color="primary"
                        size="large"
                        endIcon={<ArrowForwardIcon/>}
                    >
                        Continue
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AcceptanceFormDialog;
