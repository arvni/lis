import React, { useMemo } from 'react';
import {
    Box,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
} from '@mui/material';
import Grid from '@mui/material/Grid';

import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const ItemTypeForm = ({ open, onClose, defaultValue, kinds = [] }) => {
    const url = defaultValue?.id
        ? route('payroll.item-types.update', defaultValue.id)
        : route('payroll.item-types.store');

    // FormProvider resets the form whenever this object changes, so keep it stable across renders.
    const defaultData = useMemo(
        () => ({
            name: '',
            kind: 'ALLOWANCE',
            default_amount: '',
            is_active: true,
            ...defaultValue,
        }),
        [defaultValue],
    );

    return (
        <FormProvider
            open={open}
            onClose={onClose}
            url={url}
            defaultValue={defaultData}
            generalTitle="Allowance or Deduction"
        >
            <FormContent kinds={kinds} />
        </FormProvider>
    );
};

const FormContent = ({ kinds }) => {
    const { data, setData, errors } = useFormState();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData((prevState) => ({ ...prevState, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField
                        label="Name"
                        name="name"
                        fullWidth
                        required
                        value={data.name ?? ''}
                        onChange={handleChange}
                        error={!!errors?.name}
                        helperText={errors?.name || 'e.g. Housing allowance, Insurance'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                    <FormControl fullWidth required error={!!errors?.kind}>
                        <InputLabel id="kind-label">Kind</InputLabel>
                        <Select
                            labelId="kind-label"
                            label="Kind"
                            name="kind"
                            value={data.kind ?? 'ALLOWANCE'}
                            onChange={handleChange}
                        >
                            {kinds.map((kind) => (
                                <MenuItem key={kind.value} value={kind.value}>
                                    {kind.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Default amount"
                        name="default_amount"
                        type="number"
                        fullWidth
                        inputProps={{ step: '0.001', min: '0' }}
                        value={data.default_amount ?? ''}
                        onChange={handleChange}
                        error={!!errors?.default_amount}
                        helperText={
                            errors?.default_amount ||
                            'Optional. Only fills in the amount when this is added to a contract — the contract keeps its own figure afterwards.'
                        }
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
                            data.is_active
                                ? 'Active'
                                : 'Inactive — can’t be added to new contracts'
                        }
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ItemTypeForm;
