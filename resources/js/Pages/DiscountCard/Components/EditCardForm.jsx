import React from 'react';
import {
    Box,
    Divider,
    InputAdornment,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Event, Repeat, Tune } from '@mui/icons-material';

import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const EditCardForm = ({ open, onClose, card, statuses = [] }) => (
    <FormProvider
        onClose={onClose}
        open={open}
        url={route('discount-cards.update', card.id)}
        maxWidth="xs"
        generalTitle={`Card ${card.number}`}
        defaultValue={{
            _method: 'put',
            status: card.status ?? 'Inactive',
            expires_at: card.expires_at ?? '',
            usage_limit: card.usage_limit ?? '',
        }}
    >
        <FormContent statuses={statuses} />
    </FormProvider>
);

const FormContent = ({ statuses }) => {
    const { data, setData, errors } = useFormState();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevState) => ({ ...prevState, [name]: value }));
    };

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', border: '1px solid #e0e0e0' }}>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                >
                    <Tune sx={{ mr: 1 }} />
                    Card Controls
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            select
                            label="Status"
                            name="status"
                            fullWidth
                            value={data.status ?? ''}
                            onChange={handleChange}
                            error={!!errors?.status}
                            helperText={errors?.status || 'Revoking a card cannot be undone'}
                        >
                            {statuses.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Expires At"
                            name="expires_at"
                            type="date"
                            fullWidth
                            value={data.expires_at ?? ''}
                            onChange={handleChange}
                            error={!!errors?.expires_at}
                            helperText={errors?.expires_at || 'Blank means never'}
                            slotProps={{
                                inputLabel: { shrink: true },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Event fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Usage Limit"
                            name="usage_limit"
                            type="number"
                            fullWidth
                            value={data.usage_limit ?? ''}
                            onChange={handleChange}
                            error={!!errors?.usage_limit}
                            helperText={errors?.usage_limit || 'Blank means unlimited'}
                            slotProps={{
                                htmlInput: { min: 1 },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Repeat fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default EditCardForm;
