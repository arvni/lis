import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import axios from "axios";

// MUI Components
import {
    Button,
    Container,
    Grid2 as Grid,
    FormGroup,
    CircularProgress,
    Typography,
    TextField,
    Paper,
    Box,
    Alert,
    Snackbar,
    Chip
} from "@mui/material";

// Icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";

// Components
import SelectSearch from "@/Components/SelectSearch";

const ConsultationForm = ({ patientId, embedded = false, onNext }) => {
    const [times, setTimes] = useState([]);
    const [waiting, setWaiting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Format current date properly
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 because months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const formattedDate = formatDate(today);

    const { data, setData, reset, processing, post, errors, setError } = useForm({
        consultant: "",
        dueDate: formattedDate,
        time: null, // Keep this but don't require it
        patient_id: patientId
    });

    useEffect(() => {
        if (data.consultant && data.dueDate) {
            setWaiting(true);
            getTimes();
        } else {
            setTimes([]);
        }
    }, [data.consultant, data.dueDate]);

    const getTimes = () => {
        axios
            .get(
                route("list-reservation-times", {
                    consultant: data.consultant?.id,
                    date: data.dueDate
                })
            )
            .then(({ data }) => setTimes(data.data))
            .then(() => setWaiting(false))
            .catch((error) => {
                console.error("Error fetching times:", error);
                setWaiting(false);
            });
    };

    const handleChange = (e) =>
        setData((previousData) => ({
            ...previousData,
            [e.target.name]: e.target.value
        }));

    const handleSubmit = () => {
        if (check()) {
            post(route("consultations.store"), {
                onSuccess: (e) => {
                    setShowSuccess(true);
                    console.log(e)
                }
            });
        }
    };

    const check = () => {
        let isValid = true;

        if (!data.consultant) {
            setError("consultant", "Please select a consultant");
            isValid = false;
        }

        if (!data.dueDate) {
            setError("dueDate", "Please select a date");
            isValid = false;
        }

        // Remove time validation - no longer required
        // if (!data.time) {
        //     setError("time", "Please select a time slot");
        //     isValid = false;
        // }

        return isValid;
    };

    // Main form content that will be rendered either embedded or in dialog
    const formContent = (
        <Container sx={{ p: embedded ? 0 : 3 }}>
            {embedded && (
                <Box mb={3}>
                    <Typography variant="body1" color="text.secondary">
                        Please complete the following details to schedule a consultation
                    </Typography>
                </Box>
            )}

            <Grid container spacing={3}>
                {/* Consultant Selection */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                            <PersonIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" fontWeight="medium">
                                Select Consultant
                            </Typography>
                        </Box>

                        <SelectSearch
                            onChange={handleChange}
                            value={data.consultant}
                            url={route("list-consultants")}
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
                    <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
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
                                slotProps={{ InputLabel: { shrink: true }, input: { min: formattedDate } }}
                                error={errors.hasOwnProperty("dueDate")}
                                helperText={errors?.dueDate}
                            />
                        </FormGroup>
                    </Paper>
                </Grid>

                {/* Available Times Display (Read-only) */}
                {(times.length > 0 || waiting) && (
                    <Grid size={{ xs: 12 }}>
                        <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                            <Box display="flex" alignItems="center" mb={2}>
                                <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="subtitle1" fontWeight="medium">
                                    Available Time Slots
                                </Typography>
                            </Box>

                            {waiting ? (
                                <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                                    <CircularProgress size={40} />
                                    <Typography variant="body2" color="text.secondary" ml={2}>
                                        Loading available times...
                                    </Typography>
                                </Box>
                            ) : times.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {times.map((item, index) => (
                                        <Chip
                                            key={index}
                                            label={item.label}
                                            variant="outlined"
                                            color="primary"
                                            sx={{
                                                borderRadius: '8px',
                                                px: 1,
                                                py: 0.5,
                                                bgcolor: 'action.selected',
                                                '&:hover': {
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                                    No available time slots. Please try another date or consultant.
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {embedded && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disableElevation
                        disabled={processing}
                        startIcon={processing ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        {processing ? "Scheduling..." : "Schedule Consultation"}
                    </Button>
                </Box>
            )}
        </Container>
    );

    // Return just the form content if embedded
    if (embedded) {
        return (
            <>
                {formContent}
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
    }

    // In non-embedded mode, this component should behave like the original AddForm dialog
    // This is included for backward compatibility, but in our case we're using the embedded version
    return null;
};

export default ConsultationForm;
