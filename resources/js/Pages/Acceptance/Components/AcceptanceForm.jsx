import React, { useState, Suspense } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    Alert,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import useAcceptanceFormState from './hooks/useAcceptanceFormState';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ScienceIcon from '@mui/icons-material/Science';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ConsultationCard from './AcceptanceForm/ConsultationCard';
import AcceptanceSummary from './AcceptanceForm/AcceptanceSummary';

// Lazy-loaded sections
const FormAccordion = React.lazy(() => import('./FormAccordion'));
const PatientSection = React.lazy(() => import('./PatientSection'));
const TestsSection = React.lazy(() => import('./TestsSection'));
const ConsultationForm = React.lazy(() => import('./ConsultationForm'));
const DoctorReferralSection = React.lazy(() => import('./DoctorReferralSection'));
const SamplingDeliverySection = React.lazy(() => import('./ReportSection.jsx'));

const AcceptanceForm = ({
    initialData,
    errors,
    onSubmit,
    canAddPrescription = false,
    maxDiscount,
    setData,
    defaultStep = 0,
}) => {
    // State for stepper
    const [activeStep, setActiveStep] = useState(defaultStep);

    // State for consultation checkbox
    const [needsConsultation, setNeedsConsultation] = useState(Boolean(initialData?.consultation));

    // Updated steps configuration with merged doctor and referral sections
    const steps = [
        { label: 'Patient Information', icon: <PersonIcon /> },
        { label: 'Consultation Request', icon: <EventNoteIcon /> },
        { label: 'Doctor & Referral', icon: <AssignmentIcon /> },
        { label: 'Tests Selection', icon: <ScienceIcon /> },
        { label: 'Sampling & Delivery', icon: <LocalHospitalIcon /> },
        { label: 'Review & Submit', icon: <ReceiptIcon /> },
    ];

    const { data, modalState, deleteConfirmState, handlers } = useAcceptanceFormState(
        initialData,
        maxDiscount,
        setData,
    );

    // Navigation functions
    const handleNext = () => {
        // Skip to next step if on consultation page but no consultation needed
        if (activeStep === 1 && needsConsultation && !data.consultation_id) return;

        if (activeStep < 2) setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));

        // Submit form data after EVERY step (excluding final step which has its own submit button)
        if (activeStep < steps.length - 1) onSubmit(data, activeStep, nextStep);
    };

    const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));

    const handleBack = () => {
        setData((prev) => ({ ...prev, step: Math.min(prev?.step * 1 - 1, steps.length - 1) }));
        setActiveStep((prev) => Math.max(prev - 1, 0));
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
                return Boolean(errors.referrer || errors.referenceCode);
            case 3: // Tests
                return Boolean(errors.acceptanceItems);
            case 4: // Sampling & Delivery
                return Boolean(
                    errors.samplerGender || errors['howReport.way'] || errors['howReport.who'],
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
                            icon={<PersonIcon />}
                        >
                            <PatientSection patient={data.patient} />
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
                            icon={<EventNoteIcon />}
                        >
                            {initialData?.consultation_id ? (
                                <Box>
                                    {/* Existing consultation details would go here */}
                                    <ConsultationCard initialData={initialData.consultation} />
                                </Box>
                            ) : (
                                <Box sx={{ p: 2 }}>
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
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="subtitle1" gutterBottom>
                                                Consultation Details
                                            </Typography>
                                            <ConsultationForm
                                                patientId={data?.patient?.id}
                                                embedded={true} // To indicate this is embedded, not a dialog
                                            />
                                        </Box>
                                    )}
                                </Box>
                            )}
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
                            icon={<AssignmentIcon />}
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
                            icon={<ScienceIcon />}
                        >
                            <TestsSection
                                data={data}
                                errors={errors}
                                modalState={modalState}
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
                            icon={<LocalHospitalIcon />}
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
                    <AcceptanceSummary
                        data={data}
                        needsConsultation={needsConsultation}
                        canAddPrescription={canAddPrescription}
                        onEditStep={handleChangeStep}
                    />
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
        <Container sx={{ p: '1em' }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
                Add New Acceptance
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                Create a new test acceptance for {data.patient.fullName}
            </Typography>

            <Box sx={{ width: '100%', mb: 4 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((step, index) => (
                        <Step key={step.label} completed={activeStep > index}>
                            <StepLabel
                                error={hasStepErrors(index)}
                                slotProps={{
                                    stepIcon: {
                                        icon: step.icon,
                                    },
                                }}
                            >
                                {step.label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {hasErrors && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Please correct the errors before submitting the form.
                </Alert>
            )}

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    startIcon={<ArrowBackIcon />}
                    variant="outlined"
                    size="large"
                >
                    Back
                </Button>

                {activeStep === steps.length - 1 ? (
                    <Button
                        onClick={() => onSubmit({ ...data, needsConsultation })}
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<SaveIcon />}
                    >
                        Submit Acceptance
                    </Button>
                ) : (
                    <Button
                        onClick={handleNext}
                        variant="contained"
                        color="primary"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                    >
                        Continue
                    </Button>
                )}
            </Box>
        </Container>
    );
};

export default AcceptanceForm;
