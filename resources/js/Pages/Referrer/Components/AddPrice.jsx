import { useEffect, useState, useCallback } from 'react';
import {
    DialogActions,
    Dialog,
    DialogTitle,
    Button,
    DialogContent,
    Typography,
    CircularProgress,
    Backdrop,
    Alert,
} from '@mui/material';
import { AttachMoney as MoneyIcon, Science as ScienceIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import axios from 'axios';
import Grid from '@mui/material/Grid';

import TestSelection from './AddPrice/TestSelection.jsx';
import TestInfoCard from './AddPrice/TestInfoCard.jsx';
import MethodPriceSection from './AddPrice/MethodPriceSection.jsx';
import PanelPricingSection from './AddPrice/PanelPricingSection.jsx';

const AddPrice = ({ open, defaultValue, onClose }) => {
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
                const res = await axios.get(route('api.tests.show', selectedTest?.id), {
                    params: { referrer: defaultValue.referrer },
                });

                // Initialize methods data structure as an array
                const methodsArray = [];

                // For each method in the test, create an entry in methodsArray
                if (res.data.data.method_tests && res.data.data.method_tests.length > 0) {
                    res.data.data.method_tests.forEach((methodTest) => {
                        methodsArray.push({
                            id: methodTest.id,
                            method: methodTest.method,
                            method_id: methodTest.method.id,
                            price_type: methodTest.method.price_type || 'Fix',
                            price:
                                methodTest.method.price_type === 'Fix'
                                    ? methodTest.method.price
                                    : null,
                            extra: methodTest.method.extra || {},
                        });
                    });
                }
                setData((prevData) => ({
                    ...prevData,
                    test: res.data.data,
                    methods: methodsArray, // Store all methods data as array
                    price: res.data.data.price,
                    price_type: res.data.data.price_type || 'Fix',
                    extra: res.data.data.extra || {},
                }));
            } catch (error) {
                console.error('Error fetching test details:', error);
                // Optionally add error handling/notification
            } finally {
                setLoading(false);
            }
        } else {
            setData((prevData) => ({
                ...prevData,
                test: null,
                methods: [],
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
            method: data.methods, // Add methods data for submission
        };

        router.post(routeName, submissionData, {
            onSuccess: onClose,
            onError: (errors) => {
                console.error('Submission errors:', errors);
                setErrors(errors);
            },
        });
    };

    // Generic change handler for method specific inputs
    const handleMethodChange = (index, field, value) => {
        setData((prevData) => {
            const updatedMethods = [...prevData.methods];
            updatedMethods[index] = {
                ...updatedMethods[index],
                [field]: field === 'price' ? Number(value) : value,
            };
            return {
                ...prevData,
                methods: updatedMethods,
            };
        });
    };

    // Extra fields change handler for specific method
    const handleMethodExtraChange = (index, name, value) => {
        setData((prevData) => {
            const updatedMethods = [...prevData.methods];
            updatedMethods[index] = {
                ...updatedMethods[index],
                extra: {
                    ...updatedMethods[index].extra,
                    [name]: value,
                },
            };
            return {
                ...prevData,
                methods: updatedMethods,
            };
        });
    };

    // Toggle method expansion
    const toggleMethodExpansion = (index) => {
        setExpandedMethods((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const handleChange = (e) =>
        setData((prevData) => ({ ...prevData, [e.target.name]: e.target.value }));
    const handleExtraChange = (e) =>
        setData((prevData) => ({
            ...prevData,
            extra: { ...(prevData.extra || {}), [e.target.name]: e.target.value },
        }));

    return (
        <>
            <Dialog
                open={open}
                fullWidth
                maxWidth="lg"
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            minHeight: '60vh',
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <ScienceIcon />
                    {!data?.id ? 'Add' : 'Edit'} Price
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        {/* Test Selection */}
                        <Grid size={12}>
                            <TestSelection
                                value={data?.test}
                                errors={errors}
                                onTestSelect={handleTestSelect}
                            />
                        </Grid>

                        {/* Test Details Section */}
                        {data.test && (
                            <>
                                <Grid size={12}>
                                    <TestInfoCard test={data.test} priceType={data.price_type} />
                                </Grid>

                                {/* Pricing Configuration Section */}
                                {data.test.type !== 'PANEL' &&
                                    data.methods &&
                                    Object.keys(data.methods).length > 0 && (
                                        <Grid size={12}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    mb: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                }}
                                            >
                                                <MoneyIcon color="primary" />
                                                Configure Pricing for Each Method
                                            </Typography>
                                            <Alert severity="info" sx={{ mb: 2 }}>
                                                Expand each method below to configure its specific
                                                pricing options.
                                            </Alert>
                                            {Object.keys(data.methods).map((methodId) => {
                                                const methodData = data.methods[methodId];
                                                const method = data?.test?.method_tests?.find(
                                                    (item) =>
                                                        item.method_id ===
                                                        (methodData.method?.id ||
                                                            methodData.method_id),
                                                )?.method;
                                                return (
                                                    <MethodPriceSection
                                                        key={`method-${method?.id}`}
                                                        methodData={methodData}
                                                        method={method}
                                                        isExpanded={expandedMethods[methodId]}
                                                        index={methodId}
                                                        errors={errors}
                                                        onToggle={toggleMethodExpansion}
                                                        onMethodChange={handleMethodChange}
                                                        onMethodExtraChange={handleMethodExtraChange}
                                                    />
                                                );
                                            })}
                                        </Grid>
                                    )}

                                {/* Panel Pricing Section */}
                                {data.test.type === 'PANEL' && (
                                    <Grid size={12}>
                                        <PanelPricingSection
                                            data={data}
                                            errors={errors}
                                            onChange={handleChange}
                                            onExtraChange={handleExtraChange}
                                        />
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
