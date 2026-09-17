import React from 'react';
import { MenuItem, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import SelectSearch from '@/Components/SelectSearch';

/**
 * The contract's own terms. The nested entitlement and allowance rows are edited separately.
 *
 * Props:
 *   data, setData, errors – from useForm on the page
 *   person, onPerson      – the picked person object and its setter
 *   employmentTypes       – [{ value, label }]
 *   shifts                – [{ id, name }]; the pick is saved to the person's shift assignment,
 *                           not onto the contract, so attendance and pay can never disagree
 *   lockPerson            – true when editing: moving a contract to someone else would rewrite
 *                           history, so the person is fixed once it exists
 */
const ContractFields = ({
    data,
    setData,
    errors,
    person,
    onPerson,
    employmentTypes = [],
    shifts = [],
    lockPerson = false,
}) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const handleDate = (field) => (value) => {
        if (value === null) setData(field, '');
        else if (value.isValid()) setData(field, value.format('YYYY-MM-DD'));
    };

    const dateField = (field, label, { required = false, helperText = '' } = {}) => (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                label={label}
                value={data[field] ? dayjs(data[field]) : null}
                onChange={handleDate(field)}
                slotProps={{
                    textField: {
                        fullWidth: true,
                        required,
                        error: !!errors?.[field],
                        helperText: errors?.[field] || helperText,
                    },
                }}
            />
        </LocalizationProvider>
    );

    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
                <SelectSearch
                    name="person"
                    label="Person"
                    fullWidth
                    required
                    disabled={lockPerson}
                    value={person}
                    error={!!errors?.user_id}
                    helperText={
                        errors?.user_id ||
                        (lockPerson ? 'A contract stays with the person it was made for' : '')
                    }
                    url={route('api.payroll.people.list')}
                    onChange={(e) => onPerson(e.target.value)}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                    label="Position"
                    name="position"
                    fullWidth
                    value={data.position ?? ''}
                    onChange={handleChange}
                    error={!!errors?.position}
                    helperText={errors?.position || 'e.g. Lab Technician'}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    select
                    label="Employment"
                    name="employment_type"
                    fullWidth
                    required
                    value={data.employment_type ?? ''}
                    onChange={handleChange}
                    error={!!errors?.employment_type}
                    helperText={errors?.employment_type}
                >
                    {employmentTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                            {type.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                    label="Base salary"
                    name="base_salary"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ step: '0.001', min: '0' }}
                    value={data.base_salary ?? ''}
                    onChange={handleChange}
                    error={!!errors?.base_salary}
                    helperText={errors?.base_salary || 'Per month, in OMR'}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                    select
                    label="Shift"
                    name="shift_id"
                    fullWidth
                    value={data.shift_id ?? ''}
                    onChange={handleChange}
                    error={!!errors?.shift_id}
                    helperText={
                        errors?.shift_id ||
                        (data.shift_id
                            ? 'Sets the working day and the overtime rate'
                            : 'Without a shift, overtime and absence can’t be priced')
                    }
                >
                    <MenuItem value="">
                        <em>No shift</em>
                    </MenuItem>
                    {shifts.map((shift) => (
                        <MenuItem key={shift.id} value={shift.id}>
                            {shift.name}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                    label="Overtime multiplier"
                    name="overtime_multiplier"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ step: '0.05', min: '0' }}
                    value={data.overtime_multiplier ?? ''}
                    onChange={handleChange}
                    error={!!errors?.overtime_multiplier}
                    helperText={errors?.overtime_multiplier || '1.25 pays overtime at 125%'}
                />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                {dateField('start_date', 'Starts', { required: true })}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                {dateField('end_date', 'Ends', { helperText: 'Leave empty if open-ended' })}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>{dateField('probation_end_date', 'Probation ends')}</Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                    label="Reference"
                    name="reference"
                    fullWidth
                    value={data.reference ?? ''}
                    onChange={handleChange}
                    error={!!errors?.reference}
                    helperText={errors?.reference || 'The paper contract this records'}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
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
    );
};

export default ContractFields;
