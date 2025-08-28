import React, {useState, Suspense, memo} from "react";
import {
    Box,
    Container,
    Typography,
    Divider,
    Button,
    Stepper,
    Step,
    StepLabel,
    Paper,
    Alert,
    Checkbox,
    FormControlLabel, Card, CardContent, Avatar, IconButton
} from "@mui/material";
import useAcceptanceFormState from "./hooks/useAcceptanceFormState";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ScienceIcon from '@mui/icons-material/Science';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DescriptionIcon from "@mui/icons-material/Description";
import EventNoteIcon from '@mui/icons-material/EventNote';
import {
    AccessTime,
    CalendarToday,
    EventAvailable,
    LocalHospital,
    PersonOutlined
} from "@mui/icons-material";
import Grid from "@mui/material/Grid2";
import EditIcon from "@mui/icons-material/Edit";

// Lazy-loaded sections
const FormAccordion = React.lazy(() => import("./FormAccordion"));
const PatientSection = React.lazy(() => import("./PatientSection"));
const TestsSection = React.lazy(() => import("./TestsSection"));
const PrescriptionSection = React.lazy(() => import("./PrescriptionSection"));
const ConsultationForm = React.lazy(() => import("./ConsultationForm"));
const DoctorReferralSection = React.lazy(() => import("./DoctorReferralSection"));
const SamplingDeliverySection = React.lazy(() => import("./ReportSection.jsx"));

const ConsultationCard = memo(({initialData: {patient, consultant, ...consultation}}) => {

    // Format date for better display
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";

        try {
            const date = new Date(dateString);
            return date.toLocaleString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Card elevation={3} sx={{borderRadius: 2, overflow: 'hidden'}}>
            <CardContent sx={{p: 0}}>
                <Box sx={{p: 2, bgcolor: 'background.paper'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                        <Avatar sx={{bgcolor: 'primary.main', mr: 2}}>
                            <PersonOutlined/>
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">{patient.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {patient.age} years • {patient.gender}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{my: 2}}/>

                    <Grid container spacing={2}>
                        <Grid size={6}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <LocalHospital color="primary" fontSize="small"/>
                                <Typography variant="body2" color="text.secondary">Consultant</Typography>
                            </Box>
                            <Typography variant="body2" sx={{mt: 0.5, fontWeight: 500}}>
                                {consultant.name || 'Not assigned'}
                            </Typography>
                        </Grid>

                        <Grid size={6}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <CalendarToday color="primary" fontSize="small"/>
                                <Typography variant="body2" color="text.secondary">Due Date</Typography>
                            </Box>
                            <Typography variant="body2" sx={{mt: 0.5}}>
                                {formatDate(consultation.dueDate)}
                            </Typography>
                        </Grid>

                        {consultation.started_at && (
                            <>
                                <Grid size={6}>
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <EventAvailable color="primary" fontSize="small"/>
                                        <Typography variant="body2" color="text.secondary">Started At</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{mt: 0.5}}>
                                        {formatDate(consultation.started_at)}
                                    </Typography>
                                </Grid>

                                <Grid size={6}>
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <AccessTime color="primary" fontSize="small"/>
                                        <Typography variant="body2" color="text.secondary">Duration</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{mt: 0.5}}>
                                        {consultation.duration} minutes
                                    </Typography>
                                </Grid>
                            </>
                        )}
                    </Grid>

                    {consultation.status === 'done' && (
                        <>
                            <Divider sx={{my: 2}}/>
                            <Box>
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                    Report Summary
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{
                                    maxHeight: 80,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical'
                                }}>
                                    {consultation.information.report || 'No report available'}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
},);

const AcceptanceForm = ({
                            initialData,
                            errors,
                            onSubmit,
                            canAddPrescription = false,
                            maxDiscount,
                            setData,
                            defaultStep = 0
                        }) => {
    // State for stepper
    const [activeStep, setActiveStep] = useState(defaultStep);

    // State for consultation checkbox
    const [needsConsultation, setNeedsConsultation] = useState(Boolean(initialData?.consultation));

    // Updated steps configuration with merged doctor and referral sections
    const steps = [
        {label: "Patient Information", icon: <PersonIcon/>},
        {label: "Consultation Request", icon: <EventNoteIcon/>},
        {label: "Doctor & Referral", icon: <AssignmentIcon/>},
        {label: "Tests Selection", icon: <ScienceIcon/>},
        {label: "Sampling & Delivery", icon: <LocalHospitalIcon/>},
        {label: "Review & Submit", icon: <ReceiptIcon/>}
    ];

    // Use custom hook with memoization
    const {
        data,
        testModalState,
        panelModalState,
        deleteConfirmState,
        handlers
    } = useAcceptanceFormState(initialData, maxDiscount, setData);

    // Navigation functions
    const handleNext = () => {
        // Skip to next step if on consultation page but no consultation needed
        if (activeStep === 1 && needsConsultation && !data.consultation_id)
            return;

        if (activeStep < 2)
            setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));

        // Submit form data after EVERY step (excluding final step which has its own submit button)
        if (activeStep < steps.length - 1)
            onSubmit(data, activeStep, nextStep);
    }

    const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));

    const handleBack = () => {
        setData(prev => ({...prev, step: Math.min(prev?.step * 1 - 1, steps.length - 1)}));
        setActiveStep((prev) => Math.max(prev - 1, 0))
    };
    const handleChangeStep = (step) => () => setActiveStep(step);

    // Helper to check if a step has errors
    const hasStepErrors = (step) => {
        if (!errors) return false;
        switch (step) {
            case 0: // Patient
                return false; // Patient info is read-only
            case 1: // Consultation
                return false; // Simple checkbox, no validation needed
            case 2: // Doctor & Referral
                return Boolean(
                    errors.referrer ||
                    errors.referenceCode
                );
            case 3: // Tests
                return Boolean(errors.acceptanceItems);
            case 4: // Sampling & Delivery
                return Boolean(
                    errors.samplerGender ||
                    errors["howReport.way"] ||
                    errors["howReport.who"]
                );
            default:
                return false;
        }
    };

    // Handle consultation checkbox change
    const handleConsultationChange = (event) => {
        setNeedsConsultation(event.target.checked);
    };

    // Render functions for steps
    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Suspense fallback={<div>Loading...</div>}>
                        <FormAccordion
                            title="Patient Information"
                            id="patient-information"
                            defaultExpanded
                            icon={<PersonIcon/>}
                        >
                            <PatientSection patient={data.patient}/>
                        </FormAccordion>
                    </Suspense>
                );
            case 1:
                return (
                    <Suspense fallback={<div>Loading...</div>}>
                        <FormAccordion
                            title="Consultation Request"
                            id="consultation-request"
                            defaultExpanded
                            icon={<EventNoteIcon/>}
                        >
                            {initialData?.consultation_id ? <Box>
                                {/* Existing consultation details would go here */}
                                <ConsultationCard initialData={initialData.consultation}/>
                            </Box> : <Box sx={{p: 2}}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={needsConsultation}
                                            onChange={handleConsultationChange}
                                            color="primary"
                                        />
                                    }
                                    label="Do you want to schedule a consultation?"
                                />

                                {needsConsultation && (
                                    <Box sx={{mt: 3}}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Consultation Details
                                        </Typography>
                                        <ConsultationForm
                                            patientId={data?.patient?.id}
                                            embedded={true} // To indicate this is embedded, not a dialog
                                        />
                                    </Box>
                                )}
                            </Box>}
                        </FormAccordion>
                    </Suspense>
                );
            case 2:
                return (
                    <Suspense fallback={<div>Loading...</div>}>
                        <FormAccordion
                            title="Doctor & Referral Information"
                            id="doctor-referral"
                            defaultExpanded
                            icon={<AssignmentIcon/>}
                        >
                            <DoctorReferralSection
                                data={data}
                                doctor={data.doctor}
                                errors={errors}
                                onChange={handlers.handleFormChange}
                                onDoctorChange={handlers.handleDoctorChange}
                            />
                        </FormAccordion>
                    </Suspense>
                );
            case 3:
                return (
                    <Suspense fallback={<div>Loading...</div>}>
                        <FormAccordion
                            title="Test Selection"
                            id="test-information"
                            defaultExpanded
                            icon={<ScienceIcon/>}
                        >
                            <TestsSection
                                data={data}
                                errors={errors}
                                testModalState={testModalState}
                                panelModalState={panelModalState}
                                deleteConfirmState={deleteConfirmState}
                                handlers={handlers}
                                maxDiscount={maxDiscount}
                            />
                        </FormAccordion>
                    </Suspense>
                );
            case 4:
                return (
                    <Suspense fallback={<div>Loading...</div>}>
                        <FormAccordion
                            title="Sampling & Delivery"
                            id="sampling-delivery"
                            defaultExpanded
                            icon={<LocalHospitalIcon/>}
                        >
                            <SamplingDeliverySection
                                data={data}
                                errors={errors}
                                onChange={handlers.handleFormChange}
                                referrer={data.referrer}
                            />
                        </FormAccordion>
                    </Suspense>
                );
            case 5:
                return (
                    <Suspense fallback={<div>Loading...</div>}>
                        <Paper elevation={1} sx={{p: 3, mb: 3, borderRadius: 2}}>
                            <Typography variant="h5" sx={{mb: 3}}>Acceptance Summary</Typography>

                            <Box sx={{mb: 3}}>
                                <Typography variant="subtitle1" color="primary" gutterBottom>
                                    Patient Information
                                </Typography>
                                <Box sx={{pl: 2}}>
                                    <Typography variant="body1">
                                        <strong>Name:</strong> {data.patient.fullName}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>ID/Passport:</strong> {data.patient.idNo}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{my: 2}}/>
                            {needsConsultation && (
                                <>
                                    <Box sx={{mb: 3}}>
                                        <Typography variant="subtitle1" color="primary" gutterBottom>
                                            Consultation
                                        </Typography>
                                        <Box sx={{pl: 2}}>
                                            <Typography variant="body1">
                                                <strong>Consultation Requested:</strong> Yes
                                            </Typography>
                                            {/* We would add details about the consultation here */}
                                        </Box>
                                    </Box>
                                    <Divider sx={{my: 2}}/>
                                </>
                            )}

                            <Box sx={{mb: 3}}>
                                <Typography variant="subtitle1" color="primary" gutterBottom>
                                    Referral Information
                                </Typography>
                                <Box sx={{
                                    pl: 2,
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-between"
                                }}>
                                    <Box>
                                        <Typography variant="body1">
                                            <strong>Referred:</strong> {data.referred ? "Yes" : "No"}
                                        </Typography>
                                        {data.referred && (
                                            <>
                                                <Typography variant="body1">
                                                    <strong>Referrer:</strong> {data.referrer ? data.referrer.name : "N/A"}
                                                </Typography>
                                                <Typography variant="body1">
                                                    <strong>Reference Code:</strong> {data.referenceCode || "N/A"}
                                                </Typography>
                                            </>
                                        )}
                                    </Box>
                                    <IconButton onClick={handleChangeStep(2)}><EditIcon/></IconButton>
                                </Box>
                            </Box>
                            {data.doctor && data.doctor.name && (
                                <Box sx={{mb: 3}}>
                                    <Typography variant="subtitle1" color="primary" gutterBottom>
                                        Doctor Information
                                    </Typography>
                                    <Box sx={{
                                        pl: 2,
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between"
                                    }}>
                                        <Box>
                                            <Typography variant="body1">
                                                <strong>Name:</strong> {data.doctor.name}
                                            </Typography>
                                            {data.doctor.expertise && (
                                                <Typography variant="body1">
                                                    <strong>Speciality:</strong> {data.doctor.expertise}
                                                </Typography>
                                            )}
                                            {data.doctor.phone && (
                                                <Typography variant="body1">
                                                    <strong>Phone:</strong> {data.doctor.phone}
                                                </Typography>
                                            )}
                                            {data.doctor.licenseNo && (
                                                <Typography variant="body1">
                                                    <strong>License:</strong> {data.doctor.licenseNo}
                                                </Typography>
                                            )}
                                        </Box>
                                        <IconButton onClick={handleChangeStep(2)}><EditIcon/></IconButton>
                                    </Box>
                                </Box>
                            )}

                            <Divider sx={{my: 2}}/>

                            <Box sx={{mb: 3}}>
                                <Typography variant="subtitle1" color="primary" gutterBottom>
                                    Sampling & Delivery
                                </Typography>
                                <Box sx={{
                                    pl: 2,
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-between"
                                }}>
                                    <Box>
                                        <Typography variant="body1">
                                            <strong>Out Patient:</strong> {data.out_patient ? "Yes" : "No"}
                                        </Typography>
                                        {data.sampler && <Typography variant="body1">
                                            <strong>Sampler</strong> {data.sampler.name}
                                        </Typography>}
                                        {!data.referred && (
                                            <>
                                                {data?.howReport && <Typography variant="body1">
                                                    <strong>Report
                                                        Method:</strong> {Object.keys(data?.howReport).filter(method => data.howReport[method] && ["print", "email", "whatsapp", "sendToReferrer"].includes(method)).map(method => method.toUpperCase()).join(", ")}
                                                </Typography>}
                                            </>
                                        )}
                                    </Box>
                                    <IconButton onClick={handleChangeStep(4)}><EditIcon/></IconButton>
                                </Box>
                            </Box>

                            <Divider sx={{my: 2}}/>

                            <Box sx={{mb: 3}}>
                                <Typography variant="subtitle1" color="primary" gutterBottom>
                                    Tests & Panels
                                </Typography>
                                <Box sx={{
                                    pl: 2,
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-between"
                                }}>
                                    <Box>
                                        <Typography variant="body1">
                                            <strong>Tests:</strong> {(data.acceptanceItems?.tests || []).length}
                                        </Typography>
                                        <Typography variant="body1">
                                            <strong>Panels:</strong> {(data.acceptanceItems?.panels || []).length}
                                        </Typography>
                                        <Typography variant="body1" color="error">
                                            <strong>Total Price:</strong> {
                                            (data.acceptanceItems?.tests || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0) +
                                            (data.acceptanceItems?.panels || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0)
                                        }
                                        </Typography>
                                    </Box>
                                    <IconButton onClick={handleChangeStep(3)}><EditIcon/></IconButton>
                                </Box>
                            </Box>

                            {canAddPrescription && data.prescription && (
                                <>
                                    <Divider sx={{my: 2}}/>
                                    <Box sx={{mb: 3}}>
                                        <Typography variant="subtitle1" color="primary" gutterBottom>
                                            Prescription
                                        </Typography>
                                        <Box sx={{pl: 2}}>
                                            <Typography variant="body1">
                                                <strong>Document:</strong> {data.prescription.originalName}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </Paper>

                        {canAddPrescription && !data.prescription && (
                            <FormAccordion
                                title="Prescription"
                                id="prescription-information"
                                defaultExpanded
                                icon={<DescriptionIcon/>}
                            >
                                <PrescriptionSection prescription={data.prescription}/>
                            </FormAccordion>
                        )}
                    </Suspense>
                );
            default:
                return null;
        }
    };

    // Check if there are any errors
    const hasErrors = Object.keys(errors || {}).length > 0;

    // Early return if data is not available
    if (!data) return null;

    return (
        <Container sx={{p: "1em"}}>
            <Typography variant="h4" sx={{mb: 1}}>Add New Acceptance</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{mb: 3}}>
                Create a new test acceptance for {data.patient.fullName}
            </Typography>

            <Box sx={{width: '100%', mb: 4}}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((step, index) => (
                        <Step key={step.label} completed={activeStep > index}>
                            <StepLabel
                                error={hasStepErrors(index)}
                                slotProps={{
                                    StepIcon: {
                                        icon: step.icon
                                    }
                                }}
                            >
                                {step.label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {hasErrors && (
                <Alert severity="error" sx={{mb: 3}}>
                    Please correct the errors before submitting the form.
                </Alert>
            )}

            {renderStepContent(activeStep)}

            <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 4}}>
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
                        onClick={() => onSubmit({...data, needsConsultation})}
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
            </Box>
        </Container>
    );
};

export default AcceptanceForm;
