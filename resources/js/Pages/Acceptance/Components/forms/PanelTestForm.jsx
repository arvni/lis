import React, {useCallback, useMemo, useState} from 'react';
import {
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Grid2 as Grid,
    Typography,
    Paper,
    Box,
    Chip,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tabs,
    Tab,
    Badge,
    Alert,
    Stack,
    Divider,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
} from '@mui/material';
import {
    Science as ScienceIcon,
    Person as PersonIcon,
    ScienceOutlined as ScienceOutlinedIcon,
    HelpOutline as HelpOutlineIcon,
    ExpandMore as ExpandMoreIcon,
    AttachMoney as AttachMoneyIcon,
    Error as ErrorIcon,
    Calculate as CalculateIcon,
    Settings as SettingsIcon,
    LocalOffer as DiscountIcon,
    Details,
    AccessTime as AccessTimeIcon,
    Add as AddIcon,
    Remove as RemoveIcon
} from '@mui/icons-material';
import SelectSearch from "@/Components/SelectSearch.jsx";
import PriceField from "../MethodPriceField.jsx";
import DiscountManager from "@/Pages/Acceptance/Components/DiscountManager.jsx";

// Constants
const TAB_CONFIGS = [
    {label: 'Panel Information', icon: Details, key: 'panelInformation'},
    {label: 'Sample Config', icon: PersonIcon, key: 'patientAssignment'},
    {label: 'Price Config', icon: CalculateIcon, key: 'priceConfig'},
    {label: 'Test Details', icon: SettingsIcon, key: 'testDetails'}
];

const ERROR_TAB_MAPPING = {
    samples: 1,
    sampleType: 1,
    details: 3,
    price: 2,
    customParameters: 2,
    discount: 2
};

const PANEL_PRICE_TYPES = {
    FIX: 'Fix',
    FORMULATE: 'Formulate',
    CONDITIONAL: 'Conditional'
};

// Utility functions
const getTabErrors = (errors) => {
    const tabErrors = {0: [], 1: [], 2: [], 3: []};

    Object.keys(errors).forEach(errorKey => {
        const tabIndex = Object.entries(ERROR_TAB_MAPPING)
            .find(([key]) => errorKey.includes(key))?.[1] ?? 0;
        tabErrors[tabIndex].push(errorKey);
    });

    return tabErrors;
};

const hasTabError = (tabErrors, tabIndex) => tabErrors[tabIndex]?.length > 0;

const safeArrayAccess = (array, index, defaultValue = {}) =>
    Array.isArray(array) && array[index] ? array[index] : defaultValue;

// Memoized sub-components
const TestMethodDisplay = React.memo(({item, showMethod = true}) => (
    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
        <ScienceIcon color="primary" sx={{mr: 1}}/>
        <Typography variant="subtitle2" fontWeight="medium">
            {item.method_test?.method?.test?.name || "Test"}
        </Typography>
        {showMethod && (
            <Chip
                label={`Method: ${item.method_test?.method?.name || "Unknown"}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ml: 2}}
            />
        )}
    </Box>
));

TestMethodDisplay.displayName = 'TestMethodDisplay';

const PriceDisplay = React.memo(({price, discount, maxDiscount, errors}) => {
    const finalPrice = (price - discount).toFixed(2);
    const maxDiscountAmount = (maxDiscount * price * 0.01).toFixed(2);

    return (
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
                    helperText={errors.discount || `Maximum discount: ${maxDiscount}% (${maxDiscountAmount} OMR)`}
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
                        {finalPrice} OMR
                    </Typography>
                </Box>
            </Grid>
        </>
    );
});

PriceDisplay.displayName = 'PriceDisplay';

const EmptyState = React.memo(() => (
    <Paper
        elevation={0}
        sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '1px dashed grey.300'
        }}
    >
        <ScienceOutlinedIcon sx={{fontSize: 40, color: 'text.secondary', mb: 2}}/>
        <Typography variant="h6">No Tests Available</Typography>
        <Typography variant="body2" sx={{mt: 1}}>
            This panel doesn't contain any tests to configure
        </Typography>
    </Paper>
));

EmptyState.displayName = 'EmptyState';

const PanelHeader = React.memo(({panel, itemCount}) => (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center">
            <ScienceIcon color="primary" sx={{mr: 1}}/>
            <Typography variant="subtitle1" fontWeight="medium">
                {panel?.name || "Panel"}
            </Typography>
            <Chip
                label={`${itemCount} Tests`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ml: 2}}
            />
        </Box>

        {panel?.price_type === PANEL_PRICE_TYPES.FIX && (
            <Paper elevation={2} sx={{
                p: 2,
                backgroundColor: 'success.main',
                color: 'white',
                borderRadius: 2
            }}>
                <Box display="flex" alignItems="center">
                    <AttachMoneyIcon sx={{mr: 1}}/>
                    <Typography variant="h6" fontWeight="bold">
                        Panel Price: {panel.price} OMR
                    </Typography>
                </Box>
            </Paper>
        )}
    </Box>
));

PanelHeader.displayName = 'PanelHeader';

const SampleConfiguration = React.memo(({
                                            item,
                                            itemIndex,
                                            errors,
                                            onSampleTypeChange,
                                            onPatientChange,
                                            onAddSample,
                                            onRemoveSample,
                                            patient
                                        }) => {
    const sampleTypes = item?.method_test?.method?.test?.sample_types || [];
    const numberOfPatients = item.method_test?.method?.no_patient || 1;
    const maxSamples = item.method_test?.method?.no_sample || 1;

    // Get current samples or initialize with at least one sample
    const currentSamples = item.samples || [{}];
    const currentSampleCount = currentSamples.length;

    return (
        <Grid container spacing={2}>
            {/* Sample count controls */}
            <Grid size={{xs: 12}}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                        Samples ({currentSampleCount}/{maxSamples})
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title="Add sample">
                            <span>
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => onAddSample(itemIndex)}
                                    disabled={currentSampleCount >= maxSamples}
                                    sx={{
                                        bgcolor: 'primary.50',
                                        '&:hover': {bgcolor: 'primary.100'},
                                        '&.Mui-disabled': {bgcolor: 'grey.100'}
                                    }}
                                >
                                    <AddIcon fontSize="small"/>
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Remove sample">
                            <span>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onRemoveSample(itemIndex)}
                                    disabled={currentSampleCount <= 1}
                                    sx={{
                                        bgcolor: 'error.50',
                                        '&:hover': {bgcolor: 'error.100'},
                                        '&.Mui-disabled': {bgcolor: 'grey.100'}
                                    }}
                                >
                                    <RemoveIcon fontSize="small"/>
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>
            </Grid>

            {/* Sample configurations */}
            {currentSamples.map((sample, sampleIndex) => (
                <Grid key={`sample-${sampleIndex}`} size={{xs: 12}}>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            position: 'relative'
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                    <Typography variant="subtitle2" color="primary" fontWeight="medium">
                                        Sample {sampleIndex + 1}
                                    </Typography>
                                    {currentSampleCount > 1 && (
                                        <Tooltip title={`Remove Sample ${sampleIndex + 1}`}>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => onRemoveSample(itemIndex, sampleIndex)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    bgcolor: 'error.50',
                                                    '&:hover': {bgcolor: 'error.100'}
                                                }}
                                            >
                                                <RemoveIcon fontSize="small"/>
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                                <FormControl
                                    fullWidth
                                    error={Boolean(errors?.[`acceptanceItems.${itemIndex}.customParameters.samples.${sampleIndex}.sampleType`])}
                                >
                                    <InputLabel id={`sample-type-${item.id}-sampleType-${sampleIndex}`}>
                                        Sample Type
                                    </InputLabel>
                                    <Select
                                        onChange={onSampleTypeChange(itemIndex, sampleIndex)}
                                        name="sampleType"
                                        label="Sample Type"
                                        value={sample?.sampleType || ""}
                                        fullWidth
                                        labelId={`sample-type-${item.id}-sampleType-${sampleIndex}`}
                                    >
                                        <MenuItem value="">
                                            <em>Select sample type</em>
                                        </MenuItem>
                                        {sampleTypes.map(sampleType => (
                                            <MenuItem
                                                key={`sample-type-${sampleType.id}`}
                                                value={sampleType.id}
                                            >
                                                {sampleType.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText
                                        error={Boolean(errors?.[`acceptanceItems.${itemIndex}.customParameters.samples.${sampleIndex}.sampleType`])}
                                    >
                                        {errors?.[`acceptanceItems.${itemIndex}.customParameters.samples.${sampleIndex}.sampleType`] || "Type of biological sample required"}
                                    </FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid size={6}>
                                <Typography variant="subtitle2" color="primary" fontWeight="medium" sx={{mb: 2}}>
                                    Patients
                                </Typography>
                                <Stack spacing={2}>
                                    {Array.from({length: numberOfPatients}).map((_, patientIndex) => (
                                        <Box
                                            key={`patient-${patientIndex}`}
                                            display="flex"
                                            alignItems="flex-start"
                                        >
                                            <Box sx={{flexGrow: 1}}>
                                                <SelectSearch
                                                    helperText={errors?.[`acceptanceItems.${itemIndex}.samples.${sampleIndex}.patients.${patientIndex}.id`] || 'Patient receiving the test'}
                                                    error={Boolean(errors?.[`acceptanceItems.${itemIndex}.samples.${sampleIndex}.patients.${patientIndex}.id`])}
                                                    value={sample?.patients?.[patientIndex] || ""}
                                                    fullWidth
                                                    label={`Patient ${patientIndex + 1}`}
                                                    defaultData={{patient: patient?.id}}
                                                    onChange={onPatientChange(item.id, sampleIndex, patientIndex)}
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
                    </Paper>
                    {sampleIndex !== (currentSampleCount - 1) && (
                        <Divider sx={{mt: 3}}/>
                    )}
                </Grid>
            ))}
        </Grid>
    );
});

SampleConfiguration.displayName = 'SampleConfiguration';

const PanelTestForm = ({
                           acceptanceItems = [],
                           onChange,
                           errors = {},
                           patient,
                           panel,
                           maxDiscount = 0,
                       }) => {
    const [currentTab, setCurrentTab] = useState(0);

    // Memoized calculations
    const tabErrors = useMemo(() => getTabErrors(errors), [errors]);

    const calculations = useMemo(() => {
        const totalPrice = acceptanceItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        const totalDiscount = acceptanceItems.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
        const hasPanelPricing = panel?.extra?.parameters?.length > 0 &&
            (panel?.price_type === PANEL_PRICE_TYPES.FORMULATE || panel?.price_type === PANEL_PRICE_TYPES.CONDITIONAL);

        const firstItem = acceptanceItems[0];
        const customParams = {
            ...(firstItem?.customParameters || {}),
            discounts: (firstItem?.customParameters?.discounts || [])
        };

        return {
            price: totalPrice,
            discount: totalDiscount,
            hasPanelPricing,
            initializedCustomParameters: customParams
        };
    }, [acceptanceItems, panel]);

    // Sample management handlers
    const handleAddSample = useCallback((itemIndex) => {
        const item = acceptanceItems[itemIndex];
        const maxSamples = item.method_test?.method?.no_sample || 1;
        const currentSamples = item.samples || [{}];

        if (currentSamples.length >= maxSamples) return;

        const newSample = {
            sampleType: '',
            patients: Array.from({length: item.method_test?.method?.no_patient || 1}, () => '')
        };

        const updatedItems = acceptanceItems.map((item, index) =>
            index === itemIndex
                ? {...item, samples: [...currentSamples, newSample], no_sample: currentSamples.length + 1}
                : item
        );

        onChange?.(updatedItems);
    }, [acceptanceItems, onChange]);

    const handleRemoveSample = useCallback((itemIndex, sampleIndex = null) => {
        const item = acceptanceItems[itemIndex];
        const currentSamples = item.samples || [{}];

        if (currentSamples.length <= 1) return; // Must keep at least one sample

        let newSamples;
        if (sampleIndex !== null) {
            // Remove specific sample
            newSamples = currentSamples.filter((_, index) => index !== sampleIndex);
        } else {
            // Remove last sample
            newSamples = currentSamples.slice(0, -1);
        }

        const updatedItems = acceptanceItems.map((item, index) =>
            index === itemIndex
                ? {...item, samples: newSamples, no_sample: newSamples.length - 1}
                : item
        );

        onChange?.(updatedItems);
    }, [acceptanceItems, onChange]);

    // Optimized change handlers
    const handleMethodTestChange = useCallback((id) => (e) => {
        const {name, value} = e.target;
        const itemIndex = acceptanceItems.findIndex(item => item.id === id);
        if (itemIndex === -1) return;

        const item = acceptanceItems[itemIndex];
        const newValue = name === "sampleType"
            ? {customParameters: {...item.customParameters, [name]: value}}
            : {[name]: value};

        const updatedItems = acceptanceItems.map((item, index) =>
            index === itemIndex ? {...item, ...newValue} : item
        );

        onChange?.(updatedItems);
    }, [acceptanceItems, onChange]);

    const handlePanelPriceChange = useCallback((priceData) => {
        if (!onChange || !acceptanceItems.length) return;

        const pricePerItem = priceData.price / acceptanceItems.length;
        const updatedItems = acceptanceItems.map(item => ({
            ...item,
            price: pricePerItem,
            customParameters: {
                ...item.customParameters,
                ...(priceData.customParameters || {})
            }
        }));

        onChange(updatedItems);
    }, [acceptanceItems, onChange]);

    const handleDiscountChange = useCallback((discountData) => {
        if (!onChange || !acceptanceItems.length) return;

        const discountPerItem = discountData.discount / acceptanceItems.length;
        const updatedItems = acceptanceItems.map(item => ({
            ...item,
            discount: discountPerItem,
            customParameters: {
                ...item.customParameters,
                ...(discountData.customParameters || {})
            }
        }));

        onChange(updatedItems);
    }, [acceptanceItems, onChange]);

    const handlePatientsChange = useCallback((itemId, sampleIndex, patientIndex) => (e) => {
        const {value} = e.target;
        const itemIndex = acceptanceItems.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;

        const updatedItems = acceptanceItems.map((item, index) => {
            if (index !== itemIndex) return item;

            const currentSamples = [...(item.samples || [{}])];
            const currentSample = safeArrayAccess(currentSamples, sampleIndex, {patients: []});
            const currentPatients = [...(currentSample.patients || [])];

            currentPatients[patientIndex] = value;
            currentSamples[sampleIndex] = {...currentSample, patients: currentPatients};

            return {...item, samples: currentSamples};
        });

        onChange?.(updatedItems);
    }, [acceptanceItems, onChange]);

    const handleSampleTypeChange = useCallback((itemIndex, sampleIndex) => (e) => {
        const {value} = e.target;
        const updatedItems = acceptanceItems.map((item, index) => {
            if (index !== itemIndex) return item;

            const currentSamples = [...(item.samples || [{}])];
            const currentSample = safeArrayAccess(currentSamples, sampleIndex, {});
            currentSamples[sampleIndex] = {...currentSample, sampleType: value};

            return {...item, samples: currentSamples};
        });

        onChange?.(updatedItems);
    }, [acceptanceItems, onChange]);

    const handleTabChange = useCallback((event, newValue) => {
        setCurrentTab(newValue);
    }, []);

    // Tab content renderers
    const renderPriceConfiguration = useCallback(() => (
        <Box sx={{mb: 4}}>
            <Box display="flex" alignItems="center" mb={2}>
                <CalculateIcon color="primary" sx={{mr: 1}}/>
                <Typography variant="h6" fontWeight="medium">
                    Panel Configuration
                </Typography>
                <Tooltip title="Configure panel pricing and parameters">
                    <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1}}/>
                </Tooltip>
            </Box>

            {!panel ? (
                <Alert severity="warning">Panel information is not available</Alert>
            ) : (
                <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                    <Grid container spacing={3}>
                        <Grid size={{xs: 12}}>
                            <PanelHeader panel={panel} itemCount={acceptanceItems.length}/>
                        </Grid>

                        {calculations.hasPanelPricing && (
                            <Grid size={{xs: 12}}>
                                <Paper elevation={2} sx={{
                                    borderRadius: 2,
                                    borderLeft: '4px solid',
                                    borderLeftColor: 'secondary.main'
                                }}>
                                    <Accordion defaultExpanded>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon/>}
                                            sx={{
                                                backgroundColor: 'secondary.50',
                                                borderRadius: 1,
                                                '&.Mui-expanded': {minHeight: 48}
                                            }}
                                        >
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                <AttachMoneyIcon color="secondary" sx={{mr: 1}}/>
                                                <Typography variant="subtitle1" fontWeight="medium">
                                                    Panel Price Configuration
                                                </Typography>
                                                <Chip
                                                    label={panel?.price_type || "Unknown"}
                                                    size="small"
                                                    color="secondary"
                                                    variant="outlined"
                                                    sx={{ml: 2}}
                                                />
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{pt: 2}}>
                                            <PriceField
                                                method={panel}
                                                onChange={handlePanelPriceChange}
                                                values={acceptanceItems[0]?.customParameters || {}}
                                                errors={errors}
                                            />
                                        </AccordionDetails>
                                    </Accordion>
                                </Paper>
                            </Grid>
                        )}

                        {!calculations.hasPanelPricing && panel?.price_type !== PANEL_PRICE_TYPES.FIX && (
                            <Grid size={{xs: 12}}>
                                <Alert severity="info">
                                    This panel uses standard pricing. No additional configuration required.
                                </Alert>
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
                                customParameters={calculations.initializedCustomParameters}
                                price={calculations.price}
                                maxDiscount={maxDiscount}
                                onChange={handleDiscountChange}
                                errors={errors}
                            />
                        </Grid>

                        <PriceDisplay
                            price={calculations.price}
                            discount={calculations.discount}
                            maxDiscount={maxDiscount}
                            errors={errors}
                        />
                    </Grid>
                </Paper>
            )}
        </Box>
    ), [panel, acceptanceItems, calculations, maxDiscount, errors, handlePanelPriceChange, handleDiscountChange]);

    const renderPatientAssignment = useCallback(() => (
        <Box sx={{mb: 4}}>
            <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon color="primary" sx={{mr: 1}}/>
                <Typography variant="h6" fontWeight="medium">
                    Patient Assignment
                </Typography>
                <Tooltip title="Assign patients to each test in the panel">
                    <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1}}/>
                </Tooltip>
            </Box>

            {!acceptanceItems?.length ? (
                <Alert severity="warning">No tests available in this panel</Alert>
            ) : (
                <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                    <Grid container spacing={3}>
                        {acceptanceItems.map((item, itemIndex) => {
                            const hasErrors = Boolean(errors?.[`acceptanceItems.${itemIndex}.patients.0.id`]);

                            return (
                                <Grid key={`patient-assignment-${item.id}`} size={{xs: 12}}>
                                    <Paper elevation={0} sx={{
                                        p: 2,
                                        mb: 2,
                                        borderRadius: 2,
                                        borderLeft: '4px solid',
                                        borderLeftColor: hasErrors ? 'error.main' : 'primary.main',
                                        backgroundColor: hasErrors ? 'error.50' : 'primary.50'
                                    }}>
                                        <TestMethodDisplay item={item}/>
                                        <SampleConfiguration
                                            item={item}
                                            itemIndex={itemIndex}
                                            errors={errors}
                                            onSampleTypeChange={handleSampleTypeChange}
                                            onPatientChange={handlePatientsChange}
                                            onAddSample={handleAddSample}
                                            onRemoveSample={handleRemoveSample}
                                            patient={patient}
                                        />
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Paper>
            )}
        </Box>
    ), [acceptanceItems, errors, patient, handleSampleTypeChange, handlePatientsChange, handleAddSample, handleRemoveSample]);

    const renderTestDetails = useCallback(() => (
        <Box sx={{mb: 4}}>
            <Box display="flex" alignItems="center" mb={2}>
                <SettingsIcon color="primary" sx={{mr: 1}}/>
                <Typography variant="h6" fontWeight="medium">
                    Test Details
                </Typography>
                <Tooltip title="Add additional details for each test">
                    <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1}}/>
                </Tooltip>
            </Box>

            {!acceptanceItems?.length ? (
                <Alert severity="warning">No tests available in this panel</Alert>
            ) : (
                <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                    <Grid container spacing={3}>
                        {acceptanceItems.map((item) => (
                            <Grid key={`test-details-${item.id}`} size={{xs: 12}}>
                                <Paper elevation={0} sx={{
                                    p: 2,
                                    mb: 2,
                                    borderRadius: 2,
                                    borderLeft: '4px solid',
                                    borderLeftColor: 'info.main',
                                    backgroundColor: 'info.50'
                                }}>
                                    <TestMethodDisplay item={item} showMethod/>
                                    <TextField
                                        name="details"
                                        multiline
                                        fullWidth
                                        minRows={2}
                                        label="Additional Details (Optional)"
                                        placeholder="Enter any specific notes or details for this test"
                                        onChange={handleMethodTestChange(item.id)}
                                        value={item.details || ""}
                                        variant="outlined"
                                    />
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}
        </Box>
    ), [acceptanceItems, handleMethodTestChange]);

    const renderPanelInformation = useCallback(() => (
        <Box sx={{mb: 4}}>
            <Box display="flex" alignItems="center" mb={2}>
                <Details color="primary" sx={{mr: 1}}/>
                <Typography variant="h6" fontWeight="medium">
                    Panel Information
                </Typography>
                <Tooltip title="View panel information and configuration">
                    <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1}}/>
                </Tooltip>
            </Box>

            <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                <Grid container spacing={3}>
                    <Grid size={{xs: 12}}>
                        {panel ? (<>
                                <PanelHeader panel={panel} itemCount={panel?.method_tests?.length}/>
                                {panel?.method_tests?.length > 0 && (
                                    <TableContainer component={Paper} sx={{borderRadius: 2, overflow: 'hidden'}}>
                                        <Table>
                                            <TableHead sx={{backgroundColor: 'primary.50'}}>
                                                <TableRow>
                                                    <TableCell>{"Test Name >> Method Name"}</TableCell>
                                                    <TableCell align="center">
                                                        <Box display="flex" alignItems="center" justifyContent="center">
                                                            <AccessTimeIcon fontSize="small" sx={{mr: 0.5}}/>
                                                            Turnaround Time
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {panel?.method_tests?.map(({method, id}) => (
                                                    <TableRow
                                                        key={id}
                                                        hover
                                                        sx={{
                                                            '&:hover': {backgroundColor: 'action.hover'},
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Typography fontWeight="normal">
                                                                {method?.test?.name + " >>" + method.name}
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
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>)}
                            </>
                        ) : (
                            <Alert severity="warning">Panel information is not available</Alert>
                        )}
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    ), [panel, acceptanceItems.length]);

    const tabRenderers = useMemo(() => [
        renderPanelInformation,
        renderPatientAssignment,
        renderPriceConfiguration,
        renderTestDetails
    ], [renderPanelInformation, renderPatientAssignment, renderPriceConfiguration, renderTestDetails]);

    // Early return for empty state
    if (!acceptanceItems?.length) {
        return <EmptyState/>;
    }

    return (
        <Box>
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
                    {TAB_CONFIGS.map((tab, index) => {
                        const IconComponent = tab.icon;
                        const hasError = hasTabError(tabErrors, index);

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

export default PanelTestForm;
