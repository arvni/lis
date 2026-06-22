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
import EditIcon from '@mui/icons-material/Edit';

// Components
import SelectSearch from '@/Components/SelectSearch';
import { formatDate } from './EditForm/helpers';
import CustomerInfoSection from './EditForm/CustomerInfoSection';
import TimeSlotPicker from './EditForm/TimeSlotPicker';

const EditForm = ({ openEdit, onClose, reservation }) => {
    const [times, setTimes] = useState([]);
    const [waiting, setWaiting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    // Initialize form data with reservation data
    const { data, setData, processing, put, errors, setError, reset } = useForm({
        consultant: reservation?.consultant || '',
        dueDate: reservation?.started_at ? formatDate(new Date(reservation.started_at)) : '',
        time: reservation?.started_at
            ? new Date(reservation.started_at).toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : null,
        customer: {
            id: reservation?.reservable?.id || '',
            phone: reservation?.reservable?.phone || '',
            name: reservation?.reservable?.name || '',
            email: reservation?.reservable?.email || '',
        },
        note: reservation?.note || '',
    });

    const getTimes = useCallback(() => {
        axios
            .get(
                route('list-reservation-times', {
                    consultant: data.consultant?.id,
                    date: data.dueDate,
                    excludeTimeId: reservation?.id, // Exclude current reservation time
                }),
            )
            .then(({ data: response }) => {
                // Add current reservation time to available times
                const currentTime = {
                    value: new Date(reservation.started_at).toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    label:
                        new Date(reservation.started_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        }) + ' (Current)',
                    disabled: false,
                };

                setTimes([currentTime, ...response.data]);
            })
            .then(() => setWaiting(false))
            .catch((error) => {
                console.error('Error fetching times:', error);
                setWaiting(false);
            });
    }, [data.consultant, data.dueDate, reservation]);

    // Load available times when consultant or date changes
    useEffect(() => {
        if (data.consultant && data.dueDate) {
            setWaiting(true);
            getTimes();
        } else {
            setTimes([]);
        }
    }, [data.consultant, data.dueDate, getTimes]);

    // Set initial customer options if reservation exists
    useEffect(() => {
        if (reservation?.reservable && reservation.reservable_type === 'customer') {
            setOptions([reservation.reservable]);
        }
    }, [reservation]);

    useEffect(() => {
        if (reservation) {
            setData({
                consultant: reservation?.consultant || '',
                dueDate: reservation?.started_at
                    ? formatDate(new Date(reservation.started_at))
                    : '',
                time: reservation?.started_at
                    ? new Date(reservation.started_at).toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit',
                      })
                    : null,
                customer: {
                    id: reservation?.reservable?.id || '',
                    phone: reservation?.reservable?.phone || '',
                    name: reservation?.reservable?.name || '',
                    email: reservation?.reservable?.email || '',
                },
                note: reservation?.note || '',
            });
        }
    }, [open, reservation, setData]);

    const handleChange = (e) =>
        setData((previousData) => ({
            ...previousData,
            [e.target.name]: e.target.value,
        }));

    const handleSubmit = () => {
        if (check()) {
            put(route('times.update', reservation.id), {
                onSuccess: () => {
                    setShowSuccess(true);
                    onClose();
                    reset();
                },
                onError: (errors) => {
                    console.error('Update errors:', errors);
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

        if (reservation.reservable_type === 'customer') {
            if (!data.customer.phone) {
                setError('customer.phone', 'Please enter customer phone number');
                isValid = false;
            }
            if (!data.customer.name) {
                setError('customer.name', 'Please enter customer name');
                isValid = false;
            }
        }

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
                .catch(() => {
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
            customer: {
                ...previousData.customer,
                [field]: value,
            },
        }));

    // Don't render if no reservation data
    if (!reservation) return null;

    return (
        <>
            <Dialog
                open={openEdit && !processing}
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
                        bgcolor: 'warning.main',
                        color: 'white',
                        py: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EditIcon />
                        <Typography variant="h5" fontWeight="500" component="span">
                            Edit Reservation
                        </Typography>
                    </Box>
                </DialogTitle>
                <Divider />

                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Container>
                        {reservation.reservable_type === 'customer' && (
                            <CustomerInfoSection
                                data={data}
                                errors={errors}
                                options={options}
                                loading={loading}
                                open={open}
                                setOpen={setOpen}
                                onCustomerSelect={handleCustomerSelect}
                                onInputChange={fetchData}
                                onCustomerChange={handleCustomerChange}
                            />
                        )}

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
                                                input: { min: formatDate(new Date()) },
                                            }}
                                            error={Boolean(errors.dueDate)}
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
                        color="warning"
                        disableElevation
                        disabled={processing}
                        startIcon={
                            processing ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                <EditIcon />
                            )
                        }
                        sx={{
                            borderRadius: 2,
                            px: 3,
                        }}
                    >
                        {processing ? 'Updating...' : 'Update Reservation'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={showSuccess}
                autoHideDuration={3000}
                onClose={() => setShowSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled">
                    Reservation updated successfully!
                </Alert>
            </Snackbar>
        </>
    );
};

export default EditForm;
