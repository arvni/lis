import React from 'react';
import { Box, Typography, Grid, useTheme } from '@mui/material';
import { DAYS_OF_WEEK } from './constants';

const CalendarGrid = ({
    calendarData,
    isSelected,
    isToday,
    hasTimeSlots,
    hasActiveTimeSlots,
    countTimeSlots,
    onDayClick,
}) => {
    const theme = useTheme();

    return (
        <Box sx={{ mb: 3 }}>
            <Grid container>
                {/* Days of week header */}
                {DAYS_OF_WEEK.map((day, index) => (
                    <Grid size={12 / 7} key={`header-${index}`}>
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: 1,
                                fontWeight: 'bold',
                                color: 'text.secondary',
                                borderBottom: 1,
                                borderColor: 'divider',
                            }}
                        >
                            {day}
                        </Box>
                    </Grid>
                ))}

                {/* Calendar days */}
                {calendarData.map((dayObj, index) => (
                    <Grid size={12 / 7} key={`day-${index}`}>
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
                                color:
                                    isSelected(dayObj.date) || isToday(dayObj.date)
                                        ? theme.palette.primary.contrastText
                                        : theme.palette.text.primary,
                                '&:hover': {
                                    backgroundColor: dayObj.day
                                        ? isSelected(dayObj.date)
                                            ? theme.palette.primary.dark
                                            : theme.palette.action.hover
                                        : 'transparent',
                                    transform: dayObj.day ? 'scale(1.05)' : 'none',
                                },
                            }}
                            onClick={() => dayObj.day && onDayClick(dayObj.date)}
                        >
                            {dayObj.day && (
                                <>
                                    <Typography
                                        variant="body2"
                                        fontWeight={
                                            isToday(dayObj.date) || isSelected(dayObj.date)
                                                ? 'bold'
                                                : 'normal'
                                        }
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
                                                gap: 0.5,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    backgroundColor: hasActiveTimeSlots(dayObj.date)
                                                        ? theme.palette.success.main
                                                        : theme.palette.grey[400],
                                                }}
                                            />
                                            {countTimeSlots(dayObj.date) > 1 && (
                                                <Box
                                                    sx={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        backgroundColor: hasActiveTimeSlots(
                                                            dayObj.date,
                                                        )
                                                            ? theme.palette.success.main
                                                            : theme.palette.grey[400],
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
    );
};

export default CalendarGrid;
