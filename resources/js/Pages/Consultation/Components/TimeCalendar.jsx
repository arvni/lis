import React, { useState, useMemo, useCallback } from 'react';
import { Paper, useTheme, useMediaQuery } from '@mui/material';
import CalendarHeader from './TimeCalendar/CalendarHeader';
import CalendarGrid from './TimeCalendar/CalendarGrid';
import SelectedDaySlots from './TimeCalendar/SelectedDaySlots';
import {
    MONTH_NAMES,
    formatDateISO,
    isToday as isTodayFn,
    isSameDay,
    buildCalendarDays,
} from './TimeCalendar/constants';

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
    canDeleteConsultantReserve = false,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Calendar grid for the current month
    const calendarData = useMemo(() => buildCalendarDays(currentDate), [currentDate]);

    // Time slot data filtered by date
    const timeSlotsByDate = useMemo(() => {
        return timeSlots.reduce((acc, timeSlot) => {
            const dateStr = formatDateISO(new Date(timeSlot.started_at));
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(timeSlot);
            return acc;
        }, {});
    }, [timeSlots]);

    // Get time slots for selected date
    const selectedDateTimeSlots = useMemo(() => {
        if (!selectedDate) return [];
        return timeSlotsByDate[formatDateISO(selectedDate)] || [];
    }, [selectedDate, timeSlotsByDate]);

    // Helper functions
    const hasTimeSlots = useCallback(
        (date) => {
            if (!date) return false;
            return !!timeSlotsByDate[formatDateISO(date)]?.length;
        },
        [timeSlotsByDate],
    );

    const hasActiveTimeSlots = useCallback(
        (date) => {
            if (!date) return false;
            return timeSlotsByDate[formatDateISO(date)]?.some((slot) => slot.active) || false;
        },
        [timeSlotsByDate],
    );

    const countTimeSlots = useCallback(
        (date) => {
            if (!date) return 0;
            return timeSlotsByDate[formatDateISO(date)]?.length || 0;
        },
        [timeSlotsByDate],
    );

    const isSelected = useCallback((date) => isSameDay(date, selectedDate), [selectedDate]);

    // Navigation handlers
    const goToPreviousMonth = useCallback(() => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
        setSelectedDate(null);

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

        if (onMonthChange) {
            const year = today.getFullYear();
            const month = today.getMonth();
            const startDate = new Date(year, month, 1).toLocaleDateString();
            const endDate = new Date(year, month + 1, 0).toLocaleDateString();
            onMonthChange(startDate, endDate);
        }

        onDateSelect(today);
    }, [onMonthChange, onDateSelect]);

    // Handle day selection
    const handleDayClick = useCallback(
        (date) => {
            if (date) {
                setSelectedDate(date);
                onDateSelect(date);
            }
        },
        [onDateSelect],
    );

    // Handle time slot selection
    const handleTimeSlotClick = useCallback(
        (timeSlot) => {
            if (onTimeSlotSelect) {
                onTimeSlotSelect(timeSlot);
            }
        },
        [onTimeSlotSelect],
    );

    return (
        <Paper
            elevation={3}
            sx={{
                p: { xs: 1, sm: 2 },
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[3],
            }}
        >
            <CalendarHeader
                label={`${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                isMobile={isMobile}
                onPreviousMonth={goToPreviousMonth}
                onToday={goToToday}
                onNextMonth={goToNextMonth}
            />

            <CalendarGrid
                calendarData={calendarData}
                isSelected={isSelected}
                isToday={isTodayFn}
                hasTimeSlots={hasTimeSlots}
                hasActiveTimeSlots={hasActiveTimeSlots}
                countTimeSlots={countTimeSlots}
                onDayClick={handleDayClick}
            />

            {selectedDate && (
                <SelectedDaySlots
                    selectedDate={selectedDate}
                    timeSlots={selectedDateTimeSlots}
                    onTimeSlotClick={handleTimeSlotClick}
                    onTimeSlotEdit={onTimeSlotEdit}
                    onTimeSlotDelete={onTimeSlotDelete}
                    canViewPatient={canViewPatient}
                    canViewConsultation={canViewConsultation}
                    canConvertToPatient={canConvertToPatient}
                    canEditTimeSlot={canEditTimeSlot}
                    canDeleteTimeSlot={canDeleteTimeSlot}
                    canDeleteConsultantReserve={canDeleteConsultantReserve}
                />
            )}
        </Paper>
    );
};

export default TimeCalendar;
