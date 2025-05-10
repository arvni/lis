import React, {useState, useEffect} from 'react';
import {router} from "@inertiajs/react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid2 as Grid,
    CircularProgress,
    Typography,
    Divider,
    Paper,
    IconButton,
    Tooltip,
    Alert,
    Snackbar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TitleIcon from '@mui/icons-material/Title';
const isEndTimeAfterStartTime = (startTime, endTime) => {
    if (!startTime || !endTime) return true;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    if (endHour > startHour) return true;
    return endHour === startHour && endMinute > startMinute;

};

const AddTimeSlotForm = ({open, onClose, consultantId, defaultDate}) => {
    // Get today's date in YYYY-MM-DD format for default value
    const today = new Date().toISOString().split('T')[0];

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        date: new Date() > new Date(defaultDate) ? today : defaultDate,
        startTime: '',
        endTime: '',
        active: true,
        consultant_id: consultantId
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);

    // Update form data when consultantId changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            date: new Date() > new Date(defaultDate) ? today : defaultDate,
            consultant_id: consultantId
        }));
    }, [consultantId, defaultDate]);

    // Field change handler
    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: fieldValue
        }));

        // Mark field as touched
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
    };

    // Field blur handler for validation
    const handleBlur = (e) => {
        const {name} = e.target;
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        validateField(name);
    };

    // Validate a single field
    const validateField = (fieldName) => {
        const newErrors = {...errors};

        switch (fieldName) {
            case 'title':
                if (!formData.title) {
                    newErrors.title = 'Please enter a title for this time slot';
                } else if (formData.title.length > 100) {
                    newErrors.title = 'Title must be less than 100 characters';
                } else {
                    delete newErrors.title;
                }
                break;

            case 'date':
                if (!formData.date) {
                    newErrors.date = 'Please select a date';
                } else if (formData.date < new Date()) {
                    newErrors.date = 'Date cannot be in the past';
                } else {
                    delete newErrors.date;
                }
                break;

            case 'startTime':
                if (!formData.startTime) {
                    newErrors.startTime = 'Please select a start time';
                } else {
                    delete newErrors.startTime;
                }
                break;

            case 'endTime':
                if (!formData.endTime) {
                    newErrors.endTime = 'Please select an end time';
                } else if (formData.startTime && !isEndTimeAfterStartTime(formData.startTime, formData.endTime)) {
                    newErrors.endTime = 'End time must be after start time';
                } else {
                    delete newErrors.endTime;
                }
                break;

            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate all fields
    const validateForm = () => {
        // Mark all fields as touched
        const allTouched = {};
        Object.keys(formData).forEach(key => {
            allTouched[key] = true;
        });
        setTouched(allTouched);

        // Validate each field
        let isValid = true;
        ['title', 'date', 'startTime', 'endTime'].forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    };

    // Reset the form
    const resetForm = () => {
        setFormData({
            title: '',
            date: today,
            startTime: '',
            endTime: '',
            active: true,
            consultant_id: consultantId
        });
        setErrors({});
        setTouched({});
    };

    // Form submission handler
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});
        // Validate all fields
        if (!validateForm()) {
            setErrorMessage('Please fix the errors before submitting.');
            setShowError(true);
            return;
        }

        setLoading(true);

        // Send to server using Inertia
        router.post(route('times.store'), formData, {
            onSuccess: () => {
                setLoading(false);
                resetForm();
                onClose();
            },
            onError: (serverErrors) => {
                setLoading(false);

                // Map backend errors to form fields
                if (typeof serverErrors === 'object' && serverErrors !== null) {
                    setErrors(serverErrors);

                    // Show generic error message
                    setErrorMessage('There were errors in your submission. Please check the form and try again.');
                    setShowError(true);
                } else {
                    // Show generic error message
                    setErrorMessage('An unexpected error occurred. Please try again later.');
                    setShowError(true);
                }
            }
        });
    };

    // Calculate duration for display
    const calculateDuration = () => {
        if (!formData.startTime || !formData.endTime || !isEndTimeAfterStartTime(formData.startTime, formData.endTime)) {
            return null;
        }

        const [startHour, startMinute] = formData.startTime.split(':').map(Number);
        const [endHour, endMinute] = formData.endTime.split(':').map(Number);

        let durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        return `Duration: ${hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : ''}${hours > 0 && minutes > 0 ? ' and ' : ''}${minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={() => !loading && onClose()}
                maxWidth="md"
                fullWidth
                slotProps={{
                    paper: {
                        elevation: 3,
                        sx: {borderRadius: 2}
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: '8px 8px 0 0'
                }}>
                    <Typography variant="h6" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <EventNoteIcon/> Add New Time Slot
                    </Typography>
                    <Tooltip title="Close">
                        <IconButton edge="end" color="inherit" onClick={onClose} disabled={loading}>
                            <CloseIcon/>
                        </IconButton>
                    </Tooltip>
                </DialogTitle>

                <form onSubmit={handleSubmit}>
                    <DialogContent dividers>
                        <Paper elevation={0} sx={{p: 2, mb: 2}}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Please fill in the details for the new time slot
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        id="title"
                                        name="title"
                                        label="Title"
                                        placeholder="e.g., Morning Consultation"
                                        value={formData.title}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.title && Boolean(errors.title)}
                                        helperText={touched.title && errors.title}
                                        slotProps={{
                                            input: {startAdornment: <TitleIcon color="action" sx={{mr: 1}}/>}
                                        }}
                                    />
                                </Grid>

                                <Grid size={12}>
                                    <Divider textAlign="left">
                                        <Typography variant="body2" color="text.secondary">
                                            Schedule Details
                                        </Typography>
                                    </Divider>
                                </Grid>

                                <Grid size={{xs: 12, sm: 4}}>
                                    <TextField
                                        id="date"
                                        name="date"
                                        label="Date"
                                        type="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        fullWidth
                                        slotProps={{
                                            inputLabel: {shrink: true},
                                            htmlInput: {
                                                min: today
                                            }
                                        }}
                                        error={touched.date && Boolean(errors.date)}
                                        helperText={touched.date && errors.date}
                                    />
                                </Grid>

                                <Grid size={{xs: 12, sm: 4}}>
                                    <TextField
                                        id="startTime"
                                        name="startTime"
                                        label="Start Time"
                                        type="time"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        fullWidth
                                        slotProps={{
                                            inputLabel: {
                                                shrink: true
                                            },
                                            input: {
                                                startAdornment: <AccessTimeIcon color="action" sx={{mr: 1}}/>
                                            }
                                        }}
                                        error={touched.startTime && Boolean(errors.startTime)}
                                        helperText={touched.startTime && errors.startTime}
                                    />
                                </Grid>

                                <Grid size={{xs: 12, sm: 4}}>
                                    <TextField
                                        id="endTime"
                                        name="endTime"
                                        label="End Time"
                                        type="time"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        fullWidth
                                        slotProps={{
                                            inputLabel: {
                                                shrink: true
                                            },
                                            input: {
                                                startAdornment: <AccessTimeIcon color="action" sx={{mr: 1}}/>
                                            }
                                        }}
                                        error={touched.endTime && Boolean(errors.endTime)}
                                        helperText={touched.endTime && errors.endTime}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Show duration calculation */}
                        {formData.startTime && formData.endTime &&
                            isEndTimeAfterStartTime(formData.startTime, formData.endTime) && (
                                <Alert severity="info" sx={{mb: 2}}>
                                    {calculateDuration()}
                                </Alert>
                            )}
                    </DialogContent>

                    <DialogActions sx={{px: 3, py: 2, justifyContent: 'space-between'}}>
                        <Button
                            onClick={onClose}
                            disabled={loading}
                            startIcon={<CloseIcon/>}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            sx={{px: 4}}
                        >
                            {loading ? <CircularProgress size={24} color="inherit"/> : 'Save Time Slot'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Snackbar
                open={showError}
                autoHideDuration={6000}
                onClose={() => setShowError(false)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={() => setShowError(false)}
                    severity="error"
                    sx={{width: '100%'}}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default AddTimeSlotForm;
