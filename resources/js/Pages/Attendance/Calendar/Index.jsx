import { useCallback, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Box, Button, Chip, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import SelectSearch from '@/Components/SelectSearch';
import { DAY_NAMES, buildCalendarDays } from '@/Components/Calendar/monthGrid';
import { STATUS_COLORS, formatMinutes } from '@/Pages/Attendance/Days/attendanceFormat';
import DayDialog from './Components/DayDialog';

/** "YYYY-MM" moved by whole months. */
export const shiftMonth = (month, delta) => {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(year, monthNumber - 1 + delta, 1);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/** The one line that says what a day is: what happened if recorded, otherwise what was planned. */
export const dayHeadline = (day) => {
    if (day.attendance) {
        return {
            label: day.attendance.status_label,
            color: STATUS_COLORS[day.attendance.status] ?? 'default',
            variant: 'filled',
        };
    }
    if (day.holiday) return { label: day.holiday, color: 'info', variant: 'filled' };
    if (day.leaves.some((leave) => leave.type === 'DAILY' && leave.status === 'APPROVED')) {
        return { label: 'On leave', color: 'secondary', variant: 'filled' };
    }
    if (day.scheduled_start) {
        return {
            label: day.is_future || day.is_today ? 'Scheduled' : 'No record',
            color: 'default',
            variant: 'outlined',
        };
    }

    return { label: 'Day off', color: 'default', variant: 'outlined' };
};

const leaveLabel = (leave) => {
    const when = leave.type === 'HOURLY' ? ` ${leave.start_time}–${leave.end_time}` : '';
    const pending = leave.status === 'PENDING' ? ' (pending)' : '';

    return `${leave.kind}${when}${pending}`;
};

const TOTALS = [
    { key: 'scheduled_minutes', label: 'Scheduled' },
    { key: 'worked_minutes', label: 'Worked' },
    { key: 'late_minutes', label: 'Late' },
    { key: 'early_leave_minutes', label: 'Left early' },
    { key: 'leave_minutes', label: 'On leave' },
];

const DAY_COUNTS = [
    { key: 'present_days', label: 'Days present' },
    { key: 'absent_days', label: 'Days absent' },
    { key: 'leave_days', label: 'Days on leave' },
    { key: 'corrected_days', label: 'Days corrected' },
];

const DayCell = ({ day, onOpen }) => {
    const headline = dayHeadline(day);
    const attendance = day.attendance;
    const isWorkingDay = !!day.scheduled_start && !day.holiday;
    const openable = !!attendance;

    return (
        <Box
            data-testid={`day-${day.day}`}
            role={openable ? 'button' : undefined}
            tabIndex={openable ? 0 : undefined}
            aria-label={openable ? `Open ${day.date}` : undefined}
            onClick={openable ? () => onOpen(day) : undefined}
            onKeyDown={
                openable
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') onOpen(day);
                      }
                    : undefined
            }
            sx={{
                minHeight: 124,
                p: 0.75,
                border: '1px solid',
                borderColor: day.is_today ? 'primary.main' : 'divider',
                borderRadius: 1,
                bgcolor: isWorkingDay ? 'background.paper' : 'action.hover',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                cursor: openable ? 'pointer' : 'default',
                '&:hover': openable ? { borderColor: 'primary.light', boxShadow: 1 } : undefined,
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: day.is_today ? 700 : 500,
                            color: day.is_today ? 'primary.main' : 'text.primary',
                        }}
                    >
                        {day.day}
                    </Typography>
                    {day.changes.length > 0 && (
                        <Tooltip title={`Changed ${day.changes.length} time(s)`}>
                            <HistoryIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        </Tooltip>
                    )}
                </Box>
                {day.scheduled_start && (
                    <Tooltip title={day.shift?.name ?? ''}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {day.scheduled_start}–{day.scheduled_end}
                        </Typography>
                    </Tooltip>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                <Chip
                    size="small"
                    label={headline.label}
                    color={headline.color}
                    variant={headline.variant}
                    sx={{ height: 20, fontSize: '0.7rem', maxWidth: '100%' }}
                />
                {attendance?.is_manual && (
                    <Chip
                        size="small"
                        variant="outlined"
                        label="Corrected"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                )}
            </Box>

            {attendance?.check_in && (
                <Typography variant="caption">
                    In {attendance.check_in}
                    {attendance.check_out ? ` · Out ${attendance.check_out}` : ''}
                </Typography>
            )}
            {attendance?.worked_minutes > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Worked {formatMinutes(attendance.worked_minutes)}
                </Typography>
            )}
            {attendance?.late_minutes > 0 && (
                <Typography variant="caption" sx={{ color: 'warning.main' }}>
                    Late {formatMinutes(attendance.late_minutes)}
                </Typography>
            )}
            {attendance?.early_leave_minutes > 0 && (
                <Typography variant="caption" sx={{ color: 'warning.main' }}>
                    Left {formatMinutes(attendance.early_leave_minutes)} early
                </Typography>
            )}
            {day.leaves.map((leave) => (
                <Chip
                    key={leave.id}
                    size="small"
                    color="secondary"
                    variant={leave.status === 'APPROVED' ? 'filled' : 'outlined'}
                    label={leaveLabel(leave)}
                    sx={{ height: 20, fontSize: '0.7rem', maxWidth: '100%' }}
                />
            ))}
        </Box>
    );
};

const CalendarIndex = () => {
    const { person, calendar, canViewOthers, canCorrect, canExportAll } = usePage().props;
    const [year, monthNumber] = calendar.month.split('-').map(Number);
    const cells = buildCalendarDays(year, monthNumber - 1);
    const [openDate, setOpenDate] = useState(null);
    // Read from the latest props, so the dialog shows a correction as soon as the page reloads.
    const openDay = calendar.days.find((day) => day.date === openDate) ?? null;

    const visit = useCallback(
        (userId, month) =>
            router.visit(route('attendance.calendar.index'), {
                data: { user_id: userId, month },
                preserveScroll: true,
            }),
        [],
    );

    return (
        <>
            <Head title={`Calendar · ${person.name}`} />
            <PageHeader
                title="Attendance Calendar"
                subtitle={`${person.name} · shift hours, leave and what the doors recorded`}
                actions={
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Button
                            startIcon={<DownloadIcon />}
                            variant="outlined"
                            color="success"
                            component="a"
                            href={route('attendance.calendar.export', {
                                user_id: person.id,
                                month: calendar.month,
                            })}
                        >
                            Export month
                        </Button>
                        {canExportAll && (
                            <Button
                                startIcon={<DownloadIcon />}
                                variant="outlined"
                                component="a"
                                href={route('attendance.calendar.export-summary', {
                                    month: calendar.month,
                                })}
                            >
                                Export all staff
                            </Button>
                        )}
                    </Box>
                }
            />

            <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                    {canViewOthers && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SelectSearch
                                name="person"
                                label="Person"
                                size="small"
                                fullWidth
                                value={person}
                                url={route('api.attendance.calendar-people.list')}
                                onChange={(e) =>
                                    e.target.value && visit(e.target.value.id, calendar.month)
                                }
                            />
                        </Grid>
                    )}
                    <Grid size={{ xs: 12, md: canViewOthers ? 8 : 12 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: { xs: 'space-between', md: 'flex-end' },
                                gap: 1,
                            }}
                        >
                            <IconButton
                                aria-label="Previous month"
                                onClick={() => visit(person.id, shiftMonth(calendar.month, -1))}
                            >
                                <ChevronLeftIcon />
                            </IconButton>
                            <Typography variant="h6" sx={{ minWidth: 170, textAlign: 'center' }}>
                                {calendar.label}
                            </Typography>
                            <IconButton
                                aria-label="Next month"
                                onClick={() => visit(person.id, shiftMonth(calendar.month, 1))}
                            >
                                <ChevronRightIcon />
                            </IconButton>
                            <Button variant="outlined" size="small" onClick={() => visit(person.id)}>
                                This month
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {TOTALS.map((total) => (
                    <Grid key={total.key} size={{ xs: 6, sm: 4, md: 'grow' }}>
                        <Paper
                            elevation={0}
                            sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}
                        >
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {total.label}
                            </Typography>
                            <Typography variant="h6">
                                {formatMinutes(calendar.totals[total.key])}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
                {DAY_COUNTS.map((count) => (
                    <Grid key={count.key} size={{ xs: 6, sm: 3, md: 'grow' }}>
                        <Paper
                            elevation={0}
                            sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}
                        >
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {count.label}
                            </Typography>
                            <Typography variant="h6">{calendar.totals[count.key]}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>
                    Click a recorded day to see its change history
                    {canCorrect ? ' or correct its times' : ''}.
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ minWidth: 840 }}>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: '6px',
                                mb: '6px',
                            }}
                        >
                            {DAY_NAMES.map((name) => (
                                <Typography
                                    key={name}
                                    variant="caption"
                                    sx={{
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        color: 'text.secondary',
                                    }}
                                >
                                    {name}
                                </Typography>
                            ))}
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                            {cells.map((dayNumber, index) =>
                                dayNumber ? (
                                    <DayCell
                                        key={dayNumber}
                                        day={calendar.days[dayNumber - 1]}
                                        onOpen={(day) => setOpenDate(day.date)}
                                    />
                                ) : (
                                    <Box key={`blank-${index}`} data-testid="blank-cell" />
                                ),
                            )}
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {openDay?.attendance && (
                <DayDialog
                    day={openDay}
                    person={person}
                    canCorrect={canCorrect}
                    onClose={() => setOpenDate(null)}
                />
            )}
        </>
    );
};

const breadcrumbs = [
    {
        title: 'Dashboard',
        link: route('dashboard'),
        icon: null,
    },
    {
        title: 'Attendance Calendar',
        link: null,
        icon: null,
    },
];

CalendarIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default CalendarIndex;
