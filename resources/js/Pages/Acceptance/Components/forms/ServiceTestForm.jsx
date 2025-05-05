import React, {useCallback, useState, useMemo} from 'react';
import {
    Alert,
    Box,
    Divider,
    FormControl,
    FormHelperText,
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
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaidIcon from '@mui/icons-material/Paid';
import ScienceIcon from '@mui/icons-material/Science';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DiscountIcon from '@mui/icons-material/LocalOffer';
import axios from 'axios';
import MethodPriceField from '../MethodPriceField';
import DiscountManager from '../DiscountManager'; // Import the DiscountManager component

const ServiceTestForm = ({
                             data,
                             onChange,
                             errors = {},
                             maxDiscount = 0,
                             referrer,
                             patient
                         }) => {
    // Safely destructure with defaults to prevent undefined errors
    const {
        method_test: methodTest = {test: {method_tests: []}},
        price = 0,
        discount = 0,
        customParameters = {},
    } = data || {};

    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    // Initialize discounts if not present
    const initializedCustomParameters = {
        ...customParameters,
        discounts: customParameters.discounts || []
    };

    // Event handlers
    const handleMethodChange = async (e) => {
        const methodId = e.target.value;
        if (!methodId || !methodTest?.test?.method_tests) return;

        const newMethodTest = methodTest.test.method_tests.find(m => m.id === methodId);

        if (newMethodTest) {
            try {
                // Then fetch and update with new method data
                const methodData = newMethodTest.method;
                if (!methodData) return;

                // Create default patient entry
                const defaultPatient = patient ? {id: patient.id, name: patient.fullName} : null;

                // Create patients array with proper length
                const patientCount = methodData?.no_patient || 1;
                const newPatients = Array(patientCount).fill(null).map(() => defaultPatient).filter(Boolean);

                onChange({
                    method_test: {
                        ...methodTest,
                        method: methodData,
                        id: methodId
                    },
                    price: methodData.price_type === 'Fix' ? methodData.price : 0,
                    discount: 0,
                    patients:newPatients,
                    customParameters: {
                        discounts: [],
                        ...data.customParameters,
                    },

                });
            } catch (error) {
                console.error("Failed to update method:", error);
            }
        }
    };

    // Handler for discount system
    const handleDiscountChange = (updatedValues) => {
        onChange(updatedValues);
    };

    const handlePriceChange = (updatedValues) => {
        onChange(updatedValues);
    };

    // Memoize method tests to prevent unnecessary re-renders
    const availableMethodTests = useMemo(() => {
        if (!methodTest?.test?.method_tests) return [];
        return methodTest.test.method_tests.filter(mt => mt && mt.status) || [];
    }, [methodTest?.test?.method_tests]);

    return (
        <Box>
            {apiError && (
                <Alert severity="error" sx={{mb: 3}} onClose={() => setApiError(null)}>
                    {apiError}
                </Alert>
            )}

            <Box sx={{mb: 3}}>
                <Box display="flex" alignItems="center" mb={2}>
                    <ScienceIcon color="primary" sx={{mr: 1}}/>
                    <Typography variant="subtitle1" fontWeight="medium">
                        Available Testing Methods
                    </Typography>
                    <Tooltip title="Select the laboratory method to use for this test">
                        <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1}}/>
                    </Tooltip>
                </Box>

                <TableContainer component={Paper} sx={{borderRadius: 2, overflow: 'hidden'}}>
                    <Table>
                        <TableHead sx={{backgroundColor: 'primary.50'}}>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell align="center">
                                    <Box display="flex" alignItems="center" justifyContent="center">
                                        <PaidIcon fontSize="small" sx={{mr: 0.5}}/>
                                        Price(OMR)
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {availableMethodTests.map(({method, id}) => (
                                <TableRow
                                    key={id}
                                    hover
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {backgroundColor: 'action.hover'},
                                        ...(methodTest?.id === id ? {
                                            backgroundColor: 'primary.50',
                                            '&:hover': {backgroundColor: 'primary.100'}
                                        } : {})
                                    }}
                                    onClick={() => handleMethodChange({target: {value: id}})}
                                >
                                    <TableCell>
                                        <Typography fontWeight={methodTest?.id === id ? "medium" : "normal"}>
                                            {method?.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        {method?.price_type === "Fix" ? (
                                            <Typography fontWeight="medium">
                                                {method?.price}
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
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Divider sx={{my: 3}}/>

            <Box sx={{mb: 3}}>
                <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight="medium">
                        Test Configuration
                    </Typography>
                </Box>

                <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                    <Grid container spacing={3}>
                        {methodTest?.method && !loading && (
                            <>

                                {methodTest?.method?.price_type && ["Formulate", "Conditional"].includes(methodTest.method.price_type) && (
                                    <>
                                        <Grid size={12}>
                                            <Divider sx={{my: 1}}>
                                                <Chip label="Pricing Parameters" color="primary"/>
                                            </Divider>
                                        </Grid>
                                        <Grid size={12}>
                                            <Box sx={{p: 2, bgcolor: 'primary.50', borderRadius: 2, mb: 2}}>
                                                <Typography variant="body2">
                                                    This test uses {methodTest.method.price_type} pricing. Please
                                                    configure the parameters below.
                                                </Typography>
                                            </Box>
                                            <MethodPriceField
                                                method={methodTest.method}
                                                values={customParameters}
                                                onChange={handlePriceChange}
                                                errors={errors}
                                            />
                                        </Grid>
                                    </>
                                )}

                                <Grid size={12}>
                                    <Divider sx={{my: 1}}>
                                        <Chip
                                            label="Discount Management"
                                            icon={<DiscountIcon/>}
                                            color="secondary"
                                        />
                                    </Divider>
                                </Grid>

                                <Grid size={12}>
                                    <DiscountManager
                                        customParameters={initializedCustomParameters}
                                        price={price || 0}
                                        maxDiscount={maxDiscount}
                                        onChange={handleDiscountChange}
                                        errors={errors}
                                    />
                                </Grid>

                                <Grid size={12}>
                                    <Divider sx={{my: 1}}>
                                        <Chip label="Final Price"/>
                                    </Divider>
                                </Grid>

                                <Grid size={{xs:12,md:6}}>
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

                                <Grid size={{zs:12,md:6}}>
                                    <TextField
                                        type="number"
                                        label="Total Discount (OMR)"
                                        name="discount"
                                        fullWidth
                                        value={discount || 0}
                                        slotProps={{input: {readOnly: true}}}
                                        sx={{"& .MuiInputBase-input": {fontWeight: 'bold', color: 'secondary.main'}}}
                                        error={Boolean(errors.discount)}
                                        helperText={errors.discount || `Maximum discount: ${maxDiscount}% (${(maxDiscount * price * 0.01).toFixed(2)} OMR)`}
                                    />
                                </Grid>

                                <Grid size={12}>
                                    <Box sx={{
                                        p: 2,
                                        mt: 2,
                                        bgcolor: 'success.50',
                                        borderRadius: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <Typography variant="subtitle1">
                                            Final Price:
                                        </Typography>
                                        <Typography variant="h6" color="success.main" fontWeight="bold">
                                            {(price - discount).toFixed(2)} OMR
                                        </Typography>
                                    </Box>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Paper>
            </Box>
        </Box>
    );
};

export default ServiceTestForm;
