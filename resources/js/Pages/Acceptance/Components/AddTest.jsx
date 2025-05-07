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
    TextField
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

// Custom hooks and components
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

const AddTest = ({
                     open,
                     onClose,
                     onSubmit,
                     maxDiscount = 0,
                     initialData = null,
                     referrer = null,
                     patient = null,
                     onChange
                 }) => {
    // Ensure proper data structure with defaults
    const defaultData = useMemo(() => {
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
            patients: Array.isArray(safeData.patients) ? [...safeData.patients] : [],
            customParameters: safeData?.customParameters || {sampleType: ""},
            ...safeData
        };
    }, [initialData]);

    // Form state management
    const [data, setData] = useState(defaultData);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [selectedTest, setSelectedTest] = useState(defaultData?.method_test?.test || null);
    const [activeStep, setActiveStep] = useState(0);

    // Get test type with safe fallback
    const testType = useMemo(() =>
            data?.method_test?.test?.type || '',
        [data?.method_test?.test?.type]
    );

    // Define steps
    const steps = [
        {label: "Select Test", completed: Boolean(data?.method_test?.test?.id)},
        {label: "Configure Test", completed: Boolean(data?.method_test?.id && data.price)},
        {label: "Review & Submit", completed: false}
    ];

    // Enhanced form validation with conditional pricing parameters
    const validateForm = useCallback(() => {
        const newErrors = {};
        let isValid = true;

        // Validate test selection
        if (!data?.method_test?.test) {
            newErrors.test = 'Please select a test';
            isValid = false;
        }

        // Validate method selection
        if (!data?.method_test?.id) {
            newErrors.method = 'Please select a method';
            isValid = false;
        }

        // Validate price
        if (!data.price || data.price <= 0) {
            newErrors.price = 'Price must be greater than 0';
            isValid = false;
        }

        // Validate sample type if method is selected
        if (data?.method_test?.test?.type !== "SERVICE" && data?.method_test?.method && (!data?.customParameters?.sampleType || !data?.method_test?.method?.test?.sample_types?.map(item => item.id).includes(data.customParameters.sampleType))) {
            newErrors['customParameters.sampleType'] = 'Please select a sample type';
            isValid = false;
        }

        // Validate conditional or formulate price parameters
        if (data?.method_test?.method?.price_type) {
            const priceType = data.method_test.method.price_type;

            if (priceType === 'Conditional' || priceType === 'Formulate') {
                // Check if method has parameters defined
                const parameters = data.method_test.method.price_parameters || [];

                // Validate each required parameter exists in customParameters
                parameters.forEach(param => {
                    if (param.required &&
                        (!data.customParameters ||
                            data.customParameters[param.name] === undefined ||
                            data.customParameters[param.name] === '')) {
                        newErrors[`customParameters.${param.name}`] = `${param.label || param.name} is required`;
                        isValid = false;
                    }

                    // Validate numeric parameters are within range (if specified)
                    if (data.customParameters && data.customParameters[param.name] !== undefined) {
                        const value = data.customParameters[param.name];

                        if (param.type === 'number' || param.type === 'range') {
                            const numValue = Number(value);

                            if (isNaN(numValue)) {
                                newErrors[`customParameters.${param.name}`] = `${param.label || param.name} must be a number`;
                                isValid = false;
                            } else if (param.min !== undefined && numValue < param.min) {
                                newErrors[`customParameters.${param.name}`] = `${param.label || param.name} must be at least ${param.min}`;
                                isValid = false;
                            } else if (param.max !== undefined && numValue > param.max) {
                                newErrors[`customParameters.${param.name}`] = `${param.label || param.name} must be at most ${param.max}`;
                                isValid = false;
                            }
                        }
                    }
                });

                // For Formulate type, also check if the final price has been calculated
                if (priceType === 'Formulate' && (!data.price || data.price <= 0)) {
                    newErrors.price = 'Price must be calculated based on parameters';
                    isValid = false;
                }
            }
        }

        // Validate patients array
        if (Array.isArray(data.patients)) {
            if (data.patients.length === 0) {
                newErrors.patients = 'At least one patient is required';
                isValid = false;
            } else {
                // Check each patient for validity
                data.patients.forEach((patient, index) => {
                    if (!patient || !patient.id) {
                        newErrors[`patients.${index}.id`] = 'Please select a valid patient';
                        isValid = false;
                    }
                });
            }
        } else {
            newErrors.patients = 'Patients data is invalid';
            isValid = false;
        }

        // Validate discount is not greater than price
        if (data.discount > data.price) {
            newErrors.discount = 'Discount cannot be greater than price';
            isValid = false;
        }

        // Validate discount against max discount if provided
        if (maxDiscount && data.price > 0) {
            const maxAllowedDiscount = maxDiscount * 1 * data.price * 0.01;
            if (data.discount > maxAllowedDiscount) {
                newErrors.discount = `Discount cannot exceed ${maxDiscount}% of price`;
                isValid = false;
            }
        }
        setErrors(newErrors);
        return isValid;
    }, [data, maxDiscount]);

    // Handle form field changes with deep merge
    const handleChange = useCallback((updates) => {
        setData(prevData => {
            const newData = {...prevData};

            Object.keys(updates).forEach(key => {
                if (key === 'patients' && Array.isArray(updates[key])) {
                    // Special handling for patients array
                    newData[key] = [...updates[key]];
                } else if (typeof updates[key] === 'object' && updates[key] !== null) {
                    if (Array.isArray(updates[key])) {
                        // Handle any arrays properly by copying them
                        newData[key] = [...updates[key]];
                    } else {
                        // Handle regular objects
                        newData[key] = {
                            ...(newData[key] || {}),
                            ...updates[key]
                        };
                    }
                } else {
                    newData[key] = updates[key];
                }
            });
            onChange(newData);
            return newData;
        });

        // Clear relevant errors
        const updatedKeys = Object.keys(updates);
        if (updatedKeys.length) {
            setErrors(prevErrors => {
                const newErrors = {...prevErrors};
                updatedKeys.forEach(key => {
                    delete newErrors[key];
                });
                return newErrors;
            });
        }
    }, [onChange]);

    // Fetch test details from API
    const fetchTestDetails = useCallback(async (testId) => {
        setLoading(true);
        setApiError(null);

        try {
            const response = await axios.get(route("api.tests.show", testId), {
                params: referrer?{referrer: {id: referrer.id}}:{},
            });
            const discounts = response?.data?.data?.offers.map(offer => ({
                id: Date.now(),
                type: offer.type,
                value: offer.amount,
                reason: offer.title
            }));
            handleChange({
                method_test: {
                    ...(data?.method_test || {}),
                    test: response.data.data,
                    id: null,
                    method: null
                },
                price: 0,
                discount: 0,
                patients: [],
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
    }, [data?.method_test, handleChange]);

    // Handle test type selection
    const handleTestTypeChange = useCallback((e) => {
        // Reset all form data when test type changes
        handleChange({
            method_test: {test: {type: e.target.value}},
            price: 0,
            discount: 0,
            patients: [],
            customParameters: {},
            sample_type: ""
        });

        // Reset selected test
        setSelectedTest(null);

        // Reset active step
        setActiveStep(0);
    }, [handleChange]);

    // Handle test selection
    const handleTestSelect = useCallback((e) => {
        const selectedValue = e.target.value;
        setSelectedTest(selectedValue);


        if (selectedValue && selectedValue.id) {
            // Fetch new test details
            fetchTestDetails(selectedValue.id);
        } else {
            // Clear all data if no test is selected
            handleChange({
                method_test: {test: {type: testType}},
                price: 0,
                discount: 0,
                patients: [],
                customParameters: {
                    sampleType: ""
                },
            });
        }
    }, [fetchTestDetails, handleChange, testType]);

    // Handle form submission
    const handleSubmit = useCallback(() => {
        if (validateForm()) {
            try {
                onSubmit(data);
            } catch (error) {
                setApiError(error.message || 'Submission failed');
            }
        }
    }, [data, onSubmit, validateForm]);

    // Navigation functions for stepper
    const handleNext = () => {
        if (activeStep === 0 && !data?.method_test?.test?.id) {
            setErrors(prev => ({...prev, test: "Please select a test first"}));
            return;
        }

        if (activeStep === 1) {
            const isValid = validateForm();
            if (!isValid) return;
        }

        setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => {
        setActiveStep(prev => Math.max(prev - 1, 0));
    };

    // Render appropriate test form based on test type
    const renderTestForm = useCallback(() => {
        if (!data?.method_test?.test || loading) {
            return loading ? <CircularProgress/> : null;
        }

        // Ensure the data has all required fields and proper types
        const safeData = {
            ...data,
            patients: Array.isArray(data.patients) ? data.patients : []
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
    }, [data, errors, handleChange, loading, maxDiscount, patient, referrer, testType]);

    // Render function for step content
    const renderStepContent = (step) => {
        switch (step) {
            case 0: // Select Test
                return (
                    <Paper elevation={0} sx={{p: 3, backgroundColor: "grey.50", borderRadius: 2}}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Select Test Type and Test
                        </Typography>
                        <Grid container spacing={3} alignItems="center" mt={2}>
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
                                <TestDetails test={data?.method_test?.test}/>
                            </Box>
                        )}
                    </Paper>
                );

            case 1: // Configure Test
                return (
                    <Paper elevation={0} sx={{p: 3, backgroundColor: "grey.50", borderRadius: 2}}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Configure Test Parameters
                        </Typography>

                        {renderTestForm()}
                    </Paper>
                );

            case 2: // Review & Submit
                return (
                    <Paper elevation={0} sx={{p: 3, backgroundColor: "grey.50", borderRadius: 2}}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Review Test Details
                        </Typography>

                        <Grid container spacing={3}>
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

                            <Grid xs={12} md={6}>
                                <Paper elevation={1} sx={{p: 3, borderRadius: 2, height: '100%'}}>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                        Patient Information
                                    </Typography>
                                    <Box sx={{pl: 2}}>
                                        {data.patients.map((patient, index) => (
                                            <Typography key={index} variant="body1">
                                                <strong>Patient {index + 1}:</strong> {patient.name}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Paper>
                            </Grid>

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

            default:
                return null;
        }
    };

    const hasErrors = Object.keys(errors || {}).length > 0;
    const isEdit = Boolean(initialData && initialData.id);

    return (
        <Dialog
            open={open}
            fullWidth
            keepMounted
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    overflow: "hidden"
                }
            }}
        >
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
                        <Typography variant="h6">{isEdit ? "Edit Test" : "Add Test"}</Typography>
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

            {apiError && (
                <Alert
                    severity="error"
                    onClose={() => setApiError(null)}
                    sx={{mx: 3, mt: 2}}
                >
                    {apiError}
                </Alert>
            )}
            <Box sx={{width: '100%', px: 3, pt: 3}}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((step, index) => (
                        <Step key={step.label} completed={index < activeStep || step.completed}>
                            <StepLabel>{step.label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            <DialogContent sx={{p: 3}}>
                {renderStepContent(activeStep)}

                {/* Optional Details Input only shown for activeStep 1 */}
                {activeStep === 1 && data?.method_test?.test && !loading && (
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
                )}
            </DialogContent>

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

                {activeStep === steps.length - 1 ? (
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
