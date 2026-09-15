import React, { useMemo } from 'react';
import {
    Alert,
    Box,
    MenuItem,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import SelectSearch from '@/Components/SelectSearch';
import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const toTime = (time) => (time ? dayjs(`2000-01-01T${time}`) : null);

const LeaveRequestForm = ({ open, onClose, kinds = [], canManage = false }) => {
    // FormProvider resets the form whenever this object changes, so keep it stable across renders.
    const defaultData = useMemo(() => {
        const today = dayjs().format('YYYY-MM-DD');

        return {
            user_id: null,
            person: null,
            leave_kind_id: kinds[0]?.id ?? '',
            type: 'DAILY',
            start_date: today,
            end_date: today,
            start_time: '08:00',
            end_time: '10:00',
            reason: '',
        };
    }, [kinds]);

    return (
        <FormProvider
            open={open}
            onClose={onClose}
            url={route('attendance.leave-requests.store')}
            defaultValue={defaultData}
            generalTitle="Leave Request"
        >
            <FormContent kinds={kinds} canManage={canManage} />
        </FormProvider>
    );
};

const FormContent = ({ kinds, canManage }) => {
    const { data, setData, errors } = useFormState();
    const isHourly = data.type === 'HOURLY';

    const update = (name, value) => setData((prevState) => ({ ...prevState, [name]: value }));

    // Only store complete values: a half-typed date or time must not wipe the field.
    const handleDate = (name) => (value) => {
        if (value === null) update(name, '');
        else if (value.isValid()) update(name, value.format('YYYY-MM-DD'));
    };

    const handleTime = (name) => (value) => {
        if (value === null) update(name, '');
        else if (value.isValid()) update(name, value.format('HH:mm'));
    };

    const handlePerson = (e) => {
        const { value } = e.target;
        setData((prevState) => ({ ...prevState, person: value, user_id: value?.id ?? null }));
    };

    const pickerField = (name) => ({
        textField: { fullWidth: true, error: !!errors?.[name], helperText: errors?.[name] },
    });

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid container spacing={3}>
                    {canManage && (
                        <Grid size={{ xs: 12 }}>
                            <SelectSearch
                                name="person"
                                label="Person"
                                fullWidth
                                value={data.person}
                                onChange={handlePerson}
                                url={route('api.attendance.leave-people.list')}
                                error={!!errors?.user_id}
                                helperText={
                                    errors?.user_id || 'Leave empty to request leave for yourself'
                                }
                            />
                        </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select
                            fullWidth
                            required
                            label="Kind of leave"
                            name="leave_kind_id"
                            value={data.leave_kind_id ?? ''}
                            onChange={(e) => update('leave_kind_id', e.target.value)}
                            error={!!errors?.leave_kind_id}
                            helperText={errors?.leave_kind_id}
                        >
                            {kinds.map((kind) => (
                                <MenuItem key={kind.id} value={kind.id}>
                                    {kind.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ToggleButtonGroup
                            exclusive
                            fullWidth
                            color="primary"
                            value={data.type}
                            onChange={(_, value) => value && update('type', value)}
                            sx={{ height: 56 }}
                        >
                            <ToggleButton value="DAILY">Full days</ToggleButton>
                            <ToggleButton value="HOURLY">Hours</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>

                    <Grid size={{ xs: 12, sm: isHourly ? 4 : 6 }}>
                        <DatePicker
                            label={isHourly ? 'Date' : 'First day'}
                            value={data.start_date ? dayjs(data.start_date) : null}
                            onChange={handleDate('start_date')}
                            slotProps={pickerField('start_date')}
                        />
                    </Grid>
                    {isHourly ? (
                        <>
                            <Grid size={{ xs: 6, sm: 4 }}>
                                <TimePicker
                                    label="From"
                                    ampm={false}
                                    value={toTime(data.start_time)}
                                    onChange={handleTime('start_time')}
                                    slotProps={pickerField('start_time')}
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4 }}>
                                <TimePicker
                                    label="To"
                                    ampm={false}
                                    value={toTime(data.end_time)}
                                    onChange={handleTime('end_time')}
                                    slotProps={pickerField('end_time')}
                                />
                            </Grid>
                        </>
                    ) : (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <DatePicker
                                label="Last day"
                                value={data.end_date ? dayjs(data.end_date) : null}
                                onChange={handleDate('end_date')}
                                slotProps={pickerField('end_date')}
                            />
                        </Grid>
                    )}

                    <Grid size={{ xs: 12 }}>
                        <Alert severity="info">
                            {isHourly
                                ? 'Lateness and early leave are measured around these hours.'
                                : 'Days off and holidays inside these dates aren’t counted as leave.'}
                        </Alert>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Reason"
                            name="reason"
                            fullWidth
                            multiline
                            minRows={2}
                            value={data.reason ?? ''}
                            onChange={(e) => update('reason', e.target.value)}
                            error={!!errors?.reason}
                            helperText={errors?.reason}
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>
        </Box>
    );
};

export default LeaveRequestForm;
