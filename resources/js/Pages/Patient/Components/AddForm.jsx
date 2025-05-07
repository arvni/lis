import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import axios from "axios";

// MUI Components
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Container,
    Grid2 as Grid,
    FormGroup,
    FormHelperText,
    Radio,
    RadioGroup,
    FormControlLabel,
    CircularProgress,
    Typography,
    TextField,
    Paper,
    Divider,
    Box,
    Alert,
    Snackbar
} from "@mui/material";

// Icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Components
import SelectSearch from "@/Components/SelectSearch";

const AddForm = ({ open, onClose, patientId }) => {
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
        time: null,
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
                onSuccess: () => {
                    setShowSuccess(true);
                    reset();
                    setTimes([]);
                    onClose();
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

        if (!data.time) {
            setError("time", "Please select a time slot");
            isValid = false;
        }

        return isValid;
    };

    return (
        <>
            <Dialog
                open={open && !processing}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                slotProps={{
                    Paper: {
                        elevation: 3,
                        sx: {borderRadius: 2}
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    py: 2
                }}>
                    <Typography variant="h5" fontWeight="500">
                        Schedule New Consultation
                    </Typography>
                </DialogTitle>

                <Divider />

                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Container>
                        <Box mb={3}>
                            <Typography variant="body1" color="text.secondary">
                                Please fill in the details below to schedule a consultation for patient ID: {patientId}
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Consultant Selection */}
                            <Grid size={{xs: 12, md: 6}}>
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
                            <Grid  size={{xs: 12, md: 6}}>
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
                                            slotProps={{ InputLabel:{shrink: true},input:{ min: formattedDate }}}
                                            error={errors.hasOwnProperty("dueDate")}
                                            helperText={errors?.dueDate}
                                        />
                                    </FormGroup>
                                </Paper>
                            </Grid>

                            {/* Time Selection */}
                            {(times.length > 0 || waiting) && (
                                <Grid  size={{xs: 12}}>
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
                                            <>
                                                <RadioGroup
                                                    name="time"
                                                    value={data.time}
                                                    onChange={handleChange}
                                                    sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}
                                                >
                                                    {times.map((item, index) => (
                                                        <FormControlLabel
                                                            key={index}
                                                            value={item.value}
                                                            label={item.label}
                                                            disabled={item.disabled}
                                                            control={
                                                                <Radio
                                                                    color="primary"
                                                                    checkedIcon={<CheckCircleIcon />}
                                                                />
                                                            }
                                                            sx={{
                                                                border: "1px solid",
                                                                borderColor: data.time === item.value ? "primary.main" : "divider",
                                                                borderRadius: "8px",
                                                                m: 0.5,
                                                                p: 0.5,
                                                                pr: 1.5,
                                                                transition: "all 0.2s",
                                                                bgcolor: data.time === item.value ? "action.selected" : "background.paper",
                                                                "&:hover": {
                                                                    bgcolor: "action.hover",
                                                                    borderColor: "primary.light"
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                </RadioGroup>

                                                {errors.time && (
                                                    <FormHelperText error>{errors.time}</FormHelperText>
                                                )}
                                            </>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                                                No available time slots. Please try another date or consultant.
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    </Container>
                </DialogContent>

                <Divider />

                <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
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
                        startIcon={processing ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        {processing ? "Scheduling..." : "Schedule Consultation"}
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
