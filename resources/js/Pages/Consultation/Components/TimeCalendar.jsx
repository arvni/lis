import React, {useState, useEffect} from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid2 as Grid,
    IconButton,
    Card,
    CardContent,
    Chip,
    Button,
    Link
} from '@mui/material';
import {
    ArrowBackIos,
    ArrowForwardIos,
    Today,
    Event as EventIcon,
    Person,
    Phone,
    MedicalServices
} from '@mui/icons-material';


// Format time (HH:MM AM/PM)
const formatTime = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    return `${hours}:${minutes} ${ampm}`;
};

const TimeSlotCard = ({timeSlot, onClick, canCheckConsultation = false, canCheckPatient = false,}) => {
    return <Card
        variant="outlined"
        sx={{
            borderColor: timeSlot.active ? 'success.main' : 'divider',
        }}
    >
        <CardContent>
            {/* Title and Status */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                    {timeSlot.title}
                </Typography>
                <Chip
                    size="small"
                    label={timeSlot.active ? "Active" : "Inactive"}
                    color={timeSlot.active ? "success" : "default"}
                />
            </Box>

            {/* Time Information */}
            <Box display="flex" alignItems="center" mb={2}>
                <EventIcon fontSize="small" sx={{mr: 1, color: 'text.secondary'}}/>
                <Typography variant="body2" color="text.secondary">
                    {formatTime(timeSlot.started_at)} - {formatTime(timeSlot.ended_at)}
                </Typography>
            </Box>

            {/* Consultant Information */}
            {timeSlot.consultant && (
                <Box sx={{mb: 2, display: 'flex', alignItems: 'center'}}>
                    {timeSlot.consultant.avatar && (
                        <Box
                            component="img"
                            src={timeSlot.consultant.avatar}
                            alt={timeSlot.consultant.name}
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                mr: 1.5,
                                objectFit: 'cover'
                            }}
                        />
                    )}
                    <Box>
                        <Typography variant="body1" fontWeight="medium">
                            {timeSlot.consultant.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {timeSlot.consultant.title || 'Consultant'}
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Reservation Information */}
            {timeSlot.reservable_type && (
                <>
                    {/* Customer Reservation */}
                    {timeSlot.reservable_type === 'customer' && timeSlot.reservable && (
                        <Box sx={{
                            p: 1.5,
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                                <Person fontSize="small" sx={{mr: 1, color: 'text.secondary'}}/>
                                <Typography variant="body2" fontWeight="medium">
                                    Customer Appointment
                                </Typography>
                            </Box>

                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
                                <Typography variant="body2">
                                    Name: {timeSlot.reservable.name}
                                </Typography>
                                <Typography variant="body2">
                                    Phone: {timeSlot.reservable.phone}
                                </Typography>
                                {timeSlot.reservable.email && (
                                    <Typography variant="body2">
                                        Email: {timeSlot.reservable.email}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Consultation Reservation */}
                    {timeSlot.reservable_type === 'consultation' && timeSlot.reservable && (
                        <Box sx={{
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'primary.main'
                        }}>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 1, justifyContent: "space-between"}}>
                                <Typography variant="body2"
                                            fontWeight="medium"
                                            color="primary.dark"
                                            sx={{display: "flex", justifyContent: "flex-start", alignItems: "center"}}>
                                    <MedicalServices fontSize="small" sx={{mr: 1, color: 'primary.dark'}}/>
                                    Medical Consultation
                                </Typography>

                                {timeSlot.reservable.status && (
                                    <Chip
                                        size="small"
                                        label={timeSlot.reservable.status}
                                        color={
                                            timeSlot.reservable.status === 'completed' ? 'success' :
                                                timeSlot.reservable.status === 'pending' ? 'warning' : 'default'
                                        }
                                        sx={{ml: 1}}
                                    />
                                )}
                            </Box>

                            {timeSlot.reservable.patient && (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.5,
                                    color: 'primary.dark'
                                }}>
                                    <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                                        {timeSlot.reservable.patient.avatar && (
                                            <Box
                                                component="img"
                                                src={timeSlot.reservable.patient.avatar}
                                                alt={timeSlot.reservable.patient.fullName}
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    mr: 1.5,
                                                    objectFit: 'cover',
                                                    border: '2px solid',
                                                    borderColor: 'primary.main'
                                                }}
                                            />
                                        )}
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {timeSlot.reservable.patient.fullName}
                                            </Typography>
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                <Phone fontSize="small" sx={{mr: 0.5, fontSize: '0.875rem'}}/>
                                                <Typography variant="body2" fontSize="small">
                                                    {timeSlot.reservable.patient.phone}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {timeSlot.reservable.patient.idNo && (
                                        <Typography variant="body2">
                                            ID Number: {timeSlot.reservable.patient.idNo}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Action buttons */}
                            <Box sx={{mt: 2, display: 'flex', gap: 1}}>
                                {canCheckConsultation && <Button
                                    variant="outlined"
                                    size="small"
                                    component={Link}
                                    href={route("consultations.show", timeSlot.reservable.id)}
                                    sx={{flex: 1}}
                                >
                                    View Consultation
                                </Button>}

                                {timeSlot.reservable.patient && canCheckPatient && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        color="secondary"
                                        component={Link}
                                        href={route("patients.show", timeSlot.reservable.patient.id)}
                                        sx={{flex: 1}}
                                    >
                                        Patient Profile
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </CardContent>
    </Card>
}


// Modified TimeCalendar component with links to consultations and patients
const ModifiedTimeCalendar = ({
                                  times = [],
                                  onChange,
                                  canCheckPatient = false,
                                  canCheckConsultation = false,
                                  onSelectDate = () => null
                              }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Get days in month
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Get day of week for the first day of month (0 = Sunday, 6 = Saturday)
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    // Reordering days of week to start with Saturday
    const daysOfWeek = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Create calendar days array
    const createCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const daysInMonth = getDaysInMonth(year, month);
        let firstDayOfMonth = getFirstDayOfMonth(year, month);

        // Convert day of week to our Saturday-first system (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
        firstDayOfMonth = (firstDayOfMonth + 6) % 7;

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
    };

    // Format date as ISO string (YYYY-MM-DD)
    const formatDateISO = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Check if a date has any time slots
    const hasTimeSlots = (date) => {
        if (!date) return false;
        const dateStr = formatDateISO(date);
        return times.some(time => {
            const startDate = new Date(time.started_at);
            const formattedStartDate = formatDateISO(startDate);
            return formattedStartDate === dateStr;
        });
    };

    // Count time slots for a specific date
    const countTimeSlots = (date) => {
        if (!date) return 0;
        const dateStr = formatDateISO(date);
        return times.filter(time => {
            const startDate = new Date(time.started_at);
            const formattedStartDate = formatDateISO(startDate);
            return formattedStartDate === dateStr;
        }).length;
    };

    // Check if date has any active time slots
    const hasActiveTimeSlots = (date) => {
        if (!date) return false;
        const dateStr = formatDateISO(date);
        return times.some(time => {
            const startDate = new Date(time.started_at);
            const formattedStartDate = formatDateISO(startDate);
            return formattedStartDate === dateStr && time.active;
        });
    };

    // Get time slots for the selected date
    const getSelectedDateTimeSlots = () => {
        if (!selectedDate) return [];
        const dateStr = formatDateISO(selectedDate);
        return times.filter(time => {
            const startDate = new Date(time.started_at);
            const formattedStartDate = formatDateISO(startDate);
            return formattedStartDate === dateStr;
        });
    };


    // Format date (Day, Month DD, YYYY)
    const formatDate = (date) => {
        if (!date) return '';
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const weekday = daysOfWeek[date.getDay()];
        return `${weekday}, ${month} ${day}, ${year}`;
    };

    // Handle month navigation
    const goToPreviousMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
        setSelectedDate(null)
        // Call onChange with new month range
        if (onChange) {
            const year = newDate.getFullYear();
            const month = newDate.getMonth();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            onChange(startDate, endDate);

        }
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
        setSelectedDate(null);

        // Call onChange with new month range
        if (onChange) {
            const year = newDate.getFullYear();
            const month = newDate.getMonth();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            onChange(startDate, endDate);
        }
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);

        // Call onChange with current month range
        if (onChange) {
            const year = today.getFullYear();
            const month = today.getMonth();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            onChange(startDate, endDate);
        }
    };

    // Handle day selection
    const handleDayClick = (date) => {
        if (date) {
            setSelectedDate(date);
            onSelectDate(date);
        }
    };

    // Get calendar days
    const days = createCalendarDays();

    // Get selected date time slots
    const selectedDateTimeSlots = getSelectedDateTimeSlots();

    // Check if date is today
    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Check if date is selected
    const isSelected = (date) => {
        if (!date || !selectedDate) return false;
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    const handleTimeSlotClick = () => {

    }

    return (
        <Paper elevation={3} sx={{p: 2}}>
            <Box sx={{mb: 2}}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h5">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <IconButton onClick={goToPreviousMonth}>
                            <ArrowBackIos/>
                        </IconButton>
                        <IconButton onClick={goToToday}>
                            <Today/>
                        </IconButton>
                        <IconButton onClick={goToNextMonth}>
                            <ArrowForwardIos/>
                        </IconButton>
                    </Grid>
                </Grid>
            </Box>

            <Grid container spacing={3}>
                {/* Calendar */}
                <Grid size={{xs: 12}}>
                    <Box sx={{mb: 2}}>
                        <Grid container>
                            {/* Days of week header */}
                            {daysOfWeek.map((day, index) => (
                                <Grid key={index} size={12 / 7}>
                                    <Box
                                        sx={{
                                            textAlign: 'center',
                                            py: 1,
                                            fontWeight: 'bold',
                                            color: 'text.secondary'
                                        }}
                                    >
                                        {day}
                                    </Box>
                                </Grid>
                            ))}

                            {/* Calendar days */}
                            {days.map((dayObj, index) => (
                                <Grid item key={index} size={12 / 7}>
                                    <Box
                                        sx={{
                                            height: 50,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: dayObj.day ? 'pointer' : 'default',
                                            borderRadius: 1,
                                            position: 'relative',
                                            bgcolor: isSelected(dayObj.date) ? 'primary.main' :
                                                isToday(dayObj.date) ? 'primary.light' : 'transparent',
                                            color: isSelected(dayObj.date) ? 'primary.contrastText' :
                                                isToday(dayObj.date) ? 'primary.contrastText' : 'text.primary',
                                            '&:hover': {
                                                bgcolor: dayObj.day ?
                                                    (isSelected(dayObj.date) ? 'primary.dark' : 'action.hover') :
                                                    'transparent'
                                            }
                                        }}
                                        onClick={() => handleDayClick(dayObj.date)}
                                    >
                                        {dayObj.day && (
                                            <>
                                                <Typography variant="body2">
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
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: '50%',
                                                                bgcolor: hasActiveTimeSlots(dayObj.date) ? 'success.main' : 'grey.400'
                                                            }}
                                                        />
                                                        {countTimeSlots(dayObj.date) > 1 && (
                                                            <Box
                                                                sx={{
                                                                    width: 6,
                                                                    height: 6,
                                                                    borderRadius: '50%',
                                                                    bgcolor: hasActiveTimeSlots(dayObj.date) ? 'success.main' : 'grey.400',
                                                                    ml: 0.5
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
                </Grid>

                {/* Time slots for selected date */}
                {selectedDate && <Grid size={{xs: 12}}>
                    <Paper elevation={1} sx={{p: 2, height: '100%', bgcolor: 'background.default'}}>
                        <Typography variant="h6" gutterBottom>
                            {formatDate(selectedDate)}
                        </Typography>

                        {selectedDateTimeSlots.length > 0 ? (
                            <Grid container spacing={2}>
                                {selectedDateTimeSlots.map((timeSlot) => (
                                    <Grid size={{xs: 12, sm: 6, md: 4}} key={timeSlot.id}>
                                        <TimeSlotCard timeSlot={timeSlot}
                                                      onClick={handleTimeSlotClick}
                                                      canCheckPatient={canCheckPatient}
                                                      canCheckConsultation={canCheckConsultation}/>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography variant="body1" color="text.secondary" sx={{mt: 2}}>
                                No time slots scheduled for this day
                            </Typography>
                        )}
                    </Paper>
                </Grid>}
            </Grid>
        </Paper>
    );
};

export default ModifiedTimeCalendar;
