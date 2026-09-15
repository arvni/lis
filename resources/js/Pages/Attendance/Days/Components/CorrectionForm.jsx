import React, { useMemo } from 'react';
import { Alert, Box, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const toPickerValue = (time) => (time ? dayjs(`2000-01-01T${time}`) : null);

export const describeDay = (day) => {
    const schedule = day.scheduled_start
        ? `${day.shift?.name ?? 'Shift'} ${day.scheduled_start}–${day.scheduled_end}`
        : 'no working hours';

    return `${day.user?.name ?? ''} · ${day.weekday} ${day.date} · ${schedule}`;
};

const CorrectionForm = ({ open, onClose, day }) => {
    // FormProvider resets the form whenever this object changes, so keep it stable across renders.
    const defaultData = useMemo(
        () => ({
            id: day.id,
            _method: 'put',
            check_in: day.check_in ?? '',
            check_out: day.check_out ?? '',
            note: '',
        }),
        [day],
    );

    return (
        <FormProvider
            open={open}
            onClose={onClose}
            url={route('attendance.days.update', day.id)}
            defaultValue={defaultData}
            generalTitle="Attendance"
        >
            <FormContent day={day} />
        </FormProvider>
    );
};

const FormContent = ({ day }) => {
    const { data, setData, errors } = useFormState();

    // Only store complete times: a half-typed value must not wipe what is in the field.
    const handleTimeChange = (name) => (value) => {
        if (value === null) {
            setData((prevState) => ({ ...prevState, [name]: '' }));
        } else if (value.isValid()) {
            setData((prevState) => ({ ...prevState, [name]: value.format('HH:mm') }));
        }
    };

    const handleNoteChange = (e) => {
        const { value } = e.target;
        setData((prevState) => ({ ...prevState, note: value }));
    };

    const renderTimePicker = (name, label) => (
        <TimePicker
            label={label}
            ampm={false}
            value={toPickerValue(data[name])}
            onChange={handleTimeChange(name)}
            slotProps={{
                field: { clearable: true },
                textField: {
                    fullWidth: true,
                    error: !!errors?.[name],
                    helperText: errors?.[name],
                },
            }}
        />
    );

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Alert severity="info" sx={{ mb: 3 }}>
                {describeDay(day)}
            </Alert>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>{renderTimePicker('check_in', 'Check-in')}</Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        {renderTimePicker('check_out', 'Check-out')}
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Reason"
                            name="note"
                            fullWidth
                            required
                            multiline
                            minRows={2}
                            value={data.note ?? ''}
                            onChange={handleNoteChange}
                            error={!!errors?.note}
                            helperText={
                                errors?.note ||
                                'Why the doors got it wrong, e.g. forgot their card. Status and minutes are recalculated from these times, and the scheduled job won’t change this day again.'
                            }
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>
        </Box>
    );
};

export default CorrectionForm;
