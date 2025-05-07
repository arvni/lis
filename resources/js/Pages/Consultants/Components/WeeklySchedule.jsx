import {
    Button,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    Typography,
    Box,
    Tooltip,
    Paper,
} from "@mui/material";
import { useState } from "react";
import { Add, ContentCopy, RestartAlt } from "@mui/icons-material";

import AddTimeSlotForm from "./AddTimeSlotForm.jsx";
import {default_time_table} from "./Form.jsx";

const weekDays = [
    "Saturday",
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
];

const defaultTimeSlot = {
    id: Date.now(),
    day: null,
    started_at: "09:00",
    ended_at: "13:00",
    only_online: false
};

const WeeklySchedule = ({ data = Array(7).fill([]), onChange, onDeleteTimeSlot }) => {
    const [timeSlot, setTimeSlot] = useState(defaultTimeSlot);
    const [openAdd, setOpenAdd] = useState(false);

    const handleAddNewTimeSlot = (index) => () => {
        setTimeSlot(prevState => ({...defaultTimeSlot, id: Date.now(), day: index}));
        setOpenAdd(true);
    };

    const handleChange = () => {
        onChange(timeSlot);
        handleCloseAdd();
    };

    const handleCloseAdd = () => {
        setTimeSlot(defaultTimeSlot);
        setOpenAdd(false);
    };

    const handleEdit = (id, index) => () => {
        setTimeSlot({...data[index].find(item => item.id === id), day: index});
        setOpenAdd(true);
    };

    const handleDelete = () => {
        onDeleteTimeSlot(timeSlot, handleCloseAdd);
    };

    const handleReset = () => {
        // Create a deep copy of the default_time_table with new IDs
        const resetData = default_time_table.map(daySlots =>
            daySlots.map(slot => ({
                ...slot,
                id: Date.now() + Math.floor(Math.random() * 1000)
            }))
        );

        // Update all days at once
        resetData.forEach((daySlots, index) => {
            daySlots.forEach(slot => {
                onChange({...slot, day: index});
            });
        });
    };

    const handleCopyDay = (fromIndex) => (toIndex) => {
        // Copy time slots from one day to another
        const slotsToAdd = data[fromIndex].map(slot => ({
            ...slot,
            id: Date.now() + Math.floor(Math.random() * 1000),
            day: toIndex
        }));

        // Add all slots to the target day
        slotsToAdd.forEach(slot => {
            onChange(slot);
        });
    };

    return (
        <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="primary">Weekly Schedule</Typography>
                <Tooltip title="Reset to default schedule">
                    <Button
                        variant="outlined"
                        startIcon={<RestartAlt />}
                        onClick={handleReset}
                        size="small"
                    >
                        Reset to Default
                    </Button>
                </Tooltip>
            </Box>

            <List sx={{ width: "100%" }}>
                {weekDays.map((day, index) => (
                    <div key={`day-container-${index}`}>
                        <ListItem sx={{ py: 1 }} secondaryAction={
                            <>
                                <Tooltip title="Add time slot">
                                    <IconButton
                                        onClick={handleAddNewTimeSlot(index)}
                                        color="primary"
                                        size="small"
                                    >
                                        <Add />
                                    </IconButton>
                                </Tooltip>

                                {data[index]?.length > 0 && (
                                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                        <Tooltip title="Copy this day's schedule">
                                            <IconButton
                                                color="secondary"
                                                size="small"
                                                onClick={() => {
                                                    // Implementation of copying functionality could include a popover to select target day
                                                    const targetDay = (index + 1) % 7; // Example: copy to next day
                                                    handleCopyDay(index)(targetDay);
                                                }}
                                            >
                                                <ContentCopy />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </>
                        }>
                            <ListItemAvatar sx={{ minWidth: 100 }}>
                                <Typography variant="subtitle1" fontWeight="medium">
                                    {day}
                                </Typography>
                            </ListItemAvatar>

                            <ListItemText>
                                {data[index]?.length > 0 ? (
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {data[index].map(item => (
                                            <Button
                                                onClick={handleEdit(item.id, index)}
                                                color={item.only_online ? "secondary" : "primary"}
                                                variant="contained"
                                                key={item.id}
                                                size="small"
                                                sx={{ my: 0.5 }}
                                            >
                                                {item.started_at} - {item.ended_at}
                                                {item.only_online ? " (Online)" : ""}
                                            </Button>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No time slots scheduled
                                    </Typography>
                                )}
                            </ListItemText>
                        </ListItem>
                        <Divider component="li" />
                    </div>
                ))}
            </List>

            <AddTimeSlotForm
                open={openAdd}
                data={timeSlot}
                setData={setTimeSlot}
                onsubmit={handleChange}
                title={timeSlot.day !== null ? `Add Time Slot - ${weekDays[timeSlot.day]}` : "Add Time Slot"}
                onClose={handleCloseAdd}
                onDelete={handleDelete}
            />
        </Paper>
    );
};

export default WeeklySchedule;
