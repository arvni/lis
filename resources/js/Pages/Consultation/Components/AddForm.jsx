import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';

// MUI Components
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Container,
    Grid as Grid,
    FormGroup,
    CircularProgress,
    Typography,
    TextField,
    Paper,
    Divider,
    Box,
    Alert,
    Snackbar,
} from '@mui/material';

// Icons
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';

// Components
import SelectSearch from '@/Components/SelectSearch';
import { formatDate } from './EditForm/helpers';
import TimeSlotPicker from './EditForm/TimeSlotPicker';
import CustomerInfoSection from './AddForm/CustomerInfoSection';

const AddForm = ({ openAdd, onClose }) => {
    const [times, setTimes] = useState([]);
    const [waiting, setWaiting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    const today = new Date();
    const formattedDate = formatDate(today);

    const { data, setData, processing, post, errors, setError, reset } = useForm({
        consultant: '',
        dueDate: formattedDate,
        time: null,
        customer: {
            phone: '',
            name: '',
            email: '',
        },
        note: '',
    });

    const getTimes = useCallback(() => {
        axios
            .get(
                route('list-reservation-times', {
                    consultant: data.consultant?.id,
                    date: data.dueDate,
                }),
            )
            .then(({ data }) => setTimes(data.data))
            .then(() => setWaiting(false))
            .catch((error) => {
                console.error('Error fetching times:', error);
                setWaiting(false);
            });
    }, [data.consultant, data.dueDate]);

    useEffect(() => {
        if (data.consultant && data.dueDate) {
            setWaiting(true);
            getTimes();
        } else {
            setTimes([]);
        }
    }, [data.consultant, data.dueDate, getTimes]);

    const handleChange = (e) =>
        setData((previousData) => ({
            ...previousData,
            [e.target.name]: e.target.value,
        }));

    const handleSubmit = () => {
        if (check()) {
            post(route('book-an-appointment'), {
                onSuccess: () => {
                    setShowSuccess(true);
                    onClose();
                    reset();
                },
            });
        }
    };

    const check = () => {
        let isValid = true;

        if (!data.consultant) {
            setError('consultant', 'Please select a consultant');
            isValid = false;
        }

        if (!data.dueDate) {
            setError('dueDate', 'Please select a date');
            isValid = false;
        }

        if (!data.time) {
            setError('time', 'Please select a time slot');
            isValid = false;
        }
        if (!data.customer.phone) setError('customer.phone', 'Please Enter customer phone number');
        if (!data.customer.name) setError('customer.phone', 'Please Enter customer name');
        return isValid;
    };

    const fetchData = useCallback(
        (_, search) => {
            setLoading(true);
            setData((prevData) => ({
                ...prevData,
                customer: { ...prevData.customer, phone: search },
            }));
            fetch(route('api.customers.list', { search }))
                .then((response) => response.json())
                .then((data) => {
                    setOptions((data.data || []).filter(Boolean));
                    setLoading(false);
                })
                .catch((error) => {
                    console.error('Error fetching customers:', error);
                    setLoading(false);
                    setOptions([]);
                });
        },
        [setData],
    );

    // Handle customer selection
    const handleCustomerSelect = (event, newValue) => {
        setData((previousData) => ({
            ...previousData,
            customer: newValue || {
                phone: '',
                name: '',
                email: '',
            },
        }));
    };

    const handleCustomerChange = (field, value) =>
        setData((previousData) => ({
            ...previousData,
            customer: { ...previousData.customer, [field]: value },
        }));

    return (
        <>
            <Dialog
                open={openAdd && !processing}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                slotProps={{
                    Paper: {
                        elevation: 3,
                        sx: { borderRadius: 2 },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        py: 2,
                    }}
                >
                    <Typography variant="h5" fontWeight="500" component="span">
                        Schedule New Reservation
                    </Typography>
                </DialogTitle>
                <Divider />

                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Container>
                        <CustomerInfoSection
                            data={data}
                            options={options}
                            loading={loading}
                            open={open}
                            setOpen={setOpen}
                            onCustomerSelect={handleCustomerSelect}
                            onInputChange={fetchData}
                            onCustomerChange={handleCustomerChange}
                        />

                        <Grid container spacing={3} sx={{ mt: 2 }}>
                            {/* Consultant Selection */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                    }}
                                >
                                    <Box display="flex" mb={1} sx={{ alignItems: 'center' }}>
                                        <PersonIcon color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            Select Consultant
                                        </Typography>
                                    </Box>

                                    <SelectSearch
                                        onChange={handleChange}
                                        value={data.consultant}
                                        url={route('list-consultants')}
                                        name="consultant"
                                        label="Consultant"
                                        error={Boolean(errors.consultant)}
                                        helperText={errors?.consultant}
                                        fullWidth
                                    />
                                </Paper>
                            </Grid>

                            {/* Date Selection */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                    }}
                                >
                                    <Box display="flex" mb={1} sx={{ alignItems: 'center' }}>
                                        <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            Select Date
                                        </Typography>
                                    </Box>

                                    <FormGroup>
                                        <TextField
                                            type="date"
                                            name="dueDate"
                                            value={data.dueDate}
                                            onChange={handleChange}
                                            fullWidth
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                                input: { min: formattedDate },
                                            }}
                                            error={Object.prototype.hasOwnProperty.call(
                                                errors,
                                                'dueDate',
                                            )}
                                            helperText={errors?.dueDate}
                                        />
                                    </FormGroup>
                                </Paper>
                            </Grid>

                            {/* Time Selection */}
                            {(times.length > 0 || waiting) && (
                                <Grid size={{ xs: 12 }}>
                                    <TimeSlotPicker
                                        times={times}
                                        waiting={waiting}
                                        value={data.time}
                                        onChange={handleChange}
                                        error={errors.time}
                                    />
                                </Grid>
                            )}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    name="note"
                                    label="Note"
                                    value={data?.note || ''}
                                    onChange={handleChange}
                                    fullWidth
                                    multiline
                                    rows={3}
                                />
                            </Grid>
                        </Grid>
                    </Container>
                </DialogContent>

                <Divider />

                <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="inherit"
                        sx={{ borderRadius: 2 }}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disableElevation
                        disabled={processing}
                        startIcon={
                            processing ? <CircularProgress size={20} color="inherit" /> : null
                        }
                        sx={{
                            borderRadius: 2,
                            px: 3,
                        }}
                    >
                        {processing ? 'Scheduling...' : 'Schedule Consultation'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={showSuccess}
                autoHideDuration={2000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled">
                    Consultation scheduled successfully!
                </Alert>
            </Snackbar>
        </>
    );
};

export default AddForm;
