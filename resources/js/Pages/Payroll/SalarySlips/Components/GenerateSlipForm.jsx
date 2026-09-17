import React, { useMemo } from 'react';
import { Box, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';

import SelectSearch from '@/Components/SelectSearch';
import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

/** This month, as YYYY-MM — what the month input and the server both expect. */
const thisMonth = () => {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const GenerateSlipForm = ({ open, onClose }) => {
    // FormProvider resets the form whenever this object changes, so keep it stable across renders.
    const defaultData = useMemo(() => ({ user_id: '', month: thisMonth(), _person: null }), []);

    return (
        <FormProvider
            open={open}
            onClose={onClose}
            url={route('payroll.salary-slips.store')}
            defaultValue={defaultData}
            generalTitle="Salary Slip"
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData, errors } = useFormState();

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 7 }}>
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
                <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                        label="Month"
                        name="month"
                        type="month"
                        fullWidth
                        required
                        value={data.month ?? ''}
                        onChange={(e) =>
                            setData((prevState) => ({ ...prevState, month: e.target.value }))
                        }
                        error={!!errors?.month}
                        helperText={
                            errors?.month ||
                            'It is worked out from the contract and attendance as they stand now'
                        }
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default GenerateSlipForm;
