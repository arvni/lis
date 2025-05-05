import React, {useCallback, useState, useMemo} from 'react';
import {
    Alert,
    Box,
    Divider,
    FormControl,
    FormHelperText,
    Grid2 as Grid,
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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaidIcon from '@mui/icons-material/Paid';
import ScienceIcon from '@mui/icons-material/Science';
import PersonIcon from '@mui/icons-material/Person';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DiscountIcon from '@mui/icons-material/LocalOffer';
import MethodPriceField from '../MethodPriceField';
import SelectSearch from "@/Components/SelectSearch.jsx";
import DiscountManager from '../DiscountManager'; // Import the new DiscountManager component

const RegularTestForm = ({
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
        patients = []
    } = data || {};

    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    // Initialize discounts if not present
    const initializedCustomParameters = {
        ...customParameters,
        discounts: customParameters.discounts || []
    };

    // Event handlers with improved type safety
    const handleSampleTypeChange = (e) => {
        onChange({
            customParameters: {
                ...initializedCustomParameters,
                sampleType: e.target.value
            }
        });
    };

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
                        id: methodId,
                    },
                    price: methodData.price_type === 'Fix' ? methodData.price : 0,
                    patients: newPatients,
                    discount: 0,
                    customParameters: {
                        sample_type: "",
                        discounts: [], // Initialize empty discounts array on method change
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

    const handlePatientsChange = (index) => (e) => {
        // Ensure patients is an array
        const currentPatients = Array.isArray(patients) ? [...patients] : [];

        // Create a new array with length at least index+1
        const newPatients = [...currentPatients];
        // Update the patient at the specified index
        newPatients[index] = e.target.value;

        onChange({patients: newPatients});
    };

    return (
        <Box>
            {apiError && (
                <Alert severity="error" sx={{mb: 3}} onClose={() => setApiError(null)}>
                    {apiError}
                </Alert>
            )}

            <Box sx={{mb: 4}}>
                <Box display="flex" alignItems="center" mb={2}>
                    <ScienceIcon color="primary" sx={{mr: 1}}/>
                    <Typography variant="subtitle1" fontWeight="medium">
                        Available Testing Methods
                    </Typography>
                    <Tooltip title="Select the laboratory method to use for this test">
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
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Paper
                        sx={{
                            p: 3,
                            textAlign: 'center',
                            backgroundColor: 'grey.50',
                            borderRadius: 2
                        }}
                    >
                        <Typography color="text.secondary">
                            No testing methods available for this test
                        </Typography>
                    </Paper>
                )}
            </Box>

            <Divider sx={{my: 3}}/>

            <Box sx={{mb: 4}}>
                <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight="medium">
                        Test Configuration
                    </Typography>
                </Box>

                <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                    <Grid container spacing={3}>
                        {methodTest?.method && !loading && (
                            <>
                                <Grid size={{xs: 12}}>
                                    <Divider sx={{my: 1}}>
                                        <Chip label="Patient Information"/>
                                    </Divider>
                                </Grid>

                                {Array.from({length: methodTest?.method?.no_patient || 1}).map((_, index) => (
                                    <Grid key={`patient-${index}`} size={{xs: 12, md: 6}}>
                                        <Box display="flex" alignItems="flex-start">
                                            <Box sx={{flexGrow: 1}}>
                                                <SelectSearch
                                                    helperText={errors?.[`patients.${index}.id`] || `Patient receiving the test`}
                                                    error={Boolean(errors?.[`patients.${index}.id`])}
                                                    value={patients[index] || ""}
                                                    fullWidth
                                                    label={`Patient ${index + 1}`}
                                                    defaultData={{patient: patient?.id}}
                                                    onChange={handlePatientsChange(index)}
                                                    url={route("api.patients.list")}
                                                    name="patient"
                                                    startAdornment={<PersonIcon color="action" sx={{mr: 1}}/>}
                                                />
                                            </Box>
                                            <Tooltip title={`Select the patient for this test`}>
                                                <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                                            </Tooltip>
                                        </Box>
                                    </Grid>
                                ))}

                                <Grid size={{xs: 12}}>
                                    <Divider sx={{my: 1}}>
                                        <Chip label="Sample Information"/>
                                    </Divider>
                                </Grid>

                                <Grid size={{xs: 12, md: 6}}>
                                    <Box display="flex" alignItems="flex-start">
                                        <FormControl fullWidth error={Boolean(errors?.['customParameters.sampleType'])}>
                                            <InputLabel id="sample-type-select-label">Sample Type</InputLabel>
                                            <Select
                                                labelId="sample-type-select-label"
                                                id="sample-type-select"
                                                value={customParameters?.sampleType || ''}
                                                label="Sample Type"
                                                onChange={handleSampleTypeChange}
                                                fullWidth
                                            >
                                                {methodTest?.method?.test?.sample_types?.map(sampleType => (
                                                    <MenuItem
                                                        key={`sample-type-${sampleType?.id}`}
                                                        value={sampleType?.id}
                                                    >
                                                        {sampleType?.name}
                                                    </MenuItem>
                                                )) || []}
                                            </Select>
                                            {errors?.['customParameters.sampleType'] ? (
                                                <FormHelperText
                                                    error>{errors?.['customParameters.sampleType']}</FormHelperText>
                                            ) : (
                                                <FormHelperText>
                                                    Type of biological sample to collect
                                                </FormHelperText>
                                            )}
                                        </FormControl>
                                        <Tooltip title="The type of biological sample required for this test">
                                            <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                                        </Tooltip>
                                    </Box>
                                </Grid>

                                {methodTest?.method?.price_type && ["Formulate", "Conditional"].includes(methodTest.method.price_type) && (
                                    <>
                                        <Grid size={{xs: 12}}>
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

                                <Grid size={{xs: 12}}>
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
                                        helperText={errors.discount || `Maximum discount: ${maxDiscount}% (${(maxDiscount * price * 0.01).toFixed(2)} OMR)`}
                                    />
                                </Grid>

                                <Grid size={{xs: 12}}>
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

export default RegularTestForm;
