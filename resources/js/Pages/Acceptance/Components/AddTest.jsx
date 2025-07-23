import React, {useState, useCallback, useMemo} from 'react';
import {
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    CircularProgress,
    Alert,
    Button,
    Grid2 as Grid,
    IconButton,
    Typography,
    Box,
    Paper,
    Stepper,
    Step,
    StepLabel,
    Tooltip,
    TextField,
    Chip, Stack
} from "@mui/material";
import {
    Close,
    Science,
    ArrowBack,
    ArrowForward,
    HelpOutline,
    Check
} from "@mui/icons-material";
import SelectSearch from "@/Components/SelectSearch";
import axios from 'axios';

// Custom components
import TestTypeSelector from './TestTypeSelector';
import TestDetails from './TestDetails';
import RegularTestForm from './forms/RegularTestForm';
import ServiceTestForm from './forms/ServiceTestForm';

// Constants
const TEST_TYPES = {
    TEST: 'TEST',
    SERVICE: 'SERVICE',
    PANEL: 'PANEL'
};

const STEPS = [
    {label: "Select Test", key: "select"},
    {label: "Configure Test", key: "configure"},
    {label: "Review & Submit", key: "review"}
];

// Helper function to create default data structure
const createDefaultData = (initialData) => {
    const safeData = initialData || {};
    return {
        method_test: {
            test: {
                type: safeData?.method_test?.test?.type || ''
            }
        },
        price: safeData.price || 0,
        discount: safeData.discount || 0,
        details: safeData.details || '',
        samples: Array.isArray(safeData?.customParameters?.samples) ? [...safeData.customParameters.samples] : [],
        customParameters: safeData?.customParameters || {sampleType: ""},
        ...safeData
    };
};

const AddTest = ({
                     open,
                     onClose,
                     onSubmit,
                     maxDiscount = 0,
                     initialData = null,
                     referrer = null,
                     patient = null,
                     onChange,
                     requestedTests = []
                 }) => {
    // State management
    const [data, setData] = useState(() => createDefaultData(initialData));
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [selectedTest, setSelectedTest] = useState(data?.method_test?.test || null);
    const [activeStep, setActiveStep] = useState(0);

    // Computed values
    const testType = useMemo(() =>
            data?.method_test?.test?.type || '',
        [data?.method_test?.test?.type]
    );

    const isEdit = Boolean(initialData?.id);
    const hasErrors = Object.keys(errors).length > 0;

    const stepCompletionStatus = useMemo(() => ([
        Boolean(data?.method_test?.test?.id),
        Boolean(data?.method_test?.id && data.price),
        false
    ]), [data]);

    // Form validation logic
    const validateForm = useCallback(() => {
        const newErrors = {};

        // Test selection validation
        if (!data?.method_test?.test) {
            newErrors.test = 'Please select a test';
        }

        // Method selection validation
        if (!data?.method_test?.id) {
            newErrors.method = 'Please select a method';
        }

        // Price validation
        if (!data.price || data.price <= 0) {
            newErrors.price = 'Price must be greater than 0';
        }

        // Sample type validation for non-service tests
        const isServiceTest = data?.method_test?.test?.type === "SERVICE";
        const hasMethod = data?.method_test?.method;
        const sampleType = data?.customParameters?.sampleType;
        const validSampleTypes = data?.method_test?.method?.test?.sample_types?.map(item => item.id) || [];

        if (!isServiceTest && hasMethod && (!sampleType || !validSampleTypes.includes(sampleType))) {
            // Patient validation
            validatePatients(newErrors);
        }

        // Validate pricing parameters for conditional/formulated tests
        validatePricingParameters(newErrors);

        // Discount validation
        validateDiscount(newErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [data, maxDiscount]);

    const validatePricingParameters = (newErrors) => {
        const priceType = data?.method_test?.method?.price_type;

        if (priceType === 'Conditional' || priceType === 'Formulate') {
            const parameters = data.method_test.method.price_parameters || [];

            parameters.forEach(param => {
                const value = data.customParameters?.[param.name];
                const fieldKey = `customParameters.${param.name}`;

                // Required parameter validation
                if (param.required && (value === undefined || value === '')) {
                    newErrors[fieldKey] = `${param.label || param.name} is required`;
                    return;
                }

                // Numeric validation
                if (value !== undefined && (param.type === 'number' || param.type === 'range')) {
                    const numValue = Number(value);

                    if (isNaN(numValue)) {
                        newErrors[fieldKey] = `${param.label || param.name} must be a number`;
                    } else if (param.min !== undefined && numValue < param.min) {
                        newErrors[fieldKey] = `${param.label || param.name} must be at least ${param.min}`;
                    } else if (param.max !== undefined && numValue > param.max) {
                        newErrors[fieldKey] = `${param.label || param.name} must be at most ${param.max}`;
                    }
                }
            });

            // Formulated price validation
            if (priceType === 'Formulate' && (!data.price || data.price <= 0)) {
                newErrors.price = 'Price must be calculated based on parameters';
            }
        }
    };

    const validatePatients = (newErrors) => {
        if (!Array.isArray(data.samples) || data.samples.length === 0) {
            newErrors.samples = 'At least one patient is required';
        } else {
            data.samples.forEach((sample, index) => {
                if (sample?.patients?.length)
                    sample.patients.forEach((patient, patientIndex) => {
                        if (!patient?.id) {
                            newErrors[`samples.${index}.patients.${patientIndex}.id`] = 'Please select a valid patient';
                        }
                    })
                else
                    newErrors[`samples.${index}.patients`] = 'Please select a valid patient'
                if (!sample.sampleType) {
                    newErrors[`samples.${index}.sampleType`] = 'Please select a valid sampleType';
                }
            });
        }
    };

    const validateDiscount = (newErrors) => {
        if (data.discount > data.price) {
            newErrors.discount = 'Discount cannot be greater than price';
        }

        if (maxDiscount && data.price > 0) {
            const maxAllowedDiscount = maxDiscount * data.price * 0.01;
            if (data.discount > maxAllowedDiscount) {
                newErrors.discount = `Discount cannot exceed ${maxDiscount}% of price`;
            }
        }
    };

    // Event handlers
    const handleChange = useCallback((updates) => {
        setData(prevData => {
            const newData = {...prevData};

            Object.keys(updates).forEach(key => {
                if (key === 'patients' && Array.isArray(updates[key])) {
                    newData[key] = [...updates[key]];
                } else if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
                    newData[key] = {...(newData[key] || {}), ...updates[key]};
                } else {
                    newData[key] = updates[key];
                }
            });

            onChange?.(newData);
            return newData;
        });

        // Clear related errors
        setErrors(prevErrors => {
            const newErrors = {...prevErrors};
            Object.keys(updates).forEach(key => {
                delete newErrors[key];
            });
            return newErrors;
        });
    }, [onChange]);

    const fetchTestDetails = useCallback(async (testId) => {
        setLoading(true);
        setApiError(null);

        try {
            const response = await axios.get(route("api.tests.show", testId), {
                params: referrer ? {referrer: {id: referrer.id}} : {},
            });

            const testData = response.data.data;
            const discounts = testData.offers?.map(offer => ({
                id: Date.now(),
                type: offer.type,
                value: offer.amount,
                reason: offer.title
            })) || [];

            handleChange({
                method_test: {
                    ...(data?.method_test || {}),
                    test: testData,
                    id: null,
                    method: null
                },
                price: 0,
                discount: 0,
                samples: testType === "SERVICE" ? [{patients: [{id: patient.id, name: patient.fullName}]}] : [],
                no_sample: 1,
                customParameters: {
                    sampleType: "",
                    discounts
                },
            });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to fetch test details';
            setApiError(errorMsg);
            console.error("Test details fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [data?.method_test, handleChange, referrer]);

    const handleTestTypeChange = useCallback((e) => {
        const newType = e.target.value;

        // Reset form when test type changes
        handleChange({
            method_test: {test: {type: newType}},
            price: 0,
            discount: 0,
            samples: testType === "SERVICE" ? [{patients: [{id: patient.id, name: patient.fullName}]}] : [],
            no_sample: 1,
            customParameters: {},
            sample_type: ""
        });

        setSelectedTest(null);
        setActiveStep(0);
    }, [handleChange]);

    const handleTestSelect = useCallback((e) => {
        const selectedValue = e.target.value;
        setSelectedTest(selectedValue);

        if (selectedValue?.id) {
            fetchTestDetails(selectedValue.id);
        } else {
            // Clear data when no test selected
            handleChange({
                method_test: {test: {type: testType}},
                price: 0,
                discount: 0,
                no_sample: 1,
                samples: testType === "SERVICE" ? [{patients: [{id: patient.id, name: patient.fullName}]}] : [],
                customParameters: {sampleType: ""},
            });
        }
    }, [fetchTestDetails, handleChange, testType]);

    const handleRequestedTestSelect = useCallback((test) => () => {
        const selectedValue = {id: test.server_id, name: test.name};
        setSelectedTest(selectedValue);

        if (selectedValue.id) {
            fetchTestDetails(selectedValue.id);
        }
    }, [fetchTestDetails]);

    const handleSubmit = useCallback(() => {
        console.log("here");
        if (validateForm()) {
            try {
                onSubmit(data);
            } catch (error) {
                console.log(errors);
                setApiError(error.message || 'Submission failed');
            }
        }
        console.log(errors);
    }, [data, onSubmit, validateForm]);

    // Navigation handlers
    const handleNext = () => {
        if (activeStep === 0 && !data?.method_test?.test?.id) {
            setErrors(prev => ({...prev, test: "Please select a test first"}));
            return;
        }

        if (activeStep === 1 && !validateForm()) {
            return;
        }

        setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const handleBack = () => {
        setActiveStep(prev => Math.max(prev - 1, 0));
    };

    // Render helpers
    const renderTestForm = () => {
        if (!data?.method_test?.test || loading) {
            return loading ? <CircularProgress/> : null;
        }

        const safeData = {
            ...data,
            samples: Array.isArray(data.samples) ? data.samples : []
        };

        const commonProps = {
            data: safeData,
            onChange: handleChange,
            errors,
            maxDiscount,
            referrer,
            patient
        };

        switch (testType) {
            case TEST_TYPES.TEST:
                return <RegularTestForm {...commonProps} />;
            case TEST_TYPES.SERVICE:
                return <ServiceTestForm {...commonProps} />;
            default:
                return null;
        }
    };

    const renderRequestedTests = () => (
        <Box>
            {requestedTests.map(test => (
                <Chip
                    key={test.server_id || test.name}
                    label={test.name}
                    onClick={handleRequestedTestSelect(test)}
                    sx={{mr: 1, mb: 1}}
                />
            ))}
        </Box>
    );

    const renderTestSelection = () => (
        <Paper elevation={0} sx={{p: 3, backgroundColor: "grey.50", borderRadius: 2}}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Select Test Type and Test
            </Typography>

            {requestedTests.length > 0 && (
                <Box sx={{mb: 2}}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Quick select from requested tests:
                    </Typography>
                    {renderRequestedTests()}
                </Box>
            )}

            <Grid container spacing={3} alignItems="center">
                <Grid size={{xs: 12, md: 6}}>
                    <Box display="flex" alignItems="flex-start">
                        <TestTypeSelector
                            testType={testType}
                            onChange={handleTestTypeChange}
                            error={errors?.testType}
                        />
                        <Tooltip title="Select the type of test you want to add">
                            <HelpOutline fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                        </Tooltip>
                    </Box>
                </Grid>

                {testType && (
                    <Grid size={{xs: 12, md: 6}}>
                        <Box display="flex" alignItems="flex-start">
                            <SelectSearch
                                value={selectedTest || ""}
                                label="Select Test"
                                fullWidth
                                url={route("api.tests.list")}
                                defaultData={{type: testType, status: true}}
                                onChange={handleTestSelect}
                                name="test"
                                error={Boolean(errors.test)}
                                helperText={errors.test || "Choose a test from the list"}
                                placeholder="Start typing to search..."
                            />
                            <Tooltip title="Search and select the specific test to add">
                                <HelpOutline fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                            </Tooltip>
                        </Box>
                    </Grid>
                )}
            </Grid>

            {loading && (
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 3}}>
                    <CircularProgress size={24} sx={{mr: 1}}/>
                    <Typography variant="body2">Loading test details...</Typography>
                </Box>
            )}

            {data?.method_test?.test?.id && !loading && (
                <Box sx={{mt: 3}}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Test Details
                    </Typography>
                    <TestDetails test={data.method_test.test}/>
                </Box>
            )}
        </Paper>
    );

    const renderTestConfiguration = () => (
        <>
            <Paper elevation={0} sx={{p: 3, backgroundColor: "grey.50", borderRadius: 2}}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Configure Test Parameters
                </Typography>
                {renderTestForm()}
            </Paper>

            {/* Additional Details Section */}
            <Paper elevation={0} sx={{p: 3, mt: 3, backgroundColor: "grey.50", borderRadius: 2}}>
                <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="medium">
                        Additional Details
                    </Typography>
                    <Tooltip title="Optional notes about this test">
                        <HelpOutline fontSize="small" color="action" sx={{ml: 1}}/>
                    </Tooltip>
                </Box>

                <TextField
                    name="details"
                    multiline
                    fullWidth
                    rows={3}
                    error={Boolean(errors.details)}
                    onChange={(e) => handleChange({details: e.target.value})}
                    value={data.details || ""}
                    placeholder="Enter any additional notes or information about this test (optional)"
                    helperText={errors.details || "Maximum 500 characters"}
                    slotProps={{input: {maxLength: 500}}}
                    variant="outlined"
                    sx={{backgroundColor: "white"}}
                />
            </Paper>
        </>
    );

    const renderReviewStep = () => (
        <Paper elevation={0} sx={{p: 3, backgroundColor: "grey.50", borderRadius: 2}}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Review Test Details
            </Typography>

            <Grid container spacing={3}>
                {/* Test Information */}
                <Grid xs={12}>
                    <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            Selected Test
                        </Typography>
                        <Box sx={{pl: 2}}>
                            <Typography variant="body1">
                                <strong>Name:</strong> {data?.method_test?.test?.name}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Code:</strong> {data?.method_test?.test?.code}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Method:</strong> {data?.method_test?.method?.name}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Pricing Information */}
                <Grid xs={12} md={6}>
                    <Paper elevation={1} sx={{p: 3, borderRadius: 2, height: '100%'}}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            Pricing
                        </Typography>
                        <Box sx={{pl: 2}}>
                            <Typography variant="body1">
                                <strong>Price:</strong> {data.price}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Discount:</strong> {data.discount}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" color="primary">
                                <strong>Final Price:</strong> {data.price - data.discount}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Patient Information */}
                <Grid xs={12} md={6}>
                    <Paper elevation={1} sx={{p: 3, borderRadius: 2, height: '100%'}}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            Patient Information
                        </Typography>
                        <Stack direction="column" spacing={2}>
                            {data.samples.map((sample, sampleIndex) => <Box sx={{pl: 2}}>
                                <span>{sampleIndex + 1}</span>
                                {sample.patients.map((patient, index) => <Typography
                                    key={sampleIndex + "-" + index} variant="body1">
                                    <strong>Patient {index + 1}:</strong> {patient.name}
                                </Typography>)}
                            </Box>)}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Additional Details */}
                {data.details && (
                    <Grid xs={12}>
                        <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Additional Details
                            </Typography>
                            <Box sx={{pl: 2}}>
                                <Typography variant="body1">
                                    {data.details}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            <Box sx={{mt: 3}}>
                <Alert severity="info">
                    Please review all details before submitting. This test will be added to the acceptance.
                </Alert>
            </Box>
        </Paper>
    );

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return renderTestSelection();
            case 1:
                return renderTestConfiguration();
            case 2:
                return renderReviewStep();
            default:
                return null;
        }
    };

    return (
        <Dialog
            open={open}
            fullWidth
            keepMounted
            maxWidth="md"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 2,
                        overflow: "hidden"
                    }
                }
            }}
        >
            {/* Dialog Header */}
            <DialogTitle
                sx={{
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    p: 2
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                        <Science sx={{mr: 2}}/>
                        <Typography variant="h6">
                            {isEdit ? "Edit Test" : "Add Test"}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        aria-label="close"
                        sx={{color: "primary.contrastText"}}
                    >
                        <Close/>
                    </IconButton>
                </Box>
            </DialogTitle>

            {/* Error Alert */}
            {apiError && (
                <Alert
                    severity="error"
                    onClose={() => setApiError(null)}
                    sx={{mx: 3, mt: 2}}
                >
                    {apiError}
                </Alert>
            )}

            {/* Stepper */}
            <Box sx={{width: '100%', px: 3, pt: 3}}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {STEPS.map((step, index) => (
                        <Step key={step.label} completed={index < activeStep || stepCompletionStatus[index]}>
                            <StepLabel>{step.label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* Dialog Content */}
            <DialogContent sx={{p: 3}}>
                {renderStepContent(activeStep)}
            </DialogContent>

            {/* Dialog Actions */}
            <DialogActions sx={{p: 3, pt: 2, justifyContent: 'space-between'}}>
                {activeStep > 0 ? (
                    <Button
                        onClick={handleBack}
                        color="inherit"
                        variant="outlined"
                        startIcon={<ArrowBack/>}
                    >
                        Back
                    </Button>
                ) : (
                    <Button
                        onClick={onClose}
                        color="inherit"
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                )}
                {activeStep === STEPS.length - 1 ? (
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        disabled={loading || hasErrors}
                        startIcon={loading ? <CircularProgress size={16} color="inherit"/> : <Check/>}
                    >
                        {loading ? "Processing..." : (isEdit ? "Update Test" : "Add Test")}
                    </Button>
                ) : (
                    <Button
                        onClick={handleNext}
                        variant="contained"
                        color="primary"
                        endIcon={<ArrowForward/>}
                        disabled={activeStep === 0 && !data?.method_test?.test?.id}
                    >
                        Continue
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AddTest;
