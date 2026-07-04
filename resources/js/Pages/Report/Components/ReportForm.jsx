import React, { useState } from 'react';
import {
    Box,
    Button,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stepper,
    Step,
    StepLabel,
    Alert,
    useTheme,
    CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ExpandMore as ExpandMoreIcon, Check as CheckIcon } from '@mui/icons-material';

import ReportFormHeader from './Form/ReportFormHeader';
import TemplateSelector from './Form/TemplateSelector';
import ReportFormTabs from './Form/ReportFormTabs';
import { getActiveStep, computeParameterErrors } from './Form/helpers';

/**
 * Tabbed Report Form Component with separated Document and Parameter sections
 *
 * @param {Object} data - Form data
 * @param {Function} setData - Function to update form data
 * @param {Function} onSubmit - Submit handler
 * @param {string|number} patientID - Patient ID
 * @param {Object} errors - Form validation errors
 * @param {array} templates - Templates data including list of report templates
 * @param {boolean} defaultExpanded - Whether accordion is expanded by default
 */
const TabbedReportForm = ({
    data,
    setData,
    onSubmit,
    patientID,
    errors = {},
    templates = [],
    defaultExpanded = true,
}) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [activeTab, setActiveTab] = useState(0);
    const [parameterErrors, setParameterErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle template selection
    const handleTemplateChange = (e) => {
        setData((prevData) => ({
            ...prevData,
            report_template: templates.find((item) => item?.id === e.target.value),
            parameters: {},
        }));
    };

    // Handle file change for related documents
    const handleFileChange = (_, value) => setData((prevData) => ({ ...prevData, files: value }));

    // Handle parameter value changes
    const handleParameterChange = (paramId, value) => {
        setData((prevData) => ({
            ...prevData,
            parameters: {
                ...(prevData.parameters || {}),
                [paramId]: value,
            },
        }));

        // Clear error if value is provided
        if (value !== '' && value !== null && value !== undefined) {
            setParameterErrors((prev) => ({
                ...prev,
                [paramId]: undefined,
            }));
        }
    };

    // Handle accordion expansion
    const handleAccordionChange = (_, isExpanded) => setExpanded(isExpanded);

    // Handle tab change
    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
    };

    // Validate parameters (updates error state, returns validity)
    const validateParameters = () => {
        const { errors: newErrors, isValid } = computeParameterErrors(data);
        setParameterErrors(newErrors);
        return isValid;
    };

    // Enhanced submit handler that validates parameters
    const handleSubmit = async () => {
        const parametersValid = validateParameters();

        // Also validate if required document is present
        const documentValid =
            !!data.reported_document ||
            (data.report_template?.parameters?.length && validateParameters());

        if (parametersValid && documentValid) {
            setIsSubmitting(true);
            try {
                await onSubmit();
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // Switch to appropriate tab based on errors
            if (!documentValid) {
                setActiveTab(0); // Switch to Documents tab
            } else if (!parametersValid) {
                setActiveTab(1); // Switch to Parameters tab

                // Scroll to parameter section
                setTimeout(() => {
                    document.getElementById('parameter-section')?.scrollIntoView({
                        behavior: 'smooth',
                    });
                }, 100);
            }
        }
    };

    // Count errors by tab
    const countErrors = (tabIndex) => {
        if (tabIndex === 0) {
            // Documents tab errors
            return Object.keys(errors).filter(
                (key) => key !== 'report_template' && key !== 'signers',
            ).length;
        } else if (tabIndex === 1) {
            // Parameters tab errors
            return Object.keys(parameterErrors).length;
        }
        return 0;
    };

    // Only show active parameters
    const activeParameters =
        data.report_template?.parameters?.filter((param) => param.active) || [];
    const hasParameters = activeParameters.length > 0;
    const activeStep = getActiveStep(data);

    return (
        <Paper
            elevation={3}
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease',
                '&:hover': {
                    boxShadow: theme.shadows[6],
                },
            }}
        >
            <Accordion
                expanded={expanded}
                onChange={handleAccordionChange}
                defaultExpanded={defaultExpanded}
                disableGutters
                sx={{
                    '&.MuiAccordion-root': {
                        boxShadow: 'none',
                        '&:before': {
                            display: 'none',
                        },
                    },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="report-form-content"
                    id="report-form-header"
                    sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                        },
                        '& .MuiAccordionSummary-expandIconWrapper': {
                            color: 'white',
                        },
                    }}
                >
                    <ReportFormHeader activeStep={activeStep} />
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0 }}>
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                        {/* Document Progress Stepper */}
                        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, mt: 1 }}>
                            <Step>
                                <StepLabel>Reported Document</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Approved Document</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Published Document</StepLabel>
                            </Step>
                        </Stepper>

                        {/* Template Selection */}
                        <TemplateSelector
                            data={data}
                            templates={templates}
                            errors={errors}
                            activeParameters={activeParameters}
                            hasParameters={hasParameters}
                            onTemplateChange={handleTemplateChange}
                        />

                        {/* Error Messages */}
                        {(Object.keys(errors).length > 0 ||
                            Object.keys(parameterErrors).length > 0) && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                                Please correct the errors in the form before submitting.
                            </Alert>
                        )}

                        {/* Tabs for Documents and Parameters */}
                        <ReportFormTabs
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            countErrors={countErrors}
                            data={data}
                            setData={setData}
                            errors={errors}
                            handleFileChange={handleFileChange}
                            patientID={patientID}
                            isSubmitting={isSubmitting}
                            hasParameters={hasParameters}
                            activeParameters={activeParameters}
                            parameterErrors={parameterErrors}
                            handleParameterChange={handleParameterChange}
                            theme={theme}
                        />

                        {/* Submit Button */}
                        <Grid container sx={{ justifyContent: 'flex-end' }}>
                            <Button
                                onClick={handleSubmit}
                                variant="contained"
                                size="large"
                                startIcon={
                                    isSubmitting ? (
                                        <CircularProgress size={20} color="inherit" />
                                    ) : (
                                        <CheckIcon />
                                    )
                                }
                                disabled={isSubmitting}
                                sx={{
                                    mt: 2,
                                    borderRadius: 6,
                                    px: 4,
                                    py: 1,
                                }}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                        </Grid>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Paper>
    );
};

export default TabbedReportForm;
