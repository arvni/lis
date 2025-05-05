import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Button,
    Divider,
    Grid2 as Grid,
    Alert,
    useTheme
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import ParameterEntryForm from './ParameterEntryForm';
import DocumentUploads from './DocumentUploads';

// Steps for the report generation process
const steps = [
    { label: 'Select Template', icon: DescriptionIcon },
    { label: 'Fill Parameters', icon: ListAltIcon },
    { label: 'Document Settings', icon: SettingsIcon },
    { label: 'Review & Generate', icon: CheckCircleIcon }
];

const ReportGenerator = ({ templateData, onSubmit }) => {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const [reportData, setReportData] = useState({
        templateId: templateData?.id || null,
        parameterValues: {},
        reportedDocument: null,
        generationOptions: {
            generatePdf: true,
            includeAttachments: false
        }
    });
    const [errors, setErrors] = useState({});

    // Handle advancing to the next step
    const handleNext = () => {
        if (validateCurrentStep()) {
            setActiveStep((prevStep) => prevStep + 1);
        }
    };

    // Handle going back to the previous step
    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    // Validate the current step before proceeding
    const validateCurrentStep = () => {
        let isValid = true;
        const newErrors = {};

        // Validation logic for each step
        switch (activeStep) {
            case 0:
                // Template selection validation
                if (!reportData.templateId) {
                    newErrors.templateId = "Please select a template";
                    isValid = false;
                }
                break;

            case 1:
                // Parameter validation is handled by the ParameterEntryForm component
                break;

            case 2:
                // Document settings validation
                if (!reportData.reportedDocument) {
                    newErrors.reportedDocument = "Please upload the required document";
                    isValid = false;
                }
                break;

            default:
                break;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = () => {
        if (validateCurrentStep()) {
            onSubmit(reportData);
        }
    };

    // Update reportData when parameter values change
    const handleParametersSubmit = (data) => {
        setReportData(prev => ({
            ...prev,
            parameterValues: data.values
        }));
        handleNext();
    };

    // Handle document uploads
    const handleDocumentChange = (updates) => {
        setReportData(prev => ({
            ...prev,
            ...updates
        }));
    };

    // Get template parameters - just active ones
    const getActiveParameters = () => {
        return templateData?.parameters?.filter(param => param.active) || [];
    };

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            <Paper elevation={1} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom color="primary">
                    Generate Report: {templateData?.title || 'New Report'}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {/* Stepper */}
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        return (
                            <Step key={index}>
                                <StepLabel slots={{
                                   stepIcon: <StepIcon color={index === activeStep ? "primary" : "disabled"} />
                                }}>
                                    {step.label}
                                </StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>

                {/* Step Content */}
                <Box sx={{ mt: 2, minHeight: '300px' }}>
                    {activeStep === 0 && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Template Selected: <strong>{templateData?.title}</strong>
                            </Alert>
                            <Typography variant="body1" >
                                {templateData?.description || 'No description available.'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This template has {getActiveParameters().length} parameters to fill in.
                            </Typography>
                        </Box>
                    )}

                    {activeStep === 1 && (
                        <ParameterEntryForm
                            templateId={templateData?.id}
                            parameters={templateData?.parameters || []}
                            onSubmit={handleParametersSubmit}
                            initialValues={reportData.parameterValues}
                        />
                    )}

                    {activeStep === 2 && (
                        <Box>
                            <DocumentUploads
                                data={reportData}
                                setData={handleDocumentChange}
                                errors={errors}
                                theme={theme}
                            />

                            {/* Additional document options could go here */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Generation Options
                                </Typography>
                                {/* Options would go here */}
                            </Box>
                        </Box>
                    )}

                    {activeStep === 3 && (
                        <Box>
                            <Alert severity="success" sx={{ mb: 3 }}>
                                Your report is ready to be generated!
                            </Alert>

                            <Typography variant="h6" gutterBottom>
                                Report Summary
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{xs:12,sm:6}}>
                                    <Typography variant="subtitle2">Template</Typography>
                                    <Typography variant="body2">{templateData?.title}</Typography>
                                </Grid>

                                <Grid size={{xs:12,sm:6}}>
                                    <Typography variant="subtitle2">Document</Typography>
                                    <Typography variant="body2">
                                        {reportData.reportedDocument?.name || 'No document uploaded'}
                                    </Typography>
                                </Grid>

                                <Grid size={{xs:12}}>
                                    <Typography variant="subtitle2" gutterBottom>Parameters</Typography>
                                    <Box sx={{ pl: 2 }}>
                                        {getActiveParameters().map((param, index) => {
                                            const fieldId = `param-${param.title.toLowerCase().replace(/\s+/g, '-')}`;
                                            const value = reportData.parameterValues[fieldId];

                                            return (
                                                <Box key={index} sx={{ mb: 1 }}>
                                                    <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
                                                        {param.title}:
                                                    </Typography>{' '}
                                                    <Typography variant="body2" component="span">
                                                        {param.type === 'checkbox' && Array.isArray(value)
                                                            ? value.join(', ')
                                                            : param.type === 'date'
                                                                ? new Date(value).toLocaleDateString()
                                                                : param.type === 'image'
                                                                    ? 'Image uploaded'
                                                                    : value?.toString() || 'Not provided'}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        startIcon={<NavigateBeforeIcon />}
                    >
                        Back
                    </Button>

                    <Box>
                        {activeStep === steps.length - 1 ? (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                startIcon={<CheckCircleIcon />}
                            >
                                Generate Report
                            </Button>
                        ) : (
                            activeStep !== 1 && (
                                // Step 1 has its own submit button in the ParameterEntryForm
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleNext}
                                    endIcon={<NavigateNextIcon />}
                                >
                                    Next
                                </Button>
                            )
                        )}
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default ReportGenerator;
