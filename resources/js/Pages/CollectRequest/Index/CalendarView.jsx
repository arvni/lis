import React, { useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Box, Typography, Chip, Paper, IconButton, Tooltip, Stack } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { STATUS_COLORS, fmtDateTime, buildCalendarDays, DAY_NAMES, MONTH_NAMES } from './constants';

function CalendarView({ calendarEvents, calendarMonth, onMonthChange }) {
    const [year, month] = calendarMonth.split('-').map(Number);
    const jsMonth = month - 1; // 0-based

    const eventsByDay = useMemo(() => {
        const map = {};
        (calendarEvents || []).forEach((ev) => {
            const d = new Date(ev.preferred_date);
            const day = d.getDate();
            if (!map[day]) map[day] = [];
            map[day].push(ev);
        });
        return map;
    }, [calendarEvents]);

    const cells = buildCalendarDays(year, jsMonth);

    const prevMonth = () => {
        const d = new Date(year, jsMonth - 1, 1);
        onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };
    const nextMonth = () => {
        const d = new Date(year, jsMonth + 1, 1);
        onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === jsMonth;

    return (
        <Paper sx={{ p: 2 }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <IconButton onClick={prevMonth} size="small">
                    <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h6" fontWeight="bold">
                    {MONTH_NAMES[jsMonth]} {year}
                </Typography>
                <IconButton onClick={nextMonth} size="small">
                    <ChevronRightIcon />
                </IconButton>
            </Box>

            {/* Day-of-week headers */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '4px',
                    mb: '4px',
                }}
            >
                {DAY_NAMES.map((d) => (
                    <Box key={d} sx={{ textAlign: 'center', py: '4px' }}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary">
                            {d}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Calendar grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {cells.map((day, idx) => {
                    const isToday = isCurrentMonth && day === today.getDate();
                    const events = day ? eventsByDay[day] || [] : [];
                    return (
                        <Box
                            key={idx}
                            sx={{
                                minHeight: 90,
                                border: '1px solid',
                                borderColor: isToday ? 'primary.main' : 'divider',
                                borderRadius: 1,
                                p: '4px',
                                bgcolor: day
                                    ? isToday
                                        ? 'primary.50'
                                        : 'background.paper'
                                    : 'action.hover',
                            }}
                        >
                            {day && (
                                <>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: isToday ? 'bold' : 'normal',
                                            color: isToday ? 'primary.main' : 'text.primary',
                                            display: 'block',
                                            mb: '2px',
                                        }}
                                    >
                                        {day}
                                    </Typography>
                                    <Stack spacing={'2px'}>
                                        {events.map((ev) => (
                                            <Tooltip
                                                key={ev.id}
                                                title={
                                                    <Box>
                                                        <Typography
                                                            variant="caption"
                                                            display="block"
                                                        >
                                                            <strong>#{ev.id}</strong> —{' '}
                                                            {ev.referrer?.fullName || '—'}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            display="block"
                                                        >
                                                            Collector:{' '}
                                                            {ev.sample_collector?.name || '—'}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            display="block"
                                                        >
                                                            Preferred:{' '}
                                                            {new Date(
                                                                ev.preferred_date,
                                                            ).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </Typography>
                                                        {ev.logistic_information?.started_at && (
                                                            <Typography
                                                                variant="caption"
                                                                display="block"
                                                            >
                                                                Started:{' '}
                                                                {fmtDateTime(
                                                                    ev.logistic_information
                                                                        .started_at,
                                                                )}
                                                            </Typography>
                                                        )}
                                                        {ev.logistic_information?.ended_at && (
                                                            <Typography
                                                                variant="caption"
                                                                display="block"
                                                            >
                                                                Ended:{' '}
                                                                {fmtDateTime(
                                                                    ev.logistic_information
                                                                        .ended_at,
                                                                )}
                                                            </Typography>
                                                        )}
                                                        {ev.note && (
                                                            <Typography
                                                                variant="caption"
                                                                display="block"
                                                            >
                                                                Note: {ev.note}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                                arrow
                                            >
                                                <Chip
                                                    label={`#${ev.id} ${ev.referrer?.fullName?.split(' ')[0] || ''}`}
                                                    size="small"
                                                    color={STATUS_COLORS[ev.status] || 'default'}
                                                    onClick={() =>
                                                        router.visit(
                                                            route('collect-requests.show', ev.id),
                                                        )
                                                    }
                                                    sx={{
                                                        fontSize: '0.65rem',
                                                        height: 18,
                                                        cursor: 'pointer',
                                                        width: '100%',
                                                        '& .MuiChip-label': {
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        },
                                                    }}
                                                />
                                            </Tooltip>
                                        ))}
                                    </Stack>
                                </>
                            )}
                        </Box>
                    );
                })}
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <Chip
                        key={status}
                        label={status.replace('_', ' ')}
                        size="small"
                        color={color}
                        variant="outlined"
                    />
                ))}
            </Box>
        </Paper>
    );
}

export default CalendarView;
