import {
    Button, Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle, FormControlLabel,
    Grid2 as Grid,
    Typography,
    Box,
    Tooltip,
    Alert,
    DialogContentText
} from "@mui/material";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
    DeleteOutline as DeleteIcon,
    WarningAmber as WarningIcon
} from '@mui/icons-material';

// Helper functions
export const getDayjs = (hours, minutes = 0, seconds = 0) => dayjs(new Date(new Date(new Date().setHours(hours)).setMinutes(minutes)).setSeconds(seconds))

export const convertValue = (v) => {
    if (v) {
        let tmp = v.split(":");
        return getDayjs(tmp[0], tmp[1]);
    }
    return v;
}


// Time configuration
const minTime = getDayjs(9);
const maxTime = getDayjs(21);
const timeSlotPresets = [
    { label: "Morning (9:00-13:00)", start: "9:00", end: "13:00" },
    { label: "Afternoon (14:00-17:00)", start: "13:00", end: "17:00" },
    { label: "Full Day (9:00-17:00)", start: "9:00", end: "17:00" }
];

const AddTimeSlotForm = ({ open, setData, data, title, onClose, onsubmit, onDelete }) => {
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Reset error when form opens or data changes
        setError("");
    }, [open, data]);

    const handleSubmit = () => {
        if (!data.started_at || !data.ended_at) {
            setError("Please select both start and end times");
            return;
        }

        const startTime = convertValue(data.started_at).toDate().getTime();
        const endTime = convertValue(data.ended_at).toDate().getTime();

        if (startTime >= endTime) {
            setError("End time must be after start time");
            return;
        }

        setError("");
        onsubmit();
    };

    const handleChange = (name) => (v) => {
        setData(prevData => ({...prevData, [name]: dayjs(v).format("H:mm")}));
        setError(""); // Clear error on change
    };

    const handleOnlyOnlineChanged = (_, v) => setData(prevData => ({...prevData, only_online: v}));

    const handleOpenDeleteConfirm = () => setConfirmDeleteOpen(true);
    const handleCloseDeleteConfirm = () => setConfirmDeleteOpen(false);

    const handleDelete = () => {
        onDelete();
        handleCloseDeleteConfirm();
    };

    const applyPreset = (preset) => {
        setData(prevData => ({
            ...prevData,
            started_at: preset.start,
            ended_at: preset.end
        }));
        setError("");
    };

    return (
        <>
            {/* Main Time Slot Form Dialog */}
            <Dialog open={open} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h6" component="div">
                        {title || "Schedule Time Slot"}
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Select the time slot for this day or choose from common presets.
                    </DialogContentText>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box mb={3}>
                        <Typography variant="subtitle2" gutterBottom>
                            Quick Select:
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                            {timeSlotPresets.map((preset, idx) => (
                                <Button
                                    key={idx}
                                    size="small"
                                    variant="outlined"
                                    onClick={() => applyPreset(preset)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </Box>
                    </Box>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid container spacing={2}>
                            <Grid size={{xs:12, sm:5}}>
                                <TimePicker
                                    ampm={false}
                                    slotProps={{
                                        digitalClockSectionItem: {
                                            sx: {"&.Mui-disabled": {display: "none"}}
                                        },
                                        textField: {
                                            fullWidth: true,
                                            error: Boolean(error && !data.started_at)
                                        }
                                    }}
                                    sx={{ width: "100%" }}
                                    onAccept={handleChange("started_at")}
                                    label="Start Time"
                                    required
                                    value={convertValue(data?.started_at)}
                                    name="started_at"
                                    minutesStep={15}
                                    maxTime={maxTime}
                                    minTime={minTime}
                                />
                            </Grid>

                            <Grid size={{xs:12, sm:5}}>
                                <TimePicker
                                    ampm={false}
                                    sx={{ width: "100%" }}
                                    slotProps={{
                                        digitalClockSectionItem: {
                                            sx: {"&.Mui-disabled": {display: "none"}}
                                        },
                                        textField: {
                                            fullWidth: true,
                                            error: Boolean(error && !data.ended_at)
                                        }
                                    }}
                                    onAccept={handleChange("ended_at")}
                                    label="End Time"
                                    required
                                    value={convertValue(data?.ended_at)}
                                    name="ended_at"
                                    minutesStep={15}
                                    maxTime={maxTime}
                                    minTime={minTime}
                                />
                            </Grid>

                            <Grid size={{xs:12, sm:2}}>
                                <Tooltip title="Sessions are online only (no in-person appointments)">
                                    <FormControlLabel
                                        control={<Checkbox />}
                                        label="Online Only"
                                        checked={data.only_online}
                                        onChange={handleOnlyOnlineChanged}
                                    />
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                </DialogContent>

                <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <Button
                        onClick={handleOpenDeleteConfirm}
                        color="error"
                        variant="outlined"
                        sx={{ display: data.id ? 'block' : 'none' }}
                        startIcon={<DeleteIcon />}
                    >
                        Delete
                    </Button>

                    <Box>
                        <Button onClick={onClose} sx={{ mr: 1 }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            color="primary"
                        >
                            Save
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={confirmDeleteOpen}
                onClose={handleCloseDeleteConfirm}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                        Delete Time Slot
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this time slot?
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            This action cannot be undone. The time slot will be permanently removed from the schedule.
                        </Typography>
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={handleCloseDeleteConfirm}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

AddTimeSlotForm.propTypes = {
    open: PropTypes.bool.isRequired,
    setData: PropTypes.func.isRequired,
    data: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onsubmit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};

export default AddTimeSlotForm;
