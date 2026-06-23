import { Box, Typography } from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TuneIcon from '@mui/icons-material/Tune';

export const PERIODS = [
    { key: 'today', label: 'Today', icon: <TodayIcon fontSize="small" /> },
    { key: 'week', label: 'This Week', icon: <DateRangeIcon fontSize="small" /> },
    { key: 'month', label: 'This Month', icon: <CalendarMonthIcon fontSize="small" /> },
    { key: 'year', label: 'This Year', icon: <CalendarTodayIcon fontSize="small" /> },
    { key: 'custom', label: 'Custom', icon: <TuneIcon fontSize="small" /> },
];

export const Field = ({ label, children }) => (
    <Box sx={{ py: 0.75 }}>
        <Typography variant="caption" color="text.secondary" display="block">
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} component="div">
            {children ?? '—'}
        </Typography>
    </Box>
);

export const formatTime = (ts, tz) =>
    ts ? new Date(ts * 1000).toLocaleString([], { timeZone: tz }) : '—';

export const tickFormatter = (ts, period, tz) => {
    const d = new Date(ts * 1000);
    if (period === 'year' || period === 'month')
        return d.toLocaleDateString([], { timeZone: tz, month: 'short', day: 'numeric' });
    if (period === 'week')
        return d.toLocaleString([], {
            timeZone: tz,
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    return d.toLocaleTimeString([], { timeZone: tz, hour: '2-digit', minute: '2-digit' });
};
