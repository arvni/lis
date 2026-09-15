import React, { useMemo } from 'react';
import {
    Alert,
    Box,
    Divider,
    FormControlLabel,
    Paper,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { CheckCircle, EventNote, Schedule } from '@mui/icons-material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const sectionSx = { p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0' };

export const DEFAULT_HOURS = { start_time: '08:00', end_time: '16:00' };

const toPickerValue = (time) => (time ? dayjs(`2000-01-01T${time}`) : null);

/**
 * `days` only ever holds the working weekdays, ordered by weekday: exactly what the API takes.
 * A day switched on copies the hours of the last working day, so a regular week is quick to fill.
 */
export const setWorking = (days, weekday, working) => {
    const others = days.filter((day) => day.weekday !== weekday);
    if (!working) return others;

    const template = others.at(-1) ?? DEFAULT_HOURS;

    return [
        ...others,
        { weekday, start_time: template.start_time, end_time: template.end_time },
    ].sort((a, b) => a.weekday - b.weekday);
};

export const setDayTime = (days, weekday, field, time) =>
    days.map((day) => (day.weekday === weekday ? { ...day, [field]: time } : day));

const SectionTitle = ({ icon, children }) => (
    <>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {icon}
            {children}
        </Typography>
        <Divider sx={{ mb: 3 }} />
    </>
);

const ShiftForm = ({ open, onClose, defaultValue, weekdays }) => {
    const url = defaultValue?.id
        ? route('attendance.shifts.update', defaultValue.id)
        : route('attendance.shifts.store');

    // FormProvider resets the form whenever this object changes, so keep it stable across renders.
    const defaultData = useMemo(
        () => ({
            name: '',
            description: '',
            is_active: true,
            days: [],
            ...defaultValue,
        }),
        [defaultValue],
    );

    return (
        <FormProvider
            onClose={onClose}
            defaultValue={defaultData}
            open={open}
            url={url}
            maxWidth="md"
            generalTitle="Shift"
        >
            <FormContent weekdays={weekdays} />
        </FormProvider>
    );
};

const FormContent = ({ weekdays }) => {
    const { data, setData, errors } = useFormState();
    const days = data.days ?? [];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData((prevState) => ({ ...prevState, [name]: type === 'checkbox' ? checked : value }));
    };

    const updateDays = (update) =>
        setData((prevState) => ({ ...prevState, days: update(prevState.days ?? []) }));

    // Errors come back keyed by the position in `days`, not by weekday.
    const dayError = (weekday, field) => {
        const index = days.findIndex((day) => day.weekday === weekday);
        return index === -1 ? undefined : errors?.[`days.${index}.${field}`];
    };

    // Only store complete times: a half-typed value must not wipe what is in the field.
    const handleTimeChange = (weekday, field) => (value) => {
        if (value === null) {
            updateDays((current) => setDayTime(current, weekday, field, ''));
        } else if (value.isValid()) {
            updateDays((current) => setDayTime(current, weekday, field, value.format('HH:mm')));
        }
    };

    const renderTimePicker = (day, field, label) => {
        const error = dayError(day.weekday, field);

        return (
            <TimePicker
                label={label}
                ampm={false}
                value={toPickerValue(day[field])}
                onChange={handleTimeChange(day.weekday, field)}
                slotProps={{
                    textField: { size: 'small', fullWidth: true, error: !!error, helperText: error },
                }}
            />
        );
    };

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Paper elevation={0} sx={sectionSx}>
                <SectionTitle icon={<EventNote sx={{ mr: 1 }} />}>Shift</SectionTitle>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Name"
                            name="name"
                            fullWidth
                            required
                            error={!!errors?.name}
                            helperText={errors?.name || 'e.g. Morning shift'}
                            onChange={handleChange}
                            value={data.name ?? ''}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!data?.is_active}
                                    onChange={handleChange}
                                    name="is_active"
                                    color="success"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CheckCircle
                                        fontSize="small"
                                        color={data?.is_active ? 'success' : 'disabled'}
                                        sx={{ mr: 1 }}
                                    />
                                    <Typography>
                                        {data?.is_active
                                            ? 'Active'
                                            : 'Inactive — cannot be assigned to users'}
                                    </Typography>
                                </Box>
                            }
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Description"
                            name="description"
                            fullWidth
                            multiline
                            minRows={2}
                            error={!!errors?.description}
                            helperText={errors?.description}
                            onChange={handleChange}
                            value={data.description ?? ''}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper elevation={0} sx={{ ...sectionSx, mb: 0 }}>
                <SectionTitle icon={<Schedule sx={{ mr: 1 }} />}>Weekly Hours</SectionTitle>

                <Alert severity="info" sx={{ mb: 2 }}>
                    These hours repeat every week. A day that is switched off is a day off. Hours
                    end on the day they start.
                </Alert>
                {errors?.days && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.days}
                    </Alert>
                )}

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    {weekdays.map(({ value, label }) => {
                        const day = days.find((item) => item.weekday === value);

                        return (
                            <Grid
                                container
                                spacing={2}
                                alignItems="center"
                                key={value}
                                sx={{ mb: 1.5 }}
                            >
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={!!day}
                                                onChange={(e) => {
                                                    // Read it now: the updater runs after React has reset the controlled input.
                                                    const { checked } = e.target;
                                                    updateDays((current) =>
                                                        setWorking(current, value, checked),
                                                    );
                                                }}
                                            />
                                        }
                                        label={label}
                                    />
                                </Grid>
                                {day ? (
                                    <>
                                        <Grid size={{ xs: 6, sm: 4 }}>
                                            {renderTimePicker(day, 'start_time', 'Start')}
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 4 }}>
                                            {renderTimePicker(day, 'end_time', 'End')}
                                        </Grid>
                                    </>
                                ) : (
                                    <Grid size={{ xs: 12, sm: 8 }}>
                                        <Typography color="text.secondary">Day off</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        );
                    })}
                </LocalizationProvider>
            </Paper>
        </Box>
    );
};

export default ShiftForm;
