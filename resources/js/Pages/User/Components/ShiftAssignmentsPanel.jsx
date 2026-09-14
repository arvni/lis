import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import SelectSearch from '@/Components/SelectSearch';

const NETWORK_ERROR = 'The change could not be saved. Check your connection and try again.';

/**
 * Shift history for one user. Saves on its own, separately from the user form above it.
 */
const ShiftAssignmentsPanel = ({ userId }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shift, setShift] = useState(null);
    const [effectiveFrom, setEffectiveFrom] = useState(() => dayjs().format('YYYY-MM-DD'));
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);

    const load = useCallback(
        () =>
            axios
                .get(route('api.attendance.users.shift-assignments.index', userId))
                .then((response) => setAssignments(response.data.data))
                .finally(() => setLoading(false)),
        [userId],
    );

    useEffect(() => {
        load();
    }, [load]);

    const showFailure = (error) => {
        const data = error.response?.data;
        setErrors(data?.errors ?? {});
        setMessage(data?.message ?? NETWORK_ERROR);
    };

    const handleAssign = () => {
        setSaving(true);
        setErrors({});
        setMessage(null);
        axios
            .post(route('api.attendance.users.shift-assignments.store', userId), {
                shift_id: shift?.id ?? null,
                effective_from: effectiveFrom,
            })
            .then(() => {
                setShift(null);
                return load();
            })
            .catch(showFailure)
            .finally(() => setSaving(false));
    };

    const handleRemove = (assignment) => () => {
        setErrors({});
        setMessage(null);
        axios
            .delete(route('api.attendance.users.shift-assignments.destroy', [userId, assignment.id]))
            .then(load)
            .catch(showFailure);
    };

    const handleDateChange = (value) => {
        if (value === null) {
            setEffectiveFrom('');
        } else if (value.isValid()) {
            setEffectiveFrom(value.format('YYYY-MM-DD'));
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
                Shift
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The shift decides which hours count as working time. A new shift starts on its date
                and ends the previous one the day before. Changes here save straight away.
            </Typography>

            {message && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                    {message}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={28} />
                </Box>
            ) : assignments.length === 0 ? (
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    No shift assigned yet. Without a shift, every day counts as a day off.
                </Typography>
            ) : (
                <Box sx={{ overflowX: 'auto', mb: 3 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Shift</TableCell>
                                <TableCell>From</TableCell>
                                <TableCell>To</TableCell>
                                <TableCell />
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {assignments.map((assignment, index) => (
                                <TableRow key={assignment.id}>
                                    <TableCell>{assignment.shift?.name}</TableCell>
                                    <TableCell>{assignment.effective_from}</TableCell>
                                    <TableCell>{assignment.effective_to ?? 'Ongoing'}</TableCell>
                                    <TableCell>
                                        {assignment.is_current && (
                                            <Chip
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                                label="Current"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        {index === 0 && (
                                            <Tooltip title="Remove this assignment. The shift before it runs on again.">
                                                <IconButton
                                                    size="small"
                                                    aria-label={`Remove ${assignment.shift?.name ?? 'assignment'}`}
                                                    onClick={handleRemove(assignment)}
                                                >
                                                    <DeleteIcon fontSize="small" color="error" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}

            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid container spacing={2} alignItems="flex-start">
                    <Grid size={{ xs: 12, sm: 5 }}>
                        <SelectSearch
                            name="shift"
                            label="Shift"
                            fullWidth
                            value={shift}
                            onChange={(e) => setShift(e.target.value)}
                            url={route('api.attendance.shifts.list')}
                            error={Boolean(errors.shift_id)}
                            helperText={errors.shift_id?.[0] ?? 'Active shifts only'}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <DatePicker
                            label="Starts on"
                            value={effectiveFrom ? dayjs(effectiveFrom) : null}
                            onChange={handleDateChange}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    error: Boolean(errors.effective_from),
                                    helperText: errors.effective_from?.[0],
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            sx={{ height: 56 }}
                            onClick={handleAssign}
                            disabled={saving || !shift || !effectiveFrom}
                            startIcon={
                                saving ? <CircularProgress size={20} color="inherit" /> : null
                            }
                        >
                            Assign shift
                        </Button>
                    </Grid>
                </Grid>
            </LocalizationProvider>
        </Paper>
    );
};

ShiftAssignmentsPanel.propTypes = {
    userId: PropTypes.number.isRequired,
};

export default ShiftAssignmentsPanel;
