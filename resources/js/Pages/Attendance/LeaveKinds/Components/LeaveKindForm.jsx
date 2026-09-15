import React, { useMemo } from 'react';
import { Box, FormControlLabel, Switch, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';

import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const LeaveKindForm = ({ open, onClose, defaultValue }) => {
    const url = defaultValue?.id
        ? route('attendance.leave-kinds.update', defaultValue.id)
        : route('attendance.leave-kinds.store');

    // FormProvider resets the form whenever this object changes, so keep it stable across renders.
    const defaultData = useMemo(() => ({ name: '', is_active: true, ...defaultValue }), [defaultValue]);

    return (
        <FormProvider
            open={open}
            onClose={onClose}
            url={url}
            defaultValue={defaultData}
            generalTitle="Leave Kind"
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData, errors } = useFormState();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData((prevState) => ({ ...prevState, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Name"
                        name="name"
                        fullWidth
                        required
                        value={data.name ?? ''}
                        onChange={handleChange}
                        error={!!errors?.name}
                        helperText={errors?.name || 'e.g. Annual, Sick, Unpaid'}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                name="is_active"
                                checked={!!data.is_active}
                                onChange={handleChange}
                                color="success"
                            />
                        }
                        label={
                            data.is_active ? 'Active' : 'Inactive — can’t be picked for new requests'
                        }
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default LeaveKindForm;
