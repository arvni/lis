import React, { useMemo } from 'react';
import { Box, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const HolidayForm = ({ open, onClose, defaultValue }) => {
    const url = defaultValue?.id
        ? route('attendance.holidays.update', defaultValue.id)
        : route('attendance.holidays.store');

    // FormProvider resets the form whenever this object changes, so keep it stable across renders.
    const defaultData = useMemo(() => ({ date: '', title: '', ...defaultValue }), [defaultValue]);

    return (
        <FormProvider
            onClose={onClose}
            defaultValue={defaultData}
            open={open}
            url={url}
            generalTitle="Holiday"
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData, errors } = useFormState();

    const handleDateChange = (value) => {
        if (value === null) {
            setData((prevState) => ({ ...prevState, date: '' }));
        } else if (value.isValid()) {
            setData((prevState) => ({ ...prevState, date: value.format('YYYY-MM-DD') }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevState) => ({ ...prevState, [name]: value }));
    };

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 5 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Date"
                            value={data.date ? dayjs(data.date) : null}
                            onChange={handleDateChange}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    required: true,
                                    error: !!errors?.date,
                                    helperText: errors?.date,
                                },
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField
                        label="Title"
                        name="title"
                        fullWidth
                        required
                        error={!!errors?.title}
                        helperText={errors?.title || 'e.g. National Day'}
                        onChange={handleChange}
                        value={data.title ?? ''}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default HolidayForm;
