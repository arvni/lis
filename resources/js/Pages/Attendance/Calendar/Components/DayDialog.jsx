import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography,
} from '@mui/material';

import CorrectionForm from '@/Pages/Attendance/Days/Components/CorrectionForm';
import { STATUS_COLORS, formatMinutes } from '@/Pages/Attendance/Days/attendanceFormat';

const valueChange = (label, before, after) =>
    (before ?? '—') === (after ?? '—') ? null : `${label} ${before ?? '—'} → ${after ?? '—'}`;

/** What a change did, in one line: only the parts that moved. */
export const describeChange = (change) => {
    if (!change.after) return 'Day removed: no shift or punches left for it';

    const parts = [
        valueChange('In', change.before?.check_in, change.after.check_in),
        valueChange('Out', change.before?.check_out, change.after.check_out),
        valueChange('Status', change.before?.status_label, change.after.status_label),
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : 'Times unchanged';
};

const DayDialog = ({ day, person, canCorrect = false, onClose }) => {
    const [correcting, setCorrecting] = useState(false);
    const attendance = day.attendance;

    const handleReset = () =>
        router.put(
            route('attendance.days.reset', attendance.id),
            {},
            { preserveScroll: true, onSuccess: onClose },
        );

    // The correction form takes a Daily Attendance row; the calendar day has the same facts.
    const correctionDay = {
        id: attendance.id,
        user: person,
        date: day.date,
        weekday: day.weekday,
        shift: day.shift,
        scheduled_start: day.scheduled_start,
        scheduled_end: day.scheduled_end,
        check_in: attendance.check_in,
        check_out: attendance.check_out,
    };

    if (correcting) {
        return <CorrectionForm open day={correctionDay} onClose={onClose} />;
    }

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {person.name} · {day.weekday} {day.date}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                        <Chip
                            size="small"
                            color={STATUS_COLORS[attendance.status] ?? 'default'}
                            label={attendance.status_label}
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {day.scheduled_start
                                ? `${day.shift?.name ?? 'Shift'} ${day.scheduled_start}–${day.scheduled_end}`
                                : 'No working hours'}
                        </Typography>
                    </Box>

                    <Typography variant="body2">
                        In {attendance.check_in ?? '—'} · Out {attendance.check_out ?? '—'} · Worked{' '}
                        {formatMinutes(attendance.worked_minutes)}
                    </Typography>
                    {attendance.overtime_minutes > 0 && (
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                            Overtime {formatMinutes(attendance.overtime_minutes)}
                        </Typography>
                    )}
                    {(attendance.late_minutes > 0 || attendance.early_leave_minutes > 0) && (
                        <Typography variant="body2" sx={{ color: 'warning.main' }}>
                            Late {formatMinutes(attendance.late_minutes)} · Left early{' '}
                            {formatMinutes(attendance.early_leave_minutes)}
                        </Typography>
                    )}

                    {attendance.is_manual && (
                        <Alert severity="info">
                            Corrected by hand{attendance.note ? `: ${attendance.note}` : ''}. The
                            scheduled job leaves this day alone.
                        </Alert>
                    )}

                    <Divider />

                    <Typography variant="subtitle2">Change history</Typography>
                    {day.changes.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No changes: these are the times the doors recorded.
                        </Typography>
                    ) : (
                        <List dense disablePadding>
                            {day.changes.map((change) => (
                                <ListItem key={change.id} disableGutters alignItems="flex-start">
                                    <ListItemText
                                        primary={`${change.action_label} by ${change.by} · ${change.at}`}
                                        secondary={
                                            change.note
                                                ? `${describeChange(change)} — ${change.note}`
                                                : describeChange(change)
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Close</Button>
                {canCorrect && attendance.is_manual && (
                    <Button color="warning" onClick={handleReset}>
                        Recalculate from punches
                    </Button>
                )}
                {canCorrect && (
                    <Button variant="contained" onClick={() => setCorrecting(true)}>
                        Correct times
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default DayDialog;
