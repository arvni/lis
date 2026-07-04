import React from 'react';
import { Box, Paper, Typography, Grid, Button, Stack, useTheme } from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';
import TimeSlotCard from '../TimeSlotCard';
import { formatDate } from './constants';

const SelectedDaySlots = ({
    selectedDate,
    timeSlots,
    onTimeSlotClick,
    onTimeSlotEdit,
    onTimeSlotDelete,
    canViewPatient,
    canViewConsultation,
    canConvertToPatient,
    canEditTimeSlot,
    canDeleteTimeSlot,
    canDeleteConsultantReserve,
}) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={1}
            sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
            }}
        >
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
                <CalendarMonth color="primary" />
                <Typography variant="h6" fontWeight="600">
                    {formatDate(selectedDate)}
                </Typography>
            </Stack>

            {timeSlots.length > 0 ? (
                <Grid container spacing={2}>
                    {timeSlots.map((timeSlot) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={timeSlot.id}>
                            <TimeSlotCard
                                timeSlot={timeSlot}
                                onClick={onTimeSlotClick}
                                canCheckPatient={canViewPatient}
                                canCheckConsultation={canViewConsultation}
                                canConversion={canConvertToPatient}
                                canEdit={canEditTimeSlot}
                                canDelete={canDeleteTimeSlot}
                                onEdit={onTimeSlotEdit}
                                onDelete={onTimeSlotDelete}
                                canDeleteConsultantReserve={canDeleteConsultantReserve}
                            />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box
                    sx={{
                        py: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 2,
                        borderStyle: 'dashed',
                        borderWidth: 1,
                        borderColor: theme.palette.divider,
                    }}
                >
                    <CalendarMonth
                        sx={{
                            fontSize: 48,
                            color: theme.palette.text.secondary,
                            mb: 2,
                            opacity: 0.5,
                        }}
                    />
                    <Typography variant="body1" color="text.secondary">
                        No time slots scheduled for this day
                    </Typography>
                    {canEditTimeSlot && (
                        <Button
                            variant="outlined"
                            color="primary"
                            sx={{ mt: 2 }}
                            onClick={() => onTimeSlotEdit({ date: selectedDate })}
                        >
                            Add Time Slot
                        </Button>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default SelectedDaySlots;
