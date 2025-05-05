import React, {useState} from "react";
import {
    Box,
    Paper,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    useTheme,
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    Article as ArticleIcon,
} from "@mui/icons-material";
import ReportFormContent from "./Form/ReportFormContent.jsx";

/**
 * Enhanced Report Form Component with Parameter Support
 *
 * @param {Object} data - Form data
 * @param {Function} setData - Function to update form data
 * @param {Function} onSubmit - Submit handler
 * @param {string|number} patientID - Patient ID
 * @param {Object} errors - Form validation errors
 * @param {array} templates - Templates data including list of report templates
 * @param {boolean} defaultExpanded - Whether accordion is expanded by default
 */
const ReportForm = ({
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
    const [parameterErrors, setParameterErrors] = useState({});

    // Determine active step based on available documents
    const getActiveStep = () => {
        if (data.published_document) return 2;
        if (data.approveded_document) return 1;
        return 0;
    };

    const handleTemplateChange = (e) => {
        setData(prevData => ({
            ...prevData,
            report_template: templates.find(item => item.id === e.target.value),
            parameterValues: {}
        }));
    }

    // Handle file change for related documents
    const handleFileChange = (_, value) => setData(prevData => ({...prevData, files: value}));

    // Handle accordion expansion
    const handleAccordionChange = (_, isExpanded) => setExpanded(isExpanded);

    // Handle parameter value changes
    const handleParameterChange = (paramId, value) => {
        setData(prevData => ({
            ...prevData,
            parameterValues: {
                ...(prevData.parameterValues || {}),
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

    // Validate parameters
    const validateParameters = () => {
        if (!data.report_template?.parameters?.length) return true;

        const newErrors = {};
        let isValid = true;

        const activeParameters = data.report_template.parameters.filter(param => param.active);

        activeParameters.forEach(param => {
            const {title, required, type} = param;
            const fieldId = `${title.toLowerCase().replace(/\s+/g, '_')}_${param.id}`;
            const value = data.parameterValues?.[fieldId];

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
    const handleSubmit = () => {
        const parametersValid = validateParameters();

        if (parametersValid) {
            onSubmit();
        } else {
            // Scroll to parameter section
            document.getElementById('parameter-section')?.scrollIntoView({
                behavior: 'smooth'
            });
        }
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
                    <ReportFormContent
                        data={data}
                        setData={setData}
                        errors={errors}
                        templates={templates}
                        parameterErrors={parameterErrors}
                        activeParameters={activeParameters}
                        hasParameters={hasParameters}
                        handleTemplateChange={handleTemplateChange}
                        handleParameterChange={handleParameterChange}
                        handleFileChange={handleFileChange}
                        handleSubmit={handleSubmit}
                        getActiveStep={getActiveStep}
                        patientID={patientID}
                    />
                </AccordionDetails>
            </Accordion>
        </Paper>
    );
};

export default ReportForm;
