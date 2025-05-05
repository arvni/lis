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
    Divider,
    MenuItem,
    TextField, DialogContent
} from '@mui/material';
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
                const res = await axios.get(route('api.tests.show', selectedTest?.id));

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
                console.log(methodsArray);
                setData(prevData => ({
                    ...prevData,
                    test: res.data.data,
                    methods: methodsArray, // Store all methods data as array
                    price: res.data.data.price
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

    // Function to render price section for a specific method
    const renderPriceSection = (index) => {
        const methodData = data.methods[index];
        const method = data?.test?.method_tests?.find(item => item.method_id === (methodData.method?.id || methodData.method_id))?.method;
        return (
            <Grid container spacing={2} sx={{mb: 3, pb: 2, borderBottom: '1px dashed #ccc'}}
                  key={`method-${method?.id}`}>
                <Grid size={12}>
                    <Typography variant="h6">{method?.name}</Typography>
                </Grid>

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
                            <MenuItem value="Fix">Fix</MenuItem>
                            <MenuItem value="Formulate">Formulate</MenuItem>
                            <MenuItem value="Conditional">Conditional</MenuItem>
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
                                endAdornment={<small>OMR</small>}
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
                            <ParametersField
                                defaultValue={methodData.extra?.parameters}
                                onChange={(e) => handleMethodExtraChange(index, 'parameters', e.target.value)}
                                name="parameters"
                            />
                        </Grid>

                        {methodData.price_type === 'Formulate' ? (
                            <Grid item xs={6}>
                                <TextField
                                    name="formula"
                                    label="Formula"
                                    onChange={(e) => handleMethodExtraChange(index, 'formula', e.target.value)}
                                    value={methodData.extra?.formula || ''}
                                    helperText={errors[`methods.${index}.extra.formula`]}
                                    error={Boolean(errors[`methods.${index}.extra.formula`])}
                                    fullWidth
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
        );
    };

    const handleChange = (e) => setData(prevData => ({...prevData, [e.target.name]: e.target.value}))
    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth="md" // Increased width to accommodate multiple methods
            sx={{p: '5em'}}
        >
            <DialogTitle>
                {!data?.id ? 'Add' : 'Edit'} Method Price
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={2}>
                    {/* Test Selection */}
                    <Grid size={6}>
                        <SelectSearch
                            fullWidth
                            value={data?.test || ""}
                            label="Test"
                            url={route('api.tests.list')}
                            onChange={handleTestSelect}
                            name="test"
                            error={!!errors.test}
                            helperText={errors.test}
                        />
                    </Grid>

                    {/* Test Details Section */}
                    {data.test && (
                        <>
                            <Grid size={12}>
                                <Grid container spacing={2}>
                                    {/* Test Information */}
                                    <Grid><strong>Full Name: </strong>{data.test.fullName}</Grid>
                                    <Grid><strong>Test Code: </strong>{data.test.code}</Grid>
                                    <Grid><strong>Test Category: </strong>{data.test.testGroup?.name}</Grid>
                                    {data.test.type === "PANEL" &&
                                        <Grid><strong>Price: </strong>{data.test.price}</Grid>}
                                    {/* Methods Table */}
                                    <Grid item size={12}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Name</TableCell>
                                                    {data.test.type === 'TEST' && (<>
                                                        <TableCell>Turnaround Time (days)</TableCell>

                                                        <TableCell>Price (OMR)</TableCell>
                                                    </>)}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.test.method_tests?.map(({method, id}) => (
                                                    <TableRow key={id}>
                                                        <TableCell>{method?.name}</TableCell>
                                                        {data.test.type === 'TEST' && (<>
                                                            <TableCell>{method.turnaround_time}</TableCell>
                                                            <TableCell>{method.price}</TableCell>
                                                        </>)}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Divider sx={{my: '1em'}}/>
                            {/* Check if it's a panel test */}
                            {data.test.type !== 'PANEL' && data.methods && Object.keys(data.methods).length > 0 && (
                                <Grid size={12}>
                                    <Typography variant="h6" sx={{mt: 2, mb: 1}}>Configure Pricing for Each
                                        Method</Typography>
                                    {Object.keys(data.methods).map(methodId => renderPriceSection(methodId))}
                                </Grid>
                            )}
                            {data.test.type === "PANEL" && <Grid size={12}>
                                <TextField name="price"
                                           label="Price"
                                           onChange={handleChange}
                                           value={data.price}
                                           type="number"
                                           slotProps={{htmlInput: {min: 0, step: 0.01}}}/>
                            </Grid>}
                        </>
                    )}
                </Grid>
            </DialogContent>

            {/* Dialog Actions */}
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    onClick={submit}
                    variant="contained"
                    disabled={loading}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddPrice;
