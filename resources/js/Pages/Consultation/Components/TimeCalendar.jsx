import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    IconButton,
    useTheme,
    useMediaQuery,
    Button,
    Stack
} from '@mui/material';
import {
    ArrowBackIos,
    ArrowForwardIos,
    Today,
    CalendarMonth
} from '@mui/icons-material';
import TimeSlotCard from "./TimeSlotCard";

/**
 * A calendar component that displays time slots with the ability to manage appointments
 *
 * @param {Object} props - Component props
 * @param {Array} props.timeSlots - Array of time slot objects to display
 * @param {Function} props.onTimeSlotSelect - Callback when a time slot is selected
 * @param {Function} props.onDateSelect - Callback when a date is selected
 * @param {Function} props.onMonthChange - Callback when month changes with (startDate, endDate) parameters
 * @param {Function} props.onTimeSlotEdit - Callback when edit button is clicked on a time slot
 * @param {Function} props.onTimeSlotDelete - Callback when delete button is clicked on a time slot
 * @param {boolean} props.canViewPatient - Whether the user can view patient details
 * @param {boolean} props.canViewConsultation - Whether the user can view consultation details
 * @param {boolean} props.canConvertToPatient - Whether the user can convert a time slot to a patient appointment
 * @param {boolean} props.canEditTimeSlot - Whether the user can edit time slots
 * @param {boolean} props.canDeleteTimeSlot - Whether the user can delete time slots
 * @param {boolean} props.canDeleteConsultantReserve - Whether the user can delete consultant reservations
 * @returns {JSX.Element} The TimeCalendar component
 */
const TimeCalendar = ({
                          timeSlots = [],
                          onTimeSlotSelect,
                          onDateSelect = () => {},
                          onMonthChange,
                          onTimeSlotEdit = () => {},
                          onTimeSlotDelete = () => {},
                          canViewPatient = false,
                          canViewConsultation = false,
                          canConvertToPatient = false,
                          canEditTimeSlot = false,
                          canDeleteTimeSlot = false,
                          canDeleteConsultantReserve = false
                      }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Format date as ISO string (YYYY-MM-DD)
    const formatDateISO = useCallback((date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    // Days of week and month names
    const daysOfWeek = useMemo(() => [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri','Sat', 'Sun',], []);
    const monthNames = useMemo(() => [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ], []);

    // Calendar data and helpers
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Get days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get day of week for the first day of month (0 = Sunday, 6 = Saturday)
        // Convert to our Saturday-first system (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
        let firstDayOfMonth = new Date(year, month, 1).getDay();
        firstDayOfMonth = (firstDayOfMonth + 6) % 7;

        // Create calendar days array
        const days = [];

        // Add empty cells for days before the first day of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({day: null, date: null});
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push({day, date});
        }

        return days;
    }, [currentDate]);

    // Time slot data filtered by date
    const timeSlotsByDate = useMemo(() => {
        return timeSlots.reduce((acc, timeSlot) => {
            const startDate = new Date(timeSlot.started_at);
            const dateStr = formatDateISO(startDate);
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(timeSlot);
            return acc;
        }, {});
    }, [timeSlots, formatDateISO]);

    // Get time slots for selected date
    const selectedDateTimeSlots = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = formatDateISO(selectedDate);
        return timeSlotsByDate[dateStr] || [];
    }, [selectedDate, timeSlotsByDate, formatDateISO]);

    // Helper functions
    const hasTimeSlots = useCallback((date) => {
        if (!date) return false;
        const dateStr = formatDateISO(date);
        return !!timeSlotsByDate[dateStr]?.length;
    }, [timeSlotsByDate, formatDateISO]);

    const hasActiveTimeSlots = useCallback((date) => {
        if (!date) return false;
        const dateStr = formatDateISO(date);
        return timeSlotsByDate[dateStr]?.some(slot => slot.active) || false;
    }, [timeSlotsByDate, formatDateISO]);

    const countTimeSlots = useCallback((date) => {
        if (!date) return 0;
        const dateStr = formatDateISO(date);
        return timeSlotsByDate[dateStr]?.length || 0;
    }, [timeSlotsByDate, formatDateISO]);

    // Date helper functions
    const isToday = useCallback((date) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }, []);

    const isSelected = useCallback((date) => {
        if (!date || !selectedDate) return false;
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    }, [selectedDate]);

    const formatDate = useCallback((date) => {
        if (!date) return '';
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const weekday = daysOfWeek[(date.getDay() + 6) % 7]; // Convert to our Saturday-first system
        return `${weekday}, ${month} ${day}, ${year}`;
    }, [daysOfWeek, monthNames]);

    // Navigation handlers
    const goToPreviousMonth = useCallback(() => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
        setSelectedDate(null);

        // Call onMonthChange with new month range
        if (onMonthChange) {
            const year = newDate.getFullYear();
            const month = newDate.getMonth();
            const startDate = new Date(year, month, 1).toLocaleDateString();
            const endDate = new Date(year, month + 1, 0).toLocaleDateString();
            onMonthChange(startDate, endDate);
        }
    }, [currentDate, onMonthChange]);

    const goToNextMonth = useCallback(() => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
        setSelectedDate(null);

        // Call onMonthChange with new month range
        if (onMonthChange) {
            const year = newDate.getFullYear();
            const month = newDate.getMonth();
            const startDate = new Date(year, month, 1).toLocaleDateString();
            const endDate = new Date(year, month + 1, 0).toLocaleDateString();
            onMonthChange(startDate, endDate);
        }
    }, [currentDate, onMonthChange]);

    const goToToday = useCallback(() => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);

        // Call onMonthChange with current month range
        if (onMonthChange) {
            const year = today.getFullYear();
            const month = today.getMonth();
            const startDate = new Date(year, month, 1).toLocaleDateString();
            const endDate = new Date(year, month + 1, 0).toLocaleDateString();
            onMonthChange(startDate, endDate);
        }

        // Call onDateSelect with today
        onDateSelect(today);
    }, [onMonthChange, onDateSelect]);

    // Handle day selection
    const handleDayClick = useCallback((date) => {
        if (date) {
            setSelectedDate(date);
            onDateSelect(date);
        }
    }, [onDateSelect]);

    // Handle time slot selection
    const handleTimeSlotClick = useCallback((timeSlot) => {
        if (onTimeSlotSelect) {
            onTimeSlotSelect(timeSlot);
        }
    }, [onTimeSlotSelect]);

    return (
        <Paper
            elevation={3}
            sx={{
                p: { xs: 1, sm: 2 },
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[3]
            }}
        >
            {/* Calendar Header */}
            <Box sx={{ mb: 2 }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                >
                    <Typography variant="h5" fontWeight="600" color="text.primary">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <IconButton
                            onClick={goToPreviousMonth}
                            color="primary"
                            aria-label="Previous month"
                            size={isMobile ? "small" : "medium"}
                        >
                            <ArrowBackIos fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                        <IconButton
                            onClick={goToToday}
                            color="primary"
                            aria-label="Go to today"
                            size={isMobile ? "small" : "medium"}
                        >
                            <Today fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                        <IconButton
                            onClick={goToNextMonth}
                            color="primary"
                            aria-label="Next month"
                            size={isMobile ? "small" : "medium"}
                        >
                            <ArrowForwardIos fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                    </Stack>
                </Stack>
            </Box>

            {/* Calendar Grid */}
            <Box sx={{ mb: 3 }}>
                <Grid container>
                    {/* Days of week header */}
                    {daysOfWeek.map((day, index) => (
                        <Grid item key={`header-${index}`} xs={12/7}>
                            <Box
                                sx={{
                                    textAlign: 'center',
                                    py: 1,
                                    fontWeight: 'bold',
                                    color: 'text.secondary',
                                    borderBottom: 1,
                                    borderColor: 'divider'
                                }}
                            >
                                {day}
                            </Box>
                        </Grid>
                    ))}

                    {/* Calendar days */}
                    {calendarData.map((dayObj, index) => (
                        <Grid item key={`day-${index}`} xs={12/7}>
                            <Box
                                sx={{
                                    height: { xs: 40, sm: 50 },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: dayObj.day ? 'pointer' : 'default',
                                    borderRadius: 1,
                                    position: 'relative',
                                    m: 0.5,
                                    transition: 'all 0.2s',
                                    backgroundColor: isSelected(dayObj.date)
                                        ? theme.palette.primary.main
                                        : isToday(dayObj.date)
                                            ? theme.palette.primary.light
                                            : 'transparent',
                                    color: (isSelected(dayObj.date) || isToday(dayObj.date))
                                        ? theme.palette.primary.contrastText
                                        : theme.palette.text.primary,
                                    '&:hover': {
                                        backgroundColor: dayObj.day
                                            ? (isSelected(dayObj.date)
                                                ? theme.palette.primary.dark
                                                : theme.palette.action.hover)
                                            : 'transparent',
                                        transform: dayObj.day ? 'scale(1.05)' : 'none'
                                    }
                                }}
                                onClick={() => dayObj.day && handleDayClick(dayObj.date)}
                            >
                                {dayObj.day && (
                                    <>
                                        <Typography
                                            variant="body2"
                                            fontWeight={isToday(dayObj.date) || isSelected(dayObj.date) ? 'bold' : 'normal'}
                                        >
                                            {dayObj.day}
                                        </Typography>

                                        {/* Indicator for time slots */}
                                        {hasTimeSlots(dayObj.date) && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 2,
                                                    width: '100%',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    gap: 0.5
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        backgroundColor: hasActiveTimeSlots(dayObj.date)
                                                            ? theme.palette.success.main
                                                            : theme.palette.grey[400]
                                                    }}
                                                />
                                                {countTimeSlots(dayObj.date) > 1 && (
                                                    <Box
                                                        sx={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: '50%',
                                                            backgroundColor: hasActiveTimeSlots(dayObj.date)
                                                                ? theme.palette.success.main
                                                                : theme.palette.grey[400]
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Time slots for selected date */}
            {selectedDate && (
                <Paper
                    elevation={1}
                    sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.default
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 2 }}
                    >
                        <CalendarMonth color="primary" />
                        <Typography variant="h6" fontWeight="600">
                            {formatDate(selectedDate)}
                        </Typography>
                    </Stack>

                    {selectedDateTimeSlots.length > 0 ? (
                        <Grid container spacing={2}>
                            {selectedDateTimeSlots.map((timeSlot) => (
                                <Grid item xs={12} sm={6} md={4} key={timeSlot.id}>
                                    <TimeSlotCard
                                        timeSlot={timeSlot}
                                        onClick={handleTimeSlotClick}
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
                                borderColor: theme.palette.divider
                            }}
                        >
                            <CalendarMonth
                                sx={{
                                    fontSize: 48,
                                    color: theme.palette.text.secondary,
                                    mb: 2,
                                    opacity: 0.5
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
            )}
        </Paper>
    );
};

export default TimeCalendar;
