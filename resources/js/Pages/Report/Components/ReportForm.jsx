import React, {useState} from "react";
import {
    Box,
    Button,
    Paper,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stepper,
    Step,
    StepLabel,
    Alert,
    Tooltip,
    Chip,
    useTheme,
    Tabs,
    Tab,
    CircularProgress,
    Badge, Select, MenuItem
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
    ExpandMore as ExpandMoreIcon,
    FileDownload as FileDownloadIcon,
    Check as CheckIcon,
    Article as ArticleIcon,
    Tune as TuneIcon,
    Assignment as AssignmentIcon
} from "@mui/icons-material";

import ParameterSection from "./Form/ParameterSection";
import DocumentUploadSection from "./Form/DocumentUploadSection";
import {TabContext, TabPanel} from "@mui/lab";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

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
                              defaultExpanded = true
                          }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [activeTab, setActiveTab] = useState(0);
    const [parameterErrors, setParameterErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tab labels for document and parameter sections
    const tabs = [
        {label: "Documents", icon: <ArticleIcon/>},
        {label: "Parameters", icon: <TuneIcon/>},
    ];

    // Determine active step based on available documents
    const getActiveStep = () => {
        if (data.published_document) return 2;
        if (data.approveded_document) return 1;
        return 0;
    };

    // Handle template selection
    const handleTemplateChange = (e) => {
        setData(prevData => ({
            ...prevData,
            report_template: templates.find(item => item.id === e.target.value),
            parameters: {}
        }));
    }

    // Handle file change for related documents
    const handleFileChange = (_, value) => setData(prevData => ({...prevData, files: value}));

    // Handle parameter value changes
    const handleParameterChange = (paramId, value) => {
        setData(prevData => ({
            ...prevData,
            parameters: {
                ...(prevData.parameters || {}),
                [paramId]: value
            }
        }));

        // Clear error if value is provided
        if (value !== '' && value !== null && value !== undefined) {
            setParameterErrors(prev => ({
                ...prev,
                [paramId]: undefined
            }));
        }
    };

    // Handle accordion expansion
    const handleAccordionChange = (_, isExpanded) => setExpanded(isExpanded);

    // Handle tab change
    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
    };

    // Validate parameters
    const validateParameters = () => {
        if (!data.report_template?.parameters?.length) return true;

        const newErrors = {};
        let isValid = true;

        const activeParameters = data.report_template.parameters.filter(param => param.active);

        activeParameters.forEach(param => {
            const {title, required, type} = param;
            const fieldId = `${title.toLowerCase().replace(/\s+/g, '_')}_${param.id}`;
            const value = data.parameters?.[fieldId];

            if (required) {
                if (value === undefined || value === null || value === '') {
                    newErrors[fieldId] = 'This field is required';
                    isValid = false;
                } else if (type === 'checkbox' && Array.isArray(value) && value.length === 0) {
                    newErrors[fieldId] = 'Please select at least one option';
                    isValid = false;
                }
            }
        });

        setParameterErrors(newErrors);
        return isValid;
    };

    // Enhanced submit handler that validates parameters
    const handleSubmit = async () => {
        const parametersValid = validateParameters();

        // Also validate if required document is present
        const documentValid = !!data.reported_document || (data.report_template?.parameters?.length && validateParameters());

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
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    };

    // Count errors by tab
    const countErrors = (tabIndex) => {
        if (tabIndex === 0) {
            // Documents tab errors
            return Object.keys(errors).filter(key =>
                key !== 'report_template' && key !== 'signers'
            ).length;
        } else if (tabIndex === 1) {
            // Parameters tab errors
            return Object.keys(parameterErrors).length;
        }
        return 0;
    };

    // Only show active parameters
    const activeParameters = data.report_template?.parameters?.filter(param => param.active) || [];
    const hasParameters = activeParameters.length > 0;

    return (
        <Paper
            elevation={3}
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease',
                '&:hover': {
                    boxShadow: theme.shadows[6]
                }
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
                    }
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon/>}
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
                        }
                    }}
                >
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                        <ArticleIcon/>
                        <Typography variant="h6" fontWeight="500">
                            Report Documentation
                        </Typography>
                        <Chip
                            size="small"
                            label={getActiveStep() === 0 ? "Draft" : getActiveStep() === 1 ? "Approved" : "Published"}
                            color={getActiveStep() === 0 ? "warning" : getActiveStep() === 1 ? "info" : "success"}
                            sx={{ml: 2}}
                        />
                    </Box>
                </AccordionSummary>

                <AccordionDetails sx={{p: 0}}>
                    <Box sx={{p: {xs: 2, sm: 3}}}>
                        {/* Document Progress Stepper */}
                        <Stepper
                            activeStep={getActiveStep()}
                            alternativeLabel
                            sx={{mb: 4, mt: 1}}
                        >
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
                        <Box sx={{mb: 4}}>
                            {data.report_template && (
                                <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 2}}>
                                    <Tooltip title="Download document template for this report">
                                        <Button
                                            href={route("documents.download", (data.report_template.template.id || data.report_template.template.hash))}
                                            target="_blank"
                                            variant="outlined"
                                            startIcon={<FileDownloadIcon/>}
                                            size="medium"
                                            color="secondary"
                                            sx={{borderRadius: 6}}
                                        >
                                            Download Template
                                        </Button>
                                    </Tooltip>
                                </Box>
                            )}

                            <Alert
                                severity="info"
                                icon={<AssignmentIcon/>}
                                sx={{mb: 2}}
                            >
                                <Typography variant="subtitle2">
                                    Selected Template: {data?.report_template?.name || "None"}
                                </Typography>
                                <Typography variant="body2">
                                    {data?.report_template
                                        ? `This template has ${activeParameters.length} parameters to fill.`
                                        : "Please select a template to proceed."}
                                </Typography>
                            </Alert>

                            {/* Template Selection (always visible) */}
                            <FormControl
                                fullWidth
                                required
                                error={errors.report_template}
                                variant="outlined"
                                size="medium"
                                margin="normal"
                            >
                                <InputLabel id="report-template-label">Template</InputLabel>
                                <Select
                                    labelId="report-template-label"
                                    id="report-template"
                                    value={data?.report_template?.id || ''}
                                    label="Template"
                                    onChange={handleTemplateChange}
                                >
                                    {templates.map((template) => (
                                        <MenuItem key={template.id}
                                                  value={template.id}>
                                            {template.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.report_template && (
                                    <Typography variant="caption" color="error">
                                        {errors.report_template}
                                    </Typography>
                                )}
                            </FormControl>
                        </Box>

                        {/* Error Messages */}
                        {(Object.keys(errors).length > 0 || Object.keys(parameterErrors).length > 0) && (
                            <Alert
                                severity="error"
                                sx={{mb: 3, borderRadius: 1}}
                            >
                                Please correct the errors in the form before submitting.
                            </Alert>
                        )}

                        {/* Tabs for Documents and Parameters */}
                        <Box sx={{width: '100%', mb: 3}}>
                            <TabContext value={activeTab}>
                                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                                    <Tabs
                                        value={activeTab}
                                        onChange={handleTabChange}
                                        aria-label="report form tabs"
                                        indicatorColor="primary"
                                        textColor="primary"
                                    >
                                        {tabs.map((tab, index) => (
                                            <Tab
                                                key={index}
                                                label={
                                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                        {countErrors(index) > 0 ? (
                                                            <Badge badgeContent={countErrors(index)} color="error">
                                                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                                    {tab.icon}
                                                                    <Typography sx={{ml: 1}}>{tab.label}</Typography>
                                                                </Box>
                                                            </Badge>
                                                        ) : (
                                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                                {tab.icon}
                                                                <Typography sx={{ml: 1}}>{tab.label}</Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                }
                                                id={`report-tab-${index}`}
                                                aria-controls={`report-tabpanel-${index}`}
                                            />
                                        ))}
                                    </Tabs>
                                </Box>

                                {/* Document Upload Tab */}
                                <TabPanel value={0}>
                                    <DocumentUploadSection
                                        data={data}
                                        setData={setData}
                                        errors={errors}
                                        handleFileChange={handleFileChange}
                                        patientID={patientID}
                                        isSubmitting={isSubmitting}
                                    />
                                </TabPanel>

                                {/* Parameters Tab */}
                                <TabPanel value={1}>
                                    {hasParameters ? (
                                        <ParameterSection
                                            data={data}
                                            setData={setData}
                                            activeParameters={activeParameters}
                                            parameterErrors={parameterErrors}
                                            handleParameterChange={handleParameterChange}
                                            theme={theme}
                                            isSubmitting={isSubmitting}
                                        />
                                    ) : (
                                        <Alert severity="info" sx={{my: 2}}>
                                            This template doesn't have any parameters to fill.
                                        </Alert>
                                    )}
                                </TabPanel>
                            </TabContext>
                        </Box>

                        {/* Submit Button */}
                        <Grid container justifyContent="flex-end">
                            <Button
                                onClick={handleSubmit}
                                variant="contained"
                                size="large"
                                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit"/> : <CheckIcon/>}
                                disabled={isSubmitting}
                                sx={{
                                    mt: 2,
                                    borderRadius: 6,
                                    px: 4,
                                    py: 1
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
