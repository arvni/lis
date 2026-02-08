import React, {useState, useMemo, useCallback} from 'react';
import {
    Alert,
    Box,
    Button,
    Divider,
    FormControl,
    FormHelperText,
    Grid2 as Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Chip,
    Tooltip,
    Stack,
    Tabs,
    Tab,
    Badge
} from "@mui/material";
import {
    AccessTime as AccessTimeIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Paid as PaidIcon,
    Science as ScienceIcon,
    Person as PersonIcon,
    HelpOutline as HelpOutlineIcon,
    LocalOffer as DiscountIcon,
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon,
    Calculate as CalculateIcon
} from '@mui/icons-material';
import MethodPriceField from '../MethodPriceField';
import SelectSearch from "@/Components/SelectSearch.jsx";
import DiscountManager from '../DiscountManager';

// Constants
const TAB_CONFIGS = [
    {label: 'Method Selection', icon: ScienceIcon, key: 'methodSelection'},
    {label: 'Sample Config', icon: PersonIcon, key: 'patientInfo'},
    {label: 'Pricing', icon: CalculateIcon, key: 'pricing'}
];

const TAB_CONFIGS_SAMPLELESS = [
    {label: 'Method Selection', icon: ScienceIcon, key: 'methodSelection'},
    {label: 'Pricing', icon: CalculateIcon, key: 'pricing'}
];

const ERROR_TAB_MAPPING = {
    method: 0,
    samples: 1,
    patients: 1,
    sampleType: 1,
    discount: 2,
    price: 2
};

const PRICING_TYPES = ["Formulate", "Conditional"];

// Utility functions
const getTabErrors = (errors) => {
    const tabErrors = {0: [], 1: [], 2: []};

    Object.keys(errors).forEach(errorKey => {
        const tabIndex = Object.entries(ERROR_TAB_MAPPING)
            .find(([key]) => errorKey.includes(key))?.[1] ?? 0;
        tabErrors[tabIndex].push(errorKey);
    });

    return tabErrors;
};

const hasTabError = (tabErrors, tabIndex) => tabErrors[tabIndex]?.length > 0;

const createDefaultPatientArray = (count, patient) => {
    const defaultPatient = patient ? {id: patient.id, name: patient.fullName} : null;
    return Array(count).fill(defaultPatient).filter(Boolean);
};

const createDefaultSample = (patientCount, patient) => ({
    patients: createDefaultPatientArray(patientCount, patient),
    sampleType: ""
});

const createDefaultSamples = (sampleCount, patientCount, patient) => {
    return Array(sampleCount).fill(null).map(() => createDefaultSample(patientCount, patient));
};

// Memoized sub-components
const MethodTableRow = React.memo(({
                                       id,
                                       method,
                                       isSelected,
                                       onMethodSelect
                                   }) => (
    <TableRow
        hover
        sx={{
            cursor: 'pointer',
            '&:hover': {backgroundColor: 'action.hover'},
            ...(isSelected && {
                backgroundColor: 'primary.50',
                '&:hover': {backgroundColor: 'primary.100'}
            })
        }}
        onClick={() => onMethodSelect(id)}
    >
        <TableCell>
            <Typography fontWeight={isSelected ? "medium" : "normal"}>
                {method?.name}
            </Typography>
        </TableCell>
        <TableCell align="center">
            {method?.turnaround_time ? (
                <Chip
                    label={`${method.turnaround_time} days`}
                    size="small"
                    color={method.turnaround_time <= 2 ? "success" : "primary"}
                />
            ) : (
                <Typography variant="body2" color="text.secondary">
                    Not specified
                </Typography>
            )}
        </TableCell>
        <TableCell align="center">
            {method?.price_type === "Fix" ? (
                <Typography fontWeight="medium">
                    {method?.price} OMR
                </Typography>
            ) : (
                <Chip
                    label={method?.price_type}
                    size="small"
                    color="warning"
                />
            )}
        </TableCell>
    </TableRow>
));

const SampleConfiguration = React.memo(({
                                            sampleIndex,
                                            sample,
                                            methodTest,
                                            errors,
                                            patient,
                                            onSampleTypeChange,
                                            onPatientsChange,
                                            onRemoveSample,
                                            canRemove
                                        }) => {
    const sampleTypes = methodTest?.method?.test?.sample_types || [];
    const patientCount = methodTest?.method?.no_patient || 1;

    return (
        <Grid key={`sample-${sampleIndex}`} size={{xs: 12}}>
            <Box sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                position: 'relative',
                bgcolor: 'background.paper'
            }}>
                {/* Sample Header with Remove Button */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" color="primary" fontWeight="medium">
                        Sample {sampleIndex + 1}
                    </Typography>
                    {canRemove && (
                        <Tooltip title={`Remove Sample ${sampleIndex + 1}`}>
                            <IconButton
                                onClick={() => onRemoveSample(sampleIndex)}
                                size="small"
                                color="error"
                                sx={{
                                    '&:hover': {
                                        bgcolor: 'error.50'
                                    }
                                }}
                            >
                                <DeleteIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                <Grid container spacing={2}>
                    <Grid size={6}>
                        {errors?.[`samples.${sampleIndex}.sampleType`] &&
                            <Alert severity="error"
                                   sx={{mb: 1}}>{errors?.[`samples.${sampleIndex}.sampleType`]}</Alert>}
                        <Box display="flex" alignItems="flex-start">
                            <FormControl
                                fullWidth
                                error={Boolean(errors?.[`samples.${sampleIndex}.sampleType`])}
                            >
                                <InputLabel id={`sample-type-${sampleIndex}`}>
                                    Sample Type
                                </InputLabel>
                                <Select
                                    labelId={`sample-type-${sampleIndex}`}
                                    value={sample?.sampleType || ''}
                                    label="Sample Type"
                                    onChange={onSampleTypeChange(sampleIndex)}
                                    fullWidth
                                >
                                    {sampleTypes.map(sampleType => (
                                        <MenuItem
                                            key={sampleType.id}
                                            value={sampleType.id}
                                        >
                                            {sampleType.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText error={Boolean(errors?.['customParameters.sampleType'])}>
                                    {errors?.['customParameters.sampleType'] || "Type of biological sample to collect"}
                                </FormHelperText>
                            </FormControl>
                            <Tooltip title="The type of biological sample required for this test">
                                <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                            </Tooltip>
                        </Box>
                    </Grid>

                    <Grid size={6}>
                        {errors?.[`samples.${sampleIndex}.patients`] &&
                            <Alert severity="error" sx={{mb: 1}}>{errors?.[`samples.${sampleIndex}.patients`]}</Alert>}
                        <Stack spacing={2}>
                            {Array.from({length: patientCount}).map((_, patientIndex) => (
                                <Box
                                    key={`patient-${patientIndex}`}
                                    display="flex"
                                    alignItems="flex-start"
                                >
                                    <Box sx={{flexGrow: 1}}>
                                        <SelectSearch
                                            helperText={
                                                errors?.[`samples.${sampleIndex}.patients.${patientIndex}.id`] ||
                                                "Patient receiving the test"
                                            }
                                            error={Boolean(errors?.[`samples.${sampleIndex}.patients.${patientIndex}.id`])}
                                            value={sample?.patients?.[patientIndex] || ""}
                                            fullWidth
                                            label={`Patient ${patientIndex + 1}`}
                                            defaultData={{patient: patient?.id}}
                                            onChange={onPatientsChange(sampleIndex, patientIndex)}
                                            url={route("api.patients.list")}
                                            name="patient"
                                            startAdornment={<PersonIcon color="action" sx={{mr: 1}}/>}
                                        />
                                    </Box>
                                    <Tooltip title="Select the patient for this test">
                                        <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                                    </Tooltip>
                                </Box>
                            ))}
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Grid>
    );
});

const PriceSummary = React.memo(({price, discount, maxDiscount, errors}) => (
    <>
        <Grid size={{xs: 12}}>
            <Divider sx={{my: 2}}>
                <Chip label="Final Price Summary"/>
            </Divider>
        </Grid>

        <Grid size={{xs: 12, md: 6}}>
            <TextField
                type="number"
                label="Base Price (OMR)"
                name="price"
                fullWidth
                value={price || 0}
                slotProps={{input: {readOnly: true}}}
                sx={{"& .MuiInputBase-input": {fontWeight: 'bold', color: 'primary.main'}}}
            />
        </Grid>

        <Grid size={{xs: 12, md: 6}}>
            <TextField
                type="number"
                label="Total Discount (OMR)"
                name="discount"
                fullWidth
                value={discount || 0}
                slotProps={{input: {readOnly: true}}}
                sx={{"& .MuiInputBase-input": {fontWeight: 'bold', color: 'secondary.main'}}}
                error={Boolean(errors.discount)}
                helperText={
                    errors.discount ||
                    `Maximum discount: ${maxDiscount}% (${(maxDiscount * price * 0.01).toFixed(2)} OMR)`
                }
            />
        </Grid>

        <Grid size={{xs: 12}}>
            <Box sx={{
                p: 3,
                mt: 2,
                bgcolor: 'success.50',
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '2px solid',
                borderColor: 'success.200'
            }}>
                <Typography variant="h6" color="success.dark">
                    Final Price:
                </Typography>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                    {(price - discount).toFixed(2)} OMR
                </Typography>
            </Box>
        </Grid>
    </>
));

const RegularTestForm = ({
                             data = {},
                             onChange,
                             errors: errors2 = {},
                             maxDiscount = 0,
                             patient
                         }) => {
    // Safely destructure with defaults
    const {
        method_test: methodTest = {test: {method_tests: []}},
        price = 0,
        discount = 0,
        customParameters = {},
        samples = [],
        no_sample = 1,
        sampleless = false
    } = data;

    // Use different tab config based on sampleless
    const activeTabConfigs = sampleless ? TAB_CONFIGS_SAMPLELESS : TAB_CONFIGS;
    const [apiError, setApiError] = useState(null);
    const [currentTab, setCurrentTab] = useState(0);

    // Memoized calculations
    const {
        tabErrors,
        availableMethodTests,
        initializedCustomParameters,
        hasPricingConfiguration,
        maxSamples,
        canAddSample,
        canRemoveSample
    } = useMemo(() => {
        const errors = getTabErrors(errors2);
        const methods = methodTest?.test?.method_tests?.filter(mt => mt && mt.status) || [];
        const customParams = {
            ...customParameters,
            discounts: customParameters.discounts || []
        };
        const hasPricing = methodTest?.method?.price_type &&
            PRICING_TYPES.includes(methodTest.method.price_type);

        const maxSampleCount = methodTest?.method?.no_sample || 1;
        const currentSampleCount = Array.isArray(samples) ? samples.length : 0;

        return {
            tabErrors: errors,
            availableMethodTests: methods,
            initializedCustomParameters: customParams,
            hasPricingConfiguration: hasPricing,
            maxSamples: maxSampleCount,
            canAddSample: currentSampleCount < maxSampleCount,
            canRemoveSample: currentSampleCount > 1
        };
    }, [errors2, methodTest, customParameters, samples]);

    // Add sample handler
    const handleAddSample = useCallback(() => {
        if (!canAddSample) return;

        const patientCount = methodTest?.method?.no_patient || 1;
        const newSample = createDefaultSample(patientCount, patient);
        const currentSamples = Array.isArray(samples) ? [...samples] : [];

        onChange({
            samples: [...currentSamples, newSample],
            no_sample: currentSamples.length + 1
        });
    }, [canAddSample, methodTest, patient, samples, onChange]);

    // Remove sample handler
    const handleRemoveSample = useCallback((sampleIndex) => {
        if (!canRemoveSample) return;

        const currentSamples = Array.isArray(samples) ? [...samples] : [];
        const newSamples = currentSamples.filter((_, index) => index !== sampleIndex);

        onChange({
            samples: newSamples,
            no_sample: currentSamples.length - 1
        });
    }, [canRemoveSample, samples, onChange]);

    // Optimized event handlers
    const handleSampleTypeChange = useCallback((sampleIndex) => (e) => {
        const currentSamples = Array.isArray(samples) ? [...samples] : [];
        const newSamples = currentSamples.map((sample, index) =>
            index === sampleIndex
                ? {...sample, sampleType: e.target.value}
                : sample
        );

        onChange({
            samples: newSamples,
            customParameters: {
                ...initializedCustomParameters,
                sampleType: e.target.value
            }
        });
    }, [samples, initializedCustomParameters, onChange]);

    const handleMethodChange = useCallback((methodId) => {
        if (!methodId || !methodTest?.test?.method_tests) return;

        const newMethodTest = methodTest.test.method_tests.find(m => m.id === methodId);
        if (!newMethodTest?.method) return;

        try {
            const methodData = newMethodTest.method;
            const patientCount = methodData.no_patient || 1;
            const sampleCount = 1; // Start with 1 sample, user can add more

            onChange({
                method_test: {
                    ...methodTest,
                    method: methodData,
                    id: methodId,
                },
                price: methodData.price_type === 'Fix' ? methodData.price : 0,
                samples: createDefaultSamples(sampleCount, patientCount, patient),
                discount: 0,
                customParameters: {
                    sample_type: "",
                    discounts: [],
                    ...data.customParameters,
                },
            });

            // Auto-advance to next tab
            setCurrentTab(1);
        } catch (error) {
            console.error("Failed to update method:", error);
            setApiError("Failed to update method. Please try again.");
        }
    }, [methodTest, patient, data.customParameters, onChange]);

    const handleDiscountChange = useCallback((updatedValues) => {
        onChange(updatedValues);
    }, [onChange]);

    const handlePriceChange = useCallback((updatedValues) => {
        onChange(updatedValues);
    }, [onChange]);

    const handlePatientsChange = useCallback((sampleIndex, patientIndex) => (e) => {
        const currentSamples = Array.isArray(samples) ? [...samples] : [];
        const newSamples = currentSamples.map((sample, index) => {
            if (index !== sampleIndex) return sample;

            const currentPatients = Array.isArray(sample.patients) ? [...sample.patients] : [];
            const newPatients = [...currentPatients];
            newPatients[patientIndex] = e.target.value;

            return {...sample, patients: newPatients};
        });

        onChange({samples: newSamples});
    }, [samples, onChange]);

    const handleTabChange = useCallback((event, newValue) => {
        setCurrentTab(newValue);
    }, []);

    const handleApiErrorClose = useCallback(() => {
        setApiError(null);
    }, []);

    // Tab content renderers
    const renderMethodSelection = useCallback(() => (
        <Box sx={{mb: 4}}>
            <Box display="flex" alignItems="center" mb={2}>
                <ScienceIcon color="primary" sx={{mr: 1}}/>
                <Typography variant="h6" fontWeight="medium">
                    Select Testing Method
                </Typography>
                <Tooltip title="Choose the laboratory method for this test">
                    <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1}}/>
                </Tooltip>
            </Box>

            {availableMethodTests.length > 0 ? (
                <TableContainer component={Paper} sx={{borderRadius: 2, overflow: 'hidden'}}>
                    <Table>
                        <TableHead sx={{backgroundColor: 'primary.50'}}>
                            <TableRow>
                                <TableCell>Method Name</TableCell>
                                <TableCell align="center">
                                    <Box display="flex" alignItems="center" justifyContent="center">
                                        <AccessTimeIcon fontSize="small" sx={{mr: 0.5}}/>
                                        Turnaround Time
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <Box display="flex" alignItems="center" justifyContent="center">
                                        <PaidIcon fontSize="small" sx={{mr: 0.5}}/>
                                        Price
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {availableMethodTests.map(({method, id}) => (
                                <MethodTableRow
                                    key={id}
                                    methodTest={methodTest}
                                    id={id}
                                    method={method}
                                    isSelected={methodTest?.id === id}
                                    onMethodSelect={handleMethodChange}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Paper sx={{p: 3, textAlign: 'center', backgroundColor: 'grey.50', borderRadius: 2}}>
                    <Typography color="text.secondary">
                        No testing methods available for this test
                    </Typography>
                </Paper>
            )}
        </Box>
    ), [availableMethodTests, methodTest, handleMethodChange]);

    const renderPatientInformation = useCallback(() => (
        <Box sx={{mb: 4}}>
            <Box display="flex" alignItems="center" justify="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                    <PersonIcon color="primary" sx={{mr: 1}}/>
                    <Typography variant="h6" fontWeight="medium">
                        Sample Configuration
                    </Typography>
                </Box>

                {methodTest?.method && (
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                            {samples.length} of {maxSamples} samples
                        </Typography>
                        {canAddSample && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon/>}
                                onClick={handleAddSample}
                                color="primary"
                            >
                                Add Sample
                            </Button>
                        )}
                    </Box>
                )}
            </Box>

            {!methodTest?.method ? (
                <Alert severity="warning">
                    Please select a testing method first
                </Alert>
            ) : (
                <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                    <Grid container spacing={3}>
                        {samples.map((sample, sampleIndex) => (
                            <SampleConfiguration
                                key={sampleIndex}
                                sampleIndex={sampleIndex}
                                sample={sample}
                                methodTest={methodTest}
                                errors={errors2}
                                patient={patient}
                                onSampleTypeChange={handleSampleTypeChange}
                                onPatientsChange={handlePatientsChange}
                                onRemoveSample={handleRemoveSample}
                                canRemove={canRemoveSample}
                                totalSamples={samples.length}
                            />
                        ))}

                        {samples.length === 0 && (
                            <Grid size={12}>
                                <Alert severity="info">
                                    No samples configured. Click "Add Sample" to get started.
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            )}
        </Box>
    ), [
        methodTest,
        samples,
        maxSamples,
        canAddSample,
        canRemoveSample,
        errors2,
        patient,
        handleSampleTypeChange,
        handlePatientsChange,
        handleAddSample,
        handleRemoveSample
    ]);

    const renderPricingAndDiscounts = useCallback(() => (
        <Box sx={{mb: 4}}>
            <Box display="flex" alignItems="center" mb={2}>
                <CalculateIcon color="primary" sx={{mr: 1}}/>
                <Typography variant="h6" fontWeight="medium">
                    Pricing & Discounts
                </Typography>
            </Box>

            {!methodTest?.method ? (
                <Alert severity="warning">
                    Please select a testing method first
                </Alert>
            ) : (
                <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                    <Grid container spacing={3}>
                        {hasPricingConfiguration && (
                            <Grid size={12}>
                                <Box sx={{p: 2, bgcolor: 'primary.50', borderRadius: 2, mb: 2}}>
                                    <Typography variant="body2">
                                        This test uses {methodTest.method.price_type} pricing.
                                        Please configure the parameters below.
                                    </Typography>
                                </Box>
                                <MethodPriceField
                                    method={methodTest.method}
                                    values={customParameters}
                                    onChange={handlePriceChange}
                                    errors={errors2}
                                />
                            </Grid>
                        )}

                        <Grid size={{xs: 12}}>
                            <Box display="flex" alignItems="center" mb={2}>
                                <DiscountIcon color="secondary" sx={{mr: 1}}/>
                                <Typography variant="subtitle1" fontWeight="medium">
                                    Discount Management
                                </Typography>
                            </Box>
                            <DiscountManager
                                customParameters={initializedCustomParameters}
                                price={price || 0}
                                maxDiscount={maxDiscount}
                                onChange={handleDiscountChange}
                                errors={errors2}
                            />
                        </Grid>

                        <PriceSummary
                            price={price}
                            discount={discount}
                            maxDiscount={maxDiscount}
                            errors={errors2}
                        />
                    </Grid>
                </Paper>
            )}
        </Box>
    ), [
        methodTest,
        hasPricingConfiguration,
        customParameters,
        initializedCustomParameters,
        price,
        discount,
        maxDiscount,
        errors2,
        handlePriceChange,
        handleDiscountChange
    ]);

    const tabRenderers = useMemo(() => {
        if (sampleless) {
            return [renderMethodSelection, renderPricingAndDiscounts];
        }
        return [renderMethodSelection, renderPatientInformation, renderPricingAndDiscounts];
    }, [sampleless, renderMethodSelection, renderPatientInformation, renderPricingAndDiscounts]);

    return (
        <Box>
            {apiError && (
                <Alert severity="error" sx={{mb: 3}} onClose={handleApiErrorClose}>
                    {apiError}
                </Alert>
            )}

            <Paper elevation={2} sx={{borderRadius: 2, overflow: 'hidden'}}>
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: 'grey.50'
                    }}
                    variant="fullWidth"
                >
                    {activeTabConfigs.map((tab, index) => {
                        const IconComponent = tab.icon;
                        const hasError = hasTabError(tabErrors, index);
                        const isMethodSelected = index === 0 && methodTest?.id;

                        return (
                            <Tab
                                key={tab.key}
                                label={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Badge
                                            color="error"
                                            variant="dot"
                                            invisible={!hasError}
                                            sx={{
                                                '& .MuiBadge-dot': {
                                                    right: -2,
                                                    top: 2
                                                }
                                            }}
                                        >
                                            {hasError ? (
                                                <ErrorIcon fontSize="small" color="error"/>
                                            ) : isMethodSelected ? (
                                                <CheckCircleIcon fontSize="small" color="success"/>
                                            ) : (
                                                <IconComponent fontSize="small"/>
                                            )}
                                        </Badge>
                                        <Typography variant="body2" sx={{display: {xs: 'none', md: 'block'}}}>
                                            {tab.label}
                                        </Typography>
                                    </Box>
                                }
                                sx={{
                                    minHeight: 64,
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.50'
                                    }
                                }}
                            />
                        );
                    })}
                </Tabs>

                <Box sx={{p: 3, minHeight: 400}}>
                    {tabRenderers[currentTab]()}
                </Box>
            </Paper>
        </Box>
    );
};

export default RegularTestForm;
