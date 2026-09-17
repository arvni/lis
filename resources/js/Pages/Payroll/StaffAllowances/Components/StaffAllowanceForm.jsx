import React, { useMemo } from 'react';
import { Alert, Box, MenuItem, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import SelectSearch from '@/Components/SelectSearch';
import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const StaffAllowanceForm = ({ open, onClose, defaultValue, itemTypes = [], calculations = [] }) => {
    const url = defaultValue?.id
        ? route('payroll.staff-allowances.update', defaultValue.id)
        : route('payroll.staff-allowances.store');

    // FormProvider resets the form whenever this object changes, so keep it stable across renders.
    const defaultData = useMemo(
        () => ({
            user_id: '',
            payroll_item_type_id: '',
            calculation: 'FIXED',
            amount: '',
            percentage: '',
            total_amount: '',
            installments: '',
            start_date: '',
            end_date: '',
            notes: '',
            ...defaultValue,
            _person: defaultValue?.user?.id ? defaultValue.user : null,
        }),
        [defaultValue],
    );

    return (
        <FormProvider
            open={open}
            onClose={onClose}
            url={url}
            defaultValue={defaultData}
            generalTitle="Staff Allowance"
        >
            <FormContent itemTypes={itemTypes} calculations={calculations} />
        </FormProvider>
    );
};

const FormContent = ({ itemTypes, calculations }) => {
    const { data, setData, errors } = useFormState();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleDate = (field) => (value) => {
        if (value === null) setData((prevState) => ({ ...prevState, [field]: '' }));
        else if (value.isValid())
            setData((prevState) => ({ ...prevState, [field]: value.format('YYYY-MM-DD') }));
    };

    const pickType = (e) => {
        const id = e.target.value;
        const type = itemTypes.find((item) => item.id === Number(id));
        setData((prevState) => ({
            ...prevState,
            payroll_item_type_id: id,
            // The catalogue default is only a starting value; the amount stays editable.
            amount:
                prevState.calculation === 'FIXED' && type?.default_amount
                    ? type.default_amount
                    : prevState.amount,
        }));
    };

    const isFixed = data.calculation === 'FIXED';
    const isPercentage = data.calculation === 'PERCENTAGE';
    const isInstallments = data.calculation === 'INSTALLMENTS';

    const dateField = (field, label, help) => (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                label={label}
                value={data[field] ? dayjs(data[field]) : null}
                onChange={handleDate(field)}
                slotProps={{
                    textField: {
                        fullWidth: true,
                        required: field === 'start_date',
                        error: !!errors?.[field],
                        helperText: errors?.[field] || help,
                    },
                }}
            />
        </LocalizationProvider>
    );

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <SelectSearch
                        name="person"
                        label="Person"
                        fullWidth
                        required
                        value={data._person}
                        error={!!errors?.user_id}
                        helperText={errors?.user_id}
                        url={route('api.payroll.people.list')}
                        onChange={(e) =>
                            setData((prevState) => ({
                                ...prevState,
                                _person: e.target.value,
                                user_id: e.target.value?.id ?? '',
                            }))
                        }
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        select
                        label="Item"
                        name="payroll_item_type_id"
                        fullWidth
                        required
                        value={data.payroll_item_type_id ?? ''}
                        onChange={pickType}
                        error={!!errors?.payroll_item_type_id}
                        helperText={errors?.payroll_item_type_id}
                    >
                        {itemTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                                {type.name} — {type.kind_label}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        select
                        label="How it is worked out"
                        name="calculation"
                        fullWidth
                        required
                        value={data.calculation ?? 'FIXED'}
                        onChange={handleChange}
                        error={!!errors?.calculation}
                        helperText={errors?.calculation}
                    >
                        {calculations.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {isFixed && (
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Amount each month"
                            name="amount"
                            type="number"
                            fullWidth
                            required
                            inputProps={{ step: '0.001', min: '0' }}
                            value={data.amount ?? ''}
                            onChange={handleChange}
                            error={!!errors?.amount}
                            helperText={errors?.amount || 'In OMR'}
                        />
                    </Grid>
                )}

                {isPercentage && (
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Percentage of basic salary"
                            name="percentage"
                            type="number"
                            fullWidth
                            required
                            inputProps={{ step: '0.001', min: '0', max: '100' }}
                            value={data.percentage ?? ''}
                            onChange={handleChange}
                            error={!!errors?.percentage}
                            helperText={
                                errors?.percentage ||
                                'Taken from the contract’s basic salary each month'
                            }
                        />
                    </Grid>
                )}

                {isInstallments && (
                    <>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Total amount"
                                name="total_amount"
                                type="number"
                                fullWidth
                                required
                                inputProps={{ step: '0.001', min: '0' }}
                                value={data.total_amount ?? ''}
                                onChange={handleChange}
                                error={!!errors?.total_amount}
                                helperText={errors?.total_amount || 'The whole sum, e.g. the loan'}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Number of instalments"
                                name="installments"
                                type="number"
                                fullWidth
                                required
                                inputProps={{ step: '1', min: '1' }}
                                value={data.installments ?? ''}
                                onChange={handleChange}
                                error={!!errors?.installments}
                                helperText={errors?.installments || 'Months, counted from the start'}
                            />
                        </Grid>
                    </>
                )}

                <Grid size={{ xs: 12, sm: 6 }}>
                    {dateField('start_date', 'Starts', 'The first month it applies to')}
                </Grid>
                {!isInstallments && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                        {dateField('end_date', 'Ends', 'Leave empty to run until stopped')}
                    </Grid>
                )}

                {isInstallments && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Alert severity="info" sx={{ height: '100%' }}>
                            Instalments are counted from the start month and stop on their own once
                            they are paid off.
                        </Alert>
                    </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Notes"
                        name="notes"
                        fullWidth
                        multiline
                        rows={2}
                        value={data.notes ?? ''}
                        onChange={handleChange}
                        error={!!errors?.notes}
                        helperText={errors?.notes}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default StaffAllowanceForm;
