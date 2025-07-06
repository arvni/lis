import React, {useEffect, useState, useCallback} from 'react';
import {
    DialogActions,
    Select,
    Dialog,
    DialogTitle,
    FormControl,
    FormHelperText,
    InputLabel,
    OutlinedInput,
    Table,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    Button,
    MenuItem,
    TextField,
    DialogContent,
    Paper,
    Chip,
    Box,
    Collapse,
    IconButton,
    Alert,
    CircularProgress,
    Backdrop
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Info as InfoIcon,
    AttachMoney as MoneyIcon,
    Science as ScienceIcon,
    Category as CategoryIcon
} from '@mui/icons-material';
import {router} from '@inertiajs/react';
import axios from 'axios';

import SelectSearch from '@/Components/SelectSearch';
import ParametersField from './ParametersField';
import ConditionsField from './ConditionsField';
import Grid from "@mui/material/Grid2";
import Typography from '@mui/material/Typography';

const AddPrice = ({
                      open,
                      defaultValue,
                      onClose
                  }) => {
    // State management with improved typing
    const [data, setData] = useState(defaultValue);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [expandedMethods, setExpandedMethods] = useState({});

    // Reset data when defaultValue changes
    useEffect(() => {
        setData(defaultValue);
    }, [defaultValue]);

    // Close handler with data reset
    const handleClose = useCallback(() => {
        setData(defaultValue);
        onClose();
    }, [defaultValue, onClose]);

    // Test select handler
    const handleTestSelect = async (e) => {
        const selectedTest = e.target.value;

        if (selectedTest) {
            setLoading(true);
            try {
                const res = await axios.get(route('api.tests.show', selectedTest?.id), {params: {referrer: defaultValue.referrer}});

                // Initialize methods data structure as an array
                const methodsArray = [];

                // For each method in the test, create an entry in methodsArray
                if (res.data.data.method_tests && res.data.data.method_tests.length > 0) {
                    res.data.data.method_tests.forEach(methodTest => {
                        methodsArray.push({
                            id: methodTest.id,
                            method: methodTest.method,
                            method_id: methodTest.method.id,
                            price_type: methodTest.method.price_type || 'Fix',
                            price: methodTest.method.price_type === 'Fix' ? methodTest.method.price : null,
                            extra: methodTest.method.extra || {}
                        });
                    });
                }
                setData(prevData => ({
                    ...prevData,
                    test: res.data.data,
                    methods: methodsArray, // Store all methods data as array
                    price: res.data.data.price,
                    price_type:  res.data.data.price_type || 'Fix',
                    extra: res.data.data.extra || {}
                }));
            } catch (error) {
                console.error('Error fetching test details:', error);
                // Optionally add error handling/notification
            } finally {
                setLoading(false);
            }
        } else {
            setData(prevData => ({
                ...prevData,
                test: null,
                methods: []
            }));
        }
    };

    // Submit handler
    const submit = () => {
        const routeName = data?.id
            ? route('referrer-tests.update', data.id)
            : route('referrer-tests.store');

        // Prepare the data for submission with the "methods" parameter
        const submissionData = {
            ...data,
            method: data.methods // Add methods data for submission
        };

        router.post(routeName, submissionData, {
            onSuccess: onClose,
            onError: (errors) => {
                console.error('Submission errors:', errors);
                setErrors(errors);
            }
        });
    };

    // Generic change handler for method specific inputs
    const handleMethodChange = (index, field, value) => {
        setData(prevData => {
            const updatedMethods = [...prevData.methods];
            updatedMethods[index] = {
                ...updatedMethods[index],
                [field]: field === 'price' ? Number(value) : value
            };
            return {
                ...prevData,
                methods: updatedMethods
            };
        });
    };

    // Extra fields change handler for specific method
    const handleMethodExtraChange = (index, name, value) => {
        setData(prevData => {
            const updatedMethods = [...prevData.methods];
            updatedMethods[index] = {
                ...updatedMethods[index],
                extra: {
                    ...updatedMethods[index].extra,
                    [name]: value
                }
            };
            return {
                ...prevData,
                methods: updatedMethods
            };
        });
    };

    // Toggle method expansion
    const toggleMethodExpansion = (index) => {
        setExpandedMethods(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Function to render price section for a specific method
    const renderPriceSection = (index) => {
        const methodData = data.methods[index];
        const method = data?.test?.method_tests?.find(item => item.method_id === (methodData.method?.id || methodData.method_id))?.method;
        const isExpanded = expandedMethods[index];

        return (
            <Paper
                elevation={2}
                sx={{
                    mb: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                }}
                key={`method-${method?.id}`}
            >
                {/* Method Header */}
                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                    onClick={() => toggleMethodExpansion(index)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScienceIcon />
                        <Typography variant="h6" component="div">
                            {method?.name}
                        </Typography>
                        <Chip
                            label={methodData.price_type || 'Fix'}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: 'inherit',
                                fontWeight: 'bold'
                            }}
                        />
                    </Box>
                    <IconButton
                        sx={{ color: 'inherit' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMethodExpansion(index);
                        }}
                    >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>

                {/* Method Content */}
                <Collapse in={isExpanded}>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            {/* Price Type Selection */}
                            <Grid size={6}>
                                <FormControl fullWidth>
                                    <InputLabel id={`price-type-select-label-${index}`}>Price Type</InputLabel>
                                    <Select
                                        labelId={`price-type-select-label-${index}`}
                                        id={`price-type-select-${index}`}
                                        value={methodData.price_type || 'Fix'}
                                        label="Price Type"
                                        onChange={(e) => handleMethodChange(index, 'price_type', e.target.value)}
                                    >
                                        <MenuItem value="Fix">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <MoneyIcon fontSize="small" />
                                                Fix
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="Formulate">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ScienceIcon fontSize="small" />
                                                Formulate
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="Conditional">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CategoryIcon fontSize="small" />
                                                Conditional
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Price Input Sections based on price type */}
                            {methodData.price_type === 'Fix' ? (
                                <Grid size={6}>
                                    <FormControl fullWidth>
                                        <InputLabel
                                            error={!!errors[`methods.${index}.price`]}
                                            id={`payment-method-label-${index}`}
                                            required
                                        >
                                            Price
                                        </InputLabel>
                                        <OutlinedInput
                                            fullWidth
                                            type="number"
                                            label="Price"
                                            value={methodData.price || ''}
                                            error={!!errors[`methods.${index}.price`]}
                                            required
                                            inputProps={{min: 0}}
                                            onChange={(e) => handleMethodChange(index, 'price', e.target.value)}
                                            endAdornment={<Chip label="OMR" size="small" color="primary" />}
                                        />
                                        {errors[`methods.${index}.price`] && (
                                            <FormHelperText error>
                                                {errors[`methods.${index}.price`]}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>
                            ) : (
                                <>
                                    <Grid size={12}>
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            <strong>Advanced Pricing Configuration</strong>
                                            <br />
                                            Configure parameters and {methodData.price_type === 'Formulate' ? 'formula' : 'conditions'} for dynamic pricing.
                                        </Alert>
                                    </Grid>
                                    <Grid size={12}>
                                        <ParametersField
                                            defaultValue={methodData.extra?.parameters}
                                            onChange={(e) => handleMethodExtraChange(index, 'parameters', e.target.value)}
                                            name="parameters"
                                        />
                                    </Grid>

                                    {methodData.price_type === 'Formulate' ? (
                                        <Grid size={12}>
                                            <TextField
                                                name="formula"
                                                label="Formula"
                                                onChange={(e) => handleMethodExtraChange(index, 'formula', e.target.value)}
                                                value={methodData.extra?.formula || ''}
                                                helperText={errors[`methods.${index}.extra.formula`] || "Enter a mathematical formula using the defined parameters"}
                                                error={Boolean(errors[`methods.${index}.extra.formula`])}
                                                fullWidth
                                                multiline
                                                rows={2}
                                            />
                                        </Grid>
                                    ) : (
                                        <Grid size={12}>
                                            <ConditionsField
                                                defaultValue={methodData.extra?.conditions}
                                                onChange={(e) => handleMethodExtraChange(index, 'conditions', e.target.value)}
                                                name="conditions"
                                            />
                                        </Grid>
                                    )}
                                </>
                            )}
                        </Grid>
                    </Box>
                </Collapse>
            </Paper>
        );
    };

    const handleChange = (e) => setData(prevData => ({...prevData, [e.target.name]: e.target.value}))
    const handleExtraChange = (e) => setData(prevData => ({
        ...prevData,
        extra: {...(prevData.extra || {}), [e.target.name]: e.target.value}
    }))

    return (
        <>
            <Dialog
                open={open}
                fullWidth
                maxWidth="lg"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        minHeight: '60vh'
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <ScienceIcon />
                    {!data?.id ? 'Add' : 'Edit'} Price
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        {/* Test Selection */}
                        <Grid size={12}>
                            <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <InfoIcon color="primary" />
                                    Test Selection
                                </Typography>
                                <SelectSearch
                                    fullWidth
                                    value={data?.test || ""}
                                    label="Select Test"
                                    url={route('api.tests.list')}
                                    onChange={handleTestSelect}
                                    name="test"
                                    error={!!errors.test}
                                    helperText={errors.test || "Search and select a test to configure pricing"}
                                />
                            </Paper>
                        </Grid>

                        {/* Test Details Section */}
                        {data.test && (
                            <>
                                <Grid size={12}>
                                    <Paper elevation={1} sx={{ p: 3, bgcolor: 'primary.50' }}>
                                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                                            Test Information
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={12} md={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                                        Full Name:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {data.test.fullName}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={12} md={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                                        Test Code:
                                                    </Typography>
                                                    <Chip label={data.test.code} size="small" color="primary" />
                                                </Box>
                                            </Grid>
                                            <Grid size={12} md={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                                        Category:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {data.test.testGroup?.name}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            {data.test.type === "PANEL" && data.price_type=="Fix"&& (
                                                <Grid size={12} md={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                                            Price:
                                                        </Typography>
                                                        <Chip label={`${data.test.price} OMR`} size="small" color="secondary" />
                                                    </Box>
                                                </Grid>
                                            )}
                                        </Grid>

                                        {/* Methods Table */}
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                                Available Methods
                                            </Typography>
                                            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Method Name</TableCell>
                                                            {data.test.type === 'TEST' && (
                                                                <>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>Turnaround Time</TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>Base Price</TableCell>
                                                                </>
                                                            )}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {data.test.method_tests?.map(({method, id}) => (
                                                            <TableRow key={id} hover>
                                                                <TableCell>{method?.name}</TableCell>
                                                                {data.test.type === 'TEST' && (
                                                                    <>
                                                                        <TableCell>
                                                                            <Chip
                                                                                label={`${method.turnaround_time} days`}
                                                                                size="small"
                                                                                color="info"
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Chip
                                                                                label={`${method.price} OMR`}
                                                                                size="small"
                                                                                color="secondary"
                                                                            />
                                                                        </TableCell>
                                                                    </>
                                                                )}
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </Paper>
                                        </Box>
                                    </Paper>
                                </Grid>

                                {/* Pricing Configuration Section */}
                                {data.test.type !== 'PANEL' && data.methods && Object.keys(data.methods).length > 0 && (
                                    <Grid size={12}>
                                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MoneyIcon color="primary" />
                                            Configure Pricing for Each Method
                                        </Typography>
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            Expand each method below to configure its specific pricing options.
                                        </Alert>
                                        {Object.keys(data.methods).map(methodId => renderPriceSection(methodId))}
                                    </Grid>
                                )}

                                {/* Panel Pricing Section */}
                                {data.test.type === "PANEL" && (
                                    <Grid size={12}>
                                        <Paper elevation={1} sx={{ p: 3 }}>
                                            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <MoneyIcon color="primary" />
                                                Panel Pricing Configuration
                                            </Typography>
                                            <Grid container spacing={3}>
                                                <Grid size={6}>
                                                    <FormControl fullWidth>
                                                        <InputLabel id="price-type-select-label">Price Type</InputLabel>
                                                        <Select
                                                            labelId="price-type-select-label"
                                                            id="price-type-select"
                                                            value={data.price_type}
                                                            label="Price Type"
                                                            name="price_type"
                                                            onChange={handleChange}
                                                        >
                                                            <MenuItem value="Fix">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <MoneyIcon fontSize="small" />
                                                                    Fix
                                                                </Box>
                                                            </MenuItem>
                                                            <MenuItem value="Formulate">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <ScienceIcon fontSize="small" />
                                                                    Formulate
                                                                </Box>
                                                            </MenuItem>
                                                            <MenuItem value="Conditional">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <CategoryIcon fontSize="small" />
                                                                    Conditional
                                                                </Box>
                                                            </MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>

                                                {data.price_type === 'Fix' ? (
                                                    <Grid size={6}>
                                                        <FormControl fullWidth>
                                                            <InputLabel
                                                                error={!!errors.price}
                                                                id="price-label"
                                                                required
                                                            >
                                                                Price
                                                            </InputLabel>
                                                            <OutlinedInput
                                                                fullWidth
                                                                type="number"
                                                                label="Price"
                                                                value={data.price || ''}
                                                                error={!!errors.price}
                                                                required
                                                                name="price"
                                                                inputProps={{min: 0}}
                                                                onChange={handleChange}
                                                                endAdornment={<Chip label="OMR" size="small" color="primary" />}
                                                            />
                                                            {errors.price && (
                                                                <FormHelperText error>
                                                                    {errors.price}
                                                                </FormHelperText>
                                                            )}
                                                        </FormControl>
                                                    </Grid>
                                                ) : (
                                                    <>
                                                        <Grid size={12}>
                                                            <Alert severity="info" sx={{ mb: 2 }}>
                                                                <strong>Advanced Pricing Configuration</strong>
                                                                <br />
                                                                Configure parameters and {data.price_type === 'Formulate' ? 'formula' : 'conditions'} for dynamic pricing.
                                                            </Alert>
                                                        </Grid>
                                                        <Grid size={12}>
                                                            <ParametersField
                                                                defaultValue={data.extra?.parameters}
                                                                onChange={handleExtraChange}
                                                                name="parameters"
                                                            />
                                                        </Grid>

                                                        {data.price_type === 'Formulate' ? (
                                                            <Grid size={12}>
                                                                <TextField
                                                                    name="formula"
                                                                    label="Formula"
                                                                    onChange={handleExtraChange}
                                                                    value={data.extra?.formula || ''}
                                                                    helperText={errors[`extra.formula`] || "Enter a mathematical formula using the defined parameters"}
                                                                    error={Boolean(errors[`extra.formula`])}
                                                                    fullWidth
                                                                    multiline
                                                                    rows={2}
                                                                />
                                                            </Grid>
                                                        ) : (
                                                            <Grid size={12}>
                                                                <ConditionsField
                                                                    defaultValue={data.extra?.conditions}
                                                                    onChange={handleExtraChange}
                                                                    name="conditions"
                                                                />
                                                            </Grid>
                                                        )}
                                                    </>
                                                )}
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                )}
                            </>
                        )}
                    </Grid>
                </DialogContent>

                {/* Dialog Actions */}
                <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Button onClick={handleClose} variant="outlined" size="large">
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        variant="contained"
                        disabled={loading}
                        size="large"
                        sx={{ minWidth: 120 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Loading Backdrop */}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
                open={loading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </>
    );
};

export default AddPrice;
